-- Calendar Events System
-- Automatically adds accepted jobs to both contractor and homeowner calendars
-- Created: 2025-10-22

-- Drop existing objects if they exist
DROP TABLE IF EXISTS calendar_events CASCADE;

-- 1. Calendar Events Table
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES homeowner_jobs(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  location TEXT,
  status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  event_type VARCHAR(50) DEFAULT 'job' CHECK (event_type IN ('job', 'appointment', 'reminder')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast calendar queries
CREATE INDEX idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX idx_calendar_events_job_id ON calendar_events(job_id);
CREATE INDEX idx_calendar_events_start_time ON calendar_events(start_time DESC);
CREATE INDEX idx_calendar_events_user_start ON calendar_events(user_id, start_time DESC);

-- Enable RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Users can only see their own calendar events
CREATE POLICY users_view_own_calendar ON calendar_events
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can only insert their own calendar events
CREATE POLICY users_insert_own_calendar ON calendar_events
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can only update their own calendar events
CREATE POLICY users_update_own_calendar ON calendar_events
  FOR UPDATE
  USING (user_id = auth.uid());

-- Users can only delete their own calendar events
CREATE POLICY users_delete_own_calendar ON calendar_events
  FOR DELETE
  USING (user_id = auth.uid());

-- 2. Function to automatically create calendar events when job bid is accepted
CREATE OR REPLACE FUNCTION create_calendar_events_on_bid_accept()
RETURNS TRIGGER AS $$
DECLARE
  v_job homeowner_jobs%ROWTYPE;
  v_homeowner_id UUID;
  v_contractor_id UUID;
  v_start_time TIMESTAMPTZ;
  v_location TEXT;
BEGIN
  -- Only proceed if bid status changed to 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN

    -- Get job details
    SELECT * INTO v_job FROM homeowner_jobs WHERE id = NEW.job_id;
    v_homeowner_id := v_job.homeowner_id;
    v_contractor_id := NEW.contractor_id;

    -- ✅ Combine address fields into a readable location string
    v_location := COALESCE(v_job.address, '') ||
                  CASE WHEN v_job.city IS NOT NULL THEN ', ' || v_job.city ELSE '' END ||
                  CASE WHEN v_job.state IS NOT NULL THEN ', ' || v_job.state ELSE '' END ||
                  CASE WHEN v_job.zip_code IS NOT NULL THEN ' ' || v_job.zip_code ELSE '' END;

    -- ✅ Use available_date or fallback to now + 1 hour
    v_start_time := COALESCE(
      NEW.available_date,
      NOW() + INTERVAL '1 hour'
    );

    -- Create calendar event for HOMEOWNER
    INSERT INTO calendar_events (
      user_id,
      job_id,
      title,
      description,
      start_time,
      end_time,
      location,
      status,
      event_type
    ) VALUES (
      v_homeowner_id,
      NEW.job_id,
      'Job: ' || v_job.title,
      v_job.description,
      v_start_time,
      v_start_time + INTERVAL '2 hours',
      v_location,
      'scheduled',
      'job'
    );

    -- Create calendar event for CONTRACTOR
    INSERT INTO calendar_events (
      user_id,
      job_id,
      title,
      description,
      start_time,
      end_time,
      location,
      status,
      event_type
    ) VALUES (
      v_contractor_id,
      NEW.job_id,
      'Job: ' || v_job.title,
      v_job.description,
      v_start_time,
      v_start_time + INTERVAL '2 hours',
      v_location,
      'scheduled',
      'job'
    );

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Create trigger on job_bids table
DROP TRIGGER IF EXISTS trigger_create_calendar_events ON job_bids;
CREATE TRIGGER trigger_create_calendar_events
  AFTER INSERT OR UPDATE ON job_bids
  FOR EACH ROW
  EXECUTE FUNCTION create_calendar_events_on_bid_accept();

-- 3. Function to update calendar event status when job status changes
CREATE OR REPLACE FUNCTION update_calendar_event_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update calendar events when job status changes
  IF NEW.status != OLD.status THEN
    UPDATE calendar_events
    SET
      status = CASE
        WHEN NEW.status = 'in_progress' THEN 'in_progress'
        WHEN NEW.status = 'completed' THEN 'completed'
        WHEN NEW.status = 'cancelled' THEN 'cancelled'
        ELSE 'scheduled'
      END,
      updated_at = NOW()
    WHERE job_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on homeowner_jobs table
DROP TRIGGER IF EXISTS trigger_update_calendar_status ON homeowner_jobs;
CREATE TRIGGER trigger_update_calendar_status
  AFTER UPDATE ON homeowner_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_calendar_event_status();

-- 4. Function to update timestamp
CREATE OR REPLACE FUNCTION update_calendar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_calendar_timestamp
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_calendar_updated_at();

COMMENT ON TABLE calendar_events IS 'Calendar events for both homeowners and contractors, automatically created when jobs are accepted';
COMMENT ON COLUMN calendar_events.event_type IS 'Type of event: job (auto-created), appointment (manual), or reminder';
COMMENT ON COLUMN calendar_events.status IS 'Event status synced with job status: scheduled, in_progress, completed, cancelled';
