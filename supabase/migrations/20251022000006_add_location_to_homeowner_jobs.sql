-- Add latitude column to homeowner_jobs table
ALTER TABLE homeowner_jobs
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);

-- Add longitude column to homeowner_jobs table
ALTER TABLE homeowner_jobs
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add index for location-based queries
CREATE INDEX IF NOT EXISTS homeowner_jobs_location_idx ON homeowner_jobs(latitude, longitude);

-- Add comments
COMMENT ON COLUMN homeowner_jobs.latitude IS 'Job location latitude for mapping';
COMMENT ON COLUMN homeowner_jobs.longitude IS 'Job location longitude for mapping';
