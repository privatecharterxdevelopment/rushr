// app/api/direct-offers/finalize-payment/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/direct-offers/finalize-payment
 * Called AFTER payment succeeds to create conversation between homeowner and contractor
 */
export async function POST(request: NextRequest) {
  try {
    const { offerId } = await request.json()

    if (!offerId) {
      return NextResponse.json(
        { error: 'Missing offerId' },
        { status: 400 }
      )
    }

    // Call the database function to finalize offer and create conversation
    const { data: conversationId, error } = await supabase.rpc(
      'finalize_offer_after_payment',
      { p_offer_id: offerId }
    )

    if (error) {
      console.error('Error finalizing offer:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to finalize offer' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      conversationId,
      message: 'Offer finalized, conversation created'
    })

  } catch (error: any) {
    console.error('Finalize offer error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to finalize offer' },
      { status: 500 }
    )
  }
}
