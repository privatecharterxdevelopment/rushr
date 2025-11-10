// app/api/contact/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { name, email, role, subject, message } = await req.json()

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Send email using Supabase Edge Function or direct SMTP
    // For now, we'll use a simple approach: store in database and send via Edge Function

    // Option 1: Store in database for admin to review
    const { error: dbError } = await supabase
      .from('contact_submissions')
      .insert({
        name,
        email,
        role,
        subject,
        message,
        submitted_at: new Date().toISOString()
      })

    if (dbError) {
      console.error('Failed to save contact submission:', dbError)
    }

    // Option 2: Send email directly using fetch to an email service
    // You can use Resend, SendGrid, or any other email service
    try {
      // Example using a hypothetical email endpoint
      const emailBody = `
New Contact Form Submission

From: ${name} (${email})
Role: ${role}
Subject: ${subject}

Message:
${message}

---
Submitted at: ${new Date().toISOString()}
      `.trim()

      // For production, integrate with Resend or SendGrid:
      // await fetch('https://api.resend.com/emails', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({
      //     from: 'noreply@userushr.com',
      //     to: 'hello@userushr.com',
      //     subject: `[Contact Form] ${subject}`,
      //     text: emailBody
      //   })
      // })

      console.log('[CONTACT] Email would be sent:', {
        from: 'noreply@userushr.com',
        to: 'hello@userushr.com',
        subject: `[Contact Form] ${subject}`,
        preview: emailBody.substring(0, 100)
      })
    } catch (emailError) {
      console.error('Failed to send email:', emailError)
      // Don't fail the request - submission is saved in database
    }

    return NextResponse.json({
      ok: true,
      message: 'Contact form submitted successfully'
    })

  } catch (error: any) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process contact form' },
      { status: 500 }
    )
  }
}
