'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../../lib/supabaseClient'
import toast, { Toaster } from 'react-hot-toast'
import { CheckCircle, Zap, TrendingUp, Users } from 'lucide-react'

export default function EarlyAccessPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate inputs
      if (!name.trim() || !email.trim() || !phone.trim()) {
        toast.error('Please fill in all fields')
        setLoading(false)
        return
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        toast.error('Please enter a valid email address')
        setLoading(false)
        return
      }

      // Check for duplicate email
      const { data: existing, error: checkError } = await supabase
        .from('pro_early_access_waitlist')
        .select('email')
        .eq('email', email.toLowerCase().trim())
        .single()

      if (existing) {
        toast.error('This email is already registered for early access')
        setLoading(false)
        return
      }

      // Insert into waitlist
      const { error: insertError } = await supabase
        .from('pro_early_access_waitlist')
        .insert({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          phone: phone.trim(),
          created_at: new Date().toISOString()
        })

      if (insertError) {
        console.error('Insert error:', insertError)
        toast.error('Something went wrong. Please try again.')
        setLoading(false)
        return
      }

      // Send confirmation email
      try {
        await fetch('/api/send-early-access-confirmation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.toLowerCase().trim(),
            name: name.trim(),
          }),
        })
      } catch (emailError) {
        console.error('Email error:', emailError)
        // Don't fail the signup if email fails
      }

      // Success!
      toast.success('Welcome to the waitlist!')
      setTimeout(() => {
        router.push('/pro/early-access/success')
      }, 1000)

    } catch (err: any) {
      console.error('Error:', err)
      toast.error('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <>
      <Toaster position="top-center" />
      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Header */}
        <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="w-full px-4 py-0 flex items-center justify-between gap-4">
            <Link href="/pro" className="flex items-center gap-2 flex-shrink-0">
              <img
                src="/rushr-contractor-header.jpeg"
                alt="Rushr Pro"
                className="h-10 md:h-12 w-auto"
              />
            </Link>
            <a
              href="mailto:hello@userushr.com"
              className="text-xs md:text-sm text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap"
            >
              Questions? Contact us →
            </a>
          </div>
        </header>

        {/* Hero Section */}
        <section className="w-full px-4 py-8 md:py-16 lg:py-24">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">

              {/* Left: Content */}
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs md:text-sm font-medium mb-4 md:mb-6">
                  <Zap className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="whitespace-nowrap">Early Access - 3 Months Free</span>
                </div>

                <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-slate-900 mb-4 md:mb-6 leading-tight">
                  Join Rushr Pro
                  <span className="block text-blue-600 mt-1 md:mt-2">Early Access</span>
                </h1>

                <p className="text-base md:text-lg lg:text-xl text-slate-600 mb-6 md:mb-8 leading-relaxed">
                  Be among the first contractors to access the future of lead generation.
                  Get notified when we launch and receive <strong className="text-slate-900">3 months free</strong> plus exclusive early access benefits.
                </p>

                {/* Benefits */}
                <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                  <div className="flex items-start gap-2 md:gap-3">
                    <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm md:text-base font-semibold text-slate-900">3 Months Free</h3>
                      <p className="text-xs md:text-sm text-slate-600">Get full access to Rushr Pro for 3 months at no cost</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 md:gap-3">
                    <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm md:text-base font-semibold text-slate-900">Priority Access</h3>
                      <p className="text-xs md:text-sm text-slate-600">Be the first to access the platform when we launch</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 md:gap-3">
                    <Users className="h-5 w-5 md:h-6 md:w-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm md:text-base font-semibold text-slate-900">Founding Member Badge</h3>
                      <p className="text-xs md:text-sm text-slate-600">Special badge on your profile as an early supporter</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Form */}
              <div className="relative">
                {/* Gradient background decoration */}
                <div className="absolute -inset-2 md:-inset-4 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-3xl blur-2xl" />

                <form
                  onSubmit={handleSubmit}
                  className="relative bg-white rounded-2xl shadow-xl border border-slate-200 p-6 md:p-8"
                >
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-5 md:mb-6">
                    Join the Waitlist
                  </h2>

                  <div className="space-y-4 md:space-y-5">
                    {/* Name */}
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="John Doe"
                        required
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="john@example.com"
                        required
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="(555) 123-4567"
                        required
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
                    >
                      {loading ? 'Joining...' : 'Join Early Access'}
                    </button>
                  </div>

                  <p className="mt-6 text-xs text-slate-500 text-center">
                    By joining, you agree to receive updates about Rushr Pro.
                    We'll never share your information.
                  </p>
                </form>
              </div>

            </div>
          </div>
        </section>

        {/* Features Preview */}
        <section className="w-full px-4 py-12 md:py-16 lg:py-20">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 text-center mb-3 md:mb-4">
              What You'll Get Access To
            </h2>
            <p className="text-base md:text-lg text-slate-600 text-center mb-8 md:mb-12 max-w-2xl mx-auto px-4">
              Rushr Pro is built specifically for contractors who want to grow their business
              with high-quality leads and modern tools.
            </p>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
              {/* Feature 1 */}
              <div className="bg-white rounded-xl p-5 md:p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3 md:mb-4">
                  <Zap className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-slate-900 mb-2">
                  Instant Job Matching
                </h3>
                <p className="text-sm md:text-base text-slate-600">
                  Get matched with local jobs in real-time. No more waiting for leads to come in.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white rounded-xl p-5 md:p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3 md:mb-4">
                  <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-slate-900 mb-2">
                  Smart Pipeline
                </h3>
                <p className="text-sm md:text-base text-slate-600">
                  Track your bids, manage proposals, and close more jobs with our intuitive pipeline.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white rounded-xl p-5 md:p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow sm:col-span-2 md:col-span-1">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3 md:mb-4">
                  <Users className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-slate-900 mb-2">
                  Direct Communication
                </h3>
                <p className="text-sm md:text-base text-slate-600">
                  Chat directly with homeowners, qualify jobs faster, and win more contracts.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="w-full bg-gradient-to-br from-blue-600 to-indigo-600 py-12 md:py-16">
          <div className="w-full px-4 text-center">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 md:mb-4">
              Ready to Transform Your Business?
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-blue-100 max-w-2xl mx-auto">
              Join hundreds of contractors already on the waitlist for 3 months free access.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full border-t border-slate-200 bg-white py-8">
          <div className="w-full px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-600">
              <p>&copy; 2025 Rushr. All rights reserved.</p>
              <div className="flex gap-6">
                <Link href="/terms" className="hover:text-slate-900">Terms</Link>
                <Link href="/privacy" className="hover:text-slate-900">Privacy</Link>
                <a href="mailto:hello@userushr.com" className="hover:text-slate-900">hello@userushr.com</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
