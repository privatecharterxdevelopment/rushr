import { NextResponse } from "next/server"
import { sql, ensureSchema } from "@/lib/db"
export const runtime = "nodejs"
export async function GET() {
  try {
    await ensureSchema()
    const r = await sql`SELECT now() as now`
    return NextResponse.json({ ok: true, now: r[0]?.now })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 })
  }
}
