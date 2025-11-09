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

    // Create user profile entry (in case the database trigger doesn't exist)
    if (data.user) {
      try {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: data.user.id,
            name: name,
            email: email,
            role: role || 'homeowner',
            created_at: new Date().toISOString()
          })

        if (profileError && !profileError.message.includes('duplicate')) {
          console.error('Error creating user profile:', profileError)
        }
      } catch (profileErr) {
        console.error('Failed to create user profile:', profileErr)
        // Don't fail registration if profile creation fails
      }
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
