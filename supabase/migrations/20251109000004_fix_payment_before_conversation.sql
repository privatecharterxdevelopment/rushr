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
