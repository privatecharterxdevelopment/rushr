-- Real-time Contractor Location Tracking & Live Chat System
-- Created: 2025-10-22

-- 1. Contractor Location Tracking Table
CREATE TABLE IF NOT EXISTS contractor_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES homeowner_jobs(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  heading DECIMAL(5, 2), -- Direction in degrees (0-360)
  speed DECIMAL(5, 2), -- Speed in km/h
  accuracy DECIMAL(8, 2), -- GPS accuracy in meters
  is_tracking_enabled BOOLEAN DEFAULT false,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast location queries
CREATE INDEX IF NOT EXISTS idx_contractor_locations_contractor_id ON contractor_locations(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_locations_job_id ON contractor_locations(job_id);
CREATE INDEX IF NOT EXISTS idx_contractor_locations_last_updated ON contractor_locations(last_updated_at DESC);

-- 2. Job Chat Messages Table
CREATE TABLE IF NOT EXISTS job_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES homeowner_jobs(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('homeowner', 'contractor')),
  message TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast message queries
CREATE INDEX IF NOT EXISTS idx_job_chat_messages_job_id ON job_chat_messages(job_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_chat_messages_sender ON job_chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_job_chat_messages_unread ON job_chat_messages(job_id) WHERE read_at IS NULL;

-- 3. Enable Realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE contractor_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE job_chat_messages;

-- 4. RLS Policies for contractor_locations

-- Enable RLS
ALTER TABLE contractor_locations ENABLE ROW LEVEL SECURITY;

-- Contractors can update their own location
CREATE POLICY contractor_update_own_location ON contractor_locations
  FOR UPDATE
  USING (contractor_id = auth.uid());

-- Contractors can insert their own location
CREATE POLICY contractor_insert_own_location ON contractor_locations
  FOR INSERT
  WITH CHECK (contractor_id = auth.uid());

-- Homeowners can view contractor location for their confirmed jobs
CREATE POLICY homeowner_view_contractor_location ON contractor_locations
  FOR SELECT
  USING (
    job_id IN (
      SELECT id FROM homeowner_jobs
      WHERE homeowner_id = auth.uid()
      AND status IN ('confirmed', 'in_progress')
    )
  );

-- Contractors can view their own location
CREATE POLICY contractor_view_own_location ON contractor_locations
  FOR SELECT
  USING (contractor_id = auth.uid());

-- 5. RLS Policies for job_chat_messages

-- Enable RLS
ALTER TABLE job_chat_messages ENABLE ROW LEVEL SECURITY;

-- Anyone involved in the job can read messages
CREATE POLICY job_participants_read_messages ON job_chat_messages
  FOR SELECT
  USING (
    job_id IN (
      SELECT id FROM homeowner_jobs
      WHERE homeowner_id = auth.uid()
    )
    OR
    job_id IN (
      SELECT job_id FROM job_bids
      WHERE contractor_id = auth.uid()
      AND status = 'accepted'
    )
  );

-- Users can send messages for their jobs
CREATE POLICY job_participants_send_messages ON job_chat_messages
  FOR INSERT
  WITH CHECK (
    (sender_role = 'homeowner' AND job_id IN (
      SELECT id FROM homeowner_jobs WHERE homeowner_id = auth.uid()
    ))
    OR
    (sender_role = 'contractor' AND job_id IN (
      SELECT job_id FROM job_bids WHERE contractor_id = auth.uid() AND status = 'accepted'
    ))
  );

-- Users can mark their own received messages as read
CREATE POLICY job_participants_mark_read ON job_chat_messages
  FOR UPDATE
  USING (
    -- Homeowner can mark contractor messages as read
    (sender_role = 'contractor' AND job_id IN (
      SELECT id FROM homeowner_jobs WHERE homeowner_id = auth.uid()
    ))
    OR
    -- Contractor can mark homeowner messages as read
    (sender_role = 'homeowner' AND job_id IN (
      SELECT job_id FROM job_bids WHERE contractor_id = auth.uid() AND status = 'accepted'
    ))
  );

-- 6. Function to update location timestamp automatically
DROP TRIGGER IF EXISTS trigger_update_contractor_location_timestamp ON contractor_locations;
DROP FUNCTION IF EXISTS update_contractor_location_timestamp();

CREATE OR REPLACE FUNCTION update_contractor_location_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contractor_location_timestamp
  BEFORE UPDATE ON contractor_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_contractor_location_timestamp();

-- 7. Function to get unread message count
DROP FUNCTION IF EXISTS get_unread_message_count(UUID, UUID);

CREATE OR REPLACE FUNCTION get_unread_message_count(p_job_id UUID, p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER;
  user_role TEXT;
BEGIN
  -- Determine user role
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM homeowner_jobs WHERE id = p_job_id AND homeowner_id = p_user_id) THEN 'homeowner'
    WHEN EXISTS (SELECT 1 FROM job_bids WHERE job_id = p_job_id AND contractor_id = p_user_id) THEN 'contractor'
    ELSE NULL
  END INTO user_role;

  IF user_role IS NULL THEN
    RETURN 0;
  END IF;

  -- Count unread messages sent by the other party
  SELECT COUNT(*)
  INTO unread_count
  FROM job_chat_messages
  WHERE job_id = p_job_id
    AND sender_role != user_role
    AND read_at IS NULL;

  RETURN unread_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Add tracking_enabled field to homeowner_jobs if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'homeowner_jobs' AND column_name = 'tracking_enabled'
  ) THEN
    ALTER TABLE homeowner_jobs ADD COLUMN tracking_enabled BOOLEAN DEFAULT false;
  END IF;
END $$;

COMMENT ON TABLE contractor_locations IS 'Real-time GPS location tracking for contractors en route to jobs';
COMMENT ON TABLE job_chat_messages IS 'Live chat messages between homeowners and contractors during active jobs';
COMMENT ON COLUMN contractor_locations.is_tracking_enabled IS 'Whether the contractor has enabled location sharing for this job';
COMMENT ON COLUMN homeowner_jobs.tracking_enabled IS 'Whether both parties have confirmed and location tracking is active';
