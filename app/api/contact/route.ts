// app/api/contact/route.ts
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const data = await req.json().catch(() => ({}))
  // TODO: wire to email, Slack, CRM, or queue here (if desired)
  // console.log('Contact form:', data)

  // Simulate a tiny processing delay
  await new Promise(r => setTimeout(r, 400))
  return NextResponse.json({ ok: true })
}
