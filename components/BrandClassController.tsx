'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function BrandClassController() {
  const pathname = usePathname()

  useEffect(() => {
    const host = (typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '')
    const hostIsPro = host === 'pro.localhost' || host.startsWith('pro.')

    // Force homeowner branding on homeowner-specific pages
    const isHomeownerPage = pathname?.startsWith('/dashboard/homeowner') ||
                           pathname?.startsWith('/profile/') ||
                           pathname?.startsWith('/profile') ||
                           pathname?.includes('/homeowner') ||
                           pathname?.startsWith('/messages') ||
                           pathname?.startsWith('/post-job') ||
                           pathname?.startsWith('/jobs') ||
                           pathname?.startsWith('/settings')

    // Force pro branding on pro-specific pages
    const isProPage = pathname?.startsWith('/pro/') || pathname?.startsWith('/dashboard/contractor')

    // Determine final pro state
    const isPro = isProPage || (hostIsPro && !isHomeownerPage)

    // Apply classes to <body> so Header/Footer inherit brand tokens
    document.body.classList.toggle('theme-blue', !!isPro)
    document.body.classList.toggle('is-pro', !!isPro)
    document.body.classList.toggle('theme-green', !isPro)
  }, [pathname])

  return null
}
