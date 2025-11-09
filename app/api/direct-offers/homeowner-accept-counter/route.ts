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

    // Notification to contractor can be added later when pro_contractors has auth link
    // For now, contractor will see status change when viewing offers
    // TODO: Add notification when pro_contractors table has auth.users reference

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
