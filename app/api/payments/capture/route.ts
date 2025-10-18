import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia'
})

/**
 * POST /api/payments/capture
 * Captures (charges) the authorized payment after homeowner confirms acceptance
 */
export async function POST(request: NextRequest) {
  try {
    const { paymentHoldId, homeownerId } = await request.json()

    if (!paymentHoldId || !homeownerId) {
      return NextResponse.json(
        { error: 'Missing paymentHoldId or homeownerId' },
        { status: 400 }
      )
    }

    // 1. Get payment hold
    const { data: paymentHold, error: holdError } = await supabase
      .from('payment_holds')
      .select('*')
      .eq('id', paymentHoldId)
      .eq('homeowner_id', homeownerId)
      .single()

    if (holdError || !paymentHold) {
      return NextResponse.json(
        { error: 'Payment hold not found or access denied' },
        { status: 404 }
      )
    }

    if (paymentHold.status !== 'authorized') {
      return NextResponse.json(
        { error: `Cannot capture payment with status: ${paymentHold.status}` },
        { status: 400 }
      )
    }

    // 2. Capture the payment intent
    const paymentIntent = await stripe.paymentIntents.capture(
      paymentHold.stripe_payment_intent_id
    )

    // 3. Update payment hold status
    const { error: updateError } = await supabase
      .from('payment_holds')
      .update({
        status: 'captured',
        stripe_charge_id: paymentIntent.latest_charge as string
      })
      .eq('id', paymentHoldId)

    if (updateError) {
      throw updateError
    }

    // 4. Update job payment status
    await supabase
      .from('homeowner_jobs')
      .update({
        payment_status: 'paid',
        payment_captured_at: new Date().toISOString()
      })
      .eq('id', paymentHold.job_id)

    // 5. Send notification to contractor: "Payment secured - let's get to work!"
    await supabase.from('notifications').insert({
      user_id: paymentHold.contractor_id,
      type: 'job_request_received',
      title: 'Payment Secured!',
      message: `Homeowner paid $${paymentHold.amount}. Payment is in escrow - let's get to work!`,
      job_id: paymentHold.job_id,
      bid_id: paymentHold.bid_id
    })

    return NextResponse.json({
      success: true,
      status: 'captured',
      chargeId: paymentIntent.latest_charge
    })

  } catch (error: any) {
    console.error('Capture payment error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to capture payment' },
      { status: 500 }
    )
  }
}
