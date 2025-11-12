'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useAuth } from '../../../contexts/AuthContext'
import { supabase } from '../../../lib/supabaseClient'
import QuickBidModal from '../../../components/QuickBidModal'
import {
  ArrowLeft,
  MapPin,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Phone,
  Calendar,
  FileText,
  Image as ImageIcon
} from 'lucide-react'

const ProMap = dynamic(() => import('../../../components/ProMap'), { ssr: false })

export default function JobDetail() {
  const { user, userProfile } = useAuth()
  const { id } = useParams<{ id: string }>()
  const [openQB, setOpenQB] = useState(false)
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Fetch job from database
  useEffect(() => {
    async function fetchJob() {
      if (!id) return

      try {
        // Check if ID is a number (job_number) or UUID (backward compatibility)
        const isJobNumber = /^\d+$/.test(id)

        // Try to fetch from contractor_available_jobs first
        let { data, error } = await supabase
          .from('contractor_available_jobs')
          .select('*')
          .eq(isJobNumber ? 'job_number' : 'job_id', id)
          .single()

        // If not found, try homeowner_jobs
        if (error || !data) {
          const { data: homeownerJob, error: homeownerError } = await supabase
            .from('homeowner_jobs')
            .select('*')
            .eq(isJobNumber ? 'job_number' : 'id', id)
            .single()

          if (homeownerError || !homeownerJob) {
            console.error('Job not found:', error, homeownerError)
            setLoading(false)
            return
          }

          // Convert homeowner job to display format
          data = {
            job_id: homeownerJob.id,
            job_number: homeownerJob.job_number,
            title: homeownerJob.title,
            description: homeownerJob.description,
            category: homeownerJob.category,
            priority: homeownerJob.priority,
            status: homeownerJob.status,
            address: homeownerJob.address,
            latitude: homeownerJob.latitude,
            longitude: homeownerJob.longitude,
            zip_code: homeownerJob.zip_code,
            phone: homeownerJob.phone,
            estimated_cost: homeownerJob.estimated_cost,
            created_at: homeownerJob.created_at
          }
        }

        setJob(data)
      } catch (err) {
        console.error('Error fetching job:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchJob()
  }, [id])

  if (loading) return (
    <section className="section">
      <div className="container-max">
        <div className="card p-8 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/3 mx-auto mb-4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    </section>
  )

  if (!job) return (
    <section className="section">
      <div className="container-max">
        <div className="card p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Job not found</h2>
          <p className="text-slate-600 mb-6">The job you're looking for doesn't exist or has been removed.</p>
          <Link href="/jobs" className="btn btn-primary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Jobs
          </Link>
        </div>
      </div>
    </section>
  )

  const isContractor = user && userProfile?.role === 'contractor'
  const jobId = job.job_id || job.id
  const jobNumber = job.job_number
  const rehireURL = `/post-job?title=${encodeURIComponent(job.title)}&cat=${encodeURIComponent(job.category)}`

  // Convert priority to urgency score and color
  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'emergency':
        return { score: 10, color: 'text-red-600 bg-red-50 border-red-200', icon: '🚨', label: 'Emergency' }
      case 'high':
        return { score: 8, color: 'text-orange-600 bg-orange-50 border-orange-200', icon: '⚡', label: 'High Priority' }
      case 'medium':
        return { score: 5, color: 'text-yellow-600 bg-yellow-50 border-yellow-200', icon: '⚠️', label: 'Medium Priority' }
      default:
        return { score: 3, color: 'text-blue-600 bg-blue-50 border-blue-200', icon: 'ℹ️', label: 'Low Priority' }
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return { color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: CheckCircle, label: 'Completed' }
      case 'in_progress':
        return { color: 'text-blue-600 bg-blue-50 border-blue-200', icon: Clock, label: 'In Progress' }
      case 'cancelled':
        return { color: 'text-red-600 bg-red-50 border-red-200', icon: XCircle, label: 'Cancelled' }
      default:
        return { color: 'text-slate-600 bg-slate-50 border-slate-200', icon: Clock, label: 'Pending' }
    }
  }

  const priorityConfig = getPriorityConfig(job.priority)
  const statusConfig = getStatusConfig(job.status)
  const StatusIcon = statusConfig.icon

  // Category emoji mapping
  const categoryEmoji: Record<string, string> = {
    'plumbing': '🔧',
    'electrical': '⚡',
    'hvac': '❄️',
    'roofing': '🏠',
    'locksmith': '🔑',
    'appliance': '🔌',
    'water-damage': '💧',
    'auto': '🚗'
  }

  return (
    <section className="section bg-slate-50">
      <div className="container-max">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-emerald-600 font-medium transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Jobs
          </Link>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">{categoryEmoji[job.category] || '📋'}</span>
                <h1 className="text-3xl font-bold text-slate-900">{job.title}</h1>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${priorityConfig.color}`}>
                  <span>{priorityConfig.icon}</span>
                  {priorityConfig.label}
                </span>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${statusConfig.color}`}>
                  <StatusIcon className="h-3.5 w-3.5" />
                  {statusConfig.label}
                </span>
                {jobNumber && (
                  <span className="text-sm text-slate-500">Job #{jobNumber}</span>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {isContractor ? (
                <button
                  className="btn-primary flex items-center gap-2"
                  onClick={() => setOpenQB(true)}
                >
                  <DollarSign className="h-4 w-4" />
                  Submit Bid
                </button>
              ) : (
                <Link href={`/jobs/${jobNumber || jobId}/compare`} className="btn-primary flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  See Bids
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Job Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description Card */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                Job Description
              </h2>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                {job.description || 'No description provided.'}
              </p>
            </div>

            {/* Location Map */}
            {job.latitude && job.longitude ? (
              <div className="card p-0 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                  <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-emerald-600" />
                    Service Location
                  </h2>
                </div>
                <div className="h-[400px]">
                  <ProMap
                    centerZip={job.zip_code || '10001'}
                    category={job.category}
                    radiusMiles={0.5}
                    searchCenter={[Number(job.latitude), Number(job.longitude)]}
                    contractors={[]}
                  />
                </div>
                <div className="p-4 border-t border-slate-200 bg-white">
                  <div className="flex items-start gap-2 text-slate-700">
                    <MapPin className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span>{job.address}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-emerald-600" />
                  Service Location
                </h2>
                <div className="flex items-start gap-2 text-slate-700">
                  <MapPin className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <span>{job.address || 'Location not specified'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Job Info */}
          <div className="space-y-6">
            {/* Quick Info Card */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Job Details</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm text-slate-500">Posted</div>
                    <div className="font-medium text-slate-900">
                      {new Date(job.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                    <div className="text-sm text-slate-500">
                      {new Date(job.created_at).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>

                {job.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm text-slate-500">Contact</div>
                      <a href={`tel:${job.phone}`} className="font-medium text-emerald-600 hover:text-emerald-700">
                        {job.phone}
                      </a>
                    </div>
                  </div>
                )}

                {job.estimated_cost && (
                  <div className="flex items-start gap-3">
                    <DollarSign className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm text-slate-500">Estimated Budget</div>
                      <div className="font-medium text-slate-900">
                        ${parseFloat(job.estimated_cost).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm text-slate-500">Urgency Level</div>
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-slate-900">{priorityConfig.score}/10</div>
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            priorityConfig.score >= 8 ? 'bg-red-500' :
                            priorityConfig.score >= 5 ? 'bg-orange-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${priorityConfig.score * 10}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Card */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Category</h2>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                <span className="text-2xl">{categoryEmoji[job.category] || '📋'}</span>
                <span className="font-medium text-emerald-900 capitalize">{job.category}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Bid Modal */}
      {isContractor && (
        <QuickBidModal
          open={openQB}
          onClose={() => setOpenQB(false)}
          jobId={jobId}
          category={job.category}
        />
      )}
    </section>
  )
}
