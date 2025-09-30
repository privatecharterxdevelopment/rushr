-- Fix: Auto-create conversation when bid is accepted
-- Add this to the accept_job_bid function

-- First, let's update the accept_job_bid function to create a conversation
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
  v_conversation_id UUID;
  v_job_title TEXT;
BEGIN
  -- Get bid details
  SELECT jb.job_id, jb.contractor_id, jb.bid_amount, hj.title
  INTO v_job_id, v_contractor_id, v_bid_amount, v_job_title
  FROM job_bids jb
  JOIN homeowner_jobs hj ON hj.id = jb.job_id
  WHERE jb.id = p_bid_id AND jb.homeowner_id = p_homeowner_id;

  IF v_job_id IS NULL THEN
    RAISE EXCEPTION 'Bid not found or access denied';
  END IF;

  -- Accept the bid (set status to accepted)
  UPDATE job_bids
  SET
    status = 'accepted',
    updated_at = NOW()
  WHERE id = p_bid_id;

  -- Reject all other bids for this job
  UPDATE job_bids
  SET
    status = 'rejected',
    updated_at = NOW()
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

  -- NEW: Create conversation between homeowner and contractor
  INSERT INTO conversations (
    homeowner_id,
    contractor_id,
    job_id,
    status,
    created_at,
    updated_at
  ) VALUES (
    p_homeowner_id,
    v_contractor_id,
    v_job_id,
    'active',
    NOW(),
    NOW()
  )
  RETURNING id INTO v_conversation_id;

  -- Send initial system message
  INSERT INTO messages (
    conversation_id,
    sender_id,
    sender_type,
    message_text,
    message_type,
    created_at
  ) VALUES (
    v_conversation_id,
    NULL, -- System message
    'system',
    'Bid accepted for "' || v_job_title || '". You can now communicate directly about the project details.',
    'system',
    NOW()
  );

END;
$$;