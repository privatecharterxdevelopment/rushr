-- Add accepted_at column to job_bids table
ALTER TABLE job_bids ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;

-- Create index for faster queries on accepted bids
CREATE INDEX IF NOT EXISTS job_bids_accepted_at_idx ON job_bids(accepted_at);
