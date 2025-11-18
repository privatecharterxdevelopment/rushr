// middleware.ts
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function middleware(req: NextRequest) {
  const url = req.nextUrl
  const host = req.headers.get('host') || ''
  const pathname = url.pathname

  console.log(`[MIDDLEWARE] ========== MIDDLEWARE CALLED: ${pathname} ==========`)

  // Allow localhost to bypass public route restrictions
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1')
  if (isLocalhost) {
    console.log(`[MIDDLEWARE] Localhost detected, allowing full access`)
    // Continue with normal middleware flow but skip public route restrictions
  }

  // PUBLIC ROUTES - Accessible without authentication (production only)
  const publicRoutes = [
    '/pro/early-access',
    '/pro/early-access/success',
    '/pro/wizard', // Contractor signup/onboarding flow
    '/pro/sign-in', // Contractor sign-in page
    '/pro/how-it-works', // Contractor info page
    '/pro/page', // Contractor landing page (if exists as /pro/page.tsx)
    '/api/send-early-access-confirmation',
  ]

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

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

  // If no auth cookies and trying to access non-public route, redirect to early access (skip for localhost)
  if (!supabaseCookies && !isPublicRoute && !isLocalhost) {
    console.log(`[MIDDLEWARE] No auth cookies, redirecting to /pro/early-access`)
    return NextResponse.redirect(new URL('/pro/early-access', req.url))
  }

  // Allow public routes without authentication
  if (isPublicRoute) {
    console.log(`[MIDDLEWARE] Public route ${pathname}, allowing access`)
    return NextResponse.next()
  }

  // Allow localhost without auth cookies
  if (isLocalhost && !supabaseCookies) {
    console.log(`[MIDDLEWARE] Localhost without auth, allowing access`)
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
    return NextResponse.redirect(new URL('/pro/early-access', req.url))
  }

  if (!user) {
    console.log(`[MIDDLEWARE] No user found, redirecting to /pro/early-access`)
    return NextResponse.redirect(new URL('/pro/early-access', req.url))
  }

  console.log(`[MIDDLEWARE] User found: ${user.id.substring(0, 8)}`)

  // Define route protection rules
  const homeownerOnlyRoutes = ['/dashboard/homeowner', '/post-job', '/my-jobs']
  const contractorOnlyRoutes = ['/dashboard/contractor', '/pro/dashboard']
  // NOTE: /pro/wizard is intentionally NOT in contractorOnlyRoutes because it should be accessible without login (it's the signup flow)

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

  // Check if user is a homeowner by checking user_profiles table
  const { data: homeownerProfile, error: homeownerError } = await supabase
    .from('user_profiles')
    .select('id, role')
    .eq('id', user.id)
    .maybeSingle()

  if (homeownerError) {
    console.log(`[MIDDLEWARE] Error checking user_profiles: ${homeownerError.message}`)
  }

  const isContractor = !!proContractor && !proError
  const isHomeowner = !!homeownerProfile && homeownerProfile.role === 'homeowner' && !homeownerError

  console.log(`[MIDDLEWARE] User ${user.id.substring(0, 8)}: isContractor=${isContractor}, isHomeowner=${isHomeowner}, needsHomeownerCheck=${needsHomeownerCheck}, needsContractorCheck=${needsContractorCheck}`)

  // PRIORITY: Contractors take precedence over homeowners if user has both profiles
  // This handles cases where a homeowner signs up as a contractor
  if (isContractor && needsHomeownerCheck) {
    console.log(`[MIDDLEWARE] 🚫🚫🚫 BLOCKING CONTRACTOR from ${pathname} -> redirecting to /dashboard/contractor`)
    return NextResponse.redirect(new URL('/dashboard/contractor', req.url))
  }

  // BLOCK homeowners from contractor-only routes (only if NOT a contractor)
  if (isHomeowner && !isContractor && needsContractorCheck) {
    console.log(`[MIDDLEWARE] 🚫🚫🚫 BLOCKING HOMEOWNER from ${pathname} -> redirecting to /dashboard/homeowner`)
    return NextResponse.redirect(new URL('/dashboard/homeowner', req.url))
  }

  console.log(`[MIDDLEWARE] Allowing access to ${pathname}`)

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
}
