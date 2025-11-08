import { NextRequest, NextResponse } from 'next/server'
import { notifyBidReceived } from '../../../lib/emailService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { homeownerEmail, homeownerName, contractorName, jobTitle, bidAmount, estimatedArrival, jobId } = body

    if (!homeownerEmail || !homeownerName || !contractorName || !jobTitle || !bidAmount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const result = await notifyBidReceived({
      homeownerEmail,
      homeownerName,
      contractorName,
      jobTitle,
      bidAmount: parseFloat(bidAmount),
      estimatedArrival: estimatedArrival || '30 minutes'
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Bid notification email sent successfully!'
      })
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Bid notification email error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
