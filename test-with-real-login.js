const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testRealLogin() {
  console.log('=== TESTING JOB POST WITH REAL LOGIN ===\n')

  // STEP 1: Get your email/password
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  })

  const email = await new Promise(resolve => {
    readline.question('Enter your homeowner email: ', resolve)
  })

  const password = await new Promise(resolve => {
    readline.question('Enter your password: ', resolve)
  })

  readline.close()

  console.log('\nAttempting login...')

  // STEP 2: Sign in
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: password.trim()
  })

  if (authError) {
    console.error('❌ LOGIN FAILED:', authError.message)
    console.error('\nMake sure:')
    console.error('1. The email/password are correct')
    console.error('2. The user exists in Supabase Authentication')
    console.error('3. Email is confirmed')
    return
  }

  console.log('✅ Logged in as:', authData.user.email)
  console.log('User ID:', authData.user.id)

  // STEP 3: Try to insert a job
  const testJob = {
    title: 'Test Emergency - Real Login',
    description: 'Testing if job post works after login',
    category: 'plumbing',
    priority: 'emergency',
    status: 'pending',
    address: '123 Test St, New York, NY 10001',
    latitude: 40.7589,
    longitude: -73.9851,
    zip_code: '10001',
    phone: '555-123-4567',
    homeowner_id: authData.user.id, // CRITICAL: Use the logged-in user's ID
    created_at: new Date().toISOString(),
  }

  console.log('\nAttempting to post job...')
  const { data, error } = await supabase
    .from('homeowner_jobs')
    .insert([testJob])
    .select()

  if (error) {
    console.error('\n❌ JOB POST FAILED')
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)

    if (error.code === '42501') {
      console.error('\nRLS POLICY BLOCKING INSERT!')
      console.error('The RLS policies are NOT working correctly.')
      console.error('Go to Supabase SQL Editor and run:')
      console.error('DROP POLICY IF EXISTS "Homeowners can insert their own jobs" ON homeowner_jobs;')
      console.error('Then re-run the FIX_RLS_POLICIES.sql')
    }
  } else {
    console.log('\n✅✅✅ SUCCESS! JOB POSTED! ✅✅✅')
    console.log('Job ID:', data[0].id)
    console.log('Job title:', data[0].title)
    console.log('\n🎉 THE "ALERT ALL EMERGENCY PROS" BUTTON WILL NOW WORK!')
  }

  await supabase.auth.signOut()
}

testRealLogin().catch(console.error)
