'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import LoadingSpinner from '../../components/LoadingSpinner'
import {
  ArrowLeft,
  Clock,
  Calendar,
  DollarSign,
  FileText,
  Plus,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react'

interface Job {
  id: string
  title: string
  status: string
  category: string
  priority: string
  created_at: string
  scheduled_date: string | null
  completed_date: string | null
  final_cost: number | null
  description: string | null
}

export default function History() {
  const { user, userProfile } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const fetchJobs = async () => {
      try {
        console.log('Fetching job history for user:', user.id)
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('homeowner_id', user.id)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching jobs:', error)
          setError(error.message)
          return
        }

        console.log('Fetched jobs:', data)
        setJobs(data || [])
      } catch (err: any) {
        console.error('Unexpected error:', err)
        setError(err.message || 'Failed to load job history')
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()
  }, [user])

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Please sign in to view job history</h2>
          <Link href="/?auth=signin" className="btn-primary">Sign In</Link>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4" />
      case 'confirmed': return <Clock className="h-4 w-4" />
      case 'pending': return <AlertCircle className="h-4 w-4" />
      case 'cancelled': return <XCircle className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/homeowner"
            className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900">
                <FileText className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Job History</h1>
                <p className="text-slate-600 dark:text-slate-400">View your posted jobs and service history</p>
              </div>
            </div>

            <Link
              href="/post-job"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              Post Service
            </Link>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <span className="text-red-700 dark:text-red-300">{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" text="Loading your job history..." color="emerald" />
          </div>
        ) : jobs.length === 0 ? (
          /* No Jobs State */
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
            <FileText className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Currently no jobs posted
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
              You haven't posted any emergency services yet. Start by posting your first service request to connect with trusted contractors.
            </p>
            <Link
              href="/post-job"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              Post a Service
            </Link>
          </div>
        ) : (
          /* Jobs List */
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      {job.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                      </div>
                      {job.scheduled_date && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>Scheduled {new Date(job.scheduled_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      {job.final_cost && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-medium">${job.final_cost.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      <span className="font-medium">Category:</span> {job.category || 'General'} •
                      <span className="font-medium"> Priority:</span> {job.priority || 'Normal'}
                    </div>
                  </div>

                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(job.status)}`}>
                    {getStatusIcon(job.status)}
                    <span className="capitalize">{job.status.replace('_', ' ')}</span>
                  </div>
                </div>

                {job.description && (
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                      Description:
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{job.description}</p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Link
                    href={`/jobs/${job.id}`}
                    className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                  >
                    View Details
                  </Link>
                  <Link
                    href={`/dashboard/homeowner/bids?job=${job.id}`}
                    className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    View Bids
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {jobs.length > 0 && (
          <div className="mt-8 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-6">
            <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-3">
              Your Service History
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-lg font-semibold text-emerald-600">{jobs.length}</div>
                <div className="text-emerald-800 dark:text-emerald-200">Total Jobs</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-emerald-600">
                  {jobs.filter(j => j.status === 'completed').length}
                </div>
                <div className="text-emerald-800 dark:text-emerald-200">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-emerald-600">
                  {jobs.filter(j => j.status === 'pending').length}
                </div>
                <div className="text-emerald-800 dark:text-emerald-200">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-emerald-600">
                  {jobs.filter(j => j.priority === 'emergency').length}
                </div>
                <div className="text-emerald-800 dark:text-emerald-200">Emergency</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
