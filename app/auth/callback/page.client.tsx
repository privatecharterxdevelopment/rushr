// app/auth/callback/page.client.tsx
'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import LoadingSpinner from '../../../components/LoadingSpinner'

export default function AuthCallbackClient() {
  const router = useRouter()
  const sp = useSearchParams()

  useEffect(() => {
    const cb = sp.get('callbackUrl') || '/onboarding/choose-role'
    router.replace(cb)
  }, [router, sp])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" text="Finishing sign-in..." />
    </div>
  )
}
