import { NextRequest, NextResponse } from 'next/server'
import { notifyBidAccepted } from '../../../lib/emailService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contractorEmail, contractorName, jobTitle, homeownerName, homeownerPhone, jobAddress, jobId } = body

    if (!contractorEmail || !contractorName || !jobTitle || !homeownerName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const result = await notifyBidAccepted({
      contractorEmail,
      contractorName,
      jobTitle,
      homeownerName,
      homeownerPhone: homeownerPhone || 'Not provided',
      jobAddress: jobAddress || 'Address in job details'
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Bid accepted notification sent successfully!'
      })
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Bid accepted notification error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
