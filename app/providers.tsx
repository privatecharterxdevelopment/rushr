'use client'

import React, { Suspense, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { AuthProvider } from '../contexts/AuthContext'
import { ProAuthProvider } from '../contexts/ProAuthContext'
import { AppProvider } from '../lib/state'
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
  const pathname = usePathname()

  // Determine which auth provider to use based on route
  const isProRoute = pathname.startsWith('/dashboard/contractor') ||
                     pathname.startsWith('/pro/')

  return (
    <ToastProvider>
      {isProRoute ? (
        // Pro routes: Only ProAuthProvider
        <ProAuthProvider>
          <AppProvider>
            <Suspense fallback={null}>
              <SP />
            </Suspense>
            {children}
            <AuthModal />
          </AppProvider>
        </ProAuthProvider>
      ) : (
        // Homeowner routes: Only AuthProvider
        <AuthProvider>
          <AppProvider>
            <Suspense fallback={null}>
              <SP />
            </Suspense>
            {children}
            <AuthModal />
          </AppProvider>
        </AuthProvider>
      )}
    </ToastProvider>
  )
}
