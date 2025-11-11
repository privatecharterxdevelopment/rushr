'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useProAuth } from '../../../../contexts/ProAuthContext'
import { supabase } from '../../../../lib/supabaseClient'
import LoadingSpinner from '../../../../components/LoadingSpinner'
import {
  ArrowLeft,
  CreditCard,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Calendar,
  Download,
  ExternalLink,
  AlertCircle,
  Banknote,
  Receipt,
  Wallet
} from 'lucide-react'

interface Transaction {
  id: string
  job_id: string
  job_title: string
  amount: number
  status: 'pending' | 'completed' | 'failed'
  created_at: string
  paid_at?: string
  homeowner_name: string
}

export default function ContractorBillingPage() {
  const { user, contractorProfile } = useProAuth()
  const [loading, setLoading] = useState(true)
  const [stripeConnectStatus, setStripeConnectStatus] = useState<any>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState({
    totalEarnings: 0,
    pendingPayouts: 0,
    completedPayouts: 0,
    thisMonthEarnings: 0
  })

  useEffect(() => {
    const loadData = async () => {
      if (!user) return

      try {
        // Check Stripe Connect status
        const stripeResponse = await fetch('/api/stripe/connect/check-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contractorId: user.id })
        })

        if (stripeResponse.ok) {
          const stripeData = await stripeResponse.json()
          setStripeConnectStatus(stripeData)
        }

        // Load transactions (mock data for now - replace with real data)
        // TODO: Create a transactions table and fetch real payment data
        const mockTransactions: Transaction[] = []
        setTransactions(mockTransactions)

        // Calculate stats
        const total = mockTransactions.reduce((sum, t) => sum + (t.status === 'completed' ? t.amount : 0), 0)
        const pending = mockTransactions.reduce((sum, t) => sum + (t.status === 'pending' ? t.amount : 0), 0)
        const completed = mockTransactions.filter(t => t.status === 'completed').length

        const now = new Date()
        const thisMonth = mockTransactions
          .filter(t => {
            const date = new Date(t.created_at)
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear() && t.status === 'completed'
          })
          .reduce((sum, t) => sum + t.amount, 0)

        setStats({
          totalEarnings: total,
          pendingPayouts: pending,
          completedPayouts: completed,
          thisMonthEarnings: thisMonth
        })

      } catch (error) {
        console.error('Error loading billing data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  const handleCompleteStripeSetup = async () => {
    try {
      const response = await fetch('/api/stripe/connect/onboarding-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractorId: user?.id })
      })

      const data = await response.json()

      if (data.success && data.url) {
        window.location.href = data.url
      } else {
        alert('Failed to generate onboarding link. Please try again.')
      }
    } catch (error) {
      console.error('Error generating Stripe link:', error)
      alert('An error occurred. Please try again.')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full">
          <CheckCircle className="h-3 w-3" />
          Paid
        </span>
      case 'pending':
        return <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
          <Clock className="h-3 w-3" />
          Pending
        </span>
      case 'failed':
        return <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
          <XCircle className="h-3 w-3" />
          Failed
        </span>
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/contractor"
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Billing & Payments</h1>
            <p className="text-sm text-slate-600 mt-1">Manage your Stripe account and view transaction history</p>
          </div>
        </div>
      </div>

      {/* Stripe Connect Status */}
      <div className="bg-white rounded-2xl border border-blue-200 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <CreditCard className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Stripe Connect Account</h2>

            {!stripeConnectStatus?.connected ? (
              <div className="space-y-3">
                <p className="text-slate-600">
                  Connect your Stripe account to receive payments from homeowners. Stripe handles all payment processing securely.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCompleteStripeSetup}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Connect Stripe Account
                  </button>
                </div>
                <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-800">
                    You'll be redirected to Stripe's secure onboarding to verify your identity and bank account information.
                  </p>
                </div>
              </div>
            ) : stripeConnectStatus?.details_submitted && stripeConnectStatus?.charges_enabled ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <span className="text-emerald-700 font-medium">Account Active</span>
                </div>
                <p className="text-slate-600">
                  Your Stripe account is connected and ready to receive payments.
                </p>
                {stripeConnectStatus?.account_id && (
                  <p className="text-xs text-slate-500">
                    Account ID: {stripeConnectStatus.account_id}
                  </p>
                )}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleCompleteStripeSetup}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Update Bank Details
                  </button>
                  <a
                    href={`https://dashboard.stripe.com/${stripeConnectStatus.account_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open Stripe Dashboard
                  </a>
                </div>
                <div className="flex items-start gap-2 p-3 bg-emerald-50 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-emerald-800">
                    <p className="font-medium mb-1">Bank Account Management:</p>
                    <p>Click "Update Bank Details" to change your IBAN/bank account, or use "Open Stripe Dashboard" for full account management including payout schedules and transaction history.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <span className="text-amber-700 font-medium">Setup Incomplete</span>
                </div>
                <p className="text-slate-600">
                  Your Stripe account setup is incomplete. Please complete the onboarding process.
                </p>
                <button
                  onClick={handleCompleteStripeSetup}
                  className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Complete Stripe Setup
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">Total Earnings</span>
            <DollarSign className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ${stats.totalEarnings.toFixed(2)}
          </div>
          <p className="text-xs text-slate-500 mt-1">All time</p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">This Month</span>
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ${stats.thisMonthEarnings.toFixed(2)}
          </div>
          <p className="text-xs text-slate-500 mt-1">{new Date().toLocaleString('default', { month: 'long' })}</p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">Pending Payouts</span>
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ${stats.pendingPayouts.toFixed(2)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Processing</p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">Completed</span>
            <CheckCircle className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {stats.completedPayouts}
          </div>
          <p className="text-xs text-slate-500 mt-1">Transactions</p>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Receipt className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900">Transaction History</h2>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        <div className="p-6">
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="h-12 w-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">No transactions yet</p>
              <p className="text-sm text-slate-500 mt-1">
                Complete jobs and receive payments to see your transaction history here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-medium text-slate-900">{transaction.job_title}</h3>
                      {getStatusBadge(transaction.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <span>{transaction.homeowner_name}</span>
                      <span>•</span>
                      <span>{new Date(transaction.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-slate-900">
                      ${transaction.amount.toFixed(2)}
                    </div>
                    {transaction.paid_at && (
                      <div className="text-xs text-slate-500">
                        Paid {new Date(transaction.paid_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">Payment Information</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>Payments are processed securely through Stripe</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>Funds are typically available 2-3 business days after job completion</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>You can update your bank account information in your Stripe dashboard</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
