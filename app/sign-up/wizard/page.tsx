'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../../contexts/AuthContext'
import LoadingSpinner from '../../../components/LoadingSpinner'

const STORAGE_KEY = 'rushr.homeowner.signup.v1'

type WizardData = {
  // Step 1: Account
  name: string
  email: string
  password: string
  // Step 2: Location
  address: string
  city: string
  state: string
  zipCode: string
  // Step 3: Contact
  phone: string
  // Step 4: Preferences
  serviceInterests: string[]
  emergencyContact: string
  emergencyPhone: string
}

const initialData: WizardData = {
  name: '',
  email: '',
  password: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  phone: '',
  serviceInterests: [],
  emergencyContact: '',
  emergencyPhone: '',
}

const STEPS = [
  { id: 1, title: 'Account', icon: '👤' },
  { id: 2, title: 'Location', icon: '📍' },
  { id: 3, title: 'Contact', icon: '📱' },
  { id: 4, title: 'Review', icon: '✓' },
]

const SERVICE_OPTIONS = [
  'Plumbing',
  'Electrical',
  'HVAC',
  'Roofing',
  'Water Damage',
  'Locksmith',
  'Appliance Repair',
  'Handyman',
  'Auto Battery',
  'Auto Tire',
  'Tow',
]

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
]

