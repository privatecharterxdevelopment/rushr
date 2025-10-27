'use client'

import React, { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  bidId: string
  jobId: string
  amount: number
  contractorName: string
  jobTitle: string
  homeownerId: string
  onPaymentSuccess: () => void
}

function PaymentForm({
  bidId,
  jobId,
  amount,
  contractorName,
  jobTitle,
  homeownerId,
  onSuccess,
  onClose
}: Omit<PaymentModalProps, 'isOpen'> & { onSuccess: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)

  // Create PaymentIntent on mount
  useEffect(() => {
    createPaymentIntent()
  }, [])

  const createPaymentIntent = async () => {
    try {
      const response = await fetch('/api/payments/create-hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bidId,
          homeownerId
        })
      })

      const data = await response.json()

      if (data.error) {
        setError(data.error)
        return
      }

      setClientSecret(data.clientSecret)
    } catch (err: any) {
      console.error('Error creating payment intent:', err)
      setError(err.message || 'Failed to initialize payment')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements || !clientSecret) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { error: submitError } = await elements.submit()
      if (submitError) {
        setError(submitError.message || 'Payment failed')
        setLoading(false)
        return
      }

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/jobs/${jobId}/track`
        },
        redirect: 'if_required'
      })

      if (confirmError) {
        setError(confirmError.message || 'Payment failed')
        setLoading(false)
        return
      }

      // Payment successful
      onSuccess()
    } catch (err: any) {
      console.error('Payment error:', err)
      setError(err.message || 'Payment failed')
      setLoading(false)
    }
  }

  const platformFee = Math.round(amount * 0.10 * 100) / 100
  const contractorPayout = amount - platformFee

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center border-b border-slate-200 pb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Secure Payment</h2>
        <p className="text-slate-600">Payment held in escrow until job completion</p>
      </div>

      {/* Payment Details */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-emerald-700 font-medium mb-1">Job</p>
            <p className="text-slate-900 font-semibold">{jobTitle}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-emerald-700 font-medium mb-1">Contractor</p>
            <p className="text-slate-900 font-semibold">{contractorName}</p>
          </div>
        </div>

        <div className="border-t border-emerald-200 pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-700">Bid Amount</span>
            <span className="font-semibold text-slate-900">${amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-700">Platform Fee (10%)</span>
            <span className="font-semibold text-slate-900">-${platformFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm border-t border-emerald-200 pt-2">
            <span className="text-slate-700">Contractor Receives</span>
            <span className="font-semibold text-emerald-700">${contractorPayout.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* How Escrow Works */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">How escrow payment works:</p>
            <ul className="space-y-1 text-blue-800">
              <li>• Payment is held securely until job completion</li>
              <li>• Both parties confirm when work is done</li>
              <li>• Funds released to contractor automatically</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Payment Form */}
      {!clientSecret ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <span className="ml-3 text-slate-600">Initializing secure payment...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <PaymentElement />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!stripe || loading}
              className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/25"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                `Pay $${amount.toFixed(2)}`
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default function PaymentModal(props: PaymentModalProps) {
  if (!props.isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={props.onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={props.onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="p-8">
              <Elements
                stripe={stripePromise}
                options={{
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#059669',
                      colorBackground: '#ffffff',
                      colorText: '#1e293b',
                      colorDanger: '#ef4444',
                      fontFamily: 'system-ui, sans-serif',
                      borderRadius: '8px'
                    }
                  }
                }}
              >
                <PaymentForm {...props} onSuccess={props.onPaymentSuccess} />
              </Elements>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
