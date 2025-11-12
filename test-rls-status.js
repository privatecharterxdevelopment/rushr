const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Use service role key to check policies
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkRLS() {
  console.log('Checking if RLS policies exist for homeowner_jobs...\n')

  // Try a simple insert with service role (bypasses RLS)
  const testJob = {
    title: 'RLS Test',
    description: 'Testing if table is accessible',
    category: 'plumbing',
    priority: 'emergency',
    status: 'pending',
    address: '123 Test',
    phone: '555-1234',
    homeowner_id: '00000000-0000-0000-0000-000000000000', // Fake UUID
    created_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('homeowner_jobs')
    .insert([testJob])
    .select()

  if (error) {
    console.error('❌ Cannot insert even with service role key:', error.message)
    console.error('\nThis means either:')
    console.error('1. The table has constraints that are failing')
    console.error('2. The service role key is not set in .env.local')
    console.error('\nError details:', error)
  } else {
    console.log('✅ Insert successful with service role')
    console.log('Job ID:', data[0]?.id)

    // Delete the test job
    await supabase.from('homeowner_jobs').delete().eq('id', data[0].id)
    console.log('Test job cleaned up\n')

    console.log('RLS policies ARE blocking regular users.')
    console.log('Did you run the FIX_RLS_POLICIES.sql in Supabase SQL Editor?')
  }
}

checkRLS().catch(console.error)
