// Quick SendGrid test script
const sgMail = require('@sendgrid/mail')

// Check if API key is set
if (!process.env.SENDGRID_API_KEY || process.env.SENDGRID_API_KEY === 'your_sendgrid_api_key_here') {
  console.error('❌ Please set SENDGRID_API_KEY in .env.local first!')
  console.log('\n📝 How to get your SendGrid API key:')
  console.log('1. Go to https://app.sendgrid.com/settings/api_keys')
  console.log('2. Click "Create API Key"')
  console.log('3. Name it "Rushr API Key"')
  console.log('4. Select "Full Access"')
  console.log('5. Copy the key and paste it in .env.local')
  process.exit(1)
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const msg = {
  to: 'noreply@userushr.com', // Send to yourself for testing
  from: {
    email: 'noreply@userushr.com',
    name: 'Rushr'
  },
  subject: 'SendGrid Test - Rushr Platform',
  text: 'If you receive this email, SendGrid is working correctly!',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10B981;">✅ SendGrid Test Successful!</h2>
      <p>If you're reading this, your SendGrid integration is working perfectly.</p>
      <p>You can now send welcome emails, bid notifications, and all other transactional emails through SendGrid.</p>
      <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
        Rushr Platform
      </p>
    </div>
  `,
}

console.log('📧 Sending test email via SendGrid...')

sgMail
  .send(msg)
  .then((response) => {
    console.log('✅ Email sent successfully!')
    console.log('Status Code:', response[0].statusCode)
    console.log('\nCheck your inbox at noreply@userushr.com')
  })
  .catch((error) => {
    console.error('❌ SendGrid Error:', error.message)
    if (error.response) {
      console.error('Response body:', error.response.body)
    }
  })
