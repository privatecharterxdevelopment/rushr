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
