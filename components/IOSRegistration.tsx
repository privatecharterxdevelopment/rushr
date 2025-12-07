// components/IOSRegistration.tsx
// iOS app registration - multi-step wizard for homeowners
'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
import Link from 'next/link'

type Step = 'welcome' | 'signin' | 'signup-1' | 'signup-2' | 'signup-3'

export default function IOSRegistration() {
  const { signIn, signUp } = useAuth()
  const router = useRouter()

  // Current step
  const [step, setStep] = useState<Step>('welcome')

  // Form data
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [zip, setZip] = useState('')
  const [howHeard, setHowHeard] = useState('')

  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sign in handler
  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please enter email and password')
      return
    }
    setLoading(true)
    setError(null)

    const result = await signIn(email, password)
    if (result.error) {
      setError(result.error)
      setLoading(false)
    }
    // Success will auto-redirect via auth state change
  }

  // Sign up handler (final step)
  const handleSignUp = async () => {
    if (!email || !password || !name) {
      setError('Please fill in all required fields')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    setError(null)

    const result = await signUp(email, password, name, 'homeowner')
    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else if (result.needsConfirmation) {
      setError('Please check your email to confirm your account')
      setLoading(false)
    }
    // Success will auto-redirect via auth state change
  }

  // Progress indicator
  const getProgress = () => {
    switch (step) {
      case 'signup-1': return 33
      case 'signup-2': return 66
      case 'signup-3': return 100
      default: return 0
    }
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-emerald-600 to-emerald-700 flex flex-col">
      {/* Safe area top */}
      <div className="safe-area-top" />

      {/* Back button (except welcome) */}
      {step !== 'welcome' && (
        <div className="px-4 pt-4">
          <button
            onClick={() => {
              if (step === 'signin') setStep('welcome')
              else if (step === 'signup-1') setStep('welcome')
              else if (step === 'signup-2') setStep('signup-1')
              else if (step === 'signup-3') setStep('signup-2')
            }}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      )}

      {/* Progress bar (signup steps only) */}
      {step.startsWith('signup') && (
        <div className="px-6 pt-4">
          <div className="h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-300"
              style={{ width: `${getProgress()}%` }}
            />
          </div>
          <p className="text-white/70 text-xs mt-2 text-center">
            Step {step === 'signup-1' ? 1 : step === 'signup-2' ? 2 : 3} of 3
          </p>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-6 pb-8">
        {/* WELCOME SCREEN */}
        {step === 'welcome' && (
          <div className="text-center">
            {/* Logo */}
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-3xl shadow-lg mb-4">
                <span className="text-5xl">🏠</span>
              </div>
              <h1 className="text-white text-3xl font-bold">Rushr</h1>
              <p className="text-emerald-200 mt-2">Emergency help, on the way</p>
            </div>

            {/* Features */}
            <div className="space-y-3 mb-8">
              {[
                { icon: '⚡', text: 'Find pros in minutes' },
                { icon: '✓', text: 'Background-checked & verified' },
                { icon: '💰', text: 'Upfront transparent pricing' },
              ].map((f, i) => (
                <div key={i} className="flex items-center justify-center gap-3 text-white/90">
                  <span className="text-xl">{f.icon}</span>
                  <span>{f.text}</span>
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => setStep('signup-1')}
                className="w-full py-4 bg-white text-emerald-600 rounded-2xl font-bold text-lg shadow-lg"
              >
                Get Started
              </button>
              <button
                onClick={() => setStep('signin')}
                className="w-full py-4 bg-white/20 text-white rounded-2xl font-semibold text-lg"
              >
                I already have an account
              </button>
            </div>

            {/* Pro link */}
            <div className="mt-6">
              <Link href="/pro/contractor-signup" className="text-white/80 text-sm underline">
                Join as a service provider
              </Link>
            </div>
          </div>
        )}

        {/* SIGN IN SCREEN */}
        {step === 'signin' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-white text-2xl font-bold">Welcome back</h2>
              <p className="text-emerald-200 mt-1">Sign in to your account</p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-xl">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-600 text-sm mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 text-sm mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <button
                  onClick={handleSignIn}
                  disabled={loading}
                  className="w-full py-4 bg-emerald-600 text-white rounded-xl font-semibold text-lg disabled:opacity-50"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>

                <div className="text-center">
                  <Link href="/reset-password" className="text-emerald-600 text-sm">
                    Forgot password?
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SIGNUP STEP 1 - Basic Info */}
        {step === 'signup-1' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-white text-2xl font-bold">Create your account</h2>
              <p className="text-emerald-200 mt-1">Let's start with the basics</p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-xl">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-600 text-sm mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Smith"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 text-sm mb-1">Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <button
                  onClick={() => {
                    if (!name || !email) {
                      setError('Please fill in all fields')
                      return
                    }
                    setError(null)
                    setStep('signup-2')
                  }}
                  className="w-full py-4 bg-emerald-600 text-white rounded-xl font-semibold text-lg"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SIGNUP STEP 2 - Password & Phone */}
        {step === 'signup-2' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-white text-2xl font-bold">Secure your account</h2>
              <p className="text-emerald-200 mt-1">Set up your login credentials</p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-xl">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-600 text-sm mb-1">Password *</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                  <p className="text-gray-400 text-xs mt-1">At least 8 characters</p>
                </div>
                <div>
                  <label className="block text-gray-600 text-sm mb-1">Phone (optional)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <button
                  onClick={() => {
                    if (!password) {
                      setError('Please enter a password')
                      return
                    }
                    if (password.length < 8) {
                      setError('Password must be at least 8 characters')
                      return
                    }
                    setError(null)
                    setStep('signup-3')
                  }}
                  className="w-full py-4 bg-emerald-600 text-white rounded-xl font-semibold text-lg"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SIGNUP STEP 3 - Location & Finish */}
        {step === 'signup-3' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-white text-2xl font-bold">Almost there!</h2>
              <p className="text-emerald-200 mt-1">Tell us where you're located</p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-xl">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-600 text-sm mb-1">ZIP Code (optional)</label>
                  <input
                    type="text"
                    value={zip}
                    onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    placeholder="12345"
                    maxLength={5}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                  <p className="text-gray-400 text-xs mt-1">Helps us find pros near you</p>
                </div>
                <div>
                  <label className="block text-gray-600 text-sm mb-1">How did you hear about us?</label>
                  <select
                    value={howHeard}
                    onChange={(e) => setHowHeard(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none bg-white"
                  >
                    <option value="">Select an option</option>
                    <option value="google">Google Search</option>
                    <option value="friend">Friend or Family</option>
                    <option value="social">Social Media</option>
                    <option value="ad">Advertisement</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Terms */}
                <p className="text-gray-500 text-xs text-center">
                  By creating an account, you agree to our{' '}
                  <Link href="/terms" className="text-emerald-600 underline">Terms</Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="text-emerald-600 underline">Privacy Policy</Link>
                </p>

                <button
                  onClick={handleSignUp}
                  disabled={loading}
                  className="w-full py-4 bg-emerald-600 text-white rounded-xl font-semibold text-lg disabled:opacity-50"
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom styles */}
      <style jsx>{`
        .safe-area-top {
          padding-top: env(safe-area-inset-top, 0);
        }
      `}</style>
    </div>
  )
}
