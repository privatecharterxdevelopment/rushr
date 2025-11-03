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
 * POST /api/stripe/connect/onboarding-link
 * Generates Stripe hosted onboarding link for contractor KYC
 */
export async function POST(request: NextRequest) {
  try {
    const { contractorId } = await request.json()

    if (!contractorId) {
      return NextResponse.json(
        { error: 'Missing contractorId' },
        { status: 400 }
      )
    }

    // Get Stripe account ID from database
    const { data: connectAccount, error: fetchError } = await supabase
      .from('stripe_connect_accounts')
      .select('stripe_account_id')
      .eq('contractor_id', contractorId)
      .single()

    if (fetchError || !connectAccount) {
      return NextResponse.json(
        { error: 'Stripe Connect account not found. Please complete wizard first.' },
        { status: 404 }
      )
    }

    // Get app URL from environment or construct from request
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: connectAccount.stripe_account_id,
      refresh_url: `${appUrl}/dashboard/contractor/stripe/refresh`,
      return_url: `${appUrl}/dashboard/contractor/stripe/success`,
      type: 'account_onboarding',
    })

    return NextResponse.json({
      success: true,
      url: accountLink.url,
      expiresAt: accountLink.expires_at
    })

  } catch (error: any) {
    console.error('Create onboarding link error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create onboarding link' },
      { status: 500 }
    )
  }
}
