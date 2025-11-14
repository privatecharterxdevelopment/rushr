'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireRole?: 'homeowner' | 'contractor'
  requireSubscription?: 'free' | 'pro' | 'proplus'
  redirectTo?: string
}

export default function ProtectedRoute({
  children,
  requireRole,
  requireSubscription,
  redirectTo = '/sign-in'
}: ProtectedRouteProps) {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      // If no user, redirect to sign in
      if (!user) {
        router.push(redirectTo)
        return
      }

      // If user profile is available, check role and subscription requirements
      if (userProfile) {
        // Check role requirement
        if (requireRole && userProfile.role !== requireRole) {
          router.push('/dashboard') // Redirect to main dashboard
          return
        }

        // Check subscription requirement
        if (requireSubscription) {
          const subscriptionLevels = { free: 0, pro: 1, proplus: 2 }
          const userLevel = subscriptionLevels[userProfile.subscription_type] || 0
          const requiredLevel = subscriptionLevels[requireSubscription] || 0

          if (userLevel < requiredLevel) {
            // Redirect to upgrade page or appropriate dashboard
            router.push('/dashboard')
            return
          }
        }
      }
    }
  }, [user, userProfile, loading, requireRole, requireSubscription, router, redirectTo])

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  // If not authenticated, show loading (will redirect)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Redirecting...</div>
      </div>
    )
  }

  // If role/subscription requirements not met, show loading (will redirect)
  if (userProfile) {
    if (requireRole && userProfile.role !== requireRole) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-lg">Access denied - redirecting...</div>
        </div>
      )
    }

    if (requireSubscription) {
      const subscriptionLevels = { free: 0, pro: 1, proplus: 2 }
      const userLevel = subscriptionLevels[userProfile.subscription_type] || 0
      const requiredLevel = subscriptionLevels[requireSubscription] || 0

      if (userLevel < requiredLevel) {
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-lg">Upgrade required - redirecting...</div>
          </div>
        )
      }
    }
  }

  // All checks passed, render children
  return <>{children}</>
}