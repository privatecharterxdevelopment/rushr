// app/pro/how-it-works/page.tsx
'use client'
import React from 'react'
import Link from 'next/link'
import { useAuth } from '../../../contexts/AuthContext'
import { showGlobalToast } from '../../../components/Toast'
import { useRouter } from 'next/navigation'

export default function ProHowItWorksPage(){
  const { user, loading } = useAuth()
  const router = useRouter()

  const postOrAuth = ()=>{
    if(!user && !loading){
      showGlobalToast('Sign in to continue', 'info')
      router.push('/auth')
      return
    }
    router.push('/jobs')
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 space-y-16">

      {/* Hero */}
      <section className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
          How Rushr works for pros
        </h1>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          <strong className="text-gray-900">Get instant emergency job alerts and win more work.</strong> No lead fees, no subscriptions—just a small fee when you complete jobs. Respond fast, get hired, get paid.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={postOrAuth}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Browse Jobs
          </button>
          <Link
            href="/pro"
            className="border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            For Professionals
          </Link>
        </div>
      </section>

      {/* How It Works Steps */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Win emergency jobs in 4 steps</h2>
          <p className="mt-2 text-gray-600">Get alerts, respond fast, get hired, get paid. That's it.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white border-2 border-blue-500 rounded-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-lg mb-4">
              <span className="text-xl font-bold text-white">1</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Create profile</h3>
            <p className="text-gray-600 text-sm">Add your trade, service area, licenses, and portfolio. Takes 5 minutes.</p>
          </div>

          <div className="bg-white border-2 border-blue-500 rounded-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-lg mb-4">
              <span className="text-xl font-bold text-white">2</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Get instant alerts</h3>
            <p className="text-gray-600 text-sm">Push notifications the moment emergency jobs are posted in your area.</p>
          </div>

          <div className="bg-white border-2 border-blue-500 rounded-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-lg mb-4">
              <span className="text-xl font-bold text-white">3</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Send quotes & win</h3>
            <p className="text-gray-600 text-sm">Respond fast with your price and ETA. Homeowners hire the best fit.</p>
          </div>

          <div className="bg-white border-2 border-blue-500 rounded-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-lg mb-4">
              <span className="text-xl font-bold text-white">4</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Complete & get paid</h3>
            <p className="text-gray-600 text-sm">Finish the job, get homeowner approval, receive payment via Stripe.</p>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border-2 border-blue-400 rounded-lg p-6 text-center">
          <p className="text-lg font-bold text-gray-900">
            ⚡ <strong>Real-time alerts. Instant bidding. Secure payments.</strong>
          </p>
          <p className="mt-2 text-gray-700">
            No lead fees. No subscriptions. Just a <strong>small fee on completed jobs</strong>. You only pay when you earn.
          </p>
        </div>
      </section>

      {/* What You Get */}
      <section>
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-gray-900">What pros get with Rushr</h3>
          <p className="mt-2 text-gray-600">
            Built for emergency service professionals who want quality jobs, fast
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-xl font-semibold text-gray-900 mb-4">Instant Job Alerts</h4>
            <ul className="space-y-2 text-gray-600">
              <li>• Push notifications for emergency jobs</li>
              <li>• Filter by trade, location, job type</li>
              <li>• See job details before bidding</li>
              <li>• Respond in seconds, not hours</li>
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-xl font-semibold text-gray-900 mb-4">Professional Tools</h4>
            <ul className="space-y-2 text-gray-600">
              <li>• In-app messaging with homeowners</li>
              <li>• Photo sharing and documentation</li>
              <li>• GPS tracking for transparency</li>
              <li>• Job history and reviews</li>
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-xl font-semibold text-gray-900 mb-4">Secure Payments</h4>
            <ul className="space-y-2 text-gray-600">
              <li>• Escrow-protected payments</li>
              <li>• Stripe direct deposit</li>
              <li>• Payment on job completion</li>
              <li>• No chasing invoices</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600">Emergency work pays better. Same-day service. Motivated homeowners. Quality jobs.</p>
        </div>
      </section>

      {/* How Rushr is Different */}
      <section>
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-gray-900">Traditional lead services vs. Rushr</h3>
          <p className="mt-2 text-gray-600">
            Stop paying for stale leads—get real jobs with real-time matching
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Traditional */}
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
            <h4 className="text-xl font-semibold text-red-900 mb-4">❌ Traditional Lead Services</h4>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-red-600 mr-2">•</span>
                <span><strong>Pay upfront for leads</strong> before knowing if they're real</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2">•</span>
                <span><strong>Compete with 5-10 other pros</strong> on the same stale lead</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2">•</span>
                <span><strong>No real-time alerts</strong>—leads are hours or days old</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2">•</span>
                <span><strong>Waste money on bad leads</strong> and tire-kickers</span>
              </li>
            </ul>
          </div>

          {/* Rushr */}
          <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-6">
            <h4 className="text-xl font-semibold text-blue-900 mb-4">✅ Rushr: On-Demand Job Platform</h4>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span><strong>No lead fees</strong>—only pay a small fee on completed jobs</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span><strong>Real emergency jobs</strong>—homeowners need help NOW</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span><strong>Instant notifications</strong> the moment jobs are posted</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span><strong>Escrow payments</strong>—get paid when job is complete</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-white border-2 border-blue-500 p-4 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">Fast</div>
            <div className="text-sm text-gray-600 font-semibold">Instant Alerts</div>
          </div>
          <div className="bg-white border-2 border-blue-500 p-4 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">Real</div>
            <div className="text-sm text-gray-600 font-semibold">Emergency Jobs</div>
          </div>
          <div className="bg-white border-2 border-blue-500 p-4 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">Fair</div>
            <div className="text-sm text-gray-600 font-semibold">No Lead Fees</div>
          </div>
          <div className="bg-white border-2 border-blue-500 p-4 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">Secure</div>
            <div className="text-sm text-gray-600 font-semibold">Escrow Payments</div>
          </div>
        </div>
      </section>

      {/* Building Your Profile */}
      <section>
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-gray-900">Building a winning profile</h3>
          <p className="mt-2 text-gray-600">Homeowners hire pros with complete profiles faster</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-xl font-semibold text-gray-900 mb-4">Required info</h4>
            <ul className="space-y-2 text-gray-600">
              <li>• <strong>Trade and specialties</strong> (plumbing, electrical, HVAC, etc.)</li>
              <li>• <strong>Service area</strong> (ZIP codes or radius)</li>
              <li>• <strong>Business name and contact info</strong></li>
              <li>• <strong>Licenses and certifications</strong> (mandatory)</li>
              <li>• <strong>Insurance documentation</strong> (mandatory)</li>
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-xl font-semibold text-gray-900 mb-4">Stand out</h4>
            <ul className="space-y-2 text-gray-600">
              <li>• Emergency availability (24/7, weekends, etc.)</li>
              <li>• Portfolio photos of past work</li>
              <li>• Professional bio (keep it short)</li>
              <li>• Specialty certifications (HVAC tech, master plumber, etc.)</li>
              <li>• Years of experience and completed jobs</li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section>
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h3>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          <details className="bg-white border border-gray-200 rounded-lg p-6">
            <summary className="font-semibold text-gray-900 cursor-pointer">How do I get job alerts?</summary>
            <p className="mt-3 text-gray-600">Once you create your profile and set your service area, you'll get instant push notifications when emergency jobs are posted that match your trade and location. Turn on notifications in your device settings.</p>
          </details>

          <details className="bg-white border border-gray-200 rounded-lg p-6">
            <summary className="font-semibold text-gray-900 cursor-pointer">How much does Rushr cost for pros?</summary>
            <p className="mt-3 text-gray-600">Rushr is free to join and browse jobs. You only pay a small fee when you complete a job through the platform. No lead fees, no subscriptions, no monthly charges.</p>
          </details>

          <details className="bg-white border border-gray-200 rounded-lg p-6">
            <summary className="font-semibold text-gray-900 cursor-pointer">How fast do I need to respond?</summary>
            <p className="mt-3 text-gray-600">Speed matters. Emergency jobs go to pros who respond fast with competitive quotes. Most winning bids are sent within 5-10 minutes of the job being posted. The faster you respond, the better your chances.</p>
          </details>

          <details className="bg-white border border-gray-200 rounded-lg p-6">
            <summary className="font-semibold text-gray-900 cursor-pointer">How do I get paid?</summary>
            <p className="mt-3 text-gray-600">When a homeowner accepts your bid and you complete the job, they approve completion in the app. Payment is released from escrow and deposited directly to your bank account via Stripe within 2-3 business days.</p>
          </details>

          <details className="bg-white border border-gray-200 rounded-lg p-6">
            <summary className="font-semibold text-gray-900 cursor-pointer">What if the homeowner doesn't approve completion?</summary>
            <p className="mt-3 text-gray-600">If there's a dispute, you can submit documentation (photos, messages, work details) and our support team will review and resolve it fairly. Escrow protects both parties.</p>
          </details>

          <details className="bg-white border border-gray-200 rounded-lg p-6">
            <summary className="font-semibold text-gray-900 cursor-pointer">Can I set my own rates?</summary>
            <p className="mt-3 text-gray-600">Absolutely. You send quotes with your own pricing. Homeowners compare multiple bids and choose based on price, ratings, availability, and distance. You're in full control of what you charge.</p>
          </details>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-8 text-center">
        <h3 className="text-2xl md:text-3xl font-bold text-white">
          Ready to win more emergency jobs?
        </h3>
        <p className="mt-3 text-base text-blue-50 max-w-2xl mx-auto">
          No lead fees. No subscriptions. Just instant alerts for real emergency work in your area.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button onClick={postOrAuth} className="bg-white hover:bg-gray-50 text-blue-700 px-8 py-3 rounded-lg font-bold shadow-lg transition-all">
            Browse Jobs Now
          </button>
          <Link href="/pro" className="border-2 border-white text-white hover:bg-white/10 px-8 py-3 rounded-lg font-bold transition-all">
            Learn More
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <div className="text-2xl mb-1">⚡</div>
            <div className="text-white font-semibold text-sm">Instant Job Alerts</div>
            <div className="text-blue-100 text-xs mt-1">Get notified the moment jobs are posted</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <div className="text-2xl mb-1">💰</div>
            <div className="text-white font-semibold text-sm">No Lead Fees</div>
            <div className="text-blue-100 text-xs mt-1">Only pay a small fee on completed jobs</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <div className="text-2xl mb-1">🔒</div>
            <div className="text-white font-semibold text-sm">Secure Payments</div>
            <div className="text-blue-100 text-xs mt-1">Escrow protection until job complete</div>
          </div>
        </div>
      </section>
    </div>
  )
}
