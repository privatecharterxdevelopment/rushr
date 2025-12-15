'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../../lib/supabaseClient'
import toast, { Toaster } from 'react-hot-toast'
import { CheckCircle, Zap, TrendingUp, Users, X } from 'lucide-react'

export default function EarlyAccessPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)

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
      const { data: existing } = await supabase
        .from('pro_early_access_waitlist')
        .select('email')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle()

      if (existing) {
        toast.success('You\'re already on the waitlist! Please check your email.')
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
        // Check if it's a duplicate email error (code 23505 = unique violation)
        if (insertError.code === '23505') {
          toast.success("You're already on the waitlist! Please check your email.")
        } else {
          toast.error('Something went wrong. Please try again.')
        }
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
            <p className="text-base md:text-lg lg:text-xl text-blue-100 max-w-2xl mx-auto mb-6">
              Join hundreds of contractors already on the waitlist for 3 months free access.
            </p>
            <p className="text-sm md:text-base text-blue-100">
              Questions? <a href="mailto:hello@userushr.com" className="underline hover:text-white font-medium">Contact us →</a>
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full border-t border-slate-200 bg-white py-8">
          <div className="w-full px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-600">
              <p>&copy; 2025 Rushr. All rights reserved.</p>
              <div className="flex gap-6">
                <button onClick={() => setShowTerms(true)} className="hover:text-slate-900">Terms</button>
                <button onClick={() => setShowPrivacy(true)} className="hover:text-slate-900">Privacy</button>
                <a href="mailto:hello@userushr.com" className="hover:text-slate-900">hello@userushr.com</a>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Terms Modal */}
      {showTerms && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Terms of Service</h2>
              <button onClick={() => setShowTerms(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-6 space-y-4 text-sm text-slate-700">
              <section>
                <h3 className="font-semibold text-base text-slate-900 mb-2">1. Early Access Program</h3>
                <p>By joining the Rushr Pro Early Access waitlist, you acknowledge that:</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Early access is subject to availability and approval</li>
                  <li>Features and pricing may change during the beta period</li>
                  <li>The 3-month free access promotion is valid only for approved early access members</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base text-slate-900 mb-2">2. Contractor Requirements</h3>
                <p>To qualify for Rushr Pro, contractors must:</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Maintain valid business licenses and insurance</li>
                  <li>Provide accurate and truthful information</li>
                  <li>Comply with all applicable laws and regulations</li>
                  <li>Complete jobs professionally and in a timely manner</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base text-slate-900 mb-2">3. Payment Terms</h3>
                <p>After the 3-month free access period:</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Standard subscription pricing will apply</li>
                  <li>You will be notified 14 days before the free period ends</li>
                  <li>You may cancel at any time without penalty</li>
                  <li>Payments are processed through Stripe Connect</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base text-slate-900 mb-2">4. Account Suspension</h3>
                <p>Rushr reserves the right to suspend or terminate accounts for:</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Violations of terms of service</li>
                  <li>Fraudulent activity or misrepresentation</li>
                  <li>Poor customer service or multiple complaints</li>
                  <li>Failure to maintain valid licenses or insurance</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base text-slate-900 mb-2">5. Privacy & Data</h3>
                <p>By signing up, you agree to our collection and use of your information as described in our Privacy Policy. We will never sell your personal data to third parties.</p>
              </section>

              <section>
                <h3 className="font-semibold text-base text-slate-900 mb-2">6. Contact</h3>
                <p>For questions or concerns, contact us at <a href="mailto:hello@userushr.com" className="text-blue-600 hover:underline">hello@userushr.com</a></p>
              </section>

              <p className="text-xs text-slate-500 mt-6">Last updated: January 2025</p>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4">
              <button onClick={() => setShowTerms(false)} className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Modal */}
      {showPrivacy && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Privacy Policy</h2>
              <button onClick={() => setShowPrivacy(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-6 space-y-4 text-sm text-slate-700">
              <section>
                <h3 className="font-semibold text-base text-slate-900 mb-2">1. Information We Collect</h3>
                <p>When you join the early access waitlist, we collect:</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Name and contact information (email, phone number)</li>
                  <li>Business information (business name, license details, insurance)</li>
                  <li>Location data (service areas, ZIP codes)</li>
                  <li>Professional credentials and certifications</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base text-slate-900 mb-2">2. How We Use Your Information</h3>
                <p>We use your information to:</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Process your early access application</li>
                  <li>Send updates about the Rushr Pro platform</li>
                  <li>Match you with homeowners seeking services</li>
                  <li>Verify your credentials and maintain quality standards</li>
                  <li>Process payments through Stripe Connect</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base text-slate-900 mb-2">3. Information Sharing</h3>
                <p>We share your information only with:</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Homeowners requesting quotes or services</li>
                  <li>Payment processors (Stripe) for transaction processing</li>
                  <li>Service providers who help us operate the platform</li>
                  <li>Law enforcement when required by law</li>
                </ul>
                <p className="mt-2 font-medium">We will never sell your personal data to third parties.</p>
              </section>

              <section>
                <h3 className="font-semibold text-base text-slate-900 mb-2">4. Data Security</h3>
                <p>We protect your information using:</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Industry-standard encryption (SSL/TLS)</li>
                  <li>Secure database storage with Supabase</li>
                  <li>Regular security audits and updates</li>
                  <li>Access controls and authentication</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base text-slate-900 mb-2">5. Your Rights</h3>
                <p>You have the right to:</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Access your personal data</li>
                  <li>Request corrections to your information</li>
                  <li>Delete your account and data</li>
                  <li>Opt out of marketing communications</li>
                  <li>Export your data in a portable format</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base text-slate-900 mb-2">6. Cookies & Tracking</h3>
                <p>We use essential cookies to:</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Keep you logged in</li>
                  <li>Remember your preferences</li>
                  <li>Analyze platform usage and performance</li>
                </ul>
                <p className="mt-2">You can disable cookies in your browser settings, but some features may not work properly.</p>
              </section>

              <section>
                <h3 className="font-semibold text-base text-slate-900 mb-2">7. Changes to This Policy</h3>
                <p>We may update this privacy policy as our platform evolves. We will notify you of significant changes via email or platform notifications.</p>
              </section>

              <section>
                <h3 className="font-semibold text-base text-slate-900 mb-2">8. Contact Us</h3>
                <p>For privacy-related questions or to exercise your rights, contact us at <a href="mailto:hello@userushr.com" className="text-blue-600 hover:underline">hello@userushr.com</a></p>
              </section>

              <p className="text-xs text-slate-500 mt-6">Last updated: January 2025</p>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4">
              <button onClick={() => setShowPrivacy(false)} className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
