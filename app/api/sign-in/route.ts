import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    // TODO: Replace this with your real Supabase/DB login
    // Right now it's just a placeholder so it won’t 405
    console.log('Sign-in request:', body)

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 })
  }
}
