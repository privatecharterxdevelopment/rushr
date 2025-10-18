import type { Metadata, Viewport } from 'next'
import ProRouteGuard from '../../components/ProRouteGuard'

export const metadata: Metadata = {
  title: { default: 'Rushr Pro', template: '%s | Rushr Pro' },
  description: 'The contractor side of Rushr — manage jobs, Signals, and your profile.',
}

export const viewport: Viewport = {
  themeColor: '#2563eb',
}

export default function ProLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProRouteGuard>
      <div className="pro-backdrop min-h-screen bg-white text-slate-900">
        <main className="p-6">{children}</main>
      </div>
    </ProRouteGuard>
  )
}
