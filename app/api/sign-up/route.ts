import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabaseClient'
import { sendWelcomeEmailHomeowner, sendWelcomeEmailContractor } from '../../../lib/emailService'

export async function POST(req: Request) {
  try {
    const { email, password, name, role, businessName } = await req.json()

    if (!email || !password || !name) {
      return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 })
    }

    // Sign up with Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: role || 'homeowner'
        }
      }
    })

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
    }

    // Send welcome email (non-blocking - don't fail registration if email fails)
    try {
      if (role === 'contractor') {
        await sendWelcomeEmailContractor({ email, name, businessName })
      } else {
        await sendWelcomeEmailHomeowner({ email, name })
      }
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
      // Don't fail the registration if email fails
    }

    return NextResponse.json({ ok: true, user: data.user })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 })
  }
}
