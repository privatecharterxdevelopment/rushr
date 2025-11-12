const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Use service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const sql = `
-- Fix RLS policies for homeowner_jobs table to allow homeowners to insert jobs

-- Drop existing policies if any
DROP POLICY IF EXISTS "Homeowners can insert their own jobs" ON homeowner_jobs;
DROP POLICY IF EXISTS "Homeowners can view their own jobs" ON homeowner_jobs;
DROP POLICY IF EXISTS "Homeowners can update their own jobs" ON homeowner_jobs;
DROP POLICY IF EXISTS "Contractors can view jobs" ON homeowner_jobs;

-- Create INSERT policy: Allow authenticated users to insert jobs with their own homeowner_id
CREATE POLICY "Homeowners can insert their own jobs"
ON homeowner_jobs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = homeowner_id);

-- Create SELECT policy: Allow homeowners to view their own jobs
CREATE POLICY "Homeowners can view their own jobs"
ON homeowner_jobs
FOR SELECT
TO authenticated
USING (auth.uid() = homeowner_id);

-- Create UPDATE policy: Allow homeowners to update their own jobs
CREATE POLICY "Homeowners can update their own jobs"
ON homeowner_jobs
FOR UPDATE
TO authenticated
USING (auth.uid() = homeowner_id)
WITH CHECK (auth.uid() = homeowner_id);

-- Create SELECT policy for contractors: Allow contractors to view all jobs
CREATE POLICY "Contractors can view jobs"
ON homeowner_jobs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM pro_contractors
    WHERE pro_contractors.id = auth.uid()
  )
);

-- Ensure RLS is enabled
ALTER TABLE homeowner_jobs ENABLE ROW LEVEL SECURITY;
`

async function applyFix() {
  console.log('Applying RLS policy fix...\n')

  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

  if (error) {
    console.error('❌ Failed to apply RLS policies')
    console.error('Error:', error)
  } else {
    console.log('✅ RLS policies applied successfully!')
    console.log('\nNow testing insert...')

    // Test insert
    const testJob = {
      title: 'Test Emergency After Fix',
      description: 'Testing job insertion after RLS fix',
      category: 'plumbing',
      priority: 'emergency',
      status: 'pending',
      address: '123 Test St, New York, NY 10001',
      latitude: 40.7589,
      longitude: -73.9851,
      zip_code: '10001',
      phone: '555-123-4567',
      homeowner_id: '4d01901d-9c88-4cd6-b1ca-42a1cf638f97',
      created_at: new Date().toISOString(),
    }

    const { data: insertData, error: insertError } = await supabase
      .from('homeowner_jobs')
      .insert([testJob])
      .select()

    if (insertError) {
      console.error('\n❌ Test insert still failing:', insertError.message)
    } else {
      console.log('\n✅ Test insert SUCCESSFUL!')
      console.log('Inserted job ID:', insertData[0]?.id)
    }
  }
}

applyFix().catch(console.error)
