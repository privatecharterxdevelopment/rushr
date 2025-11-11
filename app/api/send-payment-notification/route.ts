import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/send-payment-notification
 * Sends email notification when payment is completed
 * Called by database trigger
 */
export async function POST(request: NextRequest) {
  try {
    const {
      contractorEmail,
      contractorName,
      homeownerEmail,
      homeownerName,
      amount,
      jobTitle,
      jobId
    } = await request.json()

    if (!contractorEmail || !homeownerEmail || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://rushr-main.vercel.app'

    // Email to CONTRACTOR - Payment Received
    const contractorSubject = `💰 Payment Received: $${amount}`
    const contractorHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0;">💰 Payment Received!</h1>
        </div>
        <div style="background: #F9FAFB; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>Hi ${contractorName || 'there'},</p>

          <p>Great news! Payment has been completed for your job${jobTitle ? ` "${jobTitle}"` : ''}.</p>

          <div style="background: #D1FAE5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #065F46;">Payment Amount</p>
            <p style="margin: 10px 0 0 0; font-size: 32px; font-weight: bold; color: #047857;">$${amount}</p>
          </div>

          <p><strong>From:</strong> ${homeownerName || 'Homeowner'}</p>
          ${jobTitle ? `<p><strong>Job:</strong> ${jobTitle}</p>` : ''}

          <p style="text-align: center; margin: 30px 0;">
            <a href="${appUrl}/dashboard/contractor"
               style="background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Earnings
            </a>
          </p>

          <p style="background: #EFF6FF; padding: 15px; border-radius: 6px; border-left: 3px solid #3B82F6;">
            <strong>💡 Pro Tip:</strong> Funds will be transferred to your bank account within 2-3 business days.
          </p>

          <p>Keep up the great work!</p>

          <p>Best regards,<br>The Rushr Team</p>
        </div>
        <div style="text-align: center; margin-top: 30px; color: #6B7280; font-size: 14px;">
          <p>© ${new Date().getFullYear()} Rushr. All rights reserved.</p>
        </div>
      </div>
    `

    // Email to HOMEOWNER - Payment Confirmation
    const homeownerSubject = `✅ Payment Confirmed: $${amount}`
    const homeownerHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0;">✅ Payment Confirmed</h1>
        </div>
        <div style="background: #F9FAFB; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>Hi ${homeownerName || 'there'},</p>

          <p>Your payment has been successfully processed${jobTitle ? ` for "${jobTitle}"` : ''}.</p>

          <div style="background: #DBEAFE; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3B82F6; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #1E40AF;">Payment Amount</p>
            <p style="margin: 10px 0 0 0; font-size: 32px; font-weight: bold; color: #1E3A8A;">$${amount}</p>
          </div>

          <p><strong>Paid to:</strong> ${contractorName || 'Contractor'}</p>
          ${jobTitle ? `<p><strong>Job:</strong> ${jobTitle}</p>` : ''}

          <p style="text-align: center; margin: 30px 0;">
            <a href="${appUrl}/dashboard/homeowner"
               style="background: #3B82F6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Transaction
            </a>
          </p>

          <p style="background: #F0FDF4; padding: 15px; border-radius: 6px; border-left: 3px solid #10B981;">
            <strong>✨ Thank you for using Rushr!</strong> Please consider leaving a review for ${contractorName || 'your contractor'}.
          </p>

          <p>Best regards,<br>The Rushr Team</p>
        </div>
        <div style="text-align: center; margin-top: 30px; color: #6B7280; font-size: 14px;">
          <p>© ${new Date().getFullYear()} Rushr. All rights reserved.</p>
        </div>
      </div>
    `

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    // Send email to CONTRACTOR
    const contractorEmailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        to: contractorEmail,
        subject: contractorSubject,
        html: contractorHtml,
        text: `Payment Received: $${amount} from ${homeownerName || 'Homeowner'} for ${jobTitle || 'your job'}. View at: ${appUrl}/dashboard/contractor`
      }),
    })

    const contractorEmailData = await contractorEmailResponse.json()
    if (!contractorEmailResponse.ok) {
      console.error('[Payment Notification] Contractor email failed:', contractorEmailData.error)
    } else {
      console.log('[Payment Notification] Contractor email sent to', contractorEmail)
    }

    // Send email to HOMEOWNER
    const homeownerEmailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        to: homeownerEmail,
        subject: homeownerSubject,
        html: homeownerHtml,
        text: `Payment Confirmed: $${amount} paid to ${contractorName || 'contractor'} for ${jobTitle || 'job'}. View at: ${appUrl}/dashboard/homeowner`
      }),
    })

    const homeownerEmailData = await homeownerEmailResponse.json()
    if (!homeownerEmailResponse.ok) {
      console.error('[Payment Notification] Homeowner email failed:', homeownerEmailData.error)
    } else {
      console.log('[Payment Notification] Homeowner email sent to', homeownerEmail)
    }

    return NextResponse.json({
      success: true,
      message: 'Payment notifications sent successfully',
      contractorEmailSent: contractorEmailResponse.ok,
      homeownerEmailSent: homeownerEmailResponse.ok
    })

  } catch (error: any) {
    console.error('[Payment Notification] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send payment notification' },
      { status: 500 }
    )
  }
}
