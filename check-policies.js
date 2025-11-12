const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkPolicies() {
  console.log('Checking current RLS policies on homeowner_jobs table...\n')

  const { data, error } = await supabase
    .from('homeowner_jobs')
    .select('*')
    .limit(1)

  if (error) {
    console.log('SELECT Error:', error.message)
    console.log('This means RLS is blocking even SELECT operations\n')
  } else {
    console.log('✅ SELECT works (found', data?.length || 0, 'jobs)\n')
  }

  // Try to see if we can query the policies table
  const { data: policies, error: policyError } = await supabase
    .rpc('exec_sql', {
      sql: `SELECT policyname, cmd, permissive FROM pg_policies WHERE tablename = 'homeowner_jobs'`
    })

  if (policyError) {
    console.log('Cannot query policies (expected):', policyError.code)
  } else {
    console.log('Current policies:', policies)
  }
}

checkPolicies().catch(console.error)
