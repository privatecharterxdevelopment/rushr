const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testWithAuth() {
  console.log('Testing with authenticated user...\n')

  // First, let's sign in as the homeowner
  // You'll need to provide actual credentials
  const email = 'YOUR_HOMEOWNER_EMAIL@example.com' // REPLACE THIS
  const password = 'YOUR_PASSWORD' // REPLACE THIS

  console.log('Attempting to sign in...')
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (authError) {
    console.error('❌ Sign in failed:', authError.message)
    console.log('\nPlease edit test-authenticated-insert.js and add real credentials on lines 14-15')
    return
  }

  console.log('✅ Signed in as:', authData.user.email)
  console.log('User ID:', authData.user.id)

  // Now try to insert a job
  const testJob = {
    title: 'Test Emergency - Authenticated',
    description: 'Testing job insertion with auth',
    category: 'plumbing',
    priority: 'emergency',
    status: 'pending',
    address: '123 Test St, New York, NY 10001',
    latitude: 40.7589,
    longitude: -73.9851,
    zip_code: '10001',
    phone: '555-123-4567',
    homeowner_id: authData.user.id, // Use authenticated user's ID
    created_at: new Date().toISOString(),
  }

  console.log('\nAttempting to insert job...')
  const { data, error } = await supabase
    .from('homeowner_jobs')
    .insert([testJob])
    .select()

  if (error) {
    console.error('\n❌ INSERT STILL FAILED')
    console.error('Error:', error.message)
    console.error('\nThis means the RLS policies were NOT applied correctly.')
    console.error('Go back to Supabase SQL Editor and check if you see any error messages.')
  } else {
    console.log('\n✅✅✅ INSERT SUCCESSFUL! ✅✅✅')
    console.log('Inserted job:', data[0])
    console.log('\nJob posting is NOW WORKING!')
    console.log('You can now post jobs from the web app.')
  }

  await supabase.auth.signOut()
}

testWithAuth().catch(console.error)
