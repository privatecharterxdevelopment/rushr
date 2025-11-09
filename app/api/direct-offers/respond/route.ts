// app/api/direct-offers/respond/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()

    const {
      offer_id,
      action, // 'accept', 'reject', or 'counter_bid'
      counter_amount,
      counter_duration_hours,
      counter_start_date,
      counter_message,
      contractor_notes,
    } = body

    // Validate required fields
    if (!offer_id || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!['accept', 'reject', 'counter_bid'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Execute the appropriate function based on action
    let result
    let error

    switch (action) {
      case 'accept':
        ;({ data: result, error } = await supabase.rpc('accept_direct_offer', {
          p_offer_id: offer_id,
        }))
        break

      case 'reject':
        ;({ data: result, error } = await supabase.rpc('reject_direct_offer', {
          p_offer_id: offer_id,
          p_contractor_notes: contractor_notes || null,
        }))
        break

      case 'counter_bid':
        if (!counter_amount) {
          return NextResponse.json(
            { error: 'Counter amount is required for counter bids' },
            { status: 400 }
          )
        }
        ;({ data: result, error } = await supabase.rpc('counter_bid_direct_offer', {
          p_offer_id: offer_id,
          p_counter_amount: parseFloat(counter_amount),
          p_counter_duration_hours: counter_duration_hours
            ? parseInt(counter_duration_hours)
            : null,
          p_counter_start_date: counter_start_date || null,
          p_counter_message: counter_message || null,
        }))
        break
    }

    if (error) {
      console.error('Error responding to offer:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to respond to offer' },
        { status: 500 }
      )
    }

    // Notification is automatically created by database trigger
    // (see notify_homeowner_offer_response trigger)

    return NextResponse.json(
      {
        success: true,
        message: `Offer ${action === 'counter_bid' ? 'counter-bid sent' : action === 'accept' ? 'accepted' : 'rejected'} successfully`,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error in respond to offer:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
