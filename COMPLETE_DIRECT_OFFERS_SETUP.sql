-- =============================================================================
-- COMPLETE DIRECT OFFERS SETUP
-- Run this in Supabase SQL Editor to set up the direct offers system
-- =============================================================================

-- STEP 1: Create direct_offers table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS direct_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who is involved
  homeowner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES pro_contractors(id) ON DELETE CASCADE,

  -- Job details
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'emergency')),

  -- Location
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  zip VARCHAR(10),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Homeowner's offer
  offered_amount DECIMAL(10, 2) NOT NULL,
  estimated_duration_hours INTEGER,
  preferred_start_date TIMESTAMPTZ,
  preferred_completion_date TIMESTAMPTZ,

  -- Contractor's response
  contractor_response VARCHAR(20) DEFAULT 'pending' CHECK (
    contractor_response IN ('pending', 'accepted', 'rejected', 'counter_bid')
  ),
  counter_bid_amount DECIMAL(10, 2),
  counter_bid_duration_hours INTEGER,
  counter_bid_start_date TIMESTAMPTZ,
  counter_bid_message TEXT,

  -- Final agreement
  final_agreed_amount DECIMAL(10, 2),
  final_agreed_duration_hours INTEGER,
  homeowner_accepted_counter BOOLEAN DEFAULT false,

  -- Status tracking
  status VARCHAR(20) DEFAULT 'pending' CHECK (
    status IN ('pending', 'accepted', 'counter_bid', 'rejected', 'agreement_reached', 'cancelled')
  ),

  -- Conversion to job
  converted_to_job_id UUID REFERENCES homeowner_jobs(id) ON DELETE SET NULL,

  -- Messages/notes
  homeowner_notes TEXT,
  contractor_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '72 hours'),

  -- Constraints
  CONSTRAINT offer_amount_positive CHECK (offered_amount > 0),
  CONSTRAINT counter_amount_positive CHECK (counter_bid_amount IS NULL OR counter_bid_amount > 0)
);

-- STEP 2: Add indexes
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_direct_offers_homeowner ON direct_offers(homeowner_id);
CREATE INDEX IF NOT EXISTS idx_direct_offers_contractor ON direct_offers(contractor_id);
CREATE INDEX IF NOT EXISTS idx_direct_offers_status ON direct_offers(status);
CREATE INDEX IF NOT EXISTS idx_direct_offers_created_at ON direct_offers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_offers_expires_at ON direct_offers(expires_at);
CREATE INDEX IF NOT EXISTS idx_direct_offers_contractor_status ON direct_offers(contractor_id, status);

-- STEP 3: Enable RLS
-- -----------------------------------------------------------------------------
ALTER TABLE direct_offers ENABLE ROW LEVEL SECURITY;

-- Homeowners can view and manage their own offers
DROP POLICY IF EXISTS "Homeowners can view their own offers" ON direct_offers;
CREATE POLICY "Homeowners can view their own offers" ON direct_offers
  FOR SELECT USING (auth.uid() = homeowner_id);

DROP POLICY IF EXISTS "Homeowners can create offers" ON direct_offers;
CREATE POLICY "Homeowners can create offers" ON direct_offers
  FOR INSERT WITH CHECK (auth.uid() = homeowner_id);

DROP POLICY IF EXISTS "Homeowners can update their offers" ON direct_offers;
CREATE POLICY "Homeowners can update their offers" ON direct_offers
  FOR UPDATE USING (auth.uid() = homeowner_id);

-- Contractors can view and respond to offers sent to them
DROP POLICY IF EXISTS "Contractors can view their offers" ON direct_offers;
CREATE POLICY "Contractors can view their offers" ON direct_offers
  FOR SELECT USING (auth.uid() = contractor_id);

DROP POLICY IF EXISTS "Contractors can respond to their offers" ON direct_offers;
CREATE POLICY "Contractors can respond to their offers" ON direct_offers
  FOR UPDATE USING (auth.uid() = contractor_id);

-- STEP 4: Create database functions
-- -----------------------------------------------------------------------------

