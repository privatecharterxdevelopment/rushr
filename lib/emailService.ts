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
