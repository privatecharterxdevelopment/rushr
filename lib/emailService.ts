/**
 * Email Notification Service for Rushr Platform
 *
 * Sends automated emails for all platform interactions:
 * - Bid received (to homeowner)
 * - New job posted (to contractor)
 * - Payment completed (to both)
 * - Work started/completed (to both)
 *
 * Uses Supabase Edge Function with Microsoft Exchange SMTP
 */

export type EmailType =
  | 'bid_received'          // Homeowner receives bid from contractor
  | 'job_posted'            // Contractor receives notification of new job
  | 'bid_accepted'          // Contractor notified their bid was accepted
  | 'payment_completed'     // Both parties notified of payment
  | 'work_started'          // Both parties notified work has started
  | 'work_completed'        // Both parties notified work is complete
  | 'job_cancelled'         // Both parties notified job was cancelled
  | 'kyc_refused'           // Contractor KYC verification refused
  | 'onboarding_confirmation' // New user onboarding confirmation
  | 'password_reset'        // Password reset request
  | 'support_ticket'        // Support ticket received confirmation

interface EmailPayload {
  to: string
  subject: string
  html: string
  text?: string
}

/**
 * Send an email notification using Supabase Edge Function with Microsoft Exchange SMTP
 */
async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[EMAIL] ❌ Supabase configuration missing')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text || '',
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send email')
    }

    console.log('[EMAIL] ✅ Email sent successfully via Supabase SMTP:', {
      subject: payload.subject,
      to: payload.to
    })
    return { success: true }
  } catch (err: any) {
    console.error('[EMAIL] ❌ Failed to send email via Supabase SMTP:', {
      error: err.message,
      subject: payload.subject,
      to: payload.to
    })
    return { success: false, error: err.message }
  }
}

/**
 * Notify homeowner when they receive a bid
 */
