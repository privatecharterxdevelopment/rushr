// components/LayoutClient.tsx
'use client'

import { Suspense, type PropsWithChildren } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer' // if you already have one, this will use it
import AuthModal from '../components/AuthModal'
import AuthQueryListener from '../components/AuthQueryListener'

export default function LayoutClient({ children }: PropsWithChildren) {
  return (
    <Suspense fallback={null}>
      {/* Page shell */}
      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1">
          {/* Site container to prevent full-width stretching */}
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>

        <Footer />
      </div>

      {/* Mounted once at root */}
      <AuthModal />
      <AuthQueryListener />
    </Suspense>
  )
}
