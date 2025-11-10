// Script to add job_number column to homeowner_jobs table
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function addJobNumbers() {
  console.log('Adding job_number column to homeowner_jobs...')

  try {
    // Execute the SQL to add job_number column
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create sequence for job numbers starting at 10000
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'job_number_seq') THEN
            CREATE SEQUENCE job_number_seq START WITH 10000 INCREMENT BY 1;
          END IF;
        END $$;

        -- Add job_number column if it doesn't exist
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'homeowner_jobs' AND column_name = 'job_number'
          ) THEN
            ALTER TABLE homeowner_jobs ADD COLUMN job_number INTEGER;
          END IF;
        END $$;

        -- Backfill existing jobs with sequential numbers
        UPDATE homeowner_jobs
        SET job_number = nextval('job_number_seq')
        WHERE job_number IS NULL;

        -- Make job_number unique and not null
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'homeowner_jobs_job_number_unique'
          ) THEN
            ALTER TABLE homeowner_jobs
            ALTER COLUMN job_number SET NOT NULL,
            ADD CONSTRAINT homeowner_jobs_job_number_unique UNIQUE (job_number);
          END IF;
        END $$;

        -- Set default for new jobs
        ALTER TABLE homeowner_jobs
        ALTER COLUMN job_number SET DEFAULT nextval('job_number_seq');

        -- Create index for fast lookups by job_number
        CREATE INDEX IF NOT EXISTS idx_homeowner_jobs_job_number ON homeowner_jobs(job_number);
      `
    })

    if (error) {
      console.error('Error:', error)

      // If exec_sql doesn't exist, try direct SQL execution
      console.log('Trying alternative method...')
      const queries = [
        `CREATE SEQUENCE IF NOT EXISTS job_number_seq START WITH 10000 INCREMENT BY 1`,
        `ALTER TABLE homeowner_jobs ADD COLUMN IF NOT EXISTS job_number INTEGER`,
        `UPDATE homeowner_jobs SET job_number = nextval('job_number_seq') WHERE job_number IS NULL`,
        `CREATE UNIQUE INDEX IF NOT EXISTS homeowner_jobs_job_number_unique ON homeowner_jobs(job_number)`,
        `ALTER TABLE homeowner_jobs ALTER COLUMN job_number SET DEFAULT nextval('job_number_seq')`,
        `CREATE INDEX IF NOT EXISTS idx_homeowner_jobs_job_number ON homeowner_jobs(job_number)`
      ]

      for (const query of queries) {
        const result = await supabase.rpc('exec_sql', { sql: query })
        if (result.error) {
          console.error('Query failed:', query, result.error)
        } else {
          console.log('✓ Executed:', query.substring(0, 50) + '...')
        }
      }
    } else {
      console.log('✓ Successfully added job_number column!')
      console.log('Result:', data)
    }
  } catch (err) {
    console.error('Fatal error:', err)
  }
}

addJobNumbers()
