'use client'

import React from 'react'
import { usePathname } from 'next/navigation'

export default function LogoWordmark({ className = '', variant = 'header' }: { className?: string, variant?: 'header' | 'footer' }) {
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

  // Choose logo based on variant (header/footer) and user type (pro/homeowner)
  let src: string
  if (variant === 'footer') {
    src = isPro ? '/rushr-contractor-footer.jpeg' : '/rushr-homeowner-footer.jpeg'
  } else {
    src = isPro ? '/rushr-contractor-header.jpeg' : '/rushr-homeowner-header.jpeg'
  }

  const alt = isPro ? 'Rushr — for pros' : 'Rushr'

  // Different sizes for header vs footer
  const heightClass = variant === 'footer' ? 'h-12' : 'h-16'

  return (
    <img
      src={src}
      alt={alt}
      className={`block ${heightClass} w-auto select-none ${className}`}
      // small visual padding to soften any edge rounding
      style={{ paddingRight: 2 }}
      draggable={false}
    />
  )
}
