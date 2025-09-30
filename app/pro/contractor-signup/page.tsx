'use client';
export const dynamic = 'force-dynamic';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProAuth } from '../../../contexts/ProAuthContext';
import LoadingSpinner from '../../../components/LoadingSpinner';
import Link from 'next/link';

/** Wrapper to satisfy Next 14 requirement: useSearchParams must be inside Suspense */
export default function Page() {
  return (
    <Suspense fallback={<LoadingSpinner size="lg" text="Loading..." color="blue" />}>
      <ClientInner />
    </Suspense>
  );
}

/* ====================== Page ====================== */
function ClientInner() {
  const router = useRouter()
  const { signUp, user, loading: authLoading } = useProAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state - minimal required fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    businessName: ''
  })

  // No auto-redirect - let users stay on the page if they want

  // Simple signup handler
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Use minimal required data for initial signup
      const contractorData = {
        name: formData.name,
        businessName: formData.businessName || formData.name + "'s Service",
        phone: '', // Will be filled during KYC
        licenseNumber: 'pending',
        licenseState: 'pending',
        insuranceCarrier: 'pending',
        categories: ['General'],
        baseZip: '00000'
      }

      const result = await signUp(formData.email, formData.password, contractorData)

      if (result.error) {
        setError(result.error)
      } else {
        // Success - manually redirect to extensive contractor dashboard
        console.log('Account created successfully!')
        router.push('/dashboard/contractor')
      }
    } catch (err) {
      setError('An error occurred during signup. Please try again.')
      console.error('Signup error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Checking authentication..." color="blue" />
      </div>
    )
  }

  /* ====================== Render ====================== */
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 relative">
      {/* Pro-themed background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-transparent -z-10"></div>

      <div className="max-w-md w-full bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-8 border border-gray-200/50">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Join Rushr Pro</h1>
          <p className="text-sm text-gray-600 mt-1">Start your professional journey with us</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="John Smith"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Name
            </label>
            <input
              type="text"
              value={formData.businessName}
              onChange={(e) => handleInputChange('businessName', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Smith Home Services (optional)"
            />
            <p className="text-xs text-gray-500 mt-1">Leave blank to use your name + "Service"</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="john@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password *
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Create a secure password"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !formData.name || !formData.email || !formData.password}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                Creating Account...
              </div>
            ) : (
              'Create Pro Account'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/pro/sign-in" className="text-blue-600 hover:text-blue-500 font-medium transition-colors">
              Sign in here
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link href="/pro" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            ← Back to Rushr Pro
          </Link>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 text-sm mb-2">What happens next?</h3>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Immediate access to your Pro dashboard</li>
              <li>• Complete KYC verification to unlock all features</li>
              <li>• Add your licenses, insurance, and service areas</li>
              <li>• Start receiving quality job leads</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            By continuing you agree to our{' '}
            <Link href="/terms" className="text-blue-600 hover:text-blue-500 underline">
              Terms
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-blue-600 hover:text-blue-500 underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}