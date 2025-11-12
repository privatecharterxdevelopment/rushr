-- =============================================================================
-- Auto-create conversation when direct offer is made
-- =============================================================================

-- Function to create conversation when direct offer is created
CREATE OR REPLACE FUNCTION create_conversation_for_direct_offer()
RETURNS TRIGGER AS $$
DECLARE
  v_conversation_id UUID;
  v_job_title TEXT;
BEGIN
  -- Get job title
  SELECT title INTO v_job_title
  FROM homeowner_jobs
  WHERE id = NEW.job_id;

  -- Create conversation between homeowner and contractor
  INSERT INTO conversations (
    homeowner_id,
    pro_id,
    title,
    job_id,
    status,
    created_at,
    updated_at
  ) VALUES (
    NEW.homeowner_id,
    NEW.contractor_id,
    COALESCE(v_job_title, 'Direct Offer Chat'),
    NEW.job_id::TEXT,
    'active',
    NOW(),
    NOW()
  )
  ON CONFLICT (homeowner_id, pro_id, job_id) DO UPDATE
    SET updated_at = NOW()
  RETURNING id INTO v_conversation_id;

  -- Add initial system message
  INSERT INTO messages (
    conversation_id,
    sender_id,
    message_type,
    content,
    created_at
  ) VALUES (
    v_conversation_id,
    NEW.homeowner_id,
    'system',
    format('Direct offer sent for: %s', COALESCE(v_job_title, 'this job')),
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on direct_offers
DROP TRIGGER IF EXISTS trigger_create_conversation_on_direct_offer ON direct_offers;
CREATE TRIGGER trigger_create_conversation_on_direct_offer
  AFTER INSERT ON direct_offers
  FOR EACH ROW
  EXECUTE FUNCTION create_conversation_for_direct_offer();

-- Also create conversation when job has requested_contractor_id
CREATE OR REPLACE FUNCTION create_conversation_for_requested_job()
RETURNS TRIGGER AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- Only create conversation if a specific contractor was requested
  IF NEW.requested_contractor_id IS NOT NULL THEN
    -- Create conversation between homeowner and requested contractor
    INSERT INTO conversations (
      homeowner_id,
      pro_id,
      title,
      job_id,
      status,
      created_at,
      updated_at
    ) VALUES (
      NEW.homeowner_id,
      NEW.requested_contractor_id,
      NEW.title,
      NEW.id::TEXT,
      'active',
      NOW(),
      NOW()
    )
    ON CONFLICT (homeowner_id, pro_id, job_id) DO UPDATE
      SET updated_at = NOW()
    RETURNING id INTO v_conversation_id;

    -- Add initial system message
    INSERT INTO messages (
      conversation_id,
      sender_id,
      message_type,
      content,
      created_at
    ) VALUES (
      v_conversation_id,
      NEW.homeowner_id,
      'system',
      format('Job request: %s', NEW.title),
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on homeowner_jobs
DROP TRIGGER IF EXISTS trigger_create_conversation_on_requested_job ON homeowner_jobs;
CREATE TRIGGER trigger_create_conversation_on_requested_job
  AFTER INSERT ON homeowner_jobs
  FOR EACH ROW
  EXECUTE FUNCTION create_conversation_for_requested_job();

-- Verify
SELECT '✅ Conversation triggers created!' as status;
SELECT 'Conversations will be auto-created for direct offers and requested contractor jobs.' as info;
