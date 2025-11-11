// middleware.ts
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function middleware(req: NextRequest) {
  const url = req.nextUrl
  const host = req.headers.get('host') || ''
  const pathname = url.pathname

  console.log(`[MIDDLEWARE] ========== MIDDLEWARE CALLED: ${pathname} ==========`)

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
