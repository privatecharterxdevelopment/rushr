'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '../../../../../utils/supabase-browser'

export default function StripeOnboardingRefreshPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(true)

  useEffect(() => {
    async function generateNewLink() {
      try {
        const supabase = supabaseBrowser()
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          router.push('/pro/sign-in')
          return
        }

        // Generate new onboarding link
        const response = await fetch('/api/stripe/connect/onboarding-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contractorId: session.user.id })
        })

        const data = await response.json()

        if (data.success && data.url) {
          // Redirect to new Stripe onboarding link
          window.location.href = data.url
        } else {
          setError(data.error || 'Failed to generate onboarding link')
          setGenerating(false)
        }
      } catch (err: any) {
        console.error('Error generating onboarding link:', err)
        setError(err.message || 'An error occurred')
        setGenerating(false)
      }
    }

    generateNewLink()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        {generating ? (
          <>
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
                <img
                src="https://jtrxdcccswdwlritgstp.supabase.co/storage/v1/object/public/contractor-logos/RushrLogoAnimation.gif"
                alt="Loading..."
                className="w-8 h-8 object-contain"
              />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Refreshing Session</h1>
            <p className="text-gray-600">Generating a new onboarding link...</p>
          </>
        ) : (
          <>
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Expired</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => router.push('/dashboard/contractor')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Return to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  )
}
