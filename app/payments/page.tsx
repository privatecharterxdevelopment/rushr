'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../../contexts/AuthContext'
import { useSearchParams } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'
import {
  ArrowLeft,
  CreditCard,
  Lock,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Calendar,
  User,
  Building
} from 'lucide-react'

interface PaymentJob {
  id: string
  title: string
  description: string
  category: string
  priority: string
  status: string
  contractor_id: string
  contractor_name: string
  final_cost: number
  completed_date: string
}

export default function PaymentPage() {
  const { user, userProfile } = useAuth()
  const searchParams = useSearchParams()
  const jobId = searchParams.get('job')

  const [job, setJob] = useState<PaymentJob | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank'>('card')

  // Mock payment form data
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    nameOnCard: '',
    billingAddress: '',
    billingCity: '',
    billingState: '',
    billingZip: ''
  })

  // Redirect if not homeowner
  if (!user || !userProfile || userProfile.role !== 'homeowner') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Homeowner access required</h2>
          <Link href="/dashboard/homeowner" className="btn-primary">Go to Dashboard</Link>
        </div>
      </div>
    )
  }

  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId || !user) return

      try {
        const { data, error } = await supabase
          .from('homeowner_jobs')
          .select(`
            *,
            contractor:user_profiles!contractor_id(name)
          `)
          .eq('id', jobId)
          .eq('homeowner_id', user.id)
          .eq('status', 'completed')
          .single()

        if (error) {
          setError(error.message)
          return
        }

        if (!data) {
          setError('Job not found or not eligible for payment')
          return
        }

        setJob({
          id: data.id,
          title: data.title,
          description: data.description || '',
          category: data.category || 'General',
          priority: data.priority || 'normal',
          status: data.status,
          contractor_id: data.contractor_id || '',
          contractor_name: data.contractor?.name || 'Unknown Contractor',
          final_cost: data.final_cost || 0,
          completed_date: data.completed_date || data.updated_at
        })
      } catch (err: any) {
        setError(err.message || 'Failed to load job details')
      } finally {
        setLoading(false)
      }
    }

    fetchJob()
  }, [jobId, user])

  const handleInputChange = (field: string, value: string) => {
    setPaymentData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePayment = async () => {
    if (!job || processing) return

    setProcessing(true)
    setError(null)

    try {
      // Mock Stripe integration - in production this would call Stripe API
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API call

      // Update job status to paid
      const { error } = await supabase
        .from('homeowner_jobs')
        .update({
          payment_status: 'paid',
          payment_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id)
        .eq('homeowner_id', user.id)

      if (error) {
        setError('Payment processed but failed to update job status: ' + error.message)
        return
      }

      // Redirect to success page
      window.location.href = `/payments/success?job=${job.id}&amount=${job.final_cost}`

    } catch (err: any) {
      setError(err.message || 'Payment failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const isFormValid = () => {
    if (paymentMethod === 'card') {
      return paymentData.cardNumber.length >= 16 &&
             paymentData.expiryMonth &&
             paymentData.expiryYear &&
             paymentData.cvv.length >= 3 &&
             paymentData.nameOnCard.trim() &&
             paymentData.billingAddress.trim()
    }
    return true
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p>Loading payment details...</p>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-800 mb-2">Payment Not Available</h2>
          <p className="text-red-600 mb-4">
            {error || 'This job is not available for payment or has already been paid.'}
          </p>
          <Link href="/dashboard/homeowner" className="btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/homeowner"
          className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-emerald-100">
            <CreditCard className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payment</h1>
            <p className="text-gray-600">Pay for completed service work</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Payment Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Payment Information</h2>

            {/* Payment Method Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    paymentMethod === 'card'
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <CreditCard className="h-5 w-5 text-gray-600 mb-2" />
                  <div className="font-medium text-gray-900">Credit/Debit Card</div>
                  <div className="text-sm text-gray-500">Visa, Mastercard, Amex</div>
                </button>
                <button
                  onClick={() => setPaymentMethod('bank')}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    paymentMethod === 'bank'
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Building className="h-5 w-5 text-gray-600 mb-2" />
                  <div className="font-medium text-gray-900">Bank Transfer</div>
                  <div className="text-sm text-gray-500">ACH, Wire Transfer</div>
                </button>
              </div>
            </div>

            {paymentMethod === 'card' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Card Number
                  </label>
                  <input
                    type="text"
                    value={paymentData.cardNumber}
                    onChange={(e) => handleInputChange('cardNumber', e.target.value.replace(/\D/g, '').slice(0, 16))}
                    placeholder="1234 5678 9012 3456"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Month
                    </label>
                    <select
                      value={paymentData.expiryMonth}
                      onChange={(e) => handleInputChange('expiryMonth', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="">MM</option>
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={(i + 1).toString().padStart(2, '0')}>
                          {(i + 1).toString().padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Year
                    </label>
                    <select
                      value={paymentData.expiryYear}
                      onChange={(e) => handleInputChange('expiryYear', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="">YYYY</option>
                      {Array.from({ length: 10 }, (_, i) => (
                        <option key={2024 + i} value={2024 + i}>
                          {2024 + i}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CVV
                    </label>
                    <input
                      type="text"
                      value={paymentData.cvv}
                      onChange={(e) => handleInputChange('cvv', e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="123"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name on Card
                  </label>
                  <input
                    type="text"
                    value={paymentData.nameOnCard}
                    onChange={(e) => handleInputChange('nameOnCard', e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Billing Address
                  </label>
                  <input
                    type="text"
                    value={paymentData.billingAddress}
                    onChange={(e) => handleInputChange('billingAddress', e.target.value)}
                    placeholder="123 Main St"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={paymentData.billingCity}
                      onChange={(e) => handleInputChange('billingCity', e.target.value)}
                      placeholder="New York"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      value={paymentData.billingState}
                      onChange={(e) => handleInputChange('billingState', e.target.value)}
                      placeholder="NY"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      value={paymentData.billingZip}
                      onChange={(e) => handleInputChange('billingZip', e.target.value)}
                      placeholder="10001"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'bank' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-800 mb-2">
                  <Building className="h-5 w-5" />
                  <span className="font-medium">Bank Transfer Information</span>
                </div>
                <p className="text-blue-700 text-sm">
                  Bank transfer options are not yet available. Please use a credit or debit card to complete your payment.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

            <div className="space-y-4 mb-6">
              <div>
                <h3 className="font-medium text-gray-900">{job.title}</h3>
                <div className="text-sm text-gray-600 mt-1">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>{job.contractor_name}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="h-3 w-3" />
                    <span>Completed {new Date(job.completed_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Service Cost</span>
                  <span>${job.final_cost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Processing Fee</span>
                  <span>${(job.final_cost * 0.029).toFixed(2)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold text-gray-900">
                    <span>Total</span>
                    <span>${(job.final_cost * 1.029).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handlePayment}
              disabled={!isFormValid() || processing || paymentMethod === 'bank'}
              className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Pay ${(job.final_cost * 1.029).toFixed(2)}
                </>
              )}
            </button>

            <div className="mt-4 text-center text-xs text-gray-500">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Lock className="h-3 w-3" />
                <span>Secure SSL encrypted payment</span>
              </div>
              <p>Your payment information is protected and secure</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}