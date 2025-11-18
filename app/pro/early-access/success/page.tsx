'use client'

import Link from 'next/link'
import { CheckCircle, ArrowRight, Mail } from 'lucide-react'

export default function EarlyAccessSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">

        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-8 md:p-12 text-center">

          {/* Success Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-6">
            <CheckCircle className="h-12 w-12 text-emerald-600" />
          </div>

          {/* Headline */}
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            You're on the List!
          </h1>

          <p className="text-lg text-slate-600 mb-8 max-w-lg mx-auto">
            Thank you for your interest in Rushr Pro. We'll send you an email as soon as we're ready to onboard you with your <strong className="text-slate-900">3 months free access</strong>.
          </p>

          {/* What's Next */}
          <div className="bg-blue-50 rounded-xl p-6 mb-8 text-left">
            <div className="flex items-start gap-3 mb-4">
              <Mail className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">What happens next?</h3>
                <p className="text-sm text-slate-600">
                  We'll send you an email with your exclusive early access link when Rushr Pro is ready to launch.
                  You'll be among the first contractors to access the platform.
                </p>
              </div>
            </div>
          </div>

          {/* Benefits Reminder */}
          <div className="mb-8">
            <h3 className="font-semibold text-slate-900 mb-4">As an early access member, you'll get:</h3>
            <div className="grid md:grid-cols-2 gap-4 text-left">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-600"><strong className="text-slate-900">3 months free</strong> full access</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-600">Priority access to the platform</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-600">Exclusive founding member badge</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-600">Direct access to founders</span>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/pro"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-lg shadow-blue-500/30"
            >
              Learn More About Rushr Pro
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Go to Homepage
            </Link>
          </div>

          {/* Social Proof */}
          <p className="mt-8 text-sm text-slate-500">
            Check your email inbox (and spam folder) for our welcome message.
          </p>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-8">
          <p className="text-sm text-slate-600">
            Have questions?{' '}
            <a href="mailto:support@rushr.com" className="text-blue-600 hover:text-blue-700 font-medium">
              Contact our team
            </a>
          </p>
        </div>

      </div>
    </div>
  )
}
