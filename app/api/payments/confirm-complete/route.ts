import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/payments/confirm-complete
 * Allows homeowner or contractor to confirm job completion
 * When both confirm, payment is automatically released (via trigger)
 */
export async function POST(request: NextRequest) {
  try {
    const { paymentHoldId, userId, userType } = await request.json()

    if (!paymentHoldId || !userId || !userType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!['homeowner', 'contractor'].includes(userType)) {
      return NextResponse.json(
        { error: 'Invalid userType. Must be homeowner or contractor' },
        { status: 400 }
      )
    }

    // 1. Get payment hold
    const { data: paymentHold, error: holdError } = await supabase
      .from('payment_holds')
      .select('*')
      .eq('id', paymentHoldId)
      .or(`homeowner_id.eq.${userId},contractor_id.eq.${userId}`)
      .single()

    if (holdError || !paymentHold) {
      return NextResponse.json(
        { error: 'Payment hold not found or access denied' },
        { status: 404 }
      )
    }

    // Verify user type matches
    if (
      (userType === 'homeowner' && paymentHold.homeowner_id !== userId) ||
      (userType === 'contractor' && paymentHold.contractor_id !== userId)
    ) {
      return NextResponse.json(
        { error: 'User type mismatch' },
        { status: 403 }
      )
    }

    if (paymentHold.status !== 'captured') {
      return NextResponse.json(
        { error: 'Payment must be captured before confirming completion' },
        { status: 400 }
      )
    }

    // 2. Update confirmation status
    const updateFields: any = {}

    if (userType === 'homeowner') {
      if (paymentHold.homeowner_confirmed_complete) {
        return NextResponse.json(
          { error: 'Homeowner has already confirmed completion' },
          { status: 400 }
        )
      }
      updateFields.homeowner_confirmed_complete = true
      updateFields.homeowner_confirmed_at = new Date().toISOString()
    } else {
      if (paymentHold.contractor_confirmed_complete) {
        return NextResponse.json(
          { error: 'Contractor has already confirmed completion' },
          { status: 400 }
        )
      }
      updateFields.contractor_confirmed_complete = true
      updateFields.contractor_confirmed_at = new Date().toISOString()
    }

    const { data: updated, error: updateError } = await supabase
      .from('payment_holds')
      .update(updateFields)
      .eq('id', paymentHoldId)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    // 3. Check if both parties confirmed (trigger will auto-release)
    const bothConfirmed =
      (userType === 'homeowner' ? true : updated.homeowner_confirmed_complete) &&
      (userType === 'contractor' ? true : updated.contractor_confirmed_complete)

    // 4. Send notification to other party
    const otherPartyId = userType === 'homeowner'
      ? paymentHold.contractor_id
      : paymentHold.homeowner_id

    const otherPartyType = userType === 'homeowner' ? 'contractor' : 'homeowner'

    if (bothConfirmed) {
      // Both confirmed - payment will be released
      await supabase.from('notifications').insert({
        user_id: otherPartyId,
        type: 'job_filled',
        title: 'Job Complete - Payment Released!',
        message: `Both parties confirmed completion. Payment of $${updated.contractor_payout} has been released!`,
        job_id: paymentHold.job_id,
        bid_id: paymentHold.bid_id
      })
    } else {
      // One party confirmed, waiting for other
      await supabase.from('notifications').insert({
        user_id: otherPartyId,
        type: 'job_filled',
        title: `${userType === 'homeowner' ? 'Homeowner' : 'Contractor'} Confirmed Completion`,
        message: `Please confirm job completion to release payment of $${paymentHold.contractor_payout}`,
        job_id: paymentHold.job_id,
        bid_id: paymentHold.bid_id
      })
    }

    // 5. If both confirmed, update job status
    if (bothConfirmed) {
      await supabase
        .from('homeowner_jobs')
        .update({ status: 'completed' })
        .eq('id', paymentHold.job_id)
    }

    return NextResponse.json({
      success: true,
      bothConfirmed,
      paymentReleased: bothConfirmed,
      homeowerConfirmed: updated.homeowner_confirmed_complete,
      contractorConfirmed: updated.contractor_confirmed_complete
    })

  } catch (error: any) {
    console.error('Confirm completion error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to confirm completion' },
      { status: 500 }
    )
  }
}
