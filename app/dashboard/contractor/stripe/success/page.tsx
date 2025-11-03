'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '../../../../../utils/supabase-browser'

export default function StripeOnboardingSuccessPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [status, setStatus] = useState<string>('Verifying your payment setup...')

  useEffect(() => {
    async function checkStatus() {
      try {
        const supabase = supabaseBrowser()
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          router.push('/pro/sign-in')
          return
        }

        // Check Stripe Connect status
        const response = await fetch('/api/stripe/connect/check-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contractorId: session.user.id })
        })

        const data = await response.json()

        if (data.success) {
          if (data.payoutsEnabled) {
            setStatus('Payment setup complete! You can now receive payments.')
            setTimeout(() => {
              router.push('/dashboard/contractor')
            }, 2000)
          } else if (data.onboardingComplete) {
            setStatus('Onboarding complete! Your account is being reviewed by Stripe.')
            setTimeout(() => {
              router.push('/dashboard/contractor')
            }, 2000)
          } else {
            setStatus('Almost there! A few more details are needed.')
            setTimeout(() => {
              router.push('/dashboard/contractor')
            }, 2000)
          }
        } else {
          setStatus('Unable to verify status. Redirecting...')
          setTimeout(() => {
            router.push('/dashboard/contractor')
          }, 2000)
        }
      } catch (error) {
        console.error('Error checking Stripe status:', error)
        setStatus('Error checking status. Redirecting...')
        setTimeout(() => {
          router.push('/dashboard/contractor')
        }, 2000)
      } finally {
        setChecking(false)
      }
    }

    checkStatus()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="mb-4">
          {checking ? (
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Setup</h1>
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  )
}
