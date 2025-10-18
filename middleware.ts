// middleware.ts
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const url = req.nextUrl
  const host = req.headers.get('host') || ''

  if (host.startsWith('pro.') || host.startsWith('professional.')) {
    // Don't rewrite profile routes - they should be accessible from both homeowner and pro sides
    if (!url.pathname.startsWith('/pro') && !url.pathname.startsWith('/profile')) {
      url.pathname = `/pro${url.pathname}`
      return NextResponse.rewrite(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
}
