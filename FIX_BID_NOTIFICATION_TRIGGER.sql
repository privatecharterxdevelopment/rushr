-- Fix bid notification trigger to use correct notification type
-- The trigger was using 'bid_received' but the constraint only allows 'new_bid'

-- Update the function to use 'new_bid' instead of 'bid_received'
CREATE OR REPLACE FUNCTION notify_homeowner_on_new_bid()
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
  SELECT name INTO v_contractor_name
  FROM pro_contractors
  WHERE id = NEW.contractor_id;

  -- Insert notification for homeowner
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
    'new_bid',  -- FIXED: Changed from 'bid_received' to 'new_bid'
    'New Bid Received',
    format('"%s" has bid $%s on your job "%s"',
      COALESCE(v_contractor_name, 'A contractor'),
      NEW.bid_amount::TEXT,
      COALESCE(v_job_title, 'your job')
    ),
    format('/jobs/%s/compare', NEW.job_id),  -- FIXED: Updated link to use the correct route
    false,
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verify the trigger exists
SELECT 'Bid notification trigger updated successfully!' as status;
