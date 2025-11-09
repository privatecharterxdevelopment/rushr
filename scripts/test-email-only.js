// Test email sending only (no account creation)
require('dotenv').config({ path: '.env.local' });

async function testEmail() {
  console.log('📧 Testing email sending with verified domain...\n');

  // Test homeowner welcome email
  console.log('1️⃣ Sending homeowner welcome email...');
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/send-welcome-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'zac.schwartz212@gmail.com',
        name: 'Zac Schwartz',
        type: 'homeowner'
      })
    });

    const result = await response.json();
    if (result.success) {
      console.log('✅ Homeowner welcome email sent successfully!');
      console.log('   Check your inbox at zac.schwartz212@gmail.com');
    } else {
      console.error('❌ Failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n2️⃣ Sending contractor welcome email...');
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/send-welcome-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'zac.schwartz212@gmail.com',
        name: 'Zac Schwartz',
        businessName: 'Schwartz Contracting',
        type: 'contractor'
      })
    });

    const result = await response.json();
    if (result.success) {
      console.log('✅ Contractor welcome email sent successfully!');
      console.log('   Check your inbox at zac.schwartz212@gmail.com');
    } else {
      console.error('❌ Failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n💡 Check your Resend dashboard: https://resend.com/emails');
}

testEmail();
