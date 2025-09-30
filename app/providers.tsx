'use client'

import React, { Suspense, useEffect } from 'react'
import { AuthProvider } from '../contexts/AuthContext'
import { ProAuthProvider } from '../contexts/ProAuthContext'
import AuthModal, { openAuth as openAuthModal } from '../components/AuthModal'
import { ToastProvider } from '../components/Toast'
import { useSearchParams } from 'next/navigation'

/** Only this tiny component touches useSearchParams, wrapped in <Suspense>. */
function SP() {
  const sp = useSearchParams()
  useEffect(() => {
    const q = sp.get('auth')
    if (q === 'signin' || q === 'signup') openAuthModal(q as 'signin' | 'signup')
  }, [sp])
  return null
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <ProAuthProvider>
          <Suspense fallback={null}>
            <SP />
          </Suspense>
          {children}
          <AuthModal />
        </ProAuthProvider>
      </AuthProvider>
    </ToastProvider>
  )
}
