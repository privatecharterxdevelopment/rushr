-- Add job_number column with auto-increment sequence for cleaner URLs
-- Safe migration: checks what exists before making changes

-- Step 1: Create sequence if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'job_number_seq') THEN
    CREATE SEQUENCE job_number_seq START WITH 10000 INCREMENT BY 1;
    RAISE NOTICE 'Created sequence job_number_seq';
  ELSE
    RAISE NOTICE 'Sequence job_number_seq already exists';
  END IF;
END $$;

-- Step 2: Add job_number column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'homeowner_jobs'
    AND column_name = 'job_number'
  ) THEN
    ALTER TABLE homeowner_jobs ADD COLUMN job_number INTEGER;
    RAISE NOTICE 'Added job_number column';
  ELSE
    RAISE NOTICE 'Column job_number already exists';
  END IF;
END $$;

-- Step 3: Backfill existing jobs with sequential numbers (only those without a number)
UPDATE homeowner_jobs
SET job_number = nextval('job_number_seq')
WHERE job_number IS NULL;

-- Step 4: Make job_number NOT NULL (only if not already set)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'homeowner_jobs'
    AND column_name = 'job_number'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE homeowner_jobs ALTER COLUMN job_number SET NOT NULL;
    RAISE NOTICE 'Set job_number to NOT NULL';
  ELSE
    RAISE NOTICE 'job_number already NOT NULL';
  END IF;
END $$;

-- Step 5: Add unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'homeowner_jobs_job_number_unique'
  ) THEN
    ALTER TABLE homeowner_jobs ADD CONSTRAINT homeowner_jobs_job_number_unique UNIQUE (job_number);
    RAISE NOTICE 'Added unique constraint';
  ELSE
    RAISE NOTICE 'Unique constraint already exists';
  END IF;
END $$;

-- Step 6: Set default for new jobs (safe to run multiple times)
ALTER TABLE homeowner_jobs ALTER COLUMN job_number SET DEFAULT nextval('job_number_seq');

-- Step 7: Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_homeowner_jobs_job_number ON homeowner_jobs(job_number);

-- Final verification
DO $$
DECLARE
  job_count INTEGER;
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO job_count FROM homeowner_jobs;
  SELECT COUNT(*) INTO null_count FROM homeowner_jobs WHERE job_number IS NULL;

  RAISE NOTICE '=== Migration Complete ===';
  RAISE NOTICE 'Total jobs: %', job_count;
  RAISE NOTICE 'Jobs with job_number: %', job_count - null_count;
  RAISE NOTICE 'Jobs without job_number: %', null_count;

  IF null_count > 0 THEN
    RAISE WARNING 'Some jobs still have NULL job_number! Run UPDATE again.';
  END IF;
END $$;
