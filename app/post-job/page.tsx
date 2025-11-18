// app/post-job/page.tsx
'use client'

import { useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import PostJobInner from './page.client'

export default function PostJobPage() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) return

    // If user is logged in as contractor, redirect them
    if (user && userProfile && userProfile.role === 'contractor') {
      console.log('User is a contractor, redirecting to pro dashboard')
      router.push('/dashboard/contractor')
      return
    }
  }, [user, userProfile, loading, router])

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white">
        <div className="text-center">
          <img
          src="https://jtrxdcccswdwlritgstp.supabase.co/storage/v1/object/public/contractor-logos/RushrLogoAnimation.gif"
          alt="Loading..."
          className="h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4 object-contain"
        />
          <div className="text-lg text-slate-600">Loading...</div>
        </div>
      </div>
    )
  }

  // Don't render the form if user is a contractor (redirect handled in useEffect)
  if (userProfile && userProfile.role === 'contractor') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <div className="text-center">
          <img
          src="https://jtrxdcccswdwlritgstp.supabase.co/storage/v1/object/public/contractor-logos/RushrLogoAnimation.gif"
          alt="Loading..."
          className="h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4 object-contain"
        />
          <div className="text-lg text-slate-600">Redirecting to contractor dashboard...</div>
        </div>
      </div>
    )
  }

  // Render the form - pass userId only if user is logged in
  return <PostJobInner userId={user?.id || null} />
}