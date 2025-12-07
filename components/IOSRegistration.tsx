// components/IOSRegistration.tsx
// iOS app registration - True native experience
'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Link from 'next/link'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'

type Screen = 'splash' | 'welcome' | 'signin' | 'signup'

// Haptic feedback helper
const triggerHaptic = async (style: ImpactStyle = ImpactStyle.Light) => {
  try {
    await Haptics.impact({ style })
  } catch (e) {
    // Haptics not available
  }
}

const triggerNotification = async (type: NotificationType) => {
  try {
    await Haptics.notification({ type })
  } catch (e) {
    // Haptics not available
  }
}

// Animated Rushr Logo Component - Native iOS style
const AnimatedRushrLogo = () => {
  return (
    <div className="relative flex items-center justify-center">
      {/* Pulsing rings */}
      <div
        className="absolute w-28 h-28 rounded-3xl"
        style={{
          background: 'rgba(255, 255, 255, 0.15)',
          animation: 'pulse-outer 2s ease-in-out infinite'
        }}
      />
      <div
        className="absolute w-24 h-24 rounded-2xl"
        style={{
          background: 'rgba(255, 255, 255, 0.2)',
          animation: 'pulse-inner 2s ease-in-out infinite 0.3s'
        }}
      />

      {/* Main logo */}
      <div
        className="relative w-20 h-20 bg-white rounded-2xl flex items-center justify-center"
        style={{
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
          animation: 'float 2s ease-in-out infinite'
        }}
      >
        <span className="text-emerald-600 font-bold text-4xl">R</span>
      </div>

      <style jsx>{`
        @keyframes pulse-outer {
          0%, 100% { transform: scale(0.9); opacity: 0.3; }
          50% { transform: scale(1.1); opacity: 0.1; }
        }
        @keyframes pulse-inner {
          0%, 100% { transform: scale(0.95); opacity: 0.4; }
          50% { transform: scale(1.05); opacity: 0.2; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  )
}

// Static Rushr Logo
const RushrLogo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizes = {
    sm: { container: 'w-10 h-10', text: 'text-lg', radius: 'rounded-xl' },
    md: { container: 'w-12 h-12', text: 'text-xl', radius: 'rounded-xl' },
    lg: { container: 'w-14 h-14', text: 'text-2xl', radius: 'rounded-2xl' }
  }
  const s = sizes[size]

  return (
    <div
      className={`${s.container} ${s.radius} flex items-center justify-center`}
      style={{
        background: 'linear-gradient(135deg, #059669, #047857)',
        boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)'
      }}
    >
      <span className={`text-white font-bold ${s.text}`}>R</span>
    </div>
  )
}

// Native iOS Input component
const IOSInput = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoCapitalize = 'none',
  autoCorrect = 'off',
  error
}: {
  label: string
  type?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoCapitalize?: string
  autoCorrect?: string
  error?: string
}) => (
  <div>
    <label className="block text-gray-500 text-[13px] font-medium mb-1.5 ml-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoCapitalize={autoCapitalize}
      autoCorrect={autoCorrect}
      className={`w-full px-4 py-3.5 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-400 text-[16px] outline-none transition-colors ${
        error ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-emerald-500 focus:bg-white'
      }`}
      style={{ WebkitAppearance: 'none' }}
    />
    {error && <p className="text-red-500 text-[12px] mt-1 ml-1">{error}</p>}
  </div>
)

// Native iOS Button component
const IOSButton = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  loading = false
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary'
  disabled?: boolean
  loading?: boolean
}) => {
  const handlePress = async () => {
    await triggerHaptic(ImpactStyle.Medium)
    onClick?.()
  }

  const baseStyles = 'w-full py-4 rounded-2xl font-semibold text-[17px] transition-all active:scale-[0.98] disabled:opacity-50'
  const variantStyles = variant === 'primary'
    ? 'text-white'
    : 'bg-gray-100 text-gray-900 active:bg-gray-200'

  return (
    <button
      onClick={handlePress}
      disabled={disabled || loading}
      className={`${baseStyles} ${variantStyles}`}
      style={variant === 'primary' ? {
        background: 'linear-gradient(135deg, #059669, #047857)',
        boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)'
      } : undefined}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="w-5 h-5 animate-spin\" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </span>
      ) : children}
    </button>
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

  // Auto-advance from splash
  useEffect(() => {
    const timer = setTimeout(() => {
      setScreen('welcome')
    }, 2500)
    return () => clearTimeout(timer)
  }, [])

  const handleSignIn = async () => {
    if (!email || !password) {
      await triggerNotification(NotificationType.Error)
      setError('Please enter email and password')
      return
    }
    setLoading(true)
    setError(null)
    const result = await signIn(email, password)
    if (result.error) {
      await triggerNotification(NotificationType.Error)
      setError(result.error)
      setLoading(false)
    } else {
      await triggerNotification(NotificationType.Success)
    }
  }

  const handleSignUp = async () => {
    if (!email || !password || !name) {
      await triggerNotification(NotificationType.Error)
      setError('Please fill in all fields')
      return
    }
    if (password.length < 8) {
      await triggerNotification(NotificationType.Error)
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    setError(null)
    const result = await signUp(email, password, name, 'homeowner')
    if (result.error) {
      await triggerNotification(NotificationType.Error)
      setError(result.error)
      setLoading(false)
    } else if (result.needsConfirmation) {
      await triggerNotification(NotificationType.Warning)
      setError('Check your email to confirm your account')
      setLoading(false)
    } else {
      await triggerNotification(NotificationType.Success)
    }
  }

  const navigateTo = async (newScreen: Screen) => {
    await triggerHaptic()
    setError(null)
    setScreen(newScreen)
  }

  // SPLASH - Animated Rushr logo
  if (screen === 'splash') {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center"
        style={{ background: 'linear-gradient(180deg, #059669, #047857)' }}
      >
        <AnimatedRushrLogo />
        <p
          className="text-white text-2xl font-semibold mt-8"
          style={{ animation: 'fadeIn 1s ease-out 0.5s both' }}
        >
          Rushr
        </p>
        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    )
  }

  // WELCOME
  if (screen === 'welcome') {
    return (
      <div
        className="fixed inset-0 bg-white flex flex-col"
        style={{ paddingTop: 'env(safe-area-inset-top, 44px)' }}
      >
        <div className="flex-1 flex flex-col justify-center px-6">
          {/* Logo */}
          <div className="mb-8">
            <RushrLogo size="lg" />
          </div>

          {/* Title */}
          <h1 className="text-[32px] font-bold text-gray-900 tracking-tight mb-2">
            Get help fast
          </h1>
          <p className="text-gray-500 text-[17px] mb-10">
            Connect with verified pros in minutes
          </p>

          {/* Features */}
          <div className="space-y-5">
            {[
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                title: 'Fast response',
                subtitle: 'Average 12 min arrival'
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                title: 'Verified pros',
                subtitle: 'Background checked'
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: 'Upfront pricing',
                subtitle: 'No hidden fees'
              }
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-4">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)' }}
                >
                  <div className="text-emerald-600">{feature.icon}</div>
                </div>
                <div>
                  <p className="text-gray-900 font-semibold text-[15px]">{feature.title}</p>
                  <p className="text-gray-400 text-[13px]">{feature.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div
          className="px-6 pb-4 space-y-3"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
        >
          <IOSButton onClick={() => navigateTo('signup')}>
            Get Started
          </IOSButton>
          <IOSButton variant="secondary" onClick={() => navigateTo('signin')}>
            Sign In
          </IOSButton>
          <p className="text-center text-gray-400 text-[13px] pt-2">
            Are you a pro?{' '}
            <Link href="/pro/contractor-signup" className="text-emerald-600 font-semibold">
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
      <div
        className="fixed inset-0 bg-white flex flex-col"
        style={{ paddingTop: 'env(safe-area-inset-top, 44px)' }}
      >
        {/* Header */}
        <div className="flex items-center px-4 py-2">
          <button
            onClick={() => navigateTo('welcome')}
            className="w-10 h-10 flex items-center justify-center -ml-2 active:opacity-60"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-[17px] font-semibold text-gray-900 ml-2">Sign In</h1>
        </div>

        {/* Form */}
        <div className="flex-1 px-6 pt-6 overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-red-600 text-[14px]">{error}</p>
            </div>
          )}

          <div className="space-y-5">
            <IOSInput
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
            />
            <IOSInput
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="Enter password"
            />
            <div className="text-right">
              <Link href="/reset-password" className="text-emerald-600 text-[14px] font-semibold">
                Forgot password?
              </Link>
            </div>
          </div>
        </div>

        {/* Button */}
        <div
          className="px-6 py-4"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
        >
          <IOSButton onClick={handleSignIn} loading={loading} disabled={loading}>
            Sign In
          </IOSButton>
        </div>
      </div>
    )
  }

  // SIGN UP
  if (screen === 'signup') {
    return (
      <div
        className="fixed inset-0 bg-white flex flex-col"
        style={{ paddingTop: 'env(safe-area-inset-top, 44px)' }}
      >
        {/* Header */}
        <div className="flex items-center px-4 py-2">
          <button
            onClick={() => navigateTo('welcome')}
            className="w-10 h-10 flex items-center justify-center -ml-2 active:opacity-60"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-[17px] font-semibold text-gray-900 ml-2">Create Account</h1>
        </div>

        {/* Form */}
        <div className="flex-1 px-6 pt-6 overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-red-600 text-[14px]">{error}</p>
            </div>
          )}

          <div className="space-y-5">
            <IOSInput
              label="Full Name"
              type="text"
              value={name}
              onChange={setName}
              placeholder="John Smith"
              autoCapitalize="words"
            />
            <IOSInput
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
            />
            <IOSInput
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="Min. 8 characters"
            />
          </div>

          <p className="text-gray-400 text-[13px] text-center mt-8">
            By signing up, you agree to our{' '}
            <Link href="/terms" className="text-emerald-600">Terms</Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-emerald-600">Privacy Policy</Link>
          </p>
        </div>

        {/* Button */}
        <div
          className="px-6 py-4"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
        >
          <IOSButton onClick={handleSignUp} loading={loading} disabled={loading}>
            Create Account
          </IOSButton>
        </div>
      </div>
    )
  }

  return null
}
