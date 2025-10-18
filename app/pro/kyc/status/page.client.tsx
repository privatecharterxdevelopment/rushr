'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProAuth } from '../../../../contexts/ProAuthContext'

export default function KYCStatusPage() {
  const { user, contractorProfile, loading: authLoading } = useProAuth()
  const router = useRouter()
  const [timeLeft, setTimeLeft] = useState('')

  // Redirect if not authenticated or doesn't need status check
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/pro/sign-in')
      } else if (!contractorProfile) {
        router.push('/pro/contractor-signup')
      } else if (contractorProfile.kyc_status === 'not_started' || contractorProfile.kyc_status === 'failed') {
        router.push('/pro/kyc')
      } else if (contractorProfile.kyc_status === 'completed') {
        router.push('/dashboard/contractor')
      }
    }
  }, [user, contractorProfile, authLoading, router])

  // Calculate estimated completion time
  useEffect(() => {
    if (contractorProfile?.created_at) {
      const createdAt = new Date(contractorProfile.created_at)
      const targetTime = new Date(createdAt.getTime() + 2 * 24 * 60 * 60 * 1000) // 2 days from creation

      const updateTimeLeft = () => {
        const now = new Date()
        const diff = targetTime.getTime() - now.getTime()

        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60))
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

          if (hours > 24) {
            const days = Math.floor(hours / 24)
            const remainingHours = hours % 24
            setTimeLeft(`${days} day${days !== 1 ? 's' : ''} ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`)
          } else {
            setTimeLeft(`${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`)
          }
        } else {
          setTimeLeft('Processing should complete soon')
        }
      }

      updateTimeLeft()
      const interval = setInterval(updateTimeLeft, 60000) // Update every minute

      return () => clearInterval(interval)
    }
  }, [contractorProfile])

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg">Loading...</div>
    </div>
  }

  if (!contractorProfile || contractorProfile.kyc_status !== 'in_progress') {
    return null // Will be redirected by useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">KYC Verification in Progress</h1>
            <p className="text-gray-600">We're reviewing your submitted information</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">What happens next?</h2>
            <div className="text-left space-y-3 text-sm text-blue-800">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-xs font-medium">1</span>
                </div>
                <div>
                  <p className="font-medium">Document Review</p>
                  <p className="text-blue-700">Our team verifies your identity documents and information</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-xs font-medium">2</span>
                </div>
                <div>
                  <p className="font-medium">Identity Verification</p>
                  <p className="text-blue-700">We run security checks to confirm your identity</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-xs font-medium">3</span>
                </div>
                <div>
                  <p className="font-medium">Account Activation</p>
                  <p className="text-blue-700">Once approved, you'll have full access to Pro features</p>
                </div>
              </div>
            </div>
          </div>

          {timeLeft && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600">Estimated completion time</p>
              <p className="text-lg font-semibold text-gray-900">{timeLeft}</p>
            </div>
          )}

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              You'll receive an email notification once your verification is complete.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => router.push('/dashboard/contractor')}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => router.push('/pro')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Back to Pro Home
              </button>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Need help?</h3>
            <p className="text-xs text-gray-600 mb-3">
              If you have questions about your verification or need to update your information, please contact support.
            </p>
            <button className="text-sm text-blue-600 hover:text-blue-500 font-medium">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}