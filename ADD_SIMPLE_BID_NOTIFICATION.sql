-- =============================================================================
-- Simple bid notification trigger - just adds a bell notification
-- =============================================================================

-- Create simple function to notify homeowner when bid is received
CREATE OR REPLACE FUNCTION notify_homeowner_of_new_bid()
RETURNS TRIGGER AS $$
DECLARE
  v_job_title TEXT;
  v_contractor_name TEXT;
BEGIN
  -- Get job title
  SELECT title INTO v_job_title
  FROM homeowner_jobs
  WHERE id = NEW.job_id;

  -- Get contractor name
  SELECT COALESCE(business_name, name) INTO v_contractor_name
  FROM pro_contractors
  WHERE id = NEW.contractor_id;

  -- Insert simple notification
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
    'new_bid',
    'New Bid Received',
    format('%s submitted a bid of $%s on "%s"',
      COALESCE(v_contractor_name, 'A contractor'),
      COALESCE(NEW.bid_amount::TEXT, '0'),
      COALESCE(v_job_title, 'your job')
    ),
    format('/jobs/%s/compare', NEW.job_id),
    false,
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on job_bids
DROP TRIGGER IF EXISTS trigger_notify_homeowner_new_bid ON job_bids;
CREATE TRIGGER trigger_notify_homeowner_new_bid
  AFTER INSERT ON job_bids
  FOR EACH ROW
  EXECUTE FUNCTION notify_homeowner_of_new_bid();

-- Verify it was created
SELECT '✅ Simple bid notification trigger created!' as status;
SELECT 'Homeowners will now see bell notifications when contractors bid.' as info;
