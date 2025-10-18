// components/AuthQueryListener.tsx
'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { openAuth } from '../components/AuthModal'

export default function AuthQueryListener() {
  const sp = useSearchParams()

  useEffect(() => {
    const auth = sp.get('auth') // 'signin' | 'signup' | null
    const cb = sp.get('callbackUrl') || undefined
    if (auth === 'signin' || auth === 'signup') {
      openAuth(auth as 'signin' | 'signup', cb)
    }
  }, [sp])

  return null
}
