// components/IOSRegistration.tsx
// iOS app registration - Native app feel with animated logo
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Link from 'next/link'

type Screen = 'splash' | 'welcome' | 'signin' | 'signup'

// Animated Rushr Logo Component
const AnimatedRushrLogo = ({ size = 'lg' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizes = {
    sm: { container: 'w-12 h-12', text: 'text-xl', pulse: 'w-16 h-16' },
    md: { container: 'w-16 h-16', text: 'text-2xl', pulse: 'w-20 h-20' },
    lg: { container: 'w-20 h-20', text: 'text-4xl', pulse: 'w-28 h-28' }
  }
  const s = sizes[size]

  return (
    <div className="relative flex items-center justify-center">
      {/* Pulsing background rings */}
      <div className={`absolute ${s.pulse} bg-emerald-400/20 rounded-2xl animate-ping`} style={{ animationDuration: '2s' }} />
      <div className={`absolute ${s.pulse} bg-emerald-400/10 rounded-2xl animate-ping`} style={{ animationDuration: '2s', animationDelay: '0.5s' }} />

      {/* Main logo */}
      <div className={`relative ${s.container} bg-white rounded-2xl flex items-center justify-center shadow-xl`}>
        <span className={`font-bold text-emerald-600 ${s.text}`}>R</span>
      </div>
    </div>
  )
}

// Static Rushr Logo
const RushrLogo = ({ size = 'md', white = false }: { size?: 'sm' | 'md' | 'lg', white?: boolean }) => {
  const sizes = {
    sm: 'w-10 h-10 text-lg',
    md: 'w-12 h-12 text-xl',
    lg: 'w-16 h-16 text-2xl'
  }
  return (
    <div className={`${sizes[size]} ${white ? 'bg-white' : 'bg-emerald-600'} rounded-xl flex items-center justify-center shadow-lg`}>
      <span className={`font-bold ${white ? 'text-emerald-600' : 'text-white'}`}>R</span>
    </div>
  )
}

export default function IOSRegistration() {
  const { signIn, signUp } = useAuth()

  const [screen, setScreen] = useState<Screen>('splash')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [keyboardVisible, setKeyboardVisible] = useState(false)

  // Detect keyboard
  useEffect(() => {
    const handleResize = () => {
      const vh = window.innerHeight
      const viewportHeight = window.visualViewport?.height || vh
      setKeyboardVisible(viewportHeight < vh * 0.8)
    }

    window.visualViewport?.addEventListener('resize', handleResize)
    return () => window.visualViewport?.removeEventListener('resize', handleResize)
  }, [])

  // Auto-advance from splash
  useEffect(() => {
    const timer = setTimeout(() => setScreen('welcome'), 2000)
    return () => clearTimeout(timer)
  }, [])

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
  }

  const handleSignUp = async () => {
    if (!email || !password || !name) {
      setError('Please fill in all fields')
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
      setError('Check your email to confirm your account')
      setLoading(false)
    }
  }

  // SPLASH - Animated Rushr logo
  if (screen === 'splash') {
    return (
      <div className="fixed inset-0 bg-emerald-600 flex flex-col items-center justify-center safe-area-inset">
        <AnimatedRushrLogo size="lg" />
        <p className="text-white text-2xl font-semibold mt-6 animate-pulse">Rushr</p>
      </div>
    )
  }

  // WELCOME
  if (screen === 'welcome') {
    return (
      <div className="fixed inset-0 bg-white flex flex-col safe-area-inset">
        <div className="flex-1 flex flex-col justify-center px-6 pt-safe">
          {/* Logo */}
          <div className="mb-6">
            <RushrLogo size="md" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Get help fast
          </h1>
          <p className="text-gray-500 text-sm mb-8">
            Connect with verified pros in minutes
          </p>

          {/* Features */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-900 font-medium text-sm">Fast response</p>
                <p className="text-gray-400 text-xs">Average 12 min arrival</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-900 font-medium text-sm">Verified pros</p>
                <p className="text-gray-400 text-xs">Background checked</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-900 font-medium text-sm">Upfront pricing</p>
                <p className="text-gray-400 text-xs">No hidden fees</p>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="px-6 pb-8 pt-4 space-y-3">
          <button
            onClick={() => setScreen('signup')}
            className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-semibold text-sm active:bg-emerald-700"
          >
            Get Started
          </button>
          <button
            onClick={() => setScreen('signin')}
            className="w-full py-3.5 bg-gray-100 text-gray-900 rounded-xl font-semibold text-sm active:bg-gray-200"
          >
            Sign In
          </button>
          <p className="text-center text-gray-400 text-xs pt-1">
            Are you a pro?{' '}
            <Link href="/pro/contractor-signup" className="text-emerald-600 font-medium">
              Join here
            </Link>
          </p>
        </div>
      </div>
    )
  }

  // SIGN IN
  if (screen === 'signin') {
    return (
      <div className="fixed inset-0 bg-white flex flex-col safe-area-inset">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 pt-safe pb-2">
          <button
            onClick={() => { setScreen('welcome'); setError(null) }}
            className="w-10 h-10 flex items-center justify-center -ml-2"
          >
            <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Sign In</h1>
        </div>

        {/* Form */}
        <div className="flex-1 px-6 pt-4 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 text-xs font-medium mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoCapitalize="none"
                autoCorrect="off"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-xs font-medium mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
              />
            </div>
            <div className="text-right">
              <Link href="/reset-password" className="text-emerald-600 text-xs font-medium">
                Forgot password?
              </Link>
            </div>
          </div>
        </div>

        {/* Button */}
        <div className={`px-6 pb-8 pt-4 ${keyboardVisible ? 'pb-4' : ''}`}>
          <button
            onClick={handleSignIn}
            disabled={loading}
            className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-semibold text-sm disabled:opacity-50 active:bg-emerald-700"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Signing in...
              </span>
            ) : 'Sign In'}
          </button>
        </div>
      </div>
    )
  }

  // SIGN UP
  if (screen === 'signup') {
    return (
      <div className="fixed inset-0 bg-white flex flex-col safe-area-inset">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 pt-safe pb-2">
          <button
            onClick={() => { setScreen('welcome'); setError(null) }}
            className="w-10 h-10 flex items-center justify-center -ml-2"
          >
            <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Create Account</h1>
        </div>

        {/* Form */}
        <div className="flex-1 px-6 pt-4 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 text-xs font-medium mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Smith"
                autoCapitalize="words"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-xs font-medium mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoCapitalize="none"
                autoCorrect="off"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-xs font-medium mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
              />
            </div>
          </div>

          <p className="text-gray-400 text-xs text-center mt-6">
            By signing up, you agree to our{' '}
            <Link href="/terms" className="text-emerald-600">Terms</Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-emerald-600">Privacy Policy</Link>
          </p>
        </div>

        {/* Button */}
        <div className={`px-6 pb-8 pt-4 ${keyboardVisible ? 'pb-4' : ''}`}>
          <button
            onClick={handleSignUp}
            disabled={loading}
            className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-semibold text-sm disabled:opacity-50 active:bg-emerald-700"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating account...
              </span>
            ) : 'Create Account'}
          </button>
        </div>
      </div>
    )
  }

  return null
}
