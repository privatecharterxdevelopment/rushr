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
  Calendar,
  User,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MessageSquare,
  PlayCircle,
  CheckCircle,
  Eye,
  Filter,
  SortDesc
} from 'lucide-react'

interface ContractorJobWithBid {
  bid_id: string
  job_id: string
  job_title: string
  job_description: string
  job_category: string
  job_priority: string
  job_status: string
  job_address: string
  job_city: string
  job_state: string
  job_zip_code: string
  homeowner_id: string
  homeowner_name: string
  bid_amount: number
  bid_status: string
  bid_submitted_at: string
  estimated_duration_hours: number | null
  available_date: string | null
  materials_included: boolean
  warranty_months: number
  job_created_at: string
  job_scheduled_date: string | null
  job_completed_date: string | null
  final_cost: number | null
}

export default function ContractorJobsPage() {
  const { user, contractorProfile } = useProAuth()
  const [contractorJobs, setContractorJobs] = useState<ContractorJobWithBid[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'in_progress' | 'completed'>('all')
  const [startingJob, setStartingJob] = useState<string | null>(null)
  const [completingJob, setCompletingJob] = useState<string | null>(null)

  const fetchContractorJobs = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('contractor_job_details')
        .select('*')
        .eq('contractor_id', user.id)
        .order('bid_submitted_at', { ascending: false })

      if (error) {
        console.error('Error fetching contractor jobs:', error)
      } else {
        setContractorJobs(data || [])
      }
    } catch (err) {
      console.error('Error fetching contractor jobs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return

    fetchContractorJobs()

    // Set up real-time subscription for job updates
    const subscription = supabase
      .channel('contractor_job_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'job_bids',
          filter: `contractor_id=eq.${user.id}`
        },
        () => {
          fetchContractorJobs() // Refresh when jobs change
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  // Redirect if not contractor
  if (!user || !contractorProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Contractor access required</h2>
          <Link href="/pro" className="btn-primary">Go to Pro Dashboard</Link>
        </div>
      </div>
    )
  }

  const handleStartJob = async (jobId: string) => {
    if (!user || startingJob) return

    setStartingJob(jobId)

    try {
      const { error } = await supabase.rpc('start_job_work', {
        p_job_id: jobId,
        p_contractor_id: user.id
      })

      if (error) {
        alert('Error starting job: ' + error.message)
      } else {
        alert('Job started successfully!')
        fetchContractorJobs() // Refresh to show updated status
      }
    } catch (err) {
      console.error('Error starting job:', err)
      alert('Error starting job')
    } finally {
      setStartingJob(null)
    }
  }

  const handleCompleteJob = async (jobId: string) => {
    if (!user || completingJob) return

    setCompletingJob(jobId)

    try {
      const { error } = await supabase
        .from('homeowner_jobs')
        .update({
          status: 'completed',
          completed_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)
        .eq('contractor_id', user.id)

      if (error) {
        alert('Error completing job: ' + error.message)
      } else {
        alert('Job marked as completed!')
        fetchContractorJobs() // Refresh to show updated status
      }
    } catch (err) {
      console.error('Error completing job:', err)
      alert('Error completing job')
    } finally {
      setCompletingJob(null)
    }
  }

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'in_progress':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'bid_accepted':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 'bidding':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getBidStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
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

  const filteredJobs = contractorJobs.filter(job => {
    if (filter === 'all') return true
    if (filter === 'pending') return job.bid_status === 'pending'
    if (filter === 'accepted') return job.bid_status === 'accepted' && job.job_status === 'bid_accepted'
    if (filter === 'in_progress') return job.job_status === 'in_progress'
    if (filter === 'completed') return job.job_status === 'completed'
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading your jobs..." />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/dashboard/contractor" className="btn btn-outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Jobs</h1>
            <p className="text-gray-600">Track and manage your accepted jobs</p>
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
              <option value="all">All Jobs</option>
              <option value="pending">Pending Bids</option>
              <option value="accepted">Accepted</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="text-sm text-gray-600">
            {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
          </div>
        </div>
      </div>

      {/* Jobs List */}
      {filteredJobs.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
          <p className="text-gray-600">
            {filter === 'all'
              ? 'You haven\'t bid on any jobs yet.'
              : `No ${filter.replace('_', ' ')} jobs found.`
            }
          </p>
          <Link href="/jobs" className="btn-primary mt-4">
            Browse Available Jobs
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <div key={job.bid_id} className="bg-white rounded-lg border shadow-sm p-6">
              {/* Job Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {job.job_title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{job.job_city}, {job.job_state} {job.job_zip_code}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{job.homeowner_name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Bid {formatTimeAgo(job.bid_submitted_at)}</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Category:</span> {job.job_category} •
                    <span className="font-medium"> Priority:</span> {job.job_priority}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    ${job.bid_amount}
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getJobStatusColor(job.job_status)}`}>
                      {job.job_status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getBidStatusColor(job.bid_status)}`}>
                      Bid: {job.bid_status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Job Details */}
              <div className="grid md:grid-cols-2 gap-6 mb-4">
                <div className="space-y-2">
                  {job.estimated_duration_hours && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>Estimated: {job.estimated_duration_hours} hours</span>
                    </div>
                  )}
                  {job.available_date && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Available: {new Date(job.available_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  {job.job_scheduled_date && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Scheduled: {new Date(job.job_scheduled_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Materials: {job.materials_included ? 'Included' : 'Not included'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>Warranty: {job.warranty_months} months</span>
                  </div>
                  {job.final_cost && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign className="h-4 w-4" />
                      <span>Final Cost: ${job.final_cost}</span>
                    </div>
                  )}
                </div>
              </div>

              {job.job_description && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Job Description:</h4>
                  <p className="text-gray-700 text-sm bg-gray-50 rounded-lg p-3">
                    {job.job_description}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Link
                  href={`/jobs/${job.job_id}`}
                  className="btn btn-outline flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </Link>

                {job.bid_status === 'accepted' && job.job_status === 'bid_accepted' && (
                  <button
                    onClick={() => handleStartJob(job.job_id)}
                    disabled={startingJob === job.job_id}
                    className="btn-primary flex items-center gap-2"
                  >
                    {startingJob === job.job_id ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <PlayCircle className="h-4 w-4" />
                        Start Job
                      </>
                    )}
                  </button>
                )}

                {job.job_status === 'in_progress' && (
                  <button
                    onClick={() => handleCompleteJob(job.job_id)}
                    disabled={completingJob === job.job_id}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    {completingJob === job.job_id ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Completing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Mark Complete
                      </>
                    )}
                  </button>
                )}

                <button className="btn btn-outline flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Message Client
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}