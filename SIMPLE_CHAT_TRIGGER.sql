-- =============================================================================
-- SIMPLE WORKING TRIGGER - Auto-create chat when direct offer is accepted
-- =============================================================================

-- Drop existing triggers if they exist to avoid conflicts
DROP TRIGGER IF EXISTS trigger_create_conversation_on_direct_offer ON direct_offers;
DROP TRIGGER IF EXISTS trigger_create_conversation_on_requested_job ON homeowner_jobs;
DROP FUNCTION IF EXISTS create_conversation_for_direct_offer();
DROP FUNCTION IF EXISTS create_conversation_for_requested_job();

-- Simple function to create conversation when offer is accepted
CREATE OR REPLACE FUNCTION create_conversation_on_offer_accepted()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create conversation when contractor accepts
  IF NEW.contractor_response = 'accepted' AND (OLD.contractor_response IS NULL OR OLD.contractor_response != 'accepted') THEN

    -- Insert conversation (ON CONFLICT DO NOTHING to avoid duplicates)
    INSERT INTO conversations (
      homeowner_id,
      pro_id,
      title,
      job_id,
      status
    )
    SELECT
      NEW.homeowner_id,
      NEW.contractor_id,
      COALESCE(hj.title, 'Direct Offer Chat'),
      NEW.job_id,
      'active'
    FROM homeowner_jobs hj
    WHERE hj.id = NEW.job_id
    ON CONFLICT (homeowner_id, pro_id, job_id) DO NOTHING;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_conversation_on_offer_accepted
  AFTER UPDATE ON direct_offers
  FOR EACH ROW
  EXECUTE FUNCTION create_conversation_on_offer_accepted();

-- Success message
SELECT '✅ Chat trigger created successfully!' as status;
