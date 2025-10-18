'use client'

import HomeownerRouteGuard from '../../../components/HomeownerRouteGuard'

export default function HomeownerDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <HomeownerRouteGuard>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50/30 via-white to-green-50/20">
        {children}
      </div>
    </HomeownerRouteGuard>
  )
}