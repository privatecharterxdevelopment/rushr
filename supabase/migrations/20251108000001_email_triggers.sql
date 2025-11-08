-- ============================================================================
-- EMAIL NOTIFICATION TRIGGERS
-- ============================================================================
-- Purpose: Automatically send emails for key events (registration, bids, etc.)
-- ============================================================================

-- Function to send welcome email to new homeowner
CREATE OR REPLACE FUNCTION send_homeowner_welcome_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Call API endpoint to send welcome email
  PERFORM
    net.http_post(
      url := current_setting('app.settings.api_url') || '/api/send-welcome-email',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := json_build_object(
        'email', (SELECT email FROM auth.users WHERE id = NEW.id),
        'name', NEW.name,
        'type', 'homeowner'
      )::jsonb
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send welcome email to new contractor
CREATE OR REPLACE FUNCTION send_contractor_welcome_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Call API endpoint to send welcome email
  PERFORM
    net.http_post(
      url := current_setting('app.settings.api_url') || '/api/send-welcome-email',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := json_build_object(
        'email', (SELECT email FROM auth.users WHERE id = NEW.id),
        'name', COALESCE(NEW.name, NEW.business_name, 'Professional'),
        'businessName', NEW.business_name,
        'type', 'contractor'
      )::jsonb
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send bid received email to homeowner
CREATE OR REPLACE FUNCTION send_bid_received_email()
RETURNS TRIGGER AS $$
DECLARE
  v_job RECORD;
  v_homeowner RECORD;
  v_contractor RECORD;
BEGIN
  -- Get job details
  SELECT * INTO v_job FROM homeowner_jobs WHERE id = NEW.job_id;

  -- Get homeowner details
  SELECT u.email, p.name
  INTO v_homeowner
  FROM auth.users u
  JOIN user_profiles p ON u.id = p.id
  WHERE u.id = v_job.homeowner_id;

  -- Get contractor details
  SELECT name, business_name
  INTO v_contractor
  FROM pro_contractors
  WHERE id = NEW.contractor_id;

  -- Send email notification
  PERFORM
    net.http_post(
      url := current_setting('app.settings.api_url') || '/api/send-bid-notification',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := json_build_object(
        'homeownerEmail', v_homeowner.email,
        'homeownerName', v_homeowner.name,
        'contractorName', COALESCE(v_contractor.business_name, v_contractor.name),
        'jobTitle', v_job.title,
        'bidAmount', NEW.bid_amount,
        'estimatedArrival', NEW.estimated_duration || ' minutes',
        'jobId', NEW.job_id
      )::jsonb
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send bid accepted email to contractor
CREATE OR REPLACE FUNCTION send_bid_accepted_email()
RETURNS TRIGGER AS $$
DECLARE
  v_bid RECORD;
  v_job RECORD;
  v_homeowner RECORD;
  v_contractor RECORD;
  v_contractor_email TEXT;
BEGIN
  -- Only trigger when accepted_bid_id is set (not NULL)
  IF NEW.accepted_bid_id IS NOT NULL AND (OLD.accepted_bid_id IS NULL OR OLD.accepted_bid_id != NEW.accepted_bid_id) THEN

    -- Get bid details
    SELECT * INTO v_bid FROM job_bids WHERE id = NEW.accepted_bid_id;

    -- Get job details
    SELECT * INTO v_job FROM homeowner_jobs WHERE id = NEW.id;

    -- Get homeowner details
    SELECT u.email, p.name, p.phone
    INTO v_homeowner
    FROM auth.users u
    JOIN user_profiles p ON u.id = p.id
    WHERE u.id = v_job.homeowner_id;

    -- Get contractor details
    SELECT c.name, c.business_name, u.email
    INTO v_contractor
    FROM pro_contractors c
    JOIN auth.users u ON u.id = c.id
    WHERE c.id = v_bid.contractor_id;

    -- Send email notification
    PERFORM
      net.http_post(
        url := current_setting('app.settings.api_url') || '/api/send-bid-accepted',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := json_build_object(
          'contractorEmail', v_contractor.email,
          'contractorName', COALESCE(v_contractor.business_name, v_contractor.name),
          'jobTitle', v_job.title,
          'homeownerName', v_homeowner.name,
          'homeownerPhone', v_homeowner.phone,
          'jobAddress', v_job.address,
          'jobId', v_job.id
        )::jsonb
      );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for welcome emails
DROP TRIGGER IF EXISTS trigger_send_homeowner_welcome_email ON user_profiles;
CREATE TRIGGER trigger_send_homeowner_welcome_email
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  WHEN (NEW.role = 'homeowner')
  EXECUTE FUNCTION send_homeowner_welcome_email();

DROP TRIGGER IF EXISTS trigger_send_contractor_welcome_email ON pro_contractors;
CREATE TRIGGER trigger_send_contractor_welcome_email
  AFTER INSERT ON pro_contractors
  FOR EACH ROW
  EXECUTE FUNCTION send_contractor_welcome_email();

-- Trigger for bid received emails
DROP TRIGGER IF EXISTS trigger_send_bid_received_email ON job_bids;
CREATE TRIGGER trigger_send_bid_received_email
  AFTER INSERT ON job_bids
  FOR EACH ROW
  EXECUTE FUNCTION send_bid_received_email();

-- Trigger for bid accepted emails
DROP TRIGGER IF EXISTS trigger_send_bid_accepted_email ON homeowner_jobs;
CREATE TRIGGER trigger_send_bid_accepted_email
  AFTER UPDATE ON homeowner_jobs
  FOR EACH ROW
  EXECUTE FUNCTION send_bid_accepted_email();

-- Set API URL (update this with your actual URL)
-- For local development:
ALTER DATABASE postgres SET app.settings.api_url TO 'http://localhost:3000';

-- For production (update with your actual domain):
-- ALTER DATABASE postgres SET app.settings.api_url TO 'https://rushr-main.vercel.app';

-- Comments
COMMENT ON FUNCTION send_homeowner_welcome_email() IS 'Sends welcome email when a new homeowner registers';
COMMENT ON FUNCTION send_contractor_welcome_email() IS 'Sends welcome email when a new contractor registers';
COMMENT ON FUNCTION send_bid_received_email() IS 'Sends email to homeowner when they receive a new bid';
COMMENT ON FUNCTION send_bid_accepted_email() IS 'Sends email to contractor when their bid is accepted';
