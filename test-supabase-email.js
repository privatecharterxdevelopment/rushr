// Quick Supabase Email Test Script
// Tests the Supabase Edge Function for sending emails via Microsoft Exchange SMTP

require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if configuration is set
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local!')
  console.log('\nYou can find these in your Supabase dashboard:')
  console.log('1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api')
  console.log('2. Copy the Project URL and anon/public key')
  process.exit(1)
}

const emailPayload = {
  to: 'zac.schwartz212@gmail.com', // Send to yourself for testing
  subject: 'Supabase Email Test - Rushr Platform',
  text: 'If you receive this email, Supabase SMTP integration is working correctly!',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10B981;">✅ Supabase Email Test Successful!</h2>
      <p>If you're reading this, your Supabase Edge Function with Microsoft Exchange SMTP is working perfectly.</p>
      <p>You can now send:</p>
      <ul>
        <li>Bid notifications</li>
        <li>Welcome emails</li>
        <li>Payment confirmations</li>
        <li>All other transactional emails</li>
      </ul>
      <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
        Rushr Platform - Powered by Supabase Edge Functions
      </p>
    </div>
  `,
}

console.log('📧 Sending test email via Supabase Edge Function...')
console.log(`📍 Supabase URL: ${SUPABASE_URL}`)
console.log(`📨 Sending to: ${emailPayload.to}`)

fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  },
  body: JSON.stringify(emailPayload),
})
  .then(async (response) => {
    const data = await response.json()

    if (response.ok) {
      console.log('✅ Email sent successfully!')
      console.log('Response:', data)
      console.log('\n📬 Check your inbox at zac.schwartz212@gmail.com')
    } else {
      console.error('❌ Email sending failed!')
      console.error('Status:', response.status)
      console.error('Error:', data.error)

      if (data.error?.includes('SmtpClientAuthentication')) {
        console.log('\n💡 Troubleshooting:')
        console.log('1. Enable SMTP AUTH in Microsoft 365 Admin Center')
        console.log('2. Or use an App Password instead of regular password')
        console.log('3. See SUPABASE_EMAIL_SETUP.md for detailed instructions')
      }
    }
  })
  .catch((error) => {
    console.error('❌ Network Error:', error.message)
    console.log('\n💡 Make sure:')
    console.log('1. The Supabase Edge Function is deployed: supabase functions deploy send-email')
    console.log('2. SMTP secrets are configured: supabase secrets list')
    console.log('3. Your internet connection is working')
  })
