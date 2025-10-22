'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../../../../contexts/AuthContext'
import { supabase } from '../../../../lib/supabaseClient'
import LoadingSpinner from '../../../../components/LoadingSpinner'
import {
  ArrowLeft,
  DollarSign,
  Clock,
  User,
  CheckCircle2,
  MessageSquare,
  Star
} from 'lucide-react'

interface Bid {
  id: string
  job_id: string
  contractor_id: string
  bid_amount: number | null
  message: string | null
  status: string
  created_at: string
  job_title?: string
  contractor_name?: string
}

export default function HomeownerBidsPage() {
  const { user, userProfile } = useAuth()
  const [bids, setBids] = useState<Bid[]>([])
  const [loading, setLoading] = useState(true)
  const [acceptingBid, setAcceptingBid] = useState<string | null>(null)

  const fetchBids = async () => {
    if (!user) return
    try {
      // Fetch bids with job and contractor details
      const { data: bidsData, error } = await supabase
        .from('job_bids')
        .select('*')
        .eq('homeowner_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching bids:', error)
        setLoading(false)
        return
      }

      // Fetch related job and contractor info for each bid
      const enrichedBids = await Promise.all(
        (bidsData || []).map(async (bid) => {
          // Get job title
          const { data: jobData, error: jobError } = await supabase
            .from('homeowner_jobs')
            .select('title')
            .eq('id', bid.job_id)
            .single()

          if (jobError) {
            console.error('Error fetching job for bid:', bid.id, jobError)
          }

          // Get contractor name - contractor_id is the auth user id, so look up by user_id
          const { data: contractorData, error: contractorError } = await supabase
            .from('pro_contractors')
            .select('name, business_name')
            .eq('user_id', bid.contractor_id)
            .single()

          if (contractorError) {
            console.error('Error fetching contractor for bid:', bid.id, bid.contractor_id, contractorError)
          }

          return {
            ...bid,
            job_title: jobData?.title || 'Unknown Job',
            contractor_name: contractorData?.business_name || contractorData?.name || 'Unknown Contractor'
          }
        })
      )

      setBids(enrichedBids)
    } catch (err) {
      console.error('Error fetching bids:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return
    fetchBids()
  }, [user])

  const handleAcceptBid = async (bid: Bid) => {
    if (!user || acceptingBid) return

    setAcceptingBid(bid.id)

    try {
      // Update bid status to accepted
      const { error: bidError } = await supabase
        .from('job_bids')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', bid.id)

      if (bidError) {
        alert('Error accepting bid: ' + bidError.message)
        setAcceptingBid(null)
        return
      }

      // Update job status to in_progress
      const { error: jobError } = await supabase
        .from('homeowner_jobs')
        .update({ status: 'in_progress' })
        .eq('id', bid.job_id)

      if (jobError) {
        console.error('Error updating job status:', jobError)
      }

      alert('Bid accepted successfully!')
      fetchBids() // Refresh
    } catch (err) {
      console.error('Error accepting bid:', err)
      alert('Error accepting bid')
    } finally {
      setAcceptingBid(null)
    }
  }

  const getBidStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'accepted':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/homeowner"
          className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Bids on Your Jobs</h1>
        <p className="text-slate-600 mt-1">Review and accept bids from contractors</p>
      </div>

      {/* Bids List */}
      {bids.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg">
          <MessageSquare className="h-12 w-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600">No bids yet</p>
          <p className="text-sm text-slate-500 mt-1">Contractors will bid on your posted jobs</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bids.map((bid) => (
            <div key={bid.id} className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              {/* Bid Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-slate-900 mb-1">
                    {bid.job_title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <User className="h-4 w-4" />
                    <span>Bid by: {bid.contractor_name}</span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getBidStatusColor(bid.status)}`}>
                  {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                </span>
              </div>

              {/* Bid Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pb-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-sm text-slate-500">Bid Amount</p>
                    <p className="text-lg font-semibold text-slate-900">
                      ${bid.bid_amount != null ? bid.bid_amount.toFixed(2) : '0.00'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-slate-500">Submitted</p>
                    <p className="text-sm text-slate-700">{new Date(bid.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Bid Message */}
              {bid.message && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-slate-700 mb-1">Message from Contractor:</p>
                  <p className="text-slate-600 bg-slate-50 p-3 rounded-lg">{bid.message}</p>
                </div>
              )}

              {/* Actions */}
              {bid.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAcceptBid(bid)}
                    disabled={acceptingBid === bid.id}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {acceptingBid === bid.id ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                        Accepting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Accept Bid
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
