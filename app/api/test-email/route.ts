import { NextRequest, NextResponse } from 'next/server'
import { notifyBidReceived, notifyPaymentCompleted } from '../../../lib/emailService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { testEmail, type = 'bid' } = body

    if (!testEmail) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      )
    }

    let result

    if (type === 'bid') {
      // Test bid notification
      result = await notifyBidReceived({
        homeownerEmail: testEmail,
        homeownerName: 'Test User',
        contractorName: 'ABC Plumbing',
        jobTitle: 'Emergency Pipe Repair',
        bidAmount: 250,
        estimatedArrival: '30 minutes'
      })
    } else if (type === 'payment') {
      // Test payment notification
      result = await notifyPaymentCompleted({
        homeownerEmail: testEmail,
        homeownerName: 'Test Homeowner',
        contractorEmail: testEmail,
        contractorName: 'Test Contractor',
        jobTitle: 'Emergency Pipe Repair',
        amount: 250
      })
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully!',
        type
      })
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Test email error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
