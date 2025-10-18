'use client'

import React from 'react'
import { usePathname } from 'next/navigation'

export default function LogoWordmark({ className = '' }: { className?: string }) {
  const pathname = usePathname()
  const [isProHost, setIsProHost] = React.useState(false)

  React.useEffect(() => {
    try {
      const host = window.location.hostname.toLowerCase()
      setIsProHost(host === 'pro.localhost' || host.startsWith('pro.'))
    } catch {}
  }, [])

  // Homeowner-specific pages should always show homeowner logo
  const isHomeownerPage = pathname?.startsWith('/profile') ||
                         pathname?.startsWith('/dashboard/homeowner') ||
                         pathname?.startsWith('/messages') ||
                         pathname?.startsWith('/post-job') ||
                         pathname?.startsWith('/jobs') ||
                         pathname?.startsWith('/settings')

  const isPro = (pathname?.startsWith('/pro') || pathname?.startsWith('/dashboard/contractor') || isProHost) && !isHomeownerPage
  const src = isPro ? '/rushr-pro2.jpg' : '/rushr.png'
  const alt = isPro ? 'Rushr — for pros' : 'Rushr'

  return (
    <img
      src={src}
      alt={alt}
      className={`block h-10 w-auto select-none ${className}`}
      // small visual padding to soften any edge rounding
      style={{ paddingRight: 2 }}
      draggable={false}
    />
  )
}