export async function notifyBidReceived(params: {
  homeownerEmail: string
  homeownerName: string
  contractorName: string
  jobTitle: string
  bidAmount: number
  estimatedArrival: string
}) {
  const { homeownerEmail, homeownerName, contractorName, jobTitle, bidAmount, estimatedArrival } = params

  const subject = `New Bid Received for "${jobTitle}"`
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10B981;">New Bid Received!</h2>
      <p>Hi ${homeownerName},</p>
      <p><strong>${contractorName}</strong> has submitted a bid for your job:</p>

      <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Job:</strong> ${jobTitle}</p>
        <p style="margin: 5px 0;"><strong>Bid Amount:</strong> $${bidAmount.toFixed(2)}</p>
        <p style="margin: 5px 0;"><strong>Estimated Arrival:</strong> ${estimatedArrival}</p>
      </div>

      <p>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/homeowner/jobs"
           style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          View Bid Details
        </a>
      </p>

      <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
        Rushr - Emergency Home Services
      </p>
    </div>
  `

  return sendEmail({
    to: homeownerEmail,
    subject,
    html,
    text: `Hi ${homeownerName}, ${contractorName} has submitted a bid of $${bidAmount} for "${jobTitle}". Estimated arrival: ${estimatedArrival}. View details at ${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/homeowner/jobs`
  })
}

/**
 * Notify contractor when a new job is posted in their area
 */
export async function notifyNewJob(params: {
  contractorEmail: string
  contractorName: string
  jobTitle: string
  jobCategory: string
  jobAddress: string
  homeownerPhone: string
}) {
  const { contractorEmail, contractorName, jobTitle, jobCategory, jobAddress, homeownerPhone } = params

  const subject = `New Emergency Job: ${jobCategory}`
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563EB;">New Emergency Job Available!</h2>
      <p>Hi ${contractorName},</p>
      <p>A new emergency job has been posted in your service area:</p>

      <div style="background: #EFF6FF; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Category:</strong> ${jobCategory}</p>
        <p style="margin: 5px 0;"><strong>Description:</strong> ${jobTitle}</p>
        <p style="margin: 5px 0;"><strong>Location:</strong> ${jobAddress}</p>
        <p style="margin: 5px 0;"><strong>Contact:</strong> ${homeownerPhone}</p>
      </div>

      <p>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/contractor/jobs"
           style="background: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          View Job & Submit Bid
        </a>
      </p>

      <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
        Rushr Pro - Get More Jobs
      </p>
    </div>
  `

  return sendEmail({
    to: contractorEmail,
    subject,
    html,
    text: `Hi ${contractorName}, New emergency job: ${jobTitle} (${jobCategory}) at ${jobAddress}. Contact: ${homeownerPhone}. View at ${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/contractor/jobs`
  })
}

/**
 * Notify contractor their bid was accepted
 */
export async function notifyBidAccepted(params: {
  contractorEmail: string
  contractorName: string
  jobTitle: string
  homeownerName: string
  homeownerPhone: string
  jobAddress: string
}) {
  const { contractorEmail, contractorName, jobTitle, homeownerName, homeownerPhone, jobAddress } = params

  const subject = `Your Bid Was Accepted! - "${jobTitle}"`
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10B981;">Congratulations! Your Bid Was Accepted</h2>
      <p>Hi ${contractorName},</p>
      <p><strong>${homeownerName}</strong> has accepted your bid!</p>

      <div style="background: #F0FDF4; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Job:</strong> ${jobTitle}</p>
        <p style="margin: 5px 0;"><strong>Location:</strong> ${jobAddress}</p>
        <p style="margin: 5px 0;"><strong>Homeowner:</strong> ${homeownerName}</p>
        <p style="margin: 5px 0;"><strong>Contact:</strong> ${homeownerPhone}</p>
      </div>

      <p>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/contractor/jobs"
           style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          View Job Details
        </a>
      </p>

      <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
        Rushr Pro - Get More Jobs
      </p>
    </div>
  `

  return sendEmail({
    to: contractorEmail,
    subject,
    html,
    text: `Congratulations! ${homeownerName} accepted your bid for "${jobTitle}". Location: ${jobAddress}. Contact: ${homeownerPhone}. View at ${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/contractor/jobs`
  })
}

/**
 * Notify both parties when payment is completed
 */
export async function notifyPaymentCompleted(params: {
  homeownerEmail: string
  homeownerName: string
  contractorEmail: string
  contractorName: string
  jobTitle: string
  amount: number
}) {
  const { homeownerEmail, homeownerName, contractorEmail, contractorName, jobTitle, amount } = params

  // Email to homeowner
  await sendEmail({
    to: homeownerEmail,
    subject: `Payment Confirmed - "${jobTitle}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10B981;">Payment Confirmed</h2>
        <p>Hi ${homeownerName},</p>
        <p>Your payment of <strong>$${amount.toFixed(2)}</strong> for "${jobTitle}" has been processed.</p>
        <p>${contractorName} has been notified and will begin work shortly.</p>

        <p>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/homeowner/jobs"
             style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Job Status
          </a>
        </p>

        <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
          Rushr - Emergency Home Services
        </p>
      </div>
    `,
    text: `Payment confirmed: $${amount.toFixed(2)} for "${jobTitle}". ${contractorName} will begin work shortly.`
  })

  // Email to contractor
  await sendEmail({
    to: contractorEmail,
    subject: `Payment Received - "${jobTitle}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10B981;">Payment Received!</h2>
        <p>Hi ${contractorName},</p>
        <p>${homeownerName} has completed payment of <strong>$${amount.toFixed(2)}</strong> for "${jobTitle}".</p>
        <p>You can now start the work. Payment will be released to you upon job completion.</p>

        <p>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/contractor/jobs"
             style="background: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Mark Work as Started
          </a>
        </p>

        <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
          Rushr Pro - Get More Jobs
        </p>
      </div>
    `,
    text: `Payment received: $${amount.toFixed(2)} for "${jobTitle}" from ${homeownerName}. Start work and update job status.`
  })

  return { success: true }
}

/**
 * Notify both parties when work has started
 */
export async function notifyWorkStarted(params: {
  homeownerEmail: string
  homeownerName: string
  contractorEmail: string
  contractorName: string
  jobTitle: string
  estimatedCompletion: string
}) {
  const { homeownerEmail, homeownerName, contractorEmail, contractorName, jobTitle, estimatedCompletion } = params

  // Email to homeowner
  await sendEmail({
    to: homeownerEmail,
    subject: `Work Started - "${jobTitle}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563EB;">Work Has Started!</h2>
        <p>Hi ${homeownerName},</p>
        <p><strong>${contractorName}</strong> has started work on "${jobTitle}".</p>
        <p>Estimated completion: <strong>${estimatedCompletion}</strong></p>

        <p>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/homeowner/jobs"
             style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Track Progress
          </a>
        </p>

        <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
          Rushr - Emergency Home Services
        </p>
      </div>
    `,
    text: `${contractorName} has started work on "${jobTitle}". Estimated completion: ${estimatedCompletion}.`
  })

  // Email to contractor (confirmation)
  await sendEmail({
    to: contractorEmail,
    subject: `Work Status Updated - "${jobTitle}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563EB;">Work Status Updated</h2>
        <p>Hi ${contractorName},</p>
        <p>You've marked "${jobTitle}" as started.</p>
        <p>${homeownerName} has been notified.</p>

        <p>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/contractor/jobs"
             style="background: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Update Job Status
          </a>
        </p>

        <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
          Rushr Pro - Get More Jobs
        </p>
      </div>
    `,
    text: `Work started for "${jobTitle}". ${homeownerName} has been notified.`
  })

  return { success: true }
}

/**
 * Notify both parties when work is completed
 */
export async function notifyWorkCompleted(params: {
  homeownerEmail: string
  homeownerName: string
  contractorEmail: string
  contractorName: string
  jobTitle: string
}) {
  const { homeownerEmail, homeownerName, contractorEmail, contractorName, jobTitle } = params

  // Email to homeowner
  await sendEmail({
    to: homeownerEmail,
    subject: `Work Completed - "${jobTitle}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10B981;">Work Completed!</h2>
        <p>Hi ${homeownerName},</p>
        <p><strong>${contractorName}</strong> has completed work on "${jobTitle}".</p>
        <p>Please review the work and leave feedback for the contractor.</p>

        <p>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/homeowner/jobs"
             style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Review & Rate Work
          </a>
        </p>

        <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
          Rushr - Emergency Home Services
        </p>
      </div>
    `,
    text: `${contractorName} has completed "${jobTitle}". Please review and rate the work.`
  })

  // Email to contractor
  await sendEmail({
    to: contractorEmail,
    subject: `Job Completed - "${jobTitle}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10B981;">Job Completed!</h2>
        <p>Hi ${contractorName},</p>
        <p>You've marked "${jobTitle}" as complete.</p>
        <p>${homeownerName} has been notified and payment will be released soon.</p>

        <p>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/contractor/jobs"
             style="background: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Job History
          </a>
        </p>

        <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
          Rushr Pro - Get More Jobs
        </p>
      </div>
    `,
    text: `Job "${jobTitle}" marked as complete. ${homeownerName} has been notified.`
  })

  return { success: true }
}

/**
 * Notify contractor when KYC verification is refused
 */
export async function notifyKYCRefused(params: {
  contractorEmail: string
  contractorName: string
  caseId: string
  decisionDate: string
  reasonPrimary: string
  reasonDetails: string
  requestedDocuments: string
}) {
  const { contractorEmail, contractorName, caseId, decisionDate, reasonPrimary, reasonDetails, requestedDocuments } = params

  // Read the HTML template
  const fs = await import('fs/promises')
  const path = await import('path')
  const templatePath = path.join(process.cwd(), 'supabase', 'kyc-refused.html')
  let html = await fs.readFile(templatePath, 'utf-8')

  // Replace placeholders
  const currentYear = new Date().getFullYear().toString()
  const reviewUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/contractor/kyc`

  html = html
    .replace(/{{user_name}}/g, contractorName)
    .replace(/{{case_id}}/g, caseId)
    .replace(/{{decision_date}}/g, decisionDate)
    .replace(/{{kyc_reason_primary}}/g, reasonPrimary)
    .replace(/{{kyc_reason_details}}/g, reasonDetails)
    .replace(/{{requested_documents}}/g, requestedDocuments)
    .replace(/{{review_url}}/g, reviewUrl)
    .replace(/{{year}}/g, currentYear)

  const subject = `Identity Verification Update - Case #${caseId}`

  return sendEmail({
    to: contractorEmail,
    subject,
    html,
    text: `Hi ${contractorName}, We were unable to verify your identity (Case #${caseId}). Reason: ${reasonPrimary}. ${reasonDetails}. Please review and resubmit at ${reviewUrl}`
  })
}

/**
 * Send onboarding confirmation email to new user
 */
export async function notifyOnboardingConfirmation(params: {
  userEmail: string
  userName: string
  onboardingUrl: string
}) {
  const { userEmail, userName, onboardingUrl } = params

  // Read the HTML template
  const fs = await import('fs/promises')
  const path = await import('path')
  const templatePath = path.join(process.cwd(), 'supabase', 'onboarding-confirmation.html')
  let html = await fs.readFile(templatePath, 'utf-8')

  // Replace placeholders
  const currentYear = new Date().getFullYear().toString()

  html = html
    .replace(/{{user_name}}/g, userName)
    .replace(/{{onboarding_url}}/g, onboardingUrl)
    .replace(/{{year}}/g, currentYear)

  const subject = `Welcome to Rushr - Complete Your Setup`

  return sendEmail({
    to: userEmail,
    subject,
    html,
    text: `Hi ${userName}, Welcome to Rushr! Your account has been created. Complete your setup at ${onboardingUrl} (expires in 60 minutes).`
  })
}

/**
 * Send password reset email
 */
export async function notifyPasswordReset(params: {
  userEmail: string
  userName: string
  resetUrl: string
  ipAddress: string
  city: string
  device: string
  requestTime: string
}) {
  const { userEmail, userName, resetUrl, ipAddress, city, device, requestTime } = params

  // Read the HTML template
  const fs = await import('fs/promises')
  const path = await import('path')
  const templatePath = path.join(process.cwd(), 'supabase', 'password-reset.html')
  let html = await fs.readFile(templatePath, 'utf-8')

  // Replace placeholders
  html = html
    .replace(/{{user_name}}/g, userName)
    .replace(/{{reset_url}}/g, resetUrl)
    .replace(/{{ip_address}}/g, ipAddress)
    .replace(/{{city}}/g, city)
    .replace(/{{device}}/g, device)
    .replace(/{{request_time}}/g, requestTime)

  const subject = `Reset Your Rushr Password`

  return sendEmail({
    to: userEmail,
    subject,
    html,
    text: `Hi ${userName}, We received a request to reset your password. Reset your password at ${resetUrl} (expires in 60 minutes). If you didn't request this, please contact support@userushr.com`
  })
}

/**
 * Send support ticket confirmation email
 */
export async function notifySupportTicketReceived(params: {
  userEmail: string
  userName: string
  ticketId: string
  ticketSubject: string
  ticketPriority: string
  ticketStatus: string
}) {
  const { userEmail, userName, ticketId, ticketSubject, ticketPriority, ticketStatus } = params

  // Read the HTML template
  const fs = await import('fs/promises')
  const path = await import('path')
  const templatePath = path.join(process.cwd(), 'supabase', 'support-ticket.html')
  let html = await fs.readFile(templatePath, 'utf-8')

  // Replace placeholders
  const ticketUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/support/tickets/${ticketId}`

  html = html
    .replace(/{{user_name}}/g, userName)
    .replace(/{{ticket_id}}/g, ticketId)
    .replace(/{{ticket_subject}}/g, ticketSubject)
    .replace(/{{ticket_priority}}/g, ticketPriority)
    .replace(/{{ticket_status}}/g, ticketStatus)
    .replace(/{{ticket_url}}/g, ticketUrl)

  const subject = `Support Ticket Received - #${ticketId}`

  return sendEmail({
    to: userEmail,
    subject,
    html,
    text: `Hi ${userName}, We've received your support request. Ticket #${ticketId}: ${ticketSubject}. Priority: ${ticketPriority}. Status: ${ticketStatus}. View at ${ticketUrl}`
  })
}

/**
 * Send welcome email to new homeowner
 */
export async function sendWelcomeEmailHomeowner(params: {
  email: string
  name: string
}) {
  const { email, name } = params

  const subject = 'Welcome to Rushr! 🎉'
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0;">Welcome to Rushr!</h1>
      </div>
      <div style="background: #F9FAFB; padding: 30px; border-radius: 0 0 10px 10px;">
        <p>Hi ${name},</p>

        <p>Welcome to Rushr! We're thrilled to have you join our community of homeowners finding trusted local professionals.</p>

        <h3 style="color: #10B981;">🏠 What you can do:</h3>
        <ul style="line-height: 1.8;">
          <li>Post jobs and get competitive bids from verified contractors</li>
          <li>Browse trusted professionals in your area</li>
          <li>Communicate directly with contractors through our messaging system</li>
          <li>Track your projects from start to finish</li>
          <li>Make secure payments through our platform</li>
        </ul>

        <h3 style="color: #10B981;">💡 Pro tip:</h3>
        <p>The more details you provide in your job posts, the better quality bids you'll receive! Include photos, specific requirements, and your preferred timeline.</p>

        <p style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/homeowner"
             style="background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Go to Dashboard
          </a>
        </p>

        <p>If you have any questions, just reply to this email - we're here to help!</p>

        <p>Best regards,<br>The Rushr Team</p>
      </div>
      <div style="text-align: center; margin-top: 30px; color: #6B7280; font-size: 14px;">
        <p>© ${new Date().getFullYear()} Rushr. All rights reserved.</p>
        <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}" style="color: #10B981;">Visit our website</a></p>
      </div>
    </div>
  `

  return sendEmail({
    to: email,
    subject,
    html,
    text: `Welcome to Rushr! Start posting jobs and connecting with trusted contractors. Visit ${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/homeowner`
  })
}

/**
 * Send welcome email to new contractor
 */
export async function sendWelcomeEmailContractor(params: {
  email: string
  name: string
  businessName?: string
}) {
  const { email, name, businessName } = params

  const subject = 'Welcome to Rushr Pro! 💼'
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0;">Welcome to Rushr Pro!</h1>
      </div>
      <div style="background: #F9FAFB; padding: 30px; border-radius: 0 0 10px 10px;">
        <p>Hi ${businessName || name},</p>

        <p>Welcome to Rushr Pro! We're excited to have you join our network of trusted professionals.</p>

        <h3 style="color: #3B82F6;">🔧 Your Pro benefits:</h3>
        <ul style="line-height: 1.8;">
          <li>Access quality jobs in your service area</li>
          <li>Communicate directly with homeowners</li>
          <li>Build your reputation with reviews and ratings</li>
          <li>Get paid securely through our platform</li>
          <li>Grow your business with verified leads</li>
        </ul>

        <h3 style="color: #3B82F6;">⚡ Get started:</h3>
        <ol style="line-height: 1.8;">
          <li>Complete your profile with licenses & insurance details</li>
          <li>Set your service areas and specialties</li>
          <li>Start bidding on jobs that match your skills</li>
          <li>Consider upgrading to Signals for premium leads</li>
        </ol>

        <p style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/contractor"
             style="background: #3B82F6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Go to Pro Dashboard
          </a>
        </p>

        <p>Need help getting started? Reply to this email - our team is here to support your success!</p>

        <p>Best regards,<br>The Rushr Team</p>
      </div>
      <div style="text-align: center; margin-top: 30px; color: #6B7280; font-size: 14px;">
        <p>© ${new Date().getFullYear()} Rushr. All rights reserved.</p>
        <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}" style="color: #3B82F6;">Visit our website</a></p>
      </div>
    </div>
  `

  return sendEmail({
    to: email,
    subject,
    html,
    text: `Welcome to Rushr Pro! Start bidding on jobs and growing your business. Visit ${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/contractor`
  })
}

/**
 * Send early access waitlist confirmation email
 */
export async function sendEarlyAccessConfirmation(params: {
  email: string
  name: string
}) {
  const { email, name } = params
  const year = new Date().getFullYear()

  const subject = "You're on the Rushr Pro Early Access List!"
  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">
  <head>
    <meta content="width=device-width" name="viewport" />
    <link rel="preload" as="image" href="https://resend-attachments.s3.amazonaws.com/hUV19em8PwJib8k" />
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta content="IE=edge" http-equiv="X-UA-Compatible" />
    <meta content="telephone=no,address=no,email=no,date=no,url=no" name="format-detection" />
    <style>
      body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
      img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; display: block; }
      body { margin: 0; padding: 0; width: 100%; }
      @media only screen and (max-width: 599px) {
        .container { width: 100% !important; max-width: 100% !important; }
        .mobile-padding { padding-left: 24px !important; padding-right: 24px !important; }
        .mobile-text { font-size: 16px !important; line-height: 24px !important; }
        .mobile-title { font-size: 26px !important; line-height: 34px !important; }
      }
      @media (prefers-color-scheme: dark) {
        .dark-bg { background-color: #1a1a1a !important; }
        .dark-card { background-color: #2d2d2d !important; }
        .dark-text { color: #f0f0f0 !important; }
        .dark-secondary { color: #b0b0b0 !important; }
        .dark-border { border-color: #404040 !important; }
        .dark-info-box { background-color: #1f1f1f !important; border-color: #404040 !important; }
      }
    </style>
  </head>
  <body>
    <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">Your Rushr Pro Access Is Locked In</div>
    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" align="center">
      <tbody>
        <tr>
          <td>
            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
              <tbody>
                <tr>
                  <td>
                    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%">
                      <tbody>
                        <tr>
                          <td>
                            <div style="margin:0;padding:0;display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#f6f6f9">
                              <p style="margin:0;padding:0"><span>You're all set! Your exclusive benefits are locked in. We'll notify you when Rushr Pro launches.</span></p>
                            </div>
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" class="dark-bg" style="margin:0;padding:0;background-color:#f6f6f9">
                              <tbody>
                                <tr>
                                  <td>
                                    <tr style="margin:0;padding:0">
                                      <td align="center" style="margin:0;padding:40px 16px">
                                        <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                          <tbody style="width:100%">
                                            <tr style="width:100%">
                                              <td align="center">
                                                <img alt="Rushr logo" height="49" src="https://resend-attachments.s3.amazonaws.com/hUV19em8PwJib8k" style="display:block;outline:none;border:none;text-decoration:none;padding-bottom:8px" width="166" />
                                              </td>
                                            </tr>
                                          </tbody>
                                        </table>
                                        <table width="600" border="0" cellpadding="0" cellspacing="0" role="presentation" class="container" style="margin:0;padding:0;max-width:600px;width:100%">
                                          <tbody>
                                            <tr>
                                              <td>
                                                <tr style="margin:0;padding:0">
                                                  <td style="margin:0;padding:0">
                                                    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" class="dark-card" style="margin:0;padding:0;background-color:#ffffff;border-radius:12px;box-shadow:0 4px 16px rgba(0, 0, 0, 0.08);overflow:hidden">
                                                      <tbody>
                                                        <tr>
                                                          <td>
                                                            <tr style="margin:0;padding:0">
                                                              <td style="margin:0;padding:0;background-color:#0066FF;height:4px;line-height:4px;font-size:1px"><p style="margin:0;padding:0"><span> </span></p></td>
                                                            </tr>
                                                            <tr style="margin:0;padding:0">
                                                              <td class="mobile-padding" style="margin:0;padding:56px 48px 8px 48px">
                                                                <h1 class="mobile-title dark-text" style='margin:0px;padding:0;color:rgb(34, 34, 34);font-family:-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;font-size:32px;font-weight:700;letter-spacing:-0.5px;line-height:40px'>
                                                                  <span>You're all set, ${name}! 🎉</span>
                                                                </h1>
                                                              </td>
                                                            </tr>
                                                            <tr style="margin:0;padding:0">
                                                              <td class="mobile-padding" style="margin:0;padding:24px 48px 0 48px">
                                                                <p class="mobile-text dark-secondary" style='margin:0px;padding:0;color:rgb(85, 85, 85);font-family:-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;font-size:17px;line-height:26px'>
                                                                  <span>Thank you for registering for Rushr Pro! You're now officially on our priority list and your exclusive benefits are locked in.</span>
                                                                </p>
                                                              </td>
                                                            </tr>
                                                            <tr style="margin:0;padding:0">
                                                              <td class="mobile-padding" style="margin:0;padding:16px 48px 0 48px">
                                                                <p class="mobile-text dark-secondary" style='margin:0px;padding:0;color:rgb(85, 85, 85);font-family:-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;font-size:17px;line-height:26px'>
                                                                  <span>We're working hard to bring Rushr Pro to life, and you'll be among the very first to know when we're ready to launch.</span>
                                                                </p>
                                                              </td>
                                                            </tr>
                                                            <tr style="margin:0;padding:0">
                                                              <td class="mobile-padding" style="margin:0;padding:32px 48px 32px 48px">
                                                                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                                                  <tbody><tr><td><tr style="margin:0;padding:0"><td class="dark-border" style="margin:0;padding:0;border-top:1px solid #e6e6ea"><p style="margin:0;padding:0"><br /></p></td></tr></td></tr></tbody>
                                                                </table>
                                                              </td>
                                                            </tr>
                                                            <tr style="margin:0;padding:0">
                                                              <td class="mobile-padding" style="margin:0;padding:0 48px 32px 48px">
                                                                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" class="dark-info-box" style="margin:0;padding:0;background-color:#f0f7ff;border:1px solid #cce5ff;border-radius:8px">
                                                                  <tbody>
                                                                    <tr>
                                                                      <td>
                                                                        <tr style="margin:0;padding:0">
                                                                          <td style="margin:0;padding:24px">
                                                                            <p class="dark-text" style='margin:0px 0px 20px;padding:0;color:rgb(34, 34, 34);font-family:-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;font-size:16px;font-weight:600;line-height:20px'>
                                                                              <span>🎁 Your confirmed benefits</span>
                                                                            </p>
                                                                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                                                              <tbody>
                                                                                <tr><td>
                                                                                  <tr style="margin:0;padding:0">
                                                                                    <td style="margin:0;padding:0 0 14px 0">
                                                                                      <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                                                                        <tbody><tr><td><tr style="margin:0;padding:0">
                                                                                          <td style="margin:0;padding:0;width:28px;vertical-align:top"><p style="margin:0;padding:0"><span style="color:#ffffff">✓</span></p></td>
                                                                                          <td class="dark-text" style="margin:0;padding:0;font-size:15px;line-height:22px;color:#222222;font-family:-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif">
                                                                                            <p style="margin:0;padding:0"><span><strong>💵 3 Months Free</strong></span><br /><span style="color:#004085">Get full access to Rushr Pro for 3 months at no cost</span></p>
                                                                                          </td>
                                                                                        </tr></td></tr></tbody>
                                                                                      </table>
                                                                                    </td>
                                                                                  </tr>
                                                                                  <tr style="margin:0;padding:0">
                                                                                    <td style="margin:0;padding:0 0 14px 0">
                                                                                      <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                                                                        <tbody><tr><td><tr style="margin:0;padding:0">
                                                                                          <td style="margin:0;padding:0;width:28px;vertical-align:top"><p style="margin:0;padding:0"><span style="color:#ffffff">✓</span></p></td>
                                                                                          <td class="dark-text" style="margin:0;padding:0;font-size:15px;line-height:22px;color:#222222;font-family:-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif">
                                                                                            <p style="margin:0;padding:0"><span><strong>🚀 Priority Access</strong></span><br /><span style="color:#004085">Be the first to access the platform when we launch</span></p>
                                                                                          </td>
                                                                                        </tr></td></tr></tbody>
                                                                                      </table>
                                                                                    </td>
                                                                                  </tr>
                                                                                  <tr style="margin:0;padding:0">
                                                                                    <td style="margin:0;padding:0">
                                                                                      <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                                                                        <tbody><tr><td><tr style="margin:0;padding:0">
                                                                                          <td style="margin:0;padding:0;width:28px;vertical-align:top"><p style="margin:0;padding:0"><span style="color:#ffffff">✓</span></p></td>
                                                                                          <td class="dark-text" style="margin:0;padding:0;font-size:15px;line-height:22px;color:#222222;font-family:-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif">
                                                                                            <p style="margin:0;padding:0"><span><strong>📈 Lowered Fees</strong></span><br /><span style="color:#004085">Special reduced platform fees for life</span></p>
                                                                                          </td>
                                                                                        </tr></td></tr></tbody>
                                                                                      </table>
                                                                                    </td>
                                                                                  </tr>
                                                                                </td></tr>
                                                                              </tbody>
                                                                            </table>
                                                                          </td>
                                                                        </tr>
                                                                      </td>
                                                                    </tr>
                                                                  </tbody>
                                                                </table>
                                                              </td>
                                                            </tr>
                                                            <tr style="margin:0;padding:0">
                                                              <td class="mobile-padding" style="margin:0;padding:0 48px 32px 48px">
                                                                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                                                  <tbody><tr><td><tr style="margin:0;padding:0"><td class="dark-border" style="margin:0;padding:0;border-top:1px solid #e6e6ea"><p style="margin:0;padding:0"><br /></p></td></tr></td></tr></tbody>
                                                                </table>
                                                              </td>
                                                            </tr>
                                                            <tr style="margin:0;padding:0">
                                                              <td class="mobile-padding" style="margin:0;padding:0 48px 32px 48px">
                                                                <p class="mobile-text dark-text" style='margin:0px 0px 16px;padding:0;color:rgb(34, 34, 34);font-family:-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;font-size:17px;font-weight:600;line-height:26px'>
                                                                  <span>What happens next?</span>
                                                                </p>
                                                                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" class="dark-info-box" style="margin:0;padding:0;background-color:#f8f9fa;border:1px solid #e6e6ea;border-radius:8px">
                                                                  <tbody>
                                                                    <tr>
                                                                      <td>
                                                                        <tr style="margin:0;padding:0">
                                                                          <td style="margin:0;padding:24px">
                                                                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                                                              <tbody>
                                                                                <tr><td>
                                                                                  <tr style="margin:0;padding:0">
                                                                                    <td style="margin:0;padding:0 0 14px 0">
                                                                                      <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                                                                        <tbody><tr><td><tr style="margin:0;padding:0">
                                                                                          <td style="margin:0;padding:0;width:28px;vertical-align:top"><p style="margin:0;padding:0"><span style="color:#ffffff">1</span></p></td>
                                                                                          <td class="dark-text" style="margin:0;padding:0;font-size:15px;line-height:22px;color:#222222;font-family:-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif">
                                                                                            <p style="margin:0;padding:0"><span><strong>📧 Stay tuned for updates</strong></span><br /><span style="color:#555555">We'll keep you posted on our progress and launch date</span></p>
                                                                                          </td>
                                                                                        </tr></td></tr></tbody>
                                                                                      </table>
                                                                                    </td>
                                                                                  </tr>
                                                                                  <tr style="margin:0;padding:0">
                                                                                    <td style="margin:0;padding:0 0 14px 0">
                                                                                      <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                                                                        <tbody><tr><td><tr style="margin:0;padding:0">
                                                                                          <td style="margin:0;padding:0;width:28px;vertical-align:top"><p style="margin:0;padding:0"><span style="color:#ffffff">2</span></p></td>
                                                                                          <td class="dark-text" style="margin:0;padding:0;font-size:15px;line-height:22px;color:#222222;font-family:-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif">
                                                                                            <p style="margin:0;padding:0"><span><strong>🚀 Get early access</strong></span><br /><span style="color:#555555">You'll receive your invite before anyone else</span></p>
                                                                                          </td>
                                                                                        </tr></td></tr></tbody>
                                                                                      </table>
                                                                                    </td>
                                                                                  </tr>
                                                                                  <tr style="margin:0;padding:0">
                                                                                    <td style="margin:0;padding:0">
                                                                                      <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                                                                        <tbody><tr><td><tr style="margin:0;padding:0">
                                                                                          <td style="margin:0;padding:0;width:28px;vertical-align:top"><p style="margin:0;padding:0"><span style="color:#ffffff">3</span></p></td>
                                                                                          <td class="dark-text" style="margin:0;padding:0;font-size:15px;line-height:22px;color:#222222;font-family:-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif">
                                                                                            <p style="margin:0;padding:0"><span><strong>💪 Start growing your business</strong></span><br /><span style="color:#555555">Connect with homeowners and take your business to the next level</span></p>
                                                                                          </td>
                                                                                        </tr></td></tr></tbody>
                                                                                      </table>
                                                                                    </td>
                                                                                  </tr>
                                                                                </td></tr>
                                                                              </tbody>
                                                                            </table>
                                                                          </td>
                                                                        </tr>
                                                                      </td>
                                                                    </tr>
                                                                  </tbody>
                                                                </table>
                                                              </td>
                                                            </tr>
                                                            <tr style="margin:0;padding:0">
                                                              <td class="mobile-padding" style="margin:0;padding:0 48px 32px 48px">
                                                                <p class="mobile-text dark-secondary" style='margin:0px;padding:0;color:rgb(85, 85, 85);font-family:-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;font-size:16px;line-height:24px'>
                                                                  <span>In the meantime, if you have any questions or want to learn more about what we're building, feel free to reach out to us at </span>
                                                                  <a href="mailto:hello@userushr.com" style="color:rgb(0, 102, 255);text-decoration:underline;font-weight:500" target="_blank"><u>hello@userushr.com</u></a>
                                                                  <span> or simply reply to this email.</span>
                                                                </p>
                                                              </td>
                                                            </tr>
                                                            <tr style="margin:0;padding:0">
                                                              <td class="mobile-padding" style="margin:0;padding:0 48px 56px 48px">
                                                                <p class="mobile-text dark-text" style='margin:0px;padding:0;color:rgb(34, 34, 34);font-family:-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;font-size:17px;line-height:26px;text-align:center'>
                                                                  <span>Welcome to the Rushr Pro family! 💪</span>
                                                                </p>
                                                              </td>
                                                            </tr>
                                                          </td>
                                                        </tr>
                                                      </tbody>
                                                    </table>
                                                  </td>
                                                </tr>
                                                <tr style="margin:0;padding:0">
                                                  <td align="center" style="margin:0;padding:32px 16px 40px 16px">
                                                    <p class="dark-secondary" style='margin:0px 0px 8px;padding:0;color:rgb(136, 136, 136);font-family:-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;font-size:14px;line-height:20px;text-align:center'>
                                                      <span>Questions? Contact </span>
                                                      <a href="mailto:hello@userushr.com" style="color:rgb(0, 102, 255);text-decoration:none;font-weight:500" target="_blank">hello@userushr.com</a>
                                                    </p>
                                                    <p class="dark-secondary" style='margin:0px;padding:0;color:rgb(136, 136, 136);font-family:-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;font-size:12px;line-height:18px;text-align:center'>
                                                      <span>© ${year} Rushr. All rights reserved.</span>
                                                    </p>
                                                  </td>
                                                </tr>
                                              </td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      </td>
                                    </tr>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </body>
</html>`

  return sendEmail({
    to: email,
    subject,
    html,
    text: `Hi ${name}, You're all set! Thank you for registering for Rushr Pro. Your exclusive benefits are locked in: 3 Months Free, Priority Access, and Lowered Fees for life. We'll notify you when we launch. Questions? Contact hello@userushr.com - The Rushr Team`
  })
}

/**
 * Notify contractor when homeowner sends them a custom job offer
 */
export async function notifyCustomOffer(params: {
  contractorEmail: string
  contractorName: string
  homeownerName: string
  jobTitle: string
  offeredAmount: number
  jobDescription: string
  category: string
}) {
  const { contractorEmail, contractorName, homeownerName, jobTitle, offeredAmount, jobDescription, category } = params

  const subject = `New Direct Job Offer: ${jobTitle}`
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10B981;">New Direct Job Offer!</h2>
      <p>Hi ${contractorName},</p>
      <p><strong>${homeownerName}</strong> has sent you a direct job offer:</p>

      <div style="background: #F0FDF4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
        <p style="margin: 5px 0;"><strong>Job:</strong> ${jobTitle}</p>
        <p style="margin: 5px 0;"><strong>Category:</strong> ${category}</p>
        <p style="margin: 5px 0;"><strong>Offered Amount:</strong> $${offeredAmount.toFixed(2)}</p>
        <p style="margin: 5px 0;"><strong>Description:</strong></p>
        <p style="margin: 5px 0; color: #6B7280;">${jobDescription}</p>
      </div>

      <p>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/contractor/offers"
           style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          View Offer & Respond
        </a>
      </p>

      <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
        Rushr Pro - Get More Jobs
      </p>
    </div>
  `

  return sendEmail({
    to: contractorEmail,
    subject,
    html,
    text: `Hi ${contractorName}, ${homeownerName} sent you a direct job offer for "${jobTitle}" - $${offeredAmount.toFixed(2)}. ${jobDescription}. View at ${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/contractor/offers`
  })
}
