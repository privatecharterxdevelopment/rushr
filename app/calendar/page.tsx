'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '../../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Clock,
  MapPin,
  User,
  Phone,
  AlertCircle,
  CheckCircle2,
  Calendar1,
  CalendarDays
} from 'lucide-react'

interface Job {
  id: string
  title: string
  status: string
  category: string
  priority: string
  scheduled_date: string | null
  contractor_id: string | null
  created_at: string
  final_cost: number | null
  description: string | null
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

function getStatusColor(status: string) {
  switch (status) {
    case 'confirmed': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200'
    default: return 'bg-slate-100 text-slate-800 border-slate-200'
  }
}

function getPriorityIcon(priority: string) {
  if (priority === 'emergency') {
    return <AlertCircle className="h-4 w-4 text-red-600" />
  }
  return <CheckCircle2 className="h-4 w-4 text-emerald-600" />
}

export default function CalendarPage() {
  const { user, userProfile } = useAuth()
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load jobs on component mount
  React.useEffect(() => {
    if (!user) return

    const fetchJobs = async () => {
      try {
        console.log('Fetching jobs for user:', user.id)
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
        setError(err.message || 'Failed to load calendar')
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
          <h2 className="text-xl font-semibold mb-4">Please sign in to view calendar</h2>
          <Link href="/?auth=signin" className="btn-primary">Sign In</Link>
        </div>
      </div>
    )
  }

  // Get calendar data
  const { year, month } = useMemo(() => ({
    year: currentDate.getFullYear(),
    month: currentDate.getMonth()
  }), [currentDate])

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  // Filter jobs for current month
  const monthJobs = useMemo(() => {
    return jobs.filter(job => {
      if (!job.scheduled_date) return false
      const jobDate = new Date(job.scheduled_date)
      return jobDate.getMonth() === month && jobDate.getFullYear() === year
    })
  }, [jobs, month, year])

  // Group jobs by date
  const jobsByDate = useMemo(() => {
    const grouped: { [key: string]: Job[] } = {}
    monthJobs.forEach(job => {
      if (job.scheduled_date) {
        const date = new Date(job.scheduled_date).getDate()
        const key = date.toString()
        if (!grouped[key]) grouped[key] = []
        grouped[key].push(job)
      }
    })
    return grouped
  }, [monthJobs])

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Generate calendar grid
  const calendarDays = []

  // Previous month trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i
    calendarDays.push({
      day,
      isCurrentMonth: false,
      isToday: false,
      jobs: []
    })
  }

  // Current month days
  const today = new Date()
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
    calendarDays.push({
      day,
      isCurrentMonth: true,
      isToday,
      jobs: jobsByDate[day.toString()] || []
    })
  }

  // Next month leading days
  const remainingCells = 42 - calendarDays.length
  for (let day = 1; day <= remainingCells; day++) {
    calendarDays.push({
      day,
      isCurrentMonth: false,
      isToday: false,
      jobs: []
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
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
                <CalendarIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Calendar</h1>
                <p className="text-slate-600 dark:text-slate-400">View your scheduled services and appointments</p>
              </div>
            </div>

            <button
              onClick={goToToday}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              Today
            </button>
          </div>
        </div>

        {/* Error/Loading States */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <span className="text-red-700 dark:text-red-300">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <img
              src="https://jtrxdcccswdwlritgstp.supabase.co/storage/v1/object/public/contractor-logos/RushrLogoAnimation.gif"
              alt="Loading..."
              className="w-8 h-8 object-contain"
            />
            <span className="ml-3 text-slate-600">Loading calendar...</span>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                {MONTHS[month]} {year}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={goToPreviousMonth}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </button>
                <button
                  onClick={goToNextMonth}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <ChevronRight className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </button>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map(day => (
                <div key={day} className="p-3 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, index) => (
                <div
                  key={index}
                  className={`min-h-[120px] p-2 border border-slate-100 dark:border-slate-700 ${
                    date.isCurrentMonth
                      ? 'bg-white dark:bg-slate-800'
                      : 'bg-slate-50 dark:bg-slate-900/50'
                  } ${
                    date.isToday
                      ? 'ring-2 ring-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                      : ''
                  }`}
                >
                  <div className={`text-sm font-medium mb-2 ${
                    date.isCurrentMonth
                      ? date.isToday
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : 'text-slate-900 dark:text-slate-100'
                      : 'text-slate-400 dark:text-slate-600'
                  }`}>
                    {date.day}
                  </div>

                  {/* Jobs for this day */}
                  <div className="space-y-1">
                    {date.jobs.slice(0, 3).map(job => (
                      <Link
                        key={job.id}
                        href={`/jobs/${job.id}`}
                        className={`block p-1.5 rounded text-xs transition-colors hover:scale-105 border ${getStatusColor(job.status)}`}
                      >
                        <div className="flex items-center gap-1 mb-1">
                          {getPriorityIcon(job.priority)}
                          <span className="font-medium truncate">{job.title}</span>
                        </div>
                        <div className="text-xs opacity-75 capitalize">
                          {job.status.replace('_', ' ')}
                        </div>
                      </Link>
                    ))}
                    {date.jobs.length > 3 && (
                      <div className="text-xs text-slate-500 text-center">
                        +{date.jobs.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">Status Legend</h3>
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-amber-200 border border-amber-300"></div>
                  <span className="text-slate-600 dark:text-slate-400">Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-emerald-200 border border-emerald-300"></div>
                  <span className="text-slate-600 dark:text-slate-400">Confirmed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-200 border border-blue-300"></div>
                  <span className="text-slate-600 dark:text-slate-400">In Progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-gray-200 border border-gray-300"></div>
                  <span className="text-slate-600 dark:text-slate-400">Completed</span>
                </div>
              </div>
            </div>

            {/* Summary */}
            {monthJobs.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
                  {MONTHS[month]} Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
                    <div className="text-slate-600 dark:text-slate-400">Total Services</div>
                    <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{monthJobs.length}</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
                    <div className="text-slate-600 dark:text-slate-400">Confirmed</div>
                    <div className="text-lg font-semibold text-emerald-600">
                      {monthJobs.filter(j => j.status === 'confirmed').length}
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
                    <div className="text-slate-600 dark:text-slate-400">Pending</div>
                    <div className="text-lg font-semibold text-amber-600">
                      {monthJobs.filter(j => j.status === 'pending').length}
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
                    <div className="text-slate-600 dark:text-slate-400">Emergency</div>
                    <div className="text-lg font-semibold text-red-600">
                      {monthJobs.filter(j => j.priority === 'emergency').length}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* No appointments message */}
            {monthJobs.length === 0 && !loading && (
              <div className="text-center py-12">
                <CalendarDays className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                  No appointments in {MONTHS[month]}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Schedule your first emergency service to see it here
                </p>
                <Link
                  href="/post-job"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                >
                  <Calendar1 className="h-4 w-4" />
                  Schedule Service
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}