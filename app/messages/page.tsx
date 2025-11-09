'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { useProAuth } from '../../contexts/ProAuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'

/**
 * Legacy /messages route - redirects to the correct dashboard messages page
 * Based on user role (homeowner vs contractor)
 */
export default function LegacyMessagesRedirect() {
  const router = useRouter()
  const { user: homeownerUser, userProfile, loading: homeownerLoading } = useAuth()
  const { user: contractorUser, contractorProfile, loading: contractorLoading } = useProAuth()

  useEffect(() => {
    // Wait for auth to complete
    if (homeownerLoading || contractorLoading) return

    // Redirect contractors to their messages page
    if (contractorProfile && contractorUser) {
      router.replace('/dashboard/contractor/messages')
      return
    }

    // Redirect homeowners to their messages page
    if (userProfile && homeownerUser) {
      router.replace('/dashboard/homeowner/messages')
      return
    }

    // No valid user - redirect to home
    router.replace('/')
  }, [homeownerUser, userProfile, contractorUser, contractorProfile, homeownerLoading, contractorLoading, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <img
          src="https://jtrxdcccswdwlritgstp.supabase.co/storage/v1/object/public/contractor-logos/RushrLogoAnimation.gif"
          alt="Loading..."
          className="h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4 object-contain"
        />
        <p className="text-gray-600">Redirecting to messages...</p>
      </div>
    </div>
  )
}
