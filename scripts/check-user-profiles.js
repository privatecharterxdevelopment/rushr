// Check what profiles a user has
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkUserProfiles(email, password) {
  console.log(`\n🔍 Checking profiles for: ${email}\n`)

  // Login
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (authError) {
    console.error('❌ Login failed:', authError.message)
    return
  }

  console.log('✅ Login successful!')
  console.log(`   User ID: ${authData.user.id}`)
  console.log(`   Email: ${authData.user.email}\n`)

  // Check homeowner profile
  const { data: homeownerProfile, error: homeownerError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', authData.user.id)
    .maybeSingle()

  if (homeownerProfile) {
    console.log('✅ HAS HOMEOWNER PROFILE:')
    console.log('   Role:', homeownerProfile.role)
    console.log('   Name:', homeownerProfile.name)
    console.log('   Subscription:', homeownerProfile.subscription_type)
  } else {
    console.log('❌ NO HOMEOWNER PROFILE')
    if (homeownerError) {
      console.log('   Error:', homeownerError.message)
    }
  }

  // Check contractor profile
  const { data: contractorProfile, error: contractorError } = await supabase
    .from('pro_contractors')
    .select('*')
    .eq('id', authData.user.id)
    .maybeSingle()

  if (contractorProfile) {
    console.log('\n✅ HAS CONTRACTOR PROFILE:')
    console.log('   Name:', contractorProfile.name)
    console.log('   Business:', contractorProfile.business_name)
    console.log('   Status:', contractorProfile.status)
    console.log('   KYC Status:', contractorProfile.kyc_status)
    console.log('   Availability:', contractorProfile.availability)
  } else {
    console.log('\n❌ NO CONTRACTOR PROFILE')
    if (contractorError) {
      console.log('   Error:', contractorError.message)
    }
  }

  console.log('\n📋 SUMMARY:')
  console.log(`   ${homeownerProfile ? '✅' : '❌'} Homeowner`)
  console.log(`   ${contractorProfile ? '✅' : '❌'} Contractor`)

  if (homeownerProfile && contractorProfile) {
    console.log('\n⚠️  USER HAS BOTH PROFILES - Contractor takes priority in middleware')
  }
}

// Check Lorenzo
checkUserProfiles('lorenzo.vanza@hotmail.com', 'Testadmin123')
