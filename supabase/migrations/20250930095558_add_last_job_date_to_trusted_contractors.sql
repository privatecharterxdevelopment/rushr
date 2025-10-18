-- Add last_job_date column to trusted_contractors table
ALTER TABLE trusted_contractors
ADD COLUMN last_job_date TIMESTAMP WITH TIME ZONE;

-- Set default value to created_at for existing records
UPDATE trusted_contractors
SET last_job_date = created_at
WHERE last_job_date IS NULL;