'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useProAuth } from '../../../../contexts/ProAuthContext'
import { supabase } from '../../../../lib/supabaseClient'
import LoadingSpinner from '../../../../components/LoadingSpinner'
import {
  ArrowLeft,
  MapPin,
  Clock,
  DollarSign,
  AlertCircle,
  MessageSquare,
  Send
} from 'lucide-react'

interface Job {
  id: string
  title: string
  description: string
  category: string
  priority: string
  status: string
  address: string
  zip_code: string
  phone: string
  homeowner_id: string
  created_at: string
}

export default function ContractorJobsPage() {
  const { user, contractorProfile } = useProAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [bidding, setBidding] = useState<string | null>(null)
  const [bidAmount, setBidAmount] = useState<Record<string, string>>({})
  const [bidMessage, setBidMessage] = useState<Record<string, string>>({})

  const fetchJobs = async () => {
    if (!user) return
    try {
      // Fetch all pending emergency jobs
      const { data, error } = await supabase
        .from('homeowner_jobs')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching jobs:', error)
      } else {
        setJobs(data || [])
      }
    } catch (err) {
      console.error('Error fetching jobs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return
    fetchJobs()
  }, [user])

  const handleSubmitBid = async (job: Job) => {
    if (!user || !contractorProfile) return

    const amount = bidAmount[job.id]
    const message = bidMessage[job.id]

    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid bid amount')
      return
    }

    setBidding(job.id)

    try {
      const { error } = await supabase
        .from('job_bids')
        .insert([{
          job_id: job.id,
          contractor_id: user.id,
          homeowner_id: job.homeowner_id,
          bid_amount: parseFloat(amount),
          message: message || null,
          status: 'pending'
        }])

      if (error) {
        console.error('Error submitting bid:', error)
        alert('Failed to submit bid. Please try again.')
      } else {
        alert('Bid submitted successfully!')
        setBidAmount(prev => ({ ...prev, [job.id]: '' }))
        setBidMessage(prev => ({ ...prev, [job.id]: '' }))
      }
    } catch (err) {
      console.error('Error submitting bid:', err)
      alert('Failed to submit bid. Please try again.')
    } finally {
      setBidding(null)
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
          href="/dashboard/contractor"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Available Jobs</h1>
        <p className="text-slate-600 mt-1">Find and bid on emergency jobs in your area</p>
      </div>

      {/* Jobs List */}
      {jobs.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg">
          <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600">No available jobs at the moment</p>
          <p className="text-sm text-slate-500 mt-1">Check back soon for new opportunities</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              {/* Job Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold text-slate-900">{job.title}</h3>
                    {job.priority === 'emergency' && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                        EMERGENCY
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600">{job.description}</p>
                </div>
              </div>

              {/* Job Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pb-4 border-b border-slate-200">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="h-4 w-4" />
                  <span>{job.address || job.zip_code}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock className="h-4 w-4" />
                  <span>{new Date(job.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="capitalize">{job.category}</span>
                </div>
              </div>

              {/* Bid Form */}
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Your Bid Amount ($)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        type="number"
                        placeholder="Enter amount"
                        value={bidAmount[job.id] || ''}
                        onChange={(e) => setBidAmount(prev => ({ ...prev, [job.id]: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Message (Optional)
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <textarea
                      placeholder="Add a message to homeowner..."
                      value={bidMessage[job.id] || ''}
                      onChange={(e) => setBidMessage(prev => ({ ...prev, [job.id]: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                    />
                  </div>
                </div>

                <button
                  onClick={() => handleSubmitBid(job)}
                  disabled={bidding === job.id}
                  className="w-full md:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {bidding === job.id ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Bid
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
