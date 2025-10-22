// middleware.ts
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function middleware(req: NextRequest) {
  const url = req.nextUrl
  const host = req.headers.get('host') || ''
  const pathname = url.pathname

  // Handle subdomain rewrites
  if (host.startsWith('pro.') || host.startsWith('professional.')) {
    if (!pathname.startsWith('/pro') && !pathname.startsWith('/profile')) {
      url.pathname = `/pro${pathname}`
      return NextResponse.rewrite(url)
    }
  }

  // Initialize Supabase client for middleware
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // Get ALL Supabase cookies
  const allCookies = req.cookies.getAll()
  const supabaseCookies = allCookies
    .filter(cookie => cookie.name.startsWith('sb-'))
    .map(cookie => `${cookie.name}=${cookie.value}`)
    .join('; ')

  if (!supabaseCookies) {
    return NextResponse.next()
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Cookie: supabaseCookies
      }
    }
  })

  console.log(`[MIDDLEWARE] Processing: ${pathname}`)

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError) {
    console.log(`[MIDDLEWARE] Auth error: ${userError.message}`)
    return NextResponse.next()
  }

  if (!user) {
    console.log(`[MIDDLEWARE] No user found, allowing access`)
    return NextResponse.next()
  }

  console.log(`[MIDDLEWARE] User found: ${user.id.substring(0, 8)}`)

  // Define route protection rules
  const homeownerOnlyRoutes = ['/dashboard/homeowner', '/post-job', '/my-jobs']
  const contractorOnlyRoutes = ['/dashboard/contractor', '/pro/dashboard', '/pro/wizard']

  // Check if this path needs protection
  const needsHomeownerCheck = homeownerOnlyRoutes.some(route => pathname.startsWith(route))
  const needsContractorCheck = contractorOnlyRoutes.some(route => pathname.startsWith(route))

  if (!needsHomeownerCheck && !needsContractorCheck) {
    console.log(`[MIDDLEWARE] Path ${pathname} does not need protection`)
    return NextResponse.next()
  }

  // CRITICAL: Check if user is a contractor by checking pro_contractors table
  const { data: proContractor, error: proError } = await supabase
    .from('pro_contractors')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (proError) {
    console.log(`[MIDDLEWARE] Error checking pro_contractors: ${proError.message}`)
  }

  const isContractor = !!proContractor && !proError
  const isHomeowner = !isContractor

  console.log(`[MIDDLEWARE] User ${user.id.substring(0, 8)}: isContractor=${isContractor}, needsHomeownerCheck=${needsHomeownerCheck}, needsContractorCheck=${needsContractorCheck}`)

  // BLOCK contractors from homeowner-only routes
  if (isContractor && needsHomeownerCheck) {
    console.log(`[MIDDLEWARE] 🚫🚫🚫 BLOCKING CONTRACTOR from ${pathname} -> redirecting to /dashboard/contractor`)
    return NextResponse.redirect(new URL('/dashboard/contractor', req.url))
  }

  // BLOCK homeowners from contractor-only routes
  if (isHomeowner && needsContractorCheck) {
    console.log(`[MIDDLEWARE] 🚫🚫🚫 BLOCKING HOMEOWNER from ${pathname} -> redirecting to /dashboard/homeowner`)
    return NextResponse.redirect(new URL('/dashboard/homeowner', req.url))
  }

  console.log(`[MIDDLEWARE] Allowing access to ${pathname}`)

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
}
