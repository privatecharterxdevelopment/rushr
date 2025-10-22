// app/post-job/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import PostJobInner from './page.client'
import { openAuth } from '../../components/AuthModal'

export default function PostJobPage() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) return

    // Redirect to sign-up if not authenticated
    if (!user) {
      console.log('User not authenticated, redirecting to sign-up')
      router.push('/sign-up?callback=/post-job')
      return
    }

    // Check if user is a contractor - redirect to pro section
    if (userProfile && userProfile.role === 'contractor') {
      console.log('User is a contractor, redirecting to pro dashboard')
      router.push('/dashboard/contractor')
      return
    }

    // Check if user role is not homeowner (and not contractor - already handled above)
    if (userProfile && userProfile.role !== 'homeowner') {
      console.log('User role is not homeowner, redirecting to home')
      alert('Only homeowners can post emergency jobs.')
      router.push('/')
      return
    }

    // User is authenticated and is a homeowner
    setShowLoginPrompt(false)
  }, [user, userProfile, loading, router])

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <div className="text-lg text-slate-600">Loading...</div>
        </div>
      </div>
    )
  }

  // Show login prompt overlay if not authenticated
  if (showLoginPrompt || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-emerald-200 p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Sign in Required</h2>
          <p className="text-slate-600 mb-6">
            You need to be signed in as a homeowner to post emergency jobs.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => openAuth('/post-job')}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Sign In
            </button>
            <p className="text-sm text-slate-600">
              Don't have an account?{' '}
              <a href="/sign-up" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Create one
              </a>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Don't render the form if user is a contractor (redirect handled in useEffect)
  if (userProfile && userProfile.role === 'contractor') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-slate-600">Redirecting to contractor dashboard...</div>
        </div>
      </div>
    )
  }

  // Don't render the form if user is not a homeowner
  if (userProfile && userProfile.role !== 'homeowner') {
    return null
  }

  // Render the form with the real user ID
  return <PostJobInner userId={user.id} />
}