-- Fix: Auto-create conversation when bid is accepted
-- This replaces the accept_job_bid function with messaging integration
-- Uses pro_id to match the conversations table schema

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
  -- Get bid details and job title
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
  -- Using pro_id column to match the conversations table schema
  INSERT INTO conversations (
    homeowner_id,
    pro_id,  -- CORRECTED: Using pro_id instead of contractor_id
    job_id,
    title,
    status,
    created_at,
    updated_at
  ) VALUES (
    p_homeowner_id,
    v_contractor_id,
    v_job_id::TEXT,
    v_job_title,
    'active',
    NOW(),
    NOW()
  )
  ON CONFLICT (homeowner_id, pro_id, job_id) DO NOTHING
  RETURNING id INTO v_conversation_id;

  -- Send initial system message only if new conversation was created
  IF v_conversation_id IS NOT NULL THEN
    INSERT INTO messages (
      conversation_id,
      sender_id,
      message_type,
      content,
      created_at
    ) VALUES (
      v_conversation_id,
      NULL, -- System message
      'system',
      'Bid accepted for "' || v_job_title || '". You can now communicate directly about the project details.',
      NOW()
    );
  END IF;

END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION accept_job_bid(UUID, UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION accept_job_bid IS 'Accept a job bid, reject others, update job status, and create conversation between homeowner and contractor';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '=== Accept Job Bid Function Updated ===';
  RAISE NOTICE 'Now automatically creates conversations when bids are accepted';
  RAISE NOTICE 'Uses pro_id column to match conversations table schema';
  RAISE NOTICE 'Includes ON CONFLICT to prevent duplicate conversations';
END;
$$;
