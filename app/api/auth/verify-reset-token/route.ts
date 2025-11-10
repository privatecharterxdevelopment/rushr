import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token is required' },
        { status: 400 }
      )
    }

    // Check homeowner table for token
    const { data: homeowner } = await supabaseAdmin
      .from('user_profiles')
      .select('id, reset_token_expiry')
      .eq('reset_token', token)
      .maybeSingle()

    // Check contractor table for token
    const { data: contractor } = await supabaseAdmin
      .from('pro_contractors')
      .select('id, reset_token_expiry')
      .eq('reset_token', token)
      .maybeSingle()

    const user = homeowner || contractor

    if (!user) {
      return NextResponse.json({ valid: false, error: 'Invalid token' })
    }

    // Check if token is expired
    const expiry = new Date(user.reset_token_expiry)
    if (expiry < new Date()) {
      return NextResponse.json({ valid: false, error: 'Token expired' })
    }

    return NextResponse.json({ valid: true })

  } catch (error: any) {
    console.error('Error verifying reset token:', error)
    return NextResponse.json(
      { valid: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
