'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  CheckCircle2,
  Download,
  Home,
  MessageSquare,
  Calendar,
  DollarSign
} from 'lucide-react'

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const jobId = searchParams.get('job')
  const amount = searchParams.get('amount')

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null // Prevent hydration mismatch
  }

  return (
    <div className="min-h-screen bg-emerald-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600">
            Your payment has been processed successfully.
          </p>
        </div>

        {/* Payment Details */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Payment Summary</h2>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Amount Paid</span>
              <span className="font-medium text-gray-900">
                ${amount ? parseFloat(amount).toFixed(2) : '0.00'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Job ID</span>
              <span className="font-medium text-gray-900">
                {jobId || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Payment Date</span>
              <span className="font-medium text-gray-900">
                {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Payment Method</span>
              <span className="font-medium text-gray-900">Credit Card</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <button className="w-full flex items-center justify-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium text-sm">
              <Download className="w-4 h-4" />
              Download Receipt
            </button>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">What's Next?</h2>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 text-sm">Rate Your Experience</h3>
                <p className="text-gray-600 text-xs">
                  Help other homeowners by rating and reviewing your contractor.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 text-sm">Schedule Future Services</h3>
                <p className="text-gray-600 text-xs">
                  Book regular maintenance or future work with trusted contractors.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 text-sm">Warranty & Support</h3>
                <p className="text-gray-600 text-xs">
                  Your work is covered by our service guarantee and contractor warranty.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/dashboard/homeowner"
            className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <Home className="w-4 h-4" />
            Return to Dashboard
          </Link>

          <Link
            href="/post-job"
            className="w-full border border-emerald-600 text-emerald-600 py-3 px-4 rounded-lg hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            Post Another Job
          </Link>
        </div>

        {/* Support */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm mb-2">
            Need help? Contact our support team
          </p>
          <Link
            href="/contact"
            className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
          >
            Get Support
          </Link>
        </div>
      </div>
    </div>
  )
}