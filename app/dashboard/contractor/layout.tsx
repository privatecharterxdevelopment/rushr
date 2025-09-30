import type { Metadata, Viewport } from 'next'
import ProRouteGuard from '../../../components/ProRouteGuard'

export const metadata: Metadata = {
  title: { default: 'Contractor Dashboard - Rushr Pro', template: '%s | Rushr Pro' },
  description: 'Contractor dashboard for Rushr Pro - manage jobs, earnings, and your profile.',
}

export const viewport: Viewport = {
  themeColor: '#2563eb',
}

export default function ContractorLayout({ children }: { children: React.ReactNode }) {
  const proCSSVars = {
    '--brand-border': '#2563EB',
    '--brand-text': '#1D4ED8',
    '--brand-ring': '#3B82F6',
    '--brand-hover': 'rgba(59,130,246,0.08)',
    '--color-primary': '37 99 235',
    '--color-primary-hover': '29 78 216',
    '--color-primary-foreground': '255 255 255',
  } as React.CSSProperties

  return (
    <ProRouteGuard>
      <div
        className="pro-backdrop min-h-screen bg-white text-slate-900"
        style={proCSSVars}
        data-site="pro"
      >
        <main className="p-6">{children}</main>
      </div>
    </ProRouteGuard>
  )
}