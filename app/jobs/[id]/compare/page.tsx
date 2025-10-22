'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuth } from '../../../../contexts/AuthContext'
import { supabase } from '../../../../lib/supabaseClient'

interface Bid {
  id: string
  job_id: string
  contractor_id: string
  bid_amount: number | null
  message: string | null
  status: string
  created_at: string
  contractor_name?: string
  contractor_business_name?: string
}

interface Job {
  id: string
  title: string
  description: string
}

export default function CompareBids(){
  const { user } = useAuth()
  const { id } = useParams<{id:string}>()
  const [bids, setBids] = useState<Bid[]>([])
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [accepting, setAccepting] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !id) return

      try {
        // Fetch job details
        const { data: jobData, error: jobError } = await supabase
          .from('homeowner_jobs')
          .select('id, title, description')
          .eq('id', id)
          .eq('homeowner_id', user.id)
          .single()

        if (jobError) {
          setError('Job not found or access denied')
          setLoading(false)
          return
        }

        setJob(jobData)

        // Fetch all bids for this job
        const { data: bidsData, error: bidsError } = await supabase
          .from('job_bids')
          .select('*')
          .eq('job_id', id)
          .eq('homeowner_id', user.id)
          .order('bid_amount', { ascending: true })

        if (bidsError) {
          setError(bidsError.message)
          setLoading(false)
          return
        }

        // Enrich bids with contractor info
        const enrichedBids = await Promise.all(
          (bidsData || []).map(async (bid) => {
            const { data: contractorData } = await supabase
              .from('pro_contractors')
              .select('name, business_name')
              .eq('id', bid.contractor_id)
              .single()

            return {
              ...bid,
              contractor_name: contractorData?.name,
              contractor_business_name: contractorData?.business_name
            }
          })
        )

        setBids(enrichedBids)
      } catch (err: any) {
        setError(err.message || 'Failed to load bids')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, id])

  if (loading) {
    return (
      <section className="section">
        <div className="card p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
            <span className="ml-2">Loading bids...</span>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="section">
        <div className="card p-6 bg-red-50 border-red-200">
          <p className="text-red-700">Error: {error}</p>
        </div>
      </section>
    )
  }

  const handleAcceptBid = async (bidId: string) => {
    if (!user || accepting) return

    const bid = bids.find(b => b.id === bidId)
    if (!bid || bid.bid_amount == null) {
      alert('Invalid bid')
      return
    }

    setAccepting(bidId)

    try {
      // Update bid status
      const { error: bidError } = await supabase
        .from('job_bids')
        .update({ status: 'accepted' })
        .eq('id', bidId)

      if (bidError) {
        alert('Error accepting bid: ' + bidError.message)
        setAccepting(null)
        return
      }

      // Update job status and final cost
      const { error: jobError } = await supabase
        .from('homeowner_jobs')
        .update({
          status: 'in_progress',
          final_cost: bid.bid_amount
        })
        .eq('id', id)

      if (jobError) {
        console.error('Error updating job:', jobError)
      }

      // Redirect to Stripe payment page with escrow amount
      const amount = bid.bid_amount
      const jobTitle = job?.title || 'Job'
      window.location.href = `/payments/checkout?job_id=${id}&amount=${amount}&description=${encodeURIComponent(jobTitle)}&type=escrow`
    } catch (err) {
      console.error('Error accepting bid:', err)
      alert('Failed to accept bid')
      setAccepting(null)
    }
  }

  if (bids.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Compare Bids</h1>
          <Link href="/dashboard/homeowner" className="px-4 py-2 text-emerald-600 hover:text-emerald-700 font-medium">
            Back to Dashboard
          </Link>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
          <p className="text-slate-600">No bids available for this job yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Compare Bids</h1>
          <p className="text-slate-600 mt-1">{job?.title}</p>
        </div>
        <Link href="/dashboard/homeowner" className="px-4 py-2 text-emerald-600 hover:text-emerald-700 font-medium">
          Back to Dashboard
        </Link>
      </div>

      <div className="space-y-4">
        {bids.map((bid) => (
          <div key={bid.id} className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">
                  {bid.contractor_business_name || bid.contractor_name || `Contractor ${bid.contractor_id.substring(0, 8)}`}
                </h3>
                <p className="text-sm text-slate-500 mt-1">Submitted {new Date(bid.created_at).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-emerald-600">
                  ${bid.bid_amount != null ? bid.bid_amount.toFixed(2) : '0.00'}
                </p>
                <p className="text-sm text-slate-500">Bid Amount</p>
              </div>
            </div>

            {bid.message && (
              <div className="mb-4 p-4 bg-slate-50 rounded-lg">
                <p className="text-sm font-medium text-slate-700 mb-1">Message:</p>
                <p className="text-slate-600">{bid.message}</p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  bid.status === 'accepted' ? 'bg-green-100 text-green-700' :
                  bid.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                </span>
              </div>

              {bid.status === 'pending' && (
                <button
                  onClick={() => handleAcceptBid(bid.id)}
                  disabled={accepting === bid.id}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {accepting === bid.id ? 'Accepting...' : 'Accept Bid'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
