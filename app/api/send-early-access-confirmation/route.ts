import { NextRequest, NextResponse } from 'next/server'
import { sendEarlyAccessConfirmation } from '../../../lib/emailService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name } = body

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      )
    }

    const result = await sendEarlyAccessConfirmation({ email, name })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Early access confirmation email sent successfully!'
      })
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Early access email error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
