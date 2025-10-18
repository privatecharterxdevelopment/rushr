'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../../../../contexts/AuthContext'
import { supabase } from '../../../../lib/supabaseClient'
import LoadingSpinner from '../../../../components/LoadingSpinner'
import {
  ArrowLeft,
  MapPin,
  Clock,
  DollarSign,
  Calendar,
  User,
  Target,
  MessageSquare,
  CheckCircle2,
  Star,
  TrendingUp,
  Award,
  Shield,
  ThumbsUp,
  Eye,
  Filter,
  SortDesc
} from 'lucide-react'

interface JobWithBids {
  job_id: string
  job_title: string
  homeowner_id: string
  job_status: string
  bid_count: number
  bid_id: string
  contractor_id: string
  contractor_name: string
  bid_amount: number
  estimated_duration_hours: number | null
  description: string
  available_date: string | null
  materials_included: boolean
  warranty_months: number
  bid_status: string
  bid_submitted_at: string
  contractor_rating: number
  contractor_jobs_completed: number
}

export default function HomeownerBidsPage() {
  const { user, userProfile } = useAuth()
  const [jobsWithBids, setJobsWithBids] = useState<JobWithBids[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all')
  const [acceptingBid, setAcceptingBid] = useState<string | null>(null)

  const fetchJobsWithBids = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('homeowner_job_bids')
        .select('*')
        .eq('homeowner_id', user.id)
        .order('bid_submitted_at', { ascending: false })

      if (error) {
        console.error('Error fetching bids:', error)
      } else {
        setJobsWithBids(data || [])
      }
    } catch (err) {
      console.error('Error fetching bids:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return

    fetchJobsWithBids()

    // Set up real-time subscription for new bids
    const subscription = supabase
      .channel('homeowner_bids_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'job_bids',
          filter: `homeowner_id=eq.${user.id}`
        },
        () => {
          fetchJobsWithBids() // Refresh when bids change
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  // Redirect if not homeowner
  if (!user || !userProfile || userProfile.role !== 'homeowner') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Homeowner access required</h2>
          <Link href="/dashboard/contractor" className="btn-primary">Go to Dashboard</Link>
        </div>
      </div>
    )
  }

  const handleAcceptBid = async (bidId: string) => {
    if (!user || acceptingBid) return

    setAcceptingBid(bidId)

    try {
      const { error } = await supabase.rpc('accept_job_bid', {
        p_bid_id: bidId,
        p_homeowner_id: user.id
      })

      if (error) {
        alert('Error accepting bid: ' + error.message)
      } else {
        alert('Bid accepted successfully! The contractor has been notified.')
        fetchJobsWithBids() // Refresh to show updated status
      }
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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`
    }
  }

  const filteredBids = jobsWithBids.filter(bid => {
    if (filter === 'all') return true
    return bid.bid_status === filter
  })

  // Group bids by job
  const groupedBids = filteredBids.reduce((acc, bid) => {
    if (!acc[bid.job_id]) {
      acc[bid.job_id] = {
        job_title: bid.job_title,
        job_status: bid.job_status,
        bids: []
      }
    }
    acc[bid.job_id].bids.push(bid)
    return acc
  }, {} as Record<string, { job_title: string; job_status: string; bids: JobWithBids[] }>)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading your bids..." />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/dashboard/homeowner" className="btn btn-outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Bids</h1>
            <p className="text-gray-600">Review and accept bids from contractors</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Filter:</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="border rounded-lg px-3 py-1 text-sm"
            >
              <option value="all">All Bids</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="text-sm text-gray-600">
            {filteredBids.length} bid{filteredBids.length !== 1 ? 's' : ''} found
          </div>
        </div>
      </div>

      {/* Jobs with Bids */}
      {Object.keys(groupedBids).length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No bids found</h3>
          <p className="text-gray-600">
            {filter === 'all'
              ? 'You have no bids on your jobs yet.'
              : `No ${filter} bids found.`
            }
          </p>
          <Link href="/post-job" className="btn-primary mt-4">
            Post a New Job
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedBids).map(([jobId, jobData]) => (
            <div key={jobId} className="bg-white rounded-lg border shadow-sm">
              {/* Job Header */}
              <div className="border-b p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{jobData.job_title}</h2>
                    <div className="flex items-center gap-4 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        jobData.job_status === 'bidding' ? 'bg-blue-100 text-blue-700' :
                        jobData.job_status === 'bid_accepted' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {jobData.job_status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-500">
                        {jobData.bids.length} bid{jobData.bids.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <Link href={`/post-job?edit=${jobId}`} className="btn btn-outline text-sm">
                    <Eye className="h-4 w-4 mr-1" />
                    View Job
                  </Link>
                </div>
              </div>

              {/* Bids List */}
              <div className="divide-y">
                {jobData.bids.sort((a, b) => a.bid_amount - b.bid_amount).map((bid) => (
                  <div key={bid.bid_id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{bid.contractor_name}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span>{bid.contractor_rating.toFixed(1)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span>{bid.contractor_jobs_completed} jobs completed</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">${bid.bid_amount}</div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getBidStatusColor(bid.bid_status)}`}>
                          {bid.bid_status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mb-4">
                      <div className="space-y-2">
                        {bid.estimated_duration_hours && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>Estimated: {bid.estimated_duration_hours} hours</span>
                          </div>
                        )}
                        {bid.available_date && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>Available: {new Date(bid.available_date).toLocaleDateString()}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Shield className="h-4 w-4" />
                          <span>Warranty: {bid.warranty_months} months</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Target className="h-4 w-4" />
                          <span>Materials: {bid.materials_included ? 'Included' : 'Not included'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>Submitted: {formatTimeAgo(bid.bid_submitted_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Proposal Description:</h4>
                      <p className="text-gray-700 text-sm">{bid.description}</p>
                    </div>

                    {bid.bid_status === 'pending' && jobData.job_status === 'bidding' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptBid(bid.bid_id)}
                          disabled={acceptingBid === bid.bid_id}
                          className="btn-primary flex items-center gap-2"
                        >
                          {acceptingBid === bid.bid_id ? (
                            <>
                              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Accepting...
                            </>
                          ) : (
                            <>
                              <ThumbsUp className="h-4 w-4" />
                              Accept Bid
                            </>
                          )}
                        </button>
                        <button className="btn btn-outline">
                          Message Contractor
                        </button>
                      </div>
                    )}

                    {bid.bid_status === 'accepted' && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="font-medium">Bid Accepted</span>
                        </div>
                        <p className="text-green-600 text-sm mt-1">
                          This contractor has been selected for the job. They will contact you to coordinate the work.
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}