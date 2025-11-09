// app/api/direct-offers/respond/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '../../../../lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase()

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

    // Get offer details to notify homeowner
    const { data: offer } = await supabase
      .from('direct_offers')
      .select('homeowner_id, title, offered_amount')
      .eq('id', offer_id)
      .single()

    if (offer) {
      // Create notification for homeowner
      let notificationMessage = ''
      switch (action) {
        case 'accept':
          notificationMessage = `Your job offer "${offer.title}" was accepted!`
          break
        case 'reject':
          notificationMessage = `Your job offer "${offer.title}" was declined`
          break
        case 'counter_bid':
          notificationMessage = `Counter-bid received for "${offer.title}" - $${counter_amount}`
          break
      }

      await supabase.from('notifications').insert({
        user_id: offer.homeowner_id,
        type: 'offer_response',
        title: 'Offer Response',
        message: notificationMessage,
        data: {
          offer_id: offer_id,
          action: action,
          counter_amount: counter_amount || null,
        },
      })
    }

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
