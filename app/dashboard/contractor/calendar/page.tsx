'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useProAuth } from '../../../../contexts/ProAuthContext'
import { supabase } from '../../../../lib/supabaseClient'
import {
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  User,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Plus,
  Filter
} from 'lucide-react'

interface ScheduledJob {
  id: string
  title: string
  description: string
  category: string
  priority: string
  status: string
  address: string
  city: string
  state: string
  zip_code: string
  homeowner_id: string
  homeowner_name: string
  scheduled_date: string
  estimated_duration_hours: number
  bid_amount: number
  created_at: string
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function ContractorCalendarPage() {
  const { user, contractorProfile } = useProAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [scheduledJobs, setScheduledJobs] = useState<ScheduledJob[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState<ScheduledJob | null>(null)
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')

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

  const fetchScheduledJobs = async () => {
    if (!user) return
    try {
      // Get jobs where the contractor's bid was accepted and job has a scheduled date
      const { data, error } = await supabase
        .from('contractor_job_details')
        .select('*')
        .eq('contractor_id', user.id)
        .eq('bid_status', 'accepted')
        .not('job_scheduled_date', 'is', null)
        .order('job_scheduled_date', { ascending: true })

      if (error) {
        console.error('Error fetching scheduled jobs:', error)
      } else {
        const transformedJobs: ScheduledJob[] = (data || []).map(job => ({
          id: job.job_id,
          title: job.job_title,
          description: job.job_description || '',
          category: job.job_category || 'General',
          priority: job.job_priority || 'normal',
          status: job.job_status,
          address: job.job_address || '',
          city: job.job_city || '',
          state: job.job_state || '',
          zip_code: job.job_zip_code || '',
          homeowner_id: job.homeowner_id,
          homeowner_name: job.homeowner_name || 'Unknown',
          scheduled_date: job.job_scheduled_date,
          estimated_duration_hours: job.estimated_duration_hours || 2,
          bid_amount: job.bid_amount,
          created_at: job.job_created_at
        }))
        setScheduledJobs(transformedJobs)
      }
    } catch (err) {
      console.error('Error fetching scheduled jobs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchScheduledJobs()
  }, [user])

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty cells for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const getJobsForDate = (date: Date | null) => {
    if (!date) return []
    return scheduledJobs.filter(job => {
      const jobDate = new Date(job.scheduled_date)
      return jobDate.toDateString() === date.toDateString()
    })
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'bid_accepted':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'emergency':
        return 'border-l-4 border-red-500'
      case 'high':
        return 'border-l-4 border-orange-500'
      case 'medium':
        return 'border-l-4 border-yellow-500'
      default:
        return 'border-l-4 border-gray-300'
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const days = getDaysInMonth(currentDate)
  const today = new Date()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading your calendar...</p>
        </div>
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
            <h1 className="text-2xl font-bold text-gray-900">My Calendar</h1>
            <p className="text-gray-600">View and manage your scheduled jobs</p>
          </div>
        </div>

        {/* Calendar Controls */}
        <div className="flex items-center justify-between bg-white rounded-lg border p-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">View:</span>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as any)}
              className="border rounded-lg px-3 py-1 text-sm"
            >
              <option value="month">Month</option>
              <option value="week">Week</option>
              <option value="day">Day</option>
            </select>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg border shadow-sm">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b">
          {DAYS.map(day => (
            <div key={day} className="p-4 text-center font-medium text-gray-500 border-r last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const jobsForDay = getJobsForDate(day)
            const isToday = day && day.toDateString() === today.toDateString()
            const isCurrentMonth = day && day.getMonth() === currentDate.getMonth()

            return (
              <div
                key={index}
                className={`min-h-[120px] p-2 border-r border-b last:border-r-0 ${
                  !isCurrentMonth ? 'bg-gray-50' : ''
                } ${isToday ? 'bg-blue-50' : ''}`}
              >
                {day && (
                  <>
                    <div className={`text-sm font-medium mb-2 ${
                      isToday ? 'text-blue-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {day.getDate()}
                    </div>

                    <div className="space-y-1">
                      {jobsForDay.slice(0, 2).map(job => (
                        <div
                          key={job.id}
                          onClick={() => setSelectedJob(job)}
                          className={`text-xs p-2 rounded cursor-pointer hover:opacity-80 transition-opacity ${getPriorityColor(job.priority)}`}
                          style={{ backgroundColor: '#f3f4f6' }}
                        >
                          <div className="font-medium truncate">{job.title}</div>
                          <div className="text-gray-600 truncate">{job.homeowner_name}</div>
                          <div className="text-gray-500">{formatTime(job.scheduled_date)}</div>
                        </div>
                      ))}

                      {jobsForDay.length > 2 && (
                        <div className="text-xs text-gray-500 text-center py-1">
                          +{jobsForDay.length - 2} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Upcoming Jobs List */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Jobs</h2>
          <span className="text-sm text-gray-500">
            {scheduledJobs.length} scheduled job{scheduledJobs.length !== 1 ? 's' : ''}
          </span>
        </div>

        {scheduledJobs.length === 0 ? (
          <div className="bg-white rounded-lg border p-8 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No scheduled jobs</h3>
            <p className="text-gray-600 mb-4">Your accepted jobs will appear here once scheduled by homeowners</p>
            <Link href="/jobs" className="btn-primary">
              Browse Available Jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {scheduledJobs.slice(0, 5).map(job => (
              <div
                key={job.id}
                className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedJob(job)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{job.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{job.homeowner_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{job.city}, {job.state}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{job.estimated_duration_hours}h estimated</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Category:</span> {job.category} •
                      <span className="font-medium"> Priority:</span> {job.priority}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600 mb-2">
                      ${job.bid_amount}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(job.status)}`}>
                      {job.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  <span className="font-medium">Scheduled:</span> {' '}
                  {new Date(job.scheduled_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Job Detail Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">{selectedJob.title}</h2>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Client</h3>
                    <p className="text-gray-600">{selectedJob.homeowner_name}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Bid Amount</h3>
                    <p className="text-green-600 font-semibold">${selectedJob.bid_amount}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Scheduled Date & Time</h3>
                  <p className="text-gray-600">
                    {new Date(selectedJob.scheduled_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Location</h3>
                  <p className="text-gray-600">
                    {selectedJob.address && `${selectedJob.address}, `}
                    {selectedJob.city}, {selectedJob.state} {selectedJob.zip_code}
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600">{selectedJob.description || 'No description provided'}</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Category</h3>
                    <p className="text-gray-600">{selectedJob.category}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Priority</h3>
                    <p className="text-gray-600 capitalize">{selectedJob.priority}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Duration</h3>
                    <p className="text-gray-600">{selectedJob.estimated_duration_hours} hours</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Link
                    href={`/dashboard/contractor/jobs`}
                    className="btn-primary"
                    onClick={() => setSelectedJob(null)}
                  >
                    Manage Job
                  </Link>
                  <Link
                    href={`/dashboard/contractor/messages`}
                    className="btn btn-outline"
                    onClick={() => setSelectedJob(null)}
                  >
                    Message Client
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}