import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmailHomeowner, sendWelcomeEmailContractor } from '../../../lib/emailService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, type, businessName } = body

    if (!email || !name || !type) {
      return NextResponse.json(
        { error: 'Email, name, and type are required' },
        { status: 400 }
      )
    }

    let result

    if (type === 'homeowner') {
      result = await sendWelcomeEmailHomeowner({ email, name })
    } else if (type === 'contractor') {
      result = await sendWelcomeEmailContractor({ email, name, businessName })
    } else {
      return NextResponse.json(
        { error: 'Invalid type. Must be "homeowner" or "contractor"' },
        { status: 400 }
      )
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Welcome email sent successfully!'
      })
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Welcome email error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
