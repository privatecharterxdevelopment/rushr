-- Fix job_bids table - ensure all columns exist and remove NOT NULL constraints

-- First, remove NOT NULL constraint from description column if it exists
DO $$
BEGIN
    -- Make description column nullable (it shouldn't be required)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'job_bids'
        AND column_name = 'description'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE job_bids ALTER COLUMN description DROP NOT NULL;
    END IF;
END $$;

-- Check if columns exist and add them if missing
DO $$
BEGIN
    -- Add message column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'job_bids' AND column_name = 'message'
    ) THEN
        ALTER TABLE job_bids ADD COLUMN message TEXT;
    END IF;

    -- Add estimated_duration column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'job_bids' AND column_name = 'estimated_duration'
    ) THEN
        ALTER TABLE job_bids ADD COLUMN estimated_duration INTEGER;
    END IF;

    -- Add accepted_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'job_bids' AND column_name = 'accepted_at'
    ) THEN
        ALTER TABLE job_bids ADD COLUMN accepted_at TIMESTAMPTZ;
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'job_bids' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE job_bids ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'job_bids'
ORDER BY ordinal_position;
