// Quick SMTP test script
const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  secure: false, // use STARTTLS
  auth: {
    user: 'noreply@userushr.com',
    pass: 'LorenzoRushr123!',
  },
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false
  },
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000,
  socketTimeout: 10000
})

console.log('Testing SMTP connection...')

transporter.verify(function (error, success) {
  if (error) {
    console.error('❌ SMTP Error:', error)
  } else {
    console.log('✅ SMTP server is ready to take our messages')

    // Try sending a test email
    transporter.sendMail({
      from: 'Rushr <noreply@userushr.com>',
      to: 'noreply@userushr.com', // sending to yourself for testing
      subject: 'SMTP Test',
      text: 'If you receive this, SMTP is working!',
    }, (err, info) => {
      if (err) {
        console.error('❌ Send Error:', err)
      } else {
        console.log('✅ Email sent:', info.messageId)
      }
      process.exit(0)
    })
  }
})