-- Function to create offer
CREATE OR REPLACE FUNCTION create_direct_offer(
  p_contractor_id UUID,
  p_title VARCHAR,
  p_description TEXT,
  p_category VARCHAR,
  p_offered_amount DECIMAL,
  p_priority VARCHAR DEFAULT 'normal',
  p_address TEXT DEFAULT NULL,
  p_city VARCHAR DEFAULT NULL,
  p_state VARCHAR DEFAULT NULL,
  p_zip VARCHAR DEFAULT NULL,
  p_latitude DECIMAL DEFAULT NULL,
  p_longitude DECIMAL DEFAULT NULL,
  p_estimated_duration_hours INTEGER DEFAULT NULL,
  p_preferred_start_date TIMESTAMPTZ DEFAULT NULL,
  p_homeowner_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_offer_id UUID;
  v_homeowner_id UUID;
BEGIN
  v_homeowner_id := auth.uid();

  IF v_homeowner_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS(SELECT 1 FROM pro_contractors WHERE id = p_contractor_id) THEN
    RAISE EXCEPTION 'Contractor not found';
  END IF;

  INSERT INTO direct_offers (
    homeowner_id, contractor_id, title, description, category, priority,
    address, city, state, zip, latitude, longitude, offered_amount,
    estimated_duration_hours, preferred_start_date, homeowner_notes
  ) VALUES (
    v_homeowner_id, p_contractor_id, p_title, p_description, p_category, p_priority,
    p_address, p_city, p_state, p_zip, p_latitude, p_longitude, p_offered_amount,
    p_estimated_duration_hours, p_preferred_start_date, p_homeowner_notes
  ) RETURNING id INTO v_offer_id;

  RETURN v_offer_id;
END;
$$;

-- Function to accept offer (with auto-conversation creation)
CREATE OR REPLACE FUNCTION accept_direct_offer(p_offer_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_offer RECORD;
  v_conversation_id UUID;
BEGIN
  SELECT * INTO v_offer FROM direct_offers WHERE id = p_offer_id;

  IF v_offer.id IS NULL THEN RAISE EXCEPTION 'Offer not found'; END IF;
  IF v_offer.status != 'pending' THEN RAISE EXCEPTION 'Offer is no longer pending'; END IF;

  UPDATE direct_offers
  SET contractor_response = 'accepted', status = 'accepted',
      final_agreed_amount = offered_amount, final_agreed_duration_hours = estimated_duration_hours,
      responded_at = NOW(), updated_at = NOW()
  WHERE id = p_offer_id;

  -- AUTO-CREATE CONVERSATION (matching accept_job_bid behavior)
  INSERT INTO conversations (homeowner_id, pro_id, job_id, title, status, created_at, updated_at)
  VALUES (v_offer.homeowner_id, v_offer.contractor_id, NULL, v_offer.title, 'active', NOW(), NOW())
  ON CONFLICT (homeowner_id, pro_id, job_id) DO NOTHING
  RETURNING id INTO v_conversation_id;

  -- Send initial system message if new conversation created
  IF v_conversation_id IS NOT NULL THEN
    INSERT INTO messages (conversation_id, sender_id, message_type, content, created_at)
    VALUES (v_conversation_id, NULL, 'system',
      'Offer accepted for "' || v_offer.title || '" ($' || v_offer.offered_amount || '). You can now discuss project details.',
      NOW());
  END IF;
END;
$$;

-- Function to reject offer
CREATE OR REPLACE FUNCTION reject_direct_offer(p_offer_id UUID, p_contractor_notes TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE direct_offers
  SET contractor_response = 'rejected', status = 'rejected',
      contractor_notes = p_contractor_notes, responded_at = NOW(), updated_at = NOW()
  WHERE id = p_offer_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'Offer not found'; END IF;
END;
$$;

-- Function to counter-bid
CREATE OR REPLACE FUNCTION counter_bid_direct_offer(
  p_offer_id UUID,
  p_counter_amount DECIMAL,
  p_counter_duration_hours INTEGER DEFAULT NULL,
  p_counter_start_date TIMESTAMPTZ DEFAULT NULL,
  p_counter_message TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE direct_offers
  SET contractor_response = 'counter_bid', status = 'counter_bid',
      counter_bid_amount = p_counter_amount, counter_bid_duration_hours = p_counter_duration_hours,
      counter_bid_start_date = p_counter_start_date, counter_bid_message = p_counter_message,
      responded_at = NOW(), updated_at = NOW()
  WHERE id = p_offer_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'Offer not found'; END IF;
END;
$$;

-- Function to accept counter-bid (with auto-conversation creation)
CREATE OR REPLACE FUNCTION accept_counter_bid(p_offer_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_offer RECORD;
  v_conversation_id UUID;
BEGIN
  SELECT * INTO v_offer FROM direct_offers WHERE id = p_offer_id;

  IF v_offer.id IS NULL THEN RAISE EXCEPTION 'Offer not found'; END IF;
  IF v_offer.contractor_response != 'counter_bid' THEN RAISE EXCEPTION 'No counter-bid exists'; END IF;

  UPDATE direct_offers
  SET homeowner_accepted_counter = true, status = 'agreement_reached',
      final_agreed_amount = counter_bid_amount, final_agreed_duration_hours = counter_bid_duration_hours,
      updated_at = NOW()
  WHERE id = p_offer_id;

  -- AUTO-CREATE CONVERSATION
  INSERT INTO conversations (homeowner_id, pro_id, job_id, title, status, created_at, updated_at)
  VALUES (v_offer.homeowner_id, v_offer.contractor_id, NULL, v_offer.title, 'active', NOW(), NOW())
  ON CONFLICT (homeowner_id, pro_id, job_id) DO NOTHING
  RETURNING id INTO v_conversation_id;

  -- Send initial system message if new conversation created
  IF v_conversation_id IS NOT NULL THEN
    INSERT INTO messages (conversation_id, sender_id, message_type, content, created_at)
    VALUES (v_conversation_id, NULL, 'system',
      'Counter-offer accepted for "' || v_offer.title || '" ($' || v_offer.counter_bid_amount || '). You can now discuss project details.',
      NOW());
  END IF;
END;
$$;

-- STEP 5: Create notification triggers
-- -----------------------------------------------------------------------------

-- Notify contractor when they receive a new offer
CREATE OR REPLACE FUNCTION notify_contractor_new_offer()
RETURNS TRIGGER AS $$
DECLARE
  v_homeowner_name TEXT;
BEGIN
  SELECT name INTO v_homeowner_name FROM user_profiles WHERE id = NEW.homeowner_id;

  INSERT INTO notifications (user_id, type, title, message, link, is_read, created_at)
  VALUES (
    NEW.contractor_id,
    'direct_offer_received',
    'New Job Offer',
    format('"%s" sent you a direct offer for "%s" - $%s',
      COALESCE(v_homeowner_name, 'A homeowner'), NEW.title, NEW.offered_amount::TEXT),
    format('/dashboard/contractor/offers?offer_id=%s', NEW.id),
    false, NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_contractor_new_offer ON direct_offers;
CREATE TRIGGER trigger_notify_contractor_new_offer
  AFTER INSERT ON direct_offers
  FOR EACH ROW
  EXECUTE FUNCTION notify_contractor_new_offer();

-- Notify homeowner when contractor responds
CREATE OR REPLACE FUNCTION notify_homeowner_offer_response()
RETURNS TRIGGER AS $$
DECLARE
  v_contractor_name TEXT;
  v_message TEXT;
  v_notif_type TEXT;
  v_notif_title TEXT;
BEGIN
  IF NEW.contractor_response != OLD.contractor_response THEN
    SELECT name INTO v_contractor_name FROM pro_contractors WHERE id = NEW.contractor_id;

    CASE NEW.contractor_response
      WHEN 'accepted' THEN
        v_notif_type := 'direct_offer_accepted';
        v_notif_title := 'Offer Accepted!';
        v_message := format('"%s" accepted your offer for "%s" - $%s',
          COALESCE(v_contractor_name, 'The contractor'), NEW.title, NEW.offered_amount::TEXT);
      WHEN 'rejected' THEN
        v_notif_type := 'direct_offer_rejected';
        v_notif_title := 'Offer Declined';
        v_message := format('"%s" declined your offer for "%s"',
          COALESCE(v_contractor_name, 'The contractor'), NEW.title);
      WHEN 'counter_bid' THEN
        v_notif_type := 'direct_offer_counter';
        v_notif_title := 'Counter Offer Received';
        v_message := format('"%s" sent a counter offer for "%s" - $%s',
          COALESCE(v_contractor_name, 'The contractor'), NEW.title, NEW.counter_bid_amount::TEXT);
      ELSE
        RETURN NEW;
    END CASE;

    INSERT INTO notifications (user_id, type, title, message, link, is_read, created_at)
    VALUES (NEW.homeowner_id, v_notif_type, v_notif_title, v_message,
      format('/dashboard/homeowner/offers?offer_id=%s', NEW.id), false, NOW());
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_homeowner_offer_response ON direct_offers;
CREATE TRIGGER trigger_notify_homeowner_offer_response
  AFTER UPDATE ON direct_offers
  FOR EACH ROW
  EXECUTE FUNCTION notify_homeowner_offer_response();

-- Notify contractor when homeowner accepts counter-bid
CREATE OR REPLACE FUNCTION notify_contractor_counter_accepted()
RETURNS TRIGGER AS $$
DECLARE
  v_homeowner_name TEXT;
BEGIN
  IF NEW.homeowner_accepted_counter = true AND
     (OLD.homeowner_accepted_counter IS NULL OR OLD.homeowner_accepted_counter = false) THEN

    SELECT name INTO v_homeowner_name FROM user_profiles WHERE id = NEW.homeowner_id;

    INSERT INTO notifications (user_id, type, title, message, link, is_read, created_at)
    VALUES (
      NEW.contractor_id,
      'counter_bid_accepted',
      'Counter Offer Accepted!',
      format('"%s" accepted your counter offer for "%s" - $%s',
        COALESCE(v_homeowner_name, 'The homeowner'), NEW.title, NEW.counter_bid_amount::TEXT),
      format('/dashboard/contractor/offers?offer_id=%s', NEW.id),
      false, NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_contractor_counter_accepted ON direct_offers;
CREATE TRIGGER trigger_notify_contractor_counter_accepted
  AFTER UPDATE ON direct_offers
  FOR EACH ROW
  EXECUTE FUNCTION notify_contractor_counter_accepted();

-- STEP 6: Update notifications type constraint
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
  ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (
    type IN (
      'job_request_received', 'bid_received', 'bid_accepted', 'bid_rejected',
      'job_filled', 'job_expired', 'new_message', 'bid_response',
      'direct_offer_received', 'direct_offer_accepted', 'direct_offer_rejected',
      'direct_offer_counter', 'counter_bid_accepted', 'offer_response'
    )
  );
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Done!
SELECT 'Direct offers system setup complete! Contractors will now receive bell notifications.' as status;
-- =============================================================================
-- FIX DIRECT OFFERS - Correct RLS Policies and Add Notification System
-- Based on existing job_bids pattern where pro_contractors.id = auth.uid()
-- =============================================================================

-- 1. FIX RLS POLICIES TO MATCH JOB_BIDS PATTERN
-- -----------------------------------------------------------------------------

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Contractors can view offers" ON direct_offers;
DROP POLICY IF EXISTS "Contractors can respond to offers" ON direct_offers;

-- Create proper contractor policies (matching job_bids pattern)
-- Contractors can view offers sent to them
CREATE POLICY "Contractors can view their offers" ON direct_offers
  FOR SELECT USING (auth.uid() = contractor_id);

-- Contractors can update offers sent to them (to respond)
CREATE POLICY "Contractors can respond to their offers" ON direct_offers
  FOR UPDATE USING (auth.uid() = contractor_id);

-- 2. ADD NOTIFICATION TRIGGERS
-- -----------------------------------------------------------------------------

-- Function to notify contractor when they receive a direct offer
CREATE OR REPLACE FUNCTION notify_contractor_new_offer()
RETURNS TRIGGER AS $$
DECLARE
  v_homeowner_name TEXT;
BEGIN
  -- Get homeowner name
  SELECT name INTO v_homeowner_name
  FROM user_profiles
  WHERE id = NEW.homeowner_id;

  -- Create notification for contractor (contractor_id IS the auth user ID)
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    link,
    is_read,
    created_at
  ) VALUES (
    NEW.contractor_id, -- pro_contractors.id = auth.users.id
    'direct_offer_received',
    'New Job Offer',
    format('"%s" sent you a direct offer for "%s" - $%s',
      COALESCE(v_homeowner_name, 'A homeowner'),
      NEW.title,
      NEW.offered_amount::TEXT
    ),
    format('/dashboard/contractor/offers?offer_id=%s', NEW.id),
    false,
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to fire when new offer is created
DROP TRIGGER IF EXISTS trigger_notify_contractor_new_offer ON direct_offers;
CREATE TRIGGER trigger_notify_contractor_new_offer
  AFTER INSERT ON direct_offers
  FOR EACH ROW
  EXECUTE FUNCTION notify_contractor_new_offer();

-- Function to notify homeowner when contractor responds
CREATE OR REPLACE FUNCTION notify_homeowner_offer_response()
RETURNS TRIGGER AS $$
DECLARE
  v_contractor_name TEXT;
  v_message TEXT;
  v_notif_type TEXT;
  v_notif_title TEXT;
BEGIN
  -- Only notify if contractor_response changed
  IF NEW.contractor_response != OLD.contractor_response THEN
    -- Get contractor name
    SELECT name INTO v_contractor_name
    FROM pro_contractors
    WHERE id = NEW.contractor_id;

    -- Build notification based on response type
    CASE NEW.contractor_response
      WHEN 'accepted' THEN
        v_notif_type := 'direct_offer_accepted';
        v_notif_title := 'Offer Accepted!';
        v_message := format('"%s" accepted your offer for "%s" - $%s',
          COALESCE(v_contractor_name, 'The contractor'),
          NEW.title,
          NEW.offered_amount::TEXT
        );

      WHEN 'rejected' THEN
        v_notif_type := 'direct_offer_rejected';
        v_notif_title := 'Offer Declined';
        v_message := format('"%s" declined your offer for "%s"',
          COALESCE(v_contractor_name, 'The contractor'),
          NEW.title
        );

      WHEN 'counter_bid' THEN
        v_notif_type := 'direct_offer_counter';
        v_notif_title := 'Counter Offer Received';
        v_message := format('"%s" sent a counter offer for "%s" - $%s',
          COALESCE(v_contractor_name, 'The contractor'),
          NEW.title,
          NEW.counter_bid_amount::TEXT
        );

      ELSE
        RETURN NEW; -- Don't notify for other status changes
    END CASE;

    -- Create notification for homeowner
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      link,
      is_read,
      created_at
    ) VALUES (
      NEW.homeowner_id,
      v_notif_type,
      v_notif_title,
      v_message,
      format('/dashboard/homeowner/offers?offer_id=%s', NEW.id),
      false,
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to fire when offer status changes
DROP TRIGGER IF EXISTS trigger_notify_homeowner_offer_response ON direct_offers;
CREATE TRIGGER trigger_notify_homeowner_offer_response
  AFTER UPDATE ON direct_offers
  FOR EACH ROW
  EXECUTE FUNCTION notify_homeowner_offer_response();

-- Function to notify contractor when homeowner accepts counter-bid
CREATE OR REPLACE FUNCTION notify_contractor_counter_accepted()
RETURNS TRIGGER AS $$
DECLARE
  v_homeowner_name TEXT;
BEGIN
  -- Only notify if homeowner_accepted_counter changed to true
  IF NEW.homeowner_accepted_counter = true AND
     (OLD.homeowner_accepted_counter IS NULL OR OLD.homeowner_accepted_counter = false) THEN

    -- Get homeowner name
    SELECT name INTO v_homeowner_name
    FROM user_profiles
    WHERE id = NEW.homeowner_id;

    -- Create notification for contractor
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      link,
      is_read,
      created_at
    ) VALUES (
      NEW.contractor_id,
      'counter_bid_accepted',
      'Counter Offer Accepted!',
      format('"%s" accepted your counter offer for "%s" - $%s',
        COALESCE(v_homeowner_name, 'The homeowner'),
        NEW.title,
        NEW.counter_bid_amount::TEXT
      ),
      format('/dashboard/contractor/offers?offer_id=%s', NEW.id),
      false,
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for counter-bid acceptance
DROP TRIGGER IF EXISTS trigger_notify_contractor_counter_accepted ON direct_offers;
CREATE TRIGGER trigger_notify_contractor_counter_accepted
  AFTER UPDATE ON direct_offers
  FOR EACH ROW
  EXECUTE FUNCTION notify_contractor_counter_accepted();

-- 3. UPDATE NOTIFICATION TYPES (ensure they're recognized)
-- -----------------------------------------------------------------------------
-- Update notifications table type constraint if it exists
DO $$
BEGIN
  -- Try to drop the existing constraint
  ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

  -- Add updated constraint with new notification types
  ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (
    type IN (
      'job_request_received',
      'bid_received',
      'bid_accepted',
      'bid_rejected',
      'job_filled',
      'job_expired',
      'new_message',
      'bid_response',
      'direct_offer_received',
      'direct_offer_accepted',
      'direct_offer_rejected',
      'direct_offer_counter',
      'counter_bid_accepted',
      'offer_response'
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    -- If table doesn't have constraint, that's fine
    NULL;
END $$;

-- 4. ADD COMMENTS
-- -----------------------------------------------------------------------------
COMMENT ON FUNCTION notify_contractor_new_offer() IS 'Sends notification to contractor when they receive a direct job offer from homeowner';
COMMENT ON FUNCTION notify_homeowner_offer_response() IS 'Sends notification to homeowner when contractor responds to their offer';
COMMENT ON FUNCTION notify_contractor_counter_accepted() IS 'Sends notification to contractor when homeowner accepts their counter-bid';

SELECT 'Direct offers notification system fixed successfully! Contractors will now receive notifications.' as status;
-- =============================================================================
-- FIX: Payment Must Happen BEFORE Conversation is Created
-- Remove conversation creation from accept functions
-- Add finalize function to be called AFTER payment succeeds
-- =============================================================================

-- 1. Update accept_job_bid to NOT create conversation
-- Conversation will be created AFTER payment in finalize function
CREATE OR REPLACE FUNCTION accept_job_bid(
  p_bid_id UUID,
  p_homeowner_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_job_id UUID;
  v_contractor_id UUID;
  v_bid_amount DECIMAL(10,2);
BEGIN
  -- Get bid details
  SELECT jb.job_id, jb.contractor_id, jb.bid_amount
  INTO v_job_id, v_contractor_id, v_bid_amount
  FROM job_bids jb
  WHERE jb.id = p_bid_id AND jb.homeowner_id = p_homeowner_id;

  IF v_job_id IS NULL THEN
    RAISE EXCEPTION 'Bid not found or access denied';
  END IF;

  -- Accept the bid (set status to accepted)
  UPDATE job_bids
  SET status = 'accepted', updated_at = NOW()
  WHERE id = p_bid_id;

  -- Reject all other bids for this job
  UPDATE job_bids
  SET status = 'rejected', updated_at = NOW()
  WHERE job_id = v_job_id AND id != p_bid_id;

  -- Update job status and assign contractor
  UPDATE homeowner_jobs
  SET
    status = 'bid_accepted',
    accepted_bid_id = p_bid_id,
    contractor_id = v_contractor_id,
    estimated_cost = v_bid_amount,
    updated_at = NOW()
  WHERE id = v_job_id;

  -- NOTE: Conversation is NOT created here!
  -- It will be created by finalize_bid_after_payment() AFTER payment succeeds
END;
$$;

-- 2. Create finalize function to be called AFTER payment
CREATE OR REPLACE FUNCTION finalize_bid_after_payment(
  p_bid_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bid RECORD;
  v_job_title TEXT;
  v_conversation_id UUID;
BEGIN
  -- Get bid and job details
  SELECT jb.*, hj.title as job_title
  INTO v_bid
  FROM job_bids jb
  JOIN homeowner_jobs hj ON hj.id = jb.job_id
  WHERE jb.id = p_bid_id AND jb.status = 'accepted';

  IF v_bid.id IS NULL THEN
    RAISE EXCEPTION 'Bid not found or not accepted';
  END IF;

  -- Create conversation NOW (after payment succeeded)
  INSERT INTO conversations (
    homeowner_id,
    pro_id,
    job_id,
    title,
    status,
    created_at,
    updated_at
  ) VALUES (
    v_bid.homeowner_id,
    v_bid.contractor_id,
    v_bid.job_id::TEXT,
    v_bid.job_title,
    'active',
    NOW(),
    NOW()
  )
  ON CONFLICT (homeowner_id, pro_id, job_id) DO NOTHING
  RETURNING id INTO v_conversation_id;

  -- Send initial system message if new conversation was created
  IF v_conversation_id IS NOT NULL THEN
    INSERT INTO messages (
      conversation_id,
      sender_id,
      message_type,
      content,
      created_at
    ) VALUES (
      v_conversation_id,
      NULL,
      'system',
      'Payment held in escrow for "' || v_bid.job_title || '". You can now communicate about the project.',
      NOW()
    );
  END IF;

  -- Update job status to in_progress
  UPDATE homeowner_jobs
  SET status = 'in_progress', updated_at = NOW()
  WHERE id = v_bid.job_id;

  RETURN v_conversation_id;
END;
$$;

-- 3. Update accept_direct_offer to NOT create conversation
CREATE OR REPLACE FUNCTION accept_direct_offer(p_offer_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_offer RECORD;
BEGIN
  SELECT * INTO v_offer FROM direct_offers WHERE id = p_offer_id;

  IF v_offer.id IS NULL THEN RAISE EXCEPTION 'Offer not found'; END IF;
  IF v_offer.status != 'pending' THEN RAISE EXCEPTION 'Offer is no longer pending'; END IF;

  -- Update offer status
  UPDATE direct_offers
  SET
    contractor_response = 'accepted',
    status = 'accepted',
    final_agreed_amount = offered_amount,
    final_agreed_duration_hours = estimated_duration_hours,
    responded_at = NOW(),
    updated_at = NOW()
  WHERE id = p_offer_id;

  -- NOTE: Conversation is NOT created here!
  -- It will be created by finalize_offer_after_payment() AFTER payment succeeds
END;
$$;

-- 4. Create finalize function for direct offers (after payment)
CREATE OR REPLACE FUNCTION finalize_offer_after_payment(
  p_offer_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_offer RECORD;
  v_conversation_id UUID;
BEGIN
  -- Get offer details
  SELECT * INTO v_offer
  FROM direct_offers
  WHERE id = p_offer_id AND status = 'accepted';

  IF v_offer.id IS NULL THEN
    RAISE EXCEPTION 'Offer not found or not accepted';
  END IF;

  -- Create conversation NOW (after payment succeeded)
  INSERT INTO conversations (
    homeowner_id,
    pro_id,
    job_id,
    title,
    status,
    created_at,
    updated_at
  ) VALUES (
    v_offer.homeowner_id,
    v_offer.contractor_id,
    NULL,
    v_offer.title,
    'active',
    NOW(),
    NOW()
  )
  ON CONFLICT (homeowner_id, pro_id, job_id) DO NOTHING
  RETURNING id INTO v_conversation_id;

  -- Send initial system message
  IF v_conversation_id IS NOT NULL THEN
    INSERT INTO messages (
      conversation_id,
      sender_id,
      message_type,
      content,
      created_at
    ) VALUES (
      v_conversation_id,
      NULL,
      'system',
      'Payment held in escrow for "' || v_offer.title || '" ($' || v_offer.final_agreed_amount || '). You can now discuss project details.',
      NOW()
    );
  END IF;

  RETURN v_conversation_id;
END;
$$;

-- 5. Same for counter-bid acceptance
CREATE OR REPLACE FUNCTION accept_counter_bid(p_offer_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_offer RECORD;
BEGIN
  SELECT * INTO v_offer FROM direct_offers WHERE id = p_offer_id;

  IF v_offer.id IS NULL THEN RAISE EXCEPTION 'Offer not found'; END IF;
  IF v_offer.contractor_response != 'counter_bid' THEN RAISE EXCEPTION 'No counter-bid exists'; END IF;

  -- Accept counter-bid
  UPDATE direct_offers
  SET
    homeowner_accepted_counter = true,
    status = 'agreement_reached',
    final_agreed_amount = counter_bid_amount,
    final_agreed_duration_hours = counter_bid_duration_hours,
    updated_at = NOW()
  WHERE id = p_offer_id;

  -- NOTE: Conversation will be created by finalize_offer_after_payment() AFTER payment
END;
$$;

-- 6. Add comments
COMMENT ON FUNCTION accept_job_bid IS 'Accept bid - conversation created AFTER payment succeeds';
COMMENT ON FUNCTION finalize_bid_after_payment IS 'Call this AFTER payment succeeds to create conversation and finalize job';
COMMENT ON FUNCTION accept_direct_offer IS 'Accept offer - conversation created AFTER payment succeeds';
COMMENT ON FUNCTION finalize_offer_after_payment IS 'Call this AFTER payment succeeds to create conversation';
COMMENT ON FUNCTION accept_counter_bid IS 'Accept counter-bid - conversation created AFTER payment succeeds';

SELECT 'Payment-before-conversation flow implemented! Conversations now created ONLY after payment.' as status;
-- =============================================================================
-- ADD DIRECT OFFERS SUPPORT TO PAYMENT_HOLDS TABLE
-- Allow payment holds for both bids AND direct offers
-- =============================================================================

-- 1. Add offer_id column
ALTER TABLE payment_holds
ADD COLUMN IF NOT EXISTS offer_id UUID REFERENCES direct_offers(id) ON DELETE CASCADE;

-- 2. Make job_id and bid_id optional (since offers might not have a job yet)
ALTER TABLE payment_holds
ALTER COLUMN job_id DROP NOT NULL,
ALTER COLUMN bid_id DROP NOT NULL;

-- 3. Add constraint: must have either bid_id OR offer_id (not both, not neither)
ALTER TABLE payment_holds
DROP CONSTRAINT IF EXISTS payment_holds_bid_or_offer_check;

ALTER TABLE payment_holds
ADD CONSTRAINT payment_holds_bid_or_offer_check CHECK (
  (bid_id IS NOT NULL AND offer_id IS NULL) OR
  (bid_id IS NULL AND offer_id IS NOT NULL)
);

-- 4. Update unique constraint
ALTER TABLE payment_holds
DROP CONSTRAINT IF EXISTS payment_holds_bid_id_key;

-- Create unique constraint on offer_id
ALTER TABLE payment_holds
ADD CONSTRAINT payment_holds_offer_id_unique UNIQUE (offer_id);

-- Recreate unique constraint on bid_id
ALTER TABLE payment_holds
ADD CONSTRAINT payment_holds_bid_id_unique UNIQUE (bid_id);

-- 5. Create index for offer_id
CREATE INDEX IF NOT EXISTS idx_payment_holds_offer ON payment_holds(offer_id);

-- 6. Update RLS policies to allow viewing payment holds for offers
DROP POLICY IF EXISTS "Users can view their own payment holds" ON payment_holds;
CREATE POLICY "Users can view their own payment holds" ON payment_holds
  FOR SELECT USING (
    auth.uid() = homeowner_id OR
    auth.uid() = contractor_id
  );

-- 7. Add comments
COMMENT ON COLUMN payment_holds.offer_id IS 'Reference to direct_offers table (mutually exclusive with bid_id)';
COMMENT ON CONSTRAINT payment_holds_bid_or_offer_check ON payment_holds IS 'Payment must be for either a bid OR an offer, not both';

SELECT 'Payment holds now support both bids and direct offers!' as status;
