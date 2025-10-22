-- Add all missing columns to homeowner_jobs table

-- Add phone column
ALTER TABLE homeowner_jobs
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Add address column
ALTER TABLE homeowner_jobs
ADD COLUMN IF NOT EXISTS address TEXT;

-- Add zip_code column
ALTER TABLE homeowner_jobs
ADD COLUMN IF NOT EXISTS zip_code VARCHAR(10);

-- Add priority column
ALTER TABLE homeowner_jobs
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal';

-- Add comments
COMMENT ON COLUMN homeowner_jobs.phone IS 'Homeowner contact phone number';
COMMENT ON COLUMN homeowner_jobs.address IS 'Job location address';
COMMENT ON COLUMN homeowner_jobs.zip_code IS 'Job location ZIP code';
COMMENT ON COLUMN homeowner_jobs.priority IS 'Job priority level (normal, urgent, emergency)';
