-- =============================================================================
-- BID RESPONSE NOTIFICATIONS
-- Notify homeowners when contractors respond to their job requests
-- =============================================================================

-- 1. CREATE NOTIFICATION FUNCTION FOR BID RESPONSES
CREATE OR REPLACE FUNCTION notify_homeowner_bid_response()
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
  FROM user_profiles
  WHERE id = NEW.contractor_id;

  -- Create notification for homeowner
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    metadata,
    is_read,
    created_at
  ) VALUES (
    NEW.homeowner_id,
    'bid_response',
    'New bid received',
    v_contractor_name || ' responded to your request for "' || v_job_title || '"',
    jsonb_build_object(
      'bid_id', NEW.id,
      'job_id', NEW.job_id,
      'contractor_id', NEW.contractor_id,
      'bid_amount', NEW.bid_amount
    ),
    false,
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. CREATE TRIGGER ON BID CREATION
DROP TRIGGER IF EXISTS on_bid_created ON job_bids;
CREATE TRIGGER on_bid_created
AFTER INSERT ON job_bids
FOR EACH ROW
EXECUTE FUNCTION notify_homeowner_bid_response();

-- 3. CREATE NOTIFICATION FUNCTION FOR BID ACCEPTANCE
CREATE OR REPLACE FUNCTION notify_contractor_bid_accepted()
RETURNS TRIGGER AS $$
DECLARE
  v_job_title TEXT;
  v_homeowner_name TEXT;
BEGIN
  -- Only notify if status changed to 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    -- Get job title
    SELECT title INTO v_job_title
    FROM homeowner_jobs
    WHERE id = NEW.job_id;

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
      metadata,
      is_read,
      created_at
    ) VALUES (
      NEW.contractor_id,
      'bid_accepted',
      'Your bid was accepted!',
      v_homeowner_name || ' accepted your bid for "' || v_job_title || '"',
      jsonb_build_object(
        'bid_id', NEW.id,
        'job_id', NEW.job_id,
        'homeowner_id', NEW.homeowner_id,
        'bid_amount', NEW.bid_amount
      ),
      false,
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. CREATE TRIGGER ON BID STATUS UPDATE
DROP TRIGGER IF EXISTS on_bid_status_change ON job_bids;
CREATE TRIGGER on_bid_status_change
AFTER UPDATE ON job_bids
FOR EACH ROW
EXECUTE FUNCTION notify_contractor_bid_accepted();

-- 5. UPDATE NOTIFICATIONS TABLE IF NEEDED
-- Ensure notifications table has the correct structure
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 6. CREATE INDEX FOR FASTER NOTIFICATION QUERIES
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

SELECT 'Bid notification system created successfully!' as status;
