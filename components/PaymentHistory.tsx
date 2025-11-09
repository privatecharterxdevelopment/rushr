'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Filter
} from 'lucide-react'

interface Transaction {
  transaction_id: string
  created_at: string
  type: string
  amount: number
  status: string
  description: string
  job_title?: string
  job_category?: string
  contractor_name?: string
  homeowner_name?: string
  payment_hold_status?: string
  homeowner_confirmed_complete?: boolean
  contractor_confirmed_complete?: boolean
}

interface PaymentStats {
  totalSpent?: number
  totalEarned?: number
  inEscrow: number
  pendingRelease: number
  transactionCount: number
}

export default function PaymentHistory({ userType }: { userType: 'homeowner' | 'contractor' }) {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<PaymentStats>({
    inEscrow: 0,
    pendingRelease: 0,
    transactionCount: 0
  })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'charge' | 'release' | 'hold' | 'refund'>('all')

  useEffect(() => {
    if (!user) return
    fetchTransactions()
  }, [user, userType])

  async function fetchTransactions() {
    try {
      setLoading(true)

      // Fetch transactions based on user type
      const viewName = userType === 'homeowner'
        ? 'homeowner_payment_history'
        : 'contractor_earnings_history'

      const { data, error } = await supabase
        .from(viewName)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      setTransactions(data || [])

      // Calculate stats
      const stats: PaymentStats = {
        inEscrow: 0,
        pendingRelease: 0,
        transactionCount: data?.length || 0
      }

      if (userType === 'homeowner') {
        stats.totalSpent = data?.reduce((sum, t) =>
          t.type === 'hold' || t.type === 'charge' ? sum + Math.abs(t.amount) : sum, 0
        ) || 0
      } else {
        stats.totalEarned = data?.reduce((sum, t) =>
          t.type === 'release' ? sum + t.amount : sum, 0
        ) || 0
      }

      // Count escrow and pending
      data?.forEach(t => {
        if (t.payment_hold_status === 'captured') {
          stats.inEscrow += Math.abs(t.amount)
          if (t.homeowner_confirmed_complete || t.contractor_confirmed_complete) {
            stats.pendingRelease += Math.abs(t.amount)
          }
        }
      })

      setStats(stats)

    } catch (error: any) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTransactions = filter === 'all'
    ? transactions
    : transactions.filter(t => t.type === filter)

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'charge':
      case 'hold':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case 'release':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'refund':
        return <TrendingUp className="h-4 w-4 text-blue-600" />
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'charge':
      case 'hold':
        return 'text-red-600'
      case 'release':
        return 'text-green-600'
      case 'refund':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; text: string }> = {
      completed: { color: 'bg-green-100 text-green-800', text: 'Completed' },
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      failed: { color: 'bg-red-100 text-red-800', text: 'Failed' },
      cancelled: { color: 'bg-gray-100 text-gray-800', text: 'Cancelled' }
    }

    const badge = badges[status] || badges.pending

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <img
          src="https://jtrxdcccswdwlritgstp.supabase.co/storage/v1/object/public/contractor-logos/RushrLogoAnimation.gif"
          alt="Loading..."
          className="w-8 h-8 object-contain"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {userType === 'homeowner' && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Spent</p>
                <p className="text-xl font-bold text-gray-900">
                  ${stats.totalSpent?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </div>
        )}

        {userType === 'contractor' && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Earned</p>
                <p className="text-xl font-bold text-gray-900">
                  ${stats.totalEarned?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-100">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">In Escrow</p>
              <p className="text-xl font-bold text-gray-900">
                ${stats.inEscrow.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Release</p>
              <p className="text-xl font-bold text-gray-900">
                ${stats.pendingRelease.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Transactions</p>
              <p className="text-xl font-bold text-gray-900">
                {stats.transactionCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('hold')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              filter === 'hold'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Escrow
          </button>
          <button
            onClick={() => setFilter('release')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              filter === 'release'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Released
          </button>
          <button
            onClick={() => setFilter('refund')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              filter === 'refund'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Refunds
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No transactions found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredTransactions.map((transaction) => (
              <div key={transaction.transaction_id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-gray-100">
                      {getTypeIcon(transaction.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">
                          {transaction.description}
                        </h4>
                        {getStatusBadge(transaction.status)}
                      </div>
                      {transaction.job_title && (
                        <p className="text-sm text-gray-600 mb-1">
                          Job: {transaction.job_title}
                          {transaction.job_category && ` • ${transaction.job_category}`}
                        </p>
                      )}
                      {(transaction.contractor_name || transaction.homeowner_name) && (
                        <p className="text-sm text-gray-600 mb-1">
                          {userType === 'homeowner' ? 'Contractor' : 'Homeowner'}:{' '}
                          {transaction.contractor_name || transaction.homeowner_name}
                        </p>
                      )}
                      {transaction.payment_hold_status && (
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1 text-xs">
                            {transaction.homeowner_confirmed_complete ? (
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                            ) : (
                              <Clock className="h-3 w-3 text-gray-400" />
                            )}
                            <span className="text-gray-600">Homeowner confirmed</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            {transaction.contractor_confirmed_complete ? (
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                            ) : (
                              <Clock className="h-3 w-3 text-gray-400" />
                            )}
                            <span className="text-gray-600">Contractor confirmed</span>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(transaction.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${getTypeColor(transaction.type)}`}>
                      {transaction.amount >= 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
