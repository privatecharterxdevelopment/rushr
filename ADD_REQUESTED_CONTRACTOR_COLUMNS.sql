-- Add requested contractor information to homeowner_jobs table
-- RUN THIS IN SUPABASE SQL EDITOR

-- Add requested_contractor_id column (references the contractor if one was specifically selected)
ALTER TABLE homeowner_jobs
ADD COLUMN IF NOT EXISTS requested_contractor_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL;

-- Add requested_contractor_name column (stores the contractor's business name for display)
ALTER TABLE homeowner_jobs
ADD COLUMN IF NOT EXISTS requested_contractor_name TEXT;

-- Add latitude and longitude if they don't exist (for location-based features)
ALTER TABLE homeowner_jobs
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;

ALTER TABLE homeowner_jobs
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Add phone if it doesn't exist (for emergency contact)
ALTER TABLE homeowner_jobs
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Add comments
COMMENT ON COLUMN homeowner_jobs.requested_contractor_id IS 'The contractor specifically requested by the homeowner (if any)';
COMMENT ON COLUMN homeowner_jobs.requested_contractor_name IS 'The name of the requested contractor for display purposes';
COMMENT ON COLUMN homeowner_jobs.latitude IS 'Job location latitude';
COMMENT ON COLUMN homeowner_jobs.longitude IS 'Job location longitude';

-- Add index for requested contractor queries
CREATE INDEX IF NOT EXISTS idx_homeowner_jobs_requested_contractor ON homeowner_jobs(requested_contractor_id);

-- Add index for location-based queries
CREATE INDEX IF NOT EXISTS idx_homeowner_jobs_location ON homeowner_jobs(latitude, longitude);

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'homeowner_jobs'
ORDER BY ordinal_position;
