const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testJobInsert() {
  console.log('Testing homeowner_jobs insert...')
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

  // Test data
  const testJob = {
    title: 'Test Emergency',
    description: 'Testing job insertion',
    category: 'plumbing',
    priority: 'emergency',
    status: 'pending',
    address: '123 Test St, New York, NY 10001',
    latitude: 40.7589,
    longitude: -73.9851,
    zip_code: '10001',
    phone: '555-123-4567',
    homeowner_id: '4d01901d-9c88-4cd6-b1ca-42a1cf638f97', // Replace with actual user ID
    created_at: new Date().toISOString(),
  }

  console.log('\nAttempting to insert:', JSON.stringify(testJob, null, 2))

  const { data, error } = await supabase
    .from('homeowner_jobs')
    .insert([testJob])
    .select()

  if (error) {
    console.error('\n❌ INSERT FAILED')
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)
    console.error('Error details:', error.details)
    console.error('Error hint:', error.hint)
    console.error('Full error:', JSON.stringify(error, null, 2))
  } else {
    console.log('\n✅ INSERT SUCCESSFUL')
    console.log('Inserted job:', JSON.stringify(data, null, 2))
  }
}

testJobInsert().catch(console.error)
