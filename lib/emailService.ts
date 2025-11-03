/**
 * Email Notification Service for Rushr Platform
 *
 * Sends automated emails for all platform interactions:
 * - Bid received (to homeowner)
 * - New job posted (to contractor)
 * - Payment completed (to both)
 * - Work started/completed (to both)
 *
 * Uses Supabase Edge Functions to send emails via SMTP
 */

import { supabase } from './supabaseClient'

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
 * Send an email notification
 */
async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
  try {
    // Call Supabase Edge Function for email sending
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: payload
    })

    if (error) {
      console.error('[EMAIL] Error sending email:', error)
      return { success: false, error: error.message }
    }

    console.log('[EMAIL] Email sent successfully:', payload.subject)
    return { success: true }
  } catch (err: any) {
    console.error('[EMAIL] Failed to send email:', err)
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
