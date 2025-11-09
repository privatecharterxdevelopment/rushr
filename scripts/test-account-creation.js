// Test account creation with email notifications
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAccountCreation() {
  console.log('🧪 Testing account creation with email notifications...\n');

  const timestamp = Date.now();

  // 1. Create homeowner account
  console.log('1️⃣ Creating homeowner account...');
  // Use your verified email for Resend testing (it's still in test mode)
  const homeownerEmail = 'zac.schwartz212@gmail.com';
  const homeownerPassword = 'TestPassword123!';

  const { data: homeownerAuth, error: homeownerAuthError } = await supabase.auth.admin.createUser({
    email: homeownerEmail,
    password: homeownerPassword,
    email_confirm: true,
    user_metadata: {
      name: 'Test Homeowner',
      role: 'homeowner'
    }
  });

  if (homeownerAuthError) {
    console.error('❌ Homeowner auth creation failed:', homeownerAuthError);
    return;
  }

  console.log('✅ Homeowner auth created:', homeownerAuth.user.id);

  // Check if homeowner profile was auto-created by trigger
  const { data: homeownerProfile, error: homeownerProfileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', homeownerAuth.user.id)
    .single();

  if (homeownerProfileError) {
    console.error('❌ Homeowner profile not found:', homeownerProfileError);
  } else {
    console.log('✅ Homeowner profile exists (auto-created by trigger)');
  }

  console.log('\n2️⃣ Creating contractor account...');
  // For contractor, use a +alias so both go to same verified email
  const contractorEmail = `zac.schwartz212+contractor${timestamp}@gmail.com`;
  const contractorPassword = 'TestPassword123!';

  const { data: contractorAuth, error: contractorAuthError } = await supabase.auth.admin.createUser({
    email: contractorEmail,
    password: contractorPassword,
    email_confirm: true,
    user_metadata: {
      name: 'Test Contractor',
      role: 'contractor'
    }
  });

  if (contractorAuthError) {
    console.error('❌ Contractor auth creation failed:', contractorAuthError);
    return;
  }

  console.log('✅ Contractor auth created:', contractorAuth.user.id);

  // Create contractor profile with minimal required fields
  const { data: contractorProfile, error: contractorProfileError } = await supabase
    .from('pro_contractors')
    .insert({
      id: contractorAuth.user.id,
      name: 'Test Contractor',
      business_name: 'Test Contracting Co.',
      email: contractorEmail,
      phone: '+1987654321',
      categories: ['plumbing'],
      service_radius_miles: 25,
      hourly_rate: 75,
      about: 'Professional contractor for testing',
      address: '123 Test St',
      base_zip: '10001',
      latitude: 40.7489,
      longitude: -73.9680
    })
    .select()
    .single();

  if (contractorProfileError) {
    console.error('❌ Contractor profile creation failed:', contractorProfileError);
  } else {
    console.log('✅ Contractor profile created');
  }

  // Send welcome emails via API
  console.log('\n📧 Sending welcome emails...');

  // Send homeowner welcome email
  try {
    const homeownerEmailResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/send-welcome-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: homeownerEmail,
        name: 'Test Homeowner',
        type: 'homeowner'
      })
    });

    const homeownerEmailResult = await homeownerEmailResponse.json();
    if (homeownerEmailResult.success) {
      console.log('✅ Homeowner welcome email sent');
    } else {
      console.error('❌ Homeowner email failed:', homeownerEmailResult.error);
    }
  } catch (error) {
    console.error('❌ Failed to send homeowner email:', error.message);
  }

  // Send contractor welcome email
  try {
    const contractorEmailResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/send-welcome-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: contractorEmail,
        name: 'Test Contractor',
        businessName: 'Test Contracting Co.',
        type: 'contractor'
      })
    });

    const contractorEmailResult = await contractorEmailResponse.json();
    if (contractorEmailResult.success) {
      console.log('✅ Contractor welcome email sent');
    } else {
      console.error('❌ Contractor email failed:', contractorEmailResult.error);
    }
  } catch (error) {
    console.error('❌ Failed to send contractor email:', error.message);
  }
  console.log('\n✅ Test accounts created:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`👤 Homeowner:`);
  console.log(`   Email: ${homeownerEmail}`);
  console.log(`   Password: ${homeownerPassword}`);
  console.log(`   User ID: ${homeownerAuth.user.id}`);
  console.log();
  console.log(`🔧 Contractor:`);
  console.log(`   Email: ${contractorEmail}`);
  console.log(`   Password: ${contractorPassword}`);
  console.log(`   User ID: ${contractorAuth.user.id}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n💡 Check your Resend dashboard for sent emails!');
  console.log('   https://resend.com/emails');
}

testAccountCreation().catch(console.error);
