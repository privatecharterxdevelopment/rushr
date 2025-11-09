import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

if (!accountSid || !authToken || !twilioPhoneNumber) {
  console.warn('⚠️ Twilio credentials not configured. SMS notifications will not be sent.')
}

const client = accountSid && authToken ? twilio(accountSid, authToken) : null

interface SendSMSParams {
  to: string
  message: string
}

/**
 * Send an SMS message via Twilio
 */
export async function sendSMS({ to, message }: SendSMSParams): Promise<{ success: boolean; error?: string }> {
  if (!client || !twilioPhoneNumber) {
    console.error('Twilio client not configured')
    return { success: false, error: 'SMS service not configured' }
  }

  try {
    const result = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: to,
    })

    console.log(`✅ SMS sent successfully to ${to}. SID: ${result.sid}`)
    return { success: true }
  } catch (error: any) {
    console.error('❌ Error sending SMS:', error)
    return { success: false, error: error.message || 'Failed to send SMS' }
  }
}

/**
 * Send SMS notification to homeowner when they receive a new bid
 */
export async function sendBidReceivedSMS({
  homeownerPhone,
  homeownerName,
  contractorName,
  jobTitle,
  bidAmount,
}: {
  homeownerPhone: string
  homeownerName: string
  contractorName: string
  jobTitle: string
  bidAmount: number
}): Promise<{ success: boolean; error?: string }> {
  const message = `Hi ${homeownerName}! You received a new bid from ${contractorName} for "${jobTitle}" - $${bidAmount}. View details at https://rushr-main.vercel.app/dashboard/homeowner`

  return sendSMS({ to: homeownerPhone, message })
}

/**
 * Send SMS notification to contractor when their bid is accepted
 */
export async function sendBidAcceptedSMS({
  contractorPhone,
  contractorName,
  homeownerName,
  jobTitle,
}: {
  contractorPhone: string
  contractorName: string
  homeownerName: string
  jobTitle: string
}): Promise<{ success: boolean; error?: string }> {
  const message = `Congratulations ${contractorName}! ${homeownerName} accepted your bid for "${jobTitle}". View job details at https://rushr-main.vercel.app/dashboard/contractor`

  return sendSMS({ to: contractorPhone, message })
}
