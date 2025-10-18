'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../contexts/AuthContext'

export default function ContractorSignUpPage() {
  const { signUp, user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !authLoading) {
      router.push('/dashboard')
    }
  }, [user, authLoading, router])

  // Show modal when there's an error
  useEffect(() => {
    if (error) {
      setShowModal(true)
    }
  }, [error])

  // Close modal when clicking outside or pressing Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowModal(false)
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.classList.contains('modal-overlay')) {
        setShowModal(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      setLoading(false)
      return
    }

    const { error } = await signUp(email, password, name, 'contractor')
    setLoading(false)

    if (error) {
      setError(error)
    } else {
      // On successful signup, redirect to contractor profile setup
      router.push('/pro/contractor-signup')
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 relative">
      {/* Background with subtle gradient for better readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 to-transparent -z-10"></div>

      <div className="max-w-md w-full bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-8 border border-gray-200/50">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Join as a Professional</h1>
          <p className="text-sm text-gray-600 mt-2">Create your contractor account and start getting leads</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password (min 8 characters)"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />

          <button
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            disabled={loading}
          >
            {loading ? 'Creating Account…' : 'Create Contractor Account'}
          </button>
        </form>

        <p className="mt-6 text-sm text-gray-600 text-center">
          Already have an account?{' '}
          <Link href="/sign-in" className="text-blue-600 hover:text-blue-500 font-medium transition-colors">
            Sign in
          </Link>
        </p>

        <p className="mt-4 text-sm text-gray-600 text-center">
          Looking for services instead?{' '}
          <Link href="/sign-up" className="text-green-600 hover:text-green-500 font-medium transition-colors">
            Sign up as homeowner
          </Link>
        </p>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            By creating an account you agree to our{' '}
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

        {/* Error Modal */}
        {showModal && error && (
          <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay bg-black/40 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl relative border border-gray-200">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Sign Up Error</h3>
              <p className="text-sm text-red-600">{error}</p>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}