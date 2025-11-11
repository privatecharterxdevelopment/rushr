// Test script to verify admin can approve contractors
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAdminApproval() {
  console.log('🔍 Testing Admin Approval Functionality...\n')

  // Step 1: Login as admin
  const adminEmail = 'lorenzo.vanza@hotmail.com'
  const adminPassword = 'Testadmin123'

  console.log(`1️⃣ Logging in as admin: ${adminEmail}`)
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword
  })

  if (authError) {
    console.error('❌ Login failed:', authError.message)
    return
  }

  console.log('✅ Login successful!')
  console.log(`   User ID: ${authData.user.id}`)
  console.log(`   Email: ${authData.user.email}\n`)

  // Step 2: Try to fetch all contractors
  console.log('2️⃣ Fetching all contractors...')
  const { data: contractors, error: fetchError } = await supabase
    .from('pro_contractors')
    .select('*')
    .order('created_at', { ascending: false })

  if (fetchError) {
    console.error('❌ Failed to fetch contractors:', fetchError.message)
    console.error('   Code:', fetchError.code)
    console.error('   Details:', fetchError.details)
    console.error('\n⚠️  This means the RLS policy is NOT working!')
    console.error('   Please run the SQL script in Supabase SQL Editor:')
    console.error('   scripts/setup-admin-permissions.sql')
    return
  }

  console.log(`✅ Successfully fetched ${contractors.length} contractors\n`)

  // Step 3: Try to approve a pending contractor
  const pendingContractor = contractors.find(c => c.status === 'pending_approval')

  if (!pendingContractor) {
    console.log('ℹ️  No pending contractors to test approval on')
    console.log('   All contractors:', contractors.map(c => ({
      email: c.email,
      status: c.status,
      kyc_status: c.kyc_status
    })))
    return
  }

  console.log(`3️⃣ Testing approval on contractor: ${pendingContractor.email}`)
  console.log(`   Current status: ${pendingContractor.status}`)
  console.log(`   Current KYC status: ${pendingContractor.kyc_status}`)

  const { data: updateData, error: updateError } = await supabase
    .from('pro_contractors')
    .update({
      status: 'approved',
      kyc_status: 'completed',
      availability: 'online',
      profile_approved_at: new Date().toISOString(),
    })
    .eq('id', pendingContractor.id)
    .select()

  if (updateError) {
    console.error('❌ Failed to approve contractor:', updateError.message)
    console.error('   Code:', updateError.code)
    console.error('   Details:', updateError.details)
    console.error('\n⚠️  This means the admin UPDATE policy is NOT working!')
    console.error('   Please run the SQL script in Supabase SQL Editor:')
    console.error('   scripts/setup-admin-permissions.sql')
    return
  }

  console.log('✅ Successfully approved contractor!')
  console.log('   New status:', updateData[0].status)
  console.log('   New KYC status:', updateData[0].kyc_status)
  console.log('   Availability:', updateData[0].availability)
  console.log('\n🎉 Admin approval is working correctly!')
}

testAdminApproval()
