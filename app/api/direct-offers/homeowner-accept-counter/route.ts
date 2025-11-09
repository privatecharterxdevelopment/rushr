// app/api/direct-offers/homeowner-accept-counter/route.ts
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
    const { offer_id } = body

    // Validate required fields
    if (!offer_id) {
      return NextResponse.json(
        { error: 'Offer ID is required' },
        { status: 400 }
      )
    }

    // Accept the counter-bid
    const { data, error } = await supabase.rpc('accept_counter_bid', {
      p_offer_id: offer_id,
    })

    if (error) {
      console.error('Error accepting counter-bid:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to accept counter-bid' },
        { status: 500 }
      )
    }

    // Get offer details to notify contractor
    const { data: offer } = await supabase
      .from('direct_offers')
      .select('contractor_id, title, counter_bid_amount')
      .eq('id', offer_id)
      .single()

    if (offer) {
      // Get contractor user_id
      const { data: contractor } = await supabase
        .from('pro_contractors')
        .select('user_id')
        .eq('id', offer.contractor_id)
        .single()

      if (contractor) {
        // Create notification for contractor
        await supabase.from('notifications').insert({
          user_id: contractor.user_id,
          type: 'counter_bid_accepted',
          title: 'Counter-Bid Accepted!',
          message: `Your counter-bid for "${offer.title}" was accepted!`,
          data: {
            offer_id: offer_id,
            final_amount: offer.counter_bid_amount,
          },
        })
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Counter-bid accepted successfully',
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error in accept counter-bid:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
