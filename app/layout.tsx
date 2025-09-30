// app/layout.tsx
import './globals.css'
import type { Metadata } from 'next'
import Providers from './providers'
import Header from '../components/Header'
import Footer from '../components/Footer'
import BrandClassController from '../components/BrandClassController'
import RouteGuard from '../components/RouteGuard'
import { headers as nextHeaders } from 'next/headers'
import React from 'react'

export const metadata: Metadata = {
  title: 'Rushr',
  description: 'Linking Homeowners with Local Pros Instantly',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Server side host detection
  const h = await nextHeaders()
  const host = (h.get('host') || '').toLowerCase()
  const hostname = host.split(':')[0]
  const firstLabel = hostname.split('.')[0] || ''
  const isPro = firstLabel === 'pro'

  // Brand palette via CSS variables
  const cssVars: React.CSSProperties = isPro
    ? {
        ['--brand-border' as any]: '#2563EB',
        ['--brand-text' as any]:   '#1D4ED8',
        ['--brand-ring' as any]:   '#3B82F6',
        ['--brand-hover' as any]:  'rgba(59,130,246,0.08)',
      }
    : {
        ['--brand-border' as any]: '#059669',
        ['--brand-text' as any]:   '#047857',
        ['--brand-ring' as any]:   '#10B981',
        ['--brand-hover' as any]:  'rgba(16,185,129,0.08)',
      }

  return (
    <html lang="en" suppressHydrationWarning data-site={isPro ? 'pro' : 'main'}>
      <head>
        {/* keep theme + density pre hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function(){
  try {
    var html = document.documentElement;
    var pref = localStorage.getItem('al:theme') || 'light';
    var useDark = pref === 'dark';
    html.classList.toggle('dark', useDark);

    var dens = localStorage.getItem('al:density') || 'comfortable';
    html.classList.toggle('compact', dens === 'compact');
  } catch(e) {}
})();`
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        data-gramm="false"
        className="min-h-screen bg-white text-ink dark:bg-slate-950 dark:text-slate-100"
        style={cssVars}
      >
        <Providers>
          <RouteGuard>
            <BrandClassController />
            <Header />
            <main className="max-w-7xl mx-auto w-full px-3 sm:px-4 lg:px-6">
              {children}
            </main>
            <Footer />
          </RouteGuard>
        </Providers>
      </body>
    </html>
  )
}