export default function HomeownerWizard() {
  const router = useRouter()
  const { signUp, loading: authLoading } = useAuth()

  const [step, setStep] = useState(1)
  const [data, setData] = useState<WizardData>(initialData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  // Load draft from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setData({ ...initialData, ...parsed })
      } catch {}
    }
  }, [])

  // Auto-save draft
  useEffect(() => {
    const { password, ...safeData } = data
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safeData))
  }, [data])

  const updateField = <K extends keyof WizardData>(field: K, value: WizardData[K]) => {
    setData(prev => ({ ...prev, [field]: value }))
  }

  const toggleService = (service: string) => {
    setData(prev => ({
      ...prev,
      serviceInterests: prev.serviceInterests.includes(service)
        ? prev.serviceInterests.filter(s => s !== service)
        : [...prev.serviceInterests, service]
    }))
  }

  const validateStep = (stepNum: number): boolean => {
    setError(null)

    switch (stepNum) {
      case 1:
        if (!data.name.trim()) {
          setError('Please enter your name')
          return false
        }
        if (!data.email.trim() || !data.email.includes('@')) {
          setError('Please enter a valid email')
          return false
        }
        if (data.password.length < 8) {
          setError('Password must be at least 8 characters')
          return false
        }
        return true
      case 2:
        // Location is optional but if provided, validate
        if (data.zipCode && data.zipCode.length !== 5) {
          setError('Please enter a valid 5-digit ZIP code')
          return false
        }
        return true
      case 3:
        // Phone is optional
        return true
      case 4:
        if (!agreedToTerms) {
          setError('Please agree to the Terms & Conditions')
          return false
        }
        return true
      default:
        return true
    }
  }

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, STEPS.length))
    }
  }

  const prevStep = () => {
    setError(null)
    setStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(4)) return

    setLoading(true)
    setError(null)

    try {
      const result = await signUp(data.email, data.password, data.name, 'homeowner')

      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      // Clear draft on success
      localStorage.removeItem(STORAGE_KEY)

      // Redirect to dashboard
      router.push('/dashboard/homeowner')
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 to-white py-8 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <h1 className="text-2xl font-bold text-emerald-600">Rushr</h1>
          </Link>
          <h2 className="text-xl font-semibold text-slate-900">Create Your Account</h2>
          <p className="text-sm text-slate-600 mt-1">Find trusted contractors in minutes</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8 px-4">
          {STEPS.map((s, idx) => (
            <div key={s.id} className="flex items-center">
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold transition-all
                ${step >= s.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-400'}
              `}>
                {step > s.id ? '✓' : s.icon}
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`w-12 sm:w-20 h-1 mx-1 rounded ${step > s.id ? 'bg-emerald-600' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Title */}
        <div className="text-center mb-6">
          <span className="text-sm text-emerald-600 font-medium">Step {step} of {STEPS.length}</span>
          <h3 className="text-lg font-semibold text-slate-900 mt-1">{STEPS[step - 1].title}</h3>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Step 1: Account */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="John Smith"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={data.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="john@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
                <input
                  type="password"
                  value={data.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
                />
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 mb-4">
                Help us find contractors near you (optional - you can add this later)
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Street Address</label>
                <input
                  type="text"
                  value={data.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="123 Main St"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={data.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    placeholder="New York"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                  <select
                    value={data.state}
                    onChange={(e) => updateField('state', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
                  >
                    <option value="">Select</option>
                    {US_STATES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ZIP Code</label>
                <input
                  type="text"
                  value={data.zipCode}
                  onChange={(e) => updateField('zipCode', e.target.value.replace(/\D/g, '').slice(0, 5))}
                  placeholder="10001"
                  maxLength={5}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
                />
              </div>
            </div>
          )}

          {/* Step 3: Contact & Preferences */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={data.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Services you might need</label>
                <div className="grid grid-cols-2 gap-2">
                  {SERVICE_OPTIONS.map(service => (
                    <button
                      key={service}
                      type="button"
                      onClick={() => toggleService(service)}
                      className={`
                        px-3 py-2 rounded-xl text-sm font-medium transition
                        ${data.serviceInterests.includes(service)
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}
                      `}
                    >
                      {service}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <label className="block text-sm font-medium text-slate-700 mb-1">Emergency Contact (optional)</label>
                <input
                  type="text"
                  value={data.emergencyContact}
                  onChange={(e) => updateField('emergencyContact', e.target.value)}
                  placeholder="Contact name"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition mb-2"
                />
                <input
                  type="tel"
                  value={data.emergencyPhone}
                  onChange={(e) => updateField('emergencyPhone', e.target.value)}
                  placeholder="Contact phone"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
                />
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wide">Account</span>
                  <p className="font-medium text-slate-900">{data.name}</p>
                  <p className="text-sm text-slate-600">{data.email}</p>
                </div>

                {(data.address || data.city || data.zipCode) && (
                  <div className="pt-3 border-t border-slate-200">
                    <span className="text-xs text-slate-500 uppercase tracking-wide">Location</span>
                    <p className="text-sm text-slate-700">
                      {[data.address, data.city, data.state, data.zipCode].filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}

                {data.phone && (
                  <div className="pt-3 border-t border-slate-200">
                    <span className="text-xs text-slate-500 uppercase tracking-wide">Phone</span>
                    <p className="text-sm text-slate-700">{data.phone}</p>
                  </div>
                )}

                {data.serviceInterests.length > 0 && (
                  <div className="pt-3 border-t border-slate-200">
                    <span className="text-xs text-slate-500 uppercase tracking-wide">Interests</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {data.serviceInterests.map(s => (
                        <span key={s} className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Terms & Conditions */}
              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="terms" className="text-sm text-slate-700">
                  I agree to the{' '}
                  <Link href="/terms" target="_blank" className="text-emerald-600 underline">
                    Terms & Conditions
                  </Link>
                  {' '}and{' '}
                  <Link href="/privacy" target="_blank" className="text-emerald-600 underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition"
              >
                Back
              </button>
            )}

            {step < STEPS.length ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !agreedToTerms}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            )}
          </div>
        </div>

        {/* Footer Links */}
        <div className="text-center mt-6">
          <p className="text-sm text-slate-600">
            Already have an account?{' '}
            <Link href="/sign-in" className="text-emerald-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
          <p className="text-sm text-slate-600 mt-2">
            Are you a service provider?{' '}
            <Link href="/pro/wizard" className="text-blue-600 font-medium hover:underline">
              Register as a Pro
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
