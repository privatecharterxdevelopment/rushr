import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/send-message-notification
 * Sends email notification when a new message is received
 * Called by database trigger
 */
export async function POST(request: NextRequest) {
  try {
    const {
      recipientEmail,
      recipientName,
      senderName,
      jobTitle,
      messagePreview,
      conversationId
    } = await request.json()

    if (!recipientEmail || !senderName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://rushr-main.vercel.app'
    const subject = `New message from ${senderName}`

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0;">💬 New Message</h1>
        </div>
        <div style="background: #F9FAFB; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>Hi ${recipientName || 'there'},</p>

          <p><strong>${senderName}</strong> sent you a message${jobTitle ? ` about "${jobTitle}"` : ''}:</p>

          <div style="background: #EFF6FF; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3B82F6;">
            <p style="margin: 0; color: #1E40AF; font-style: italic;">"${messagePreview || 'Click to view message'}"</p>
          </div>

          <p style="text-align: center; margin: 30px 0;">
            <a href="${appUrl}/dashboard/contractor/messages${conversationId ? `?conversation=${conversationId}` : ''}"
               style="background: #3B82F6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Message
            </a>
          </p>

          <p style="color: #6B7280; font-size: 14px;">Tip: Reply quickly to keep your response time low and boost your ratings!</p>

          <p>Best regards,<br>The Rushr Team</p>
        </div>
        <div style="text-align: center; margin-top: 30px; color: #6B7280; font-size: 14px;">
          <p>© ${new Date().getFullYear()} Rushr. All rights reserved.</p>
        </div>
      </div>
    `

    const text = `New message from ${senderName}${jobTitle ? ` about "${jobTitle}"` : ''}. View at: ${appUrl}/dashboard/contractor/messages`

    // Send email via Supabase Edge Function
    const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        to: recipientEmail,
        subject,
        html,
        text
      }),
    })

    const emailData = await emailResponse.json()

    if (!emailResponse.ok) {
      throw new Error(emailData.error || 'Failed to send email')
    }

    console.log('[Message Notification] Email sent to', recipientEmail)

    return NextResponse.json({
      success: true,
      message: 'Message notification sent successfully'
    })

  } catch (error: any) {
    console.error('[Message Notification] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send message notification' },
      { status: 500 }
    )
  }
}
