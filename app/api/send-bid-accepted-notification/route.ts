import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const {
      homeownerEmail,
      contractorName,
      jobTitle,
      bidAmount,
      bidId,
      jobId
    } = await request.json()

    console.log('[Bid Accepted Email] Sending to:', homeownerEmail)

    const appUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rushr-main.vercel.app'
    const subject = `Payment Required: Bid Accepted for "${jobTitle}"`

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">✅ Bid Accepted!</h1>
        </div>

        <div style="background: #F9FAFB; padding: 30px; border-radius: 0 0 10px 10px;">
          <div style="background: white; padding: 25px; border-radius: 8px; border: 2px solid #10B981; margin-bottom: 20px;">
            <p style="margin: 0 0 15px 0; font-size: 16px; color: #1F2937;">
              Great news! You've accepted <strong>${contractorName}'s</strong> bid for:
            </p>
            <div style="background: #F0FDF4; padding: 15px; border-radius: 6px; border-left: 4px solid #10B981; margin: 15px 0;">
              <p style="margin: 0; font-size: 18px; font-weight: bold; color: #047857;">"${jobTitle}"</p>
              <p style="margin: 10px 0 0 0; font-size: 20px; font-weight: bold; color: #059669;">$${Number(bidAmount).toFixed(2)}</p>
            </div>
          </div>

          <div style="background: #EFF6FF; padding: 20px; border-radius: 8px; border-left: 4px solid #3B82F6; margin-bottom: 25px;">
            <h3 style="margin: 0 0 10px 0; color: #1E40AF; font-size: 16px;">💳 Next Step: Secure Payment</h3>
            <p style="margin: 0; color: #1E3A8A; font-size: 14px; line-height: 1.6;">
              Your payment will be held securely in escrow until the job is complete.
              The contractor won't receive payment until both parties confirm the work is done.
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${appUrl}/dashboard/homeowner/bids"
               style="background: #3B82F6; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
              Place Payment Now
            </a>
          </div>

          <div style="background: #FEF3C7; padding: 15px; border-radius: 6px; border-left: 4px solid #F59E0B; margin-top: 20px;">
            <p style="margin: 0; font-size: 13px; color: #92400E;">
              <strong>⚠️ Important:</strong> Payment must be completed before the contractor can start work.
              You can manage this in your dashboard.
            </p>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
            <p style="margin: 0; font-size: 12px; color: #6B7280; text-align: center;">
              Questions? Contact us at support@userushr.com
            </p>
          </div>
        </div>
      </div>
    `

    const text = `
Bid Accepted!

You've accepted ${contractorName}'s bid for "${jobTitle}" - $${Number(bidAmount).toFixed(2)}

Next Step: Place your payment in escrow
The payment will be held securely until the job is complete.

Click here to place payment: ${appUrl}/dashboard/homeowner/bids

Questions? Contact support@userushr.com
    `

    // Send via Supabase Edge Function
    const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        to: homeownerEmail,
        subject,
        html,
        text
      })
    })

    if (!emailResponse.ok) {
      console.error('[Bid Accepted Email] Failed to send:', await emailResponse.text())
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    console.log('[Bid Accepted Email] ✅ Sent successfully to:', homeownerEmail)
    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('[Bid Accepted Email] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
