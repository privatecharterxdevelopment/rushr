// components/IOSRegistration.tsx
// iOS app registration - SUPER MODERN design
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
import Link from 'next/link'

type Screen = 'splash' | 'welcome' | 'signin' | 'signup'

export default function IOSRegistration() {
  const { signIn, signUp } = useAuth()
  const router = useRouter()

  // Current screen
  const [screen, setScreen] = useState<Screen>('splash')
  const [signupStep, setSignupStep] = useState(1)

  // Form data
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  // Splash screen animation
  useEffect(() => {
    const timer = setTimeout(() => setScreen('welcome'), 2000)
    return () => clearTimeout(timer)
  }, [])

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
  }

  // Sign up handler
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
      setError('Check your email to confirm your account')
      setLoading(false)
    }
  }

  // SPLASH SCREEN
  if (screen === 'splash') {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          {/* Animated Logo */}
          <div className="relative">
            <div className="w-28 h-28 bg-white/20 rounded-[2rem] backdrop-blur-xl flex items-center justify-center mx-auto animate-pulse-slow">
              <div className="w-24 h-24 bg-white rounded-[1.5rem] flex items-center justify-center shadow-2xl">
                <span className="text-5xl animate-bounce-slow">🏠</span>
              </div>
            </div>
            {/* Glow effect */}
            <div className="absolute inset-0 bg-emerald-400/30 rounded-[2rem] blur-2xl -z-10 animate-pulse"></div>
          </div>
          <h1 className="text-white text-4xl font-black mt-6 tracking-tight">Rushr</h1>
          <p className="text-emerald-100 mt-2 text-lg">Help is on the way</p>

          {/* Loading dots */}
          <div className="flex justify-center gap-2 mt-8">
            <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>

        <style jsx>{`
          @keyframes fade-in {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes pulse-slow {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
          }
          @keyframes bounce-slow {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          .animate-fade-in { animation: fade-in 0.6s ease-out; }
          .animate-pulse-slow { animation: pulse-slow 2s ease-in-out infinite; }
          .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
        `}</style>
      </div>
    )
  }

  // WELCOME SCREEN
  if (screen === 'welcome') {
    return (
      <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-br from-emerald-500/30 via-teal-500/20 to-transparent rounded-full blur-3xl -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-to-tl from-emerald-600/20 via-cyan-500/10 to-transparent rounded-full blur-3xl translate-y-1/2"></div>
        </div>

        {/* Content */}
        <div className="relative flex-1 flex flex-col justify-between p-6 safe-area">
          {/* Top section */}
          <div className="pt-12">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-16">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <span className="text-2xl">🏠</span>
              </div>
              <span className="text-white text-2xl font-bold">Rushr</span>
            </div>

            {/* Hero text */}
            <h1 className="text-white text-5xl font-black leading-tight mb-4">
              Get help<br />
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                in minutes
              </span>
            </h1>
            <p className="text-gray-400 text-lg max-w-xs">
              Connect with verified pros for any emergency. Fast, reliable, transparent.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4 my-8">
            {[
              { icon: '⚡', title: 'Lightning fast', desc: 'Average response in 12 minutes' },
              { icon: '✓', title: 'Verified pros', desc: 'Background checked & insured' },
              { icon: '💎', title: 'Transparent pricing', desc: 'Know the cost upfront' },
            ].map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">{f.icon}</span>
                </div>
                <div>
                  <p className="text-white font-semibold">{f.title}</p>
                  <p className="text-gray-500 text-sm">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="space-y-3 pb-4">
            <button
              onClick={() => setScreen('signup')}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-emerald-500/30 active:scale-[0.98] transition-transform"
            >
              Get Started
            </button>
            <button
              onClick={() => setScreen('signin')}
              className="w-full py-4 bg-white/10 backdrop-blur-sm text-white rounded-2xl font-semibold text-lg border border-white/20 active:scale-[0.98] transition-transform"
            >
              Sign In
            </button>
            <p className="text-center text-gray-500 text-sm pt-2">
              Are you a pro?{' '}
              <Link href="/pro/contractor-signup" className="text-emerald-400 font-medium">
                Join here
              </Link>
            </p>
          </div>
        </div>

        <style jsx>{`
          .safe-area {
            padding-top: env(safe-area-inset-top, 24px);
            padding-bottom: env(safe-area-inset-bottom, 24px);
          }
        `}</style>
      </div>
    )
  }

  // SIGN IN SCREEN
  if (screen === 'signin') {
    return (
      <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-emerald-500/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        </div>

        {/* Content */}
        <div className="relative flex-1 flex flex-col p-6 safe-area">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => setScreen('welcome')}
              className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-white text-xl font-bold">Welcome back</h2>
          </div>

          {/* Form */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="space-y-4">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm backdrop-blur-sm">
                  {error}
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-gray-400 text-sm mb-2 ml-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-5 py-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:border-emerald-500/50 focus:bg-white/10 outline-none transition-all"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-gray-400 text-sm mb-2 ml-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-5 py-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:border-emerald-500/50 focus:bg-white/10 outline-none transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="text-right">
                <Link href="/reset-password" className="text-emerald-400 text-sm font-medium">
                  Forgot password?
                </Link>
              </div>
            </div>
          </div>

          {/* Button */}
          <div className="pb-4">
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-emerald-500/30 disabled:opacity-50 active:scale-[0.98] transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </div>
        </div>

        <style jsx>{`
          .safe-area {
            padding-top: env(safe-area-inset-top, 24px);
            padding-bottom: env(safe-area-inset-bottom, 24px);
          }
        `}</style>
      </div>
    )
  }

  // SIGN UP SCREEN (Multi-step)
  if (screen === 'signup') {
    return (
      <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-emerald-500/20 to-transparent rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2"></div>
          <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-gradient-to-tl from-cyan-500/10 to-transparent rounded-full blur-3xl translate-y-1/2 translate-x-1/2"></div>
        </div>

        {/* Content */}
        <div className="relative flex-1 flex flex-col p-6 safe-area">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => {
                if (signupStep === 1) setScreen('welcome')
                else setSignupStep(signupStep - 1)
              }}
              className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Progress */}
            <div className="flex gap-2">
              {[1, 2].map((s) => (
                <div
                  key={s}
                  className={`h-1 w-12 rounded-full transition-all ${
                    s <= signupStep ? 'bg-emerald-500' : 'bg-white/20'
                  }`}
                />
              ))}
            </div>

            <div className="w-10"></div>
          </div>

          {/* Form */}
          <div className="flex-1 flex flex-col justify-center">
            {error && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm backdrop-blur-sm">
                {error}
              </div>
            )}

            {/* Step 1: Name & Email */}
            {signupStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-white text-3xl font-bold mb-2">Create account</h2>
                  <p className="text-gray-400">Let's get you started</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2 ml-1">Full name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Smith"
                      className="w-full px-5 py-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:border-emerald-500/50 focus:bg-white/10 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2 ml-1">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-5 py-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:border-emerald-500/50 focus:bg-white/10 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Password */}
            {signupStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-white text-3xl font-bold mb-2">Secure your account</h2>
                  <p className="text-gray-400">Create a strong password</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2 ml-1">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 8 characters"
                        className="w-full px-5 py-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:border-emerald-500/50 focus:bg-white/10 outline-none transition-all pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                      >
                        {showPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                    {/* Password strength */}
                    <div className="flex gap-1 mt-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all ${
                            password.length >= i * 2
                              ? password.length >= 8
                                ? 'bg-emerald-500'
                                : 'bg-yellow-500'
                              : 'bg-white/10'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-400 text-sm mb-2 ml-1">Phone (optional)</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(555) 123-4567"
                      className="w-full px-5 py-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:border-emerald-500/50 focus:bg-white/10 outline-none transition-all"
                    />
                  </div>
                </div>

                <p className="text-gray-500 text-xs text-center">
                  By creating an account, you agree to our{' '}
                  <Link href="/terms" className="text-emerald-400">Terms</Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="text-emerald-400">Privacy Policy</Link>
                </p>
              </div>
            )}
          </div>

          {/* Button */}
          <div className="pb-4">
            {signupStep === 1 ? (
              <button
                onClick={() => {
                  if (!name || !email) {
                    setError('Please fill in all fields')
                    return
                  }
                  setError(null)
                  setSignupStep(2)
                }}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-emerald-500/30 active:scale-[0.98] transition-transform"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleSignUp}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-emerald-500/30 disabled:opacity-50 active:scale-[0.98] transition-all"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Creating account...
                  </span>
                ) : 'Create Account'}
              </button>
            )}
          </div>
        </div>

        <style jsx>{`
          .safe-area {
            padding-top: env(safe-area-inset-top, 24px);
            padding-bottom: env(safe-area-inset-bottom, 24px);
          }
        `}</style>
      </div>
    )
  }

  return null
}
