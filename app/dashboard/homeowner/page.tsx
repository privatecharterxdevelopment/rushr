'use client'

import React, { useMemo, useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../../../contexts/AuthContext'
import { useHomeownerStats } from '../../../lib/hooks/useHomeownerStats'
import { supabase } from '../../../lib/supabaseClient'
import NotificationBell from '../../../components/NotificationBell'
import LoadingSpinner from '../../../components/LoadingSpinner'
import dynamic from 'next/dynamic'

// const ContractorTracker = dynamic(() => import('../../../components/ContractorTracker'), { ssr: false })
const PaymentHistory = dynamic(() => import('../../../components/PaymentHistory'), { ssr: false })
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  FileText,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
  MapPin,
  AlertTriangle,
  Clock,
  ChevronRight,
  Siren,
  Battery,
  Zap,
  Receipt,
} from 'lucide-react'

/* ----------------------------- tiny helpers ----------------------------- */
function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-lg font-semibold text-ink dark:text-white">{children}</h2>
      {action}
    </div>
  )
}
function StatCard({
  label, value, hint, icon,
  tone = 'emerald',
}: {
  label: string; value: string | number; hint?: string; icon?: React.ReactNode;
  tone?: 'emerald' | 'blue' | 'amber' | 'rose'
}) {
  const ring =
    tone === 'emerald' ? 'border-emerald-200' :
    tone === 'blue' ? 'border-blue-200' :
    tone === 'amber' ? 'border-amber-200' : 'border-rose-200'
  const dot =
    tone === 'emerald' ? 'bg-emerald-500' :
    tone === 'blue' ? 'bg-blue-500' :
    tone === 'amber' ? 'bg-amber-500' : 'bg-rose-500'
  return (
    <div className={`rounded-2xl border ${ring} bg-white dark:bg-slate-900 p-4 shadow-sm`}>
      <div className="flex items-center gap-2">
        <span className={`inline-block h-2 w-2 rounded-full ${dot}`} />
        <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
        {icon ? <span className="ml-auto text-slate-400">{icon}</span> : null}
      </div>
      <div className="mt-1 text-2xl font-semibold text-ink dark:text-white">{value}</div>
      {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
    </div>
  )
}
function Badge({ children, tone='emerald' }:{children:React.ReactNode; tone?:'emerald'|'blue'}) {
  const cls = tone==='emerald'
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200'
    : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200'
  return <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>{children}</span>
}
function Chip({ children }:{children:React.ReactNode}) {
  return <span className="rounded-md border px-1.5 py-0.5 text-[11px] text-slate-600">{children}</span>
}
function timeUntil(iso: string) {
  try {
    const d = new Date(iso); const diff = d.getTime() - Date.now()
    if (diff <= 0) return 'now'
    const h = Math.floor(diff / 36e5), m = Math.round((diff % 36e5)/6e4)
    return h ? `${h}h ${m}m` : `${m}m`
  } catch { return '' }
}
function timeAgo(iso: string) {
  try {
    const d = new Date(iso); const diff = Date.now() - d.getTime()
    if (diff < 60000) return 'just now'
    const m = Math.floor(diff / 60000)
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    const days = Math.floor(h / 24)
    return `${days}d ago`
  } catch { return '' }
}

/* --------------------------- typed data models --------------------------- */
type Job = {
  id: string
  title: string
  status: 'Pending' | 'Confirmed' | 'In Progress' | 'Completed'
  proName?: string
  hourlyRate?: number
  estimatedDuration?: string
  priority: 'Emergency' | 'Urgent' | 'Standard'
  nextAppt?: string // ISO
  category: 'Electrical'|'HVAC'|'Roofing'|'Plumbing'|'Carpentry'|'Landscaping'|'Auto'|'Locksmith'
  totalCost?: number
  startTime?: string
  endTime?: string
}
type Conversation = { id: string; with: string; jobId?: string; preview: string; unread: number; when: string }
type CompletenessField = { key:string; label:string; weight:number; done:boolean; href:string; icon:React.ReactNode }

/* -------------------------------- Real Data Only ------------------------------- */
// All data now comes from the database - no mock data

/* ---------------------------------- page --------------------------------- */
export default function HomeownerDashboardPage() {
  // ALL HOOKS MUST BE CALLED FIRST - BEFORE ANY CONDITIONAL RETURNS
  const { user, userProfile, loading } = useAuth()
  // Always call the hook - it handles the user check internally
  const { stats, jobs: realJobs, messages, loading: statsLoading, refreshStats } = useHomeownerStats()

  // Get real trusted contractors from database - MUST BE BEFORE CONDITIONAL RETURNS
  const [savedPros, setSavedPros] = useState<any[]>([])
  const [loadingTrustedPros, setLoadingTrustedPros] = useState(true)

  // Contractor tracking state
  const [activeJob, setActiveJob] = useState<any>(null)
  const [showTracker, setShowTracker] = useState(false)

  // Move all useMemo hooks to the top to avoid React hooks error
  const completeness: CompletenessField[] = useMemo(() => {
    if (!user || !userProfile) return []
    return [
      { key:'email', label:'Verify email', weight:15, done:!!user.email_confirmed_at, href:'/profile/settings', icon:<ShieldCheck className="h-4 w-4" /> },
      { key:'phone', label:'Add phone number', weight:15, done:!!userProfile.phone, href:'/profile/settings', icon:<PhoneIcon /> },
      { key:'address', label:'Add property address', weight:20, done:!!userProfile.address, href:'/profile/settings', icon:<MapPin className="h-4 w-4" /> },
      { key:'avatar', label:'Profile photo', weight:10, done:!!userProfile.avatar_url, href:'/profile/avatar', icon:<UserRound className="h-4 w-4" /> },
      { key:'kyc', label:'Identity verification (KYC)', weight:25, done:!!userProfile.kyc_verified, href:'/profile/kyc', icon:<ShieldCheck className="h-4 w-4" /> },
      { key:'first', label:'Book first emergency service', weight:15, done:!!userProfile.first_job_completed, href:'/post-job', icon:<FileText className="h-4 w-4" /> },
    ]
  }, [user, userProfile])

  const completenessPct = useMemo(()=>{
    if (completeness.length === 0) return 0
    const totalWeight = completeness.reduce((sum, field) => sum + field.weight, 0)
    const doneWeight = completeness.filter(f => f.done).reduce((sum, field) => sum + field.weight, 0)
    return Math.round((doneWeight / totalWeight) * 100)
  }, [completeness])

  // Convert real jobs to display format - all useMemo hooks must be before any conditional returns
  const displayJobs = useMemo(() => {
    // Only use real jobs from database - no mock data
    const jobs = realJobs.map(job => ({
      id: job.id,
      title: job.title,
      status: job.status === 'pending' ? 'Pending' :
              job.status === 'confirmed' ? 'Confirmed' :
              job.status === 'in_progress' ? 'In Progress' :
              job.status === 'completed' ? 'Completed' : 'Pending',
      proName: job.contractor_id ? 'Assigned Contractor' : null, // Only show if contractor assigned
      priority: job.priority === 'emergency' ? 'Emergency' :
                job.priority === 'high' ? 'Urgent' : 'Normal',
      category: job.category || 'General',
      nextAppt: job.scheduled_date,
      totalCost: job.final_cost,
      startTime: job.scheduled_date,
      endTime: job.completed_date,
      hourlyRate: 0, // TODO: Get from contractor
      estimatedDuration: '1-2 hours', // TODO: Calculate
      created_at: job.created_at
    }))

    // Sort jobs: Emergency jobs first, then by creation date (newest first)
    return jobs.sort((a, b) => {
      if (a.priority === 'Emergency' && b.priority !== 'Emergency') return -1
      if (b.priority === 'Emergency' && a.priority !== 'Emergency') return 1
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    })
  }, [realJobs])

  // Get emergency jobs specifically for prominent display
  const emergencyJobs = useMemo(() =>
    displayJobs.filter(j => j.priority === 'Emergency' && j.status !== 'Completed'),
    [displayJobs]
  )

  const upcoming = useMemo(()=> displayJobs.filter(j=>j.status==='Confirmed' && j.nextAppt).slice(0,3),[displayJobs])

  // smart next step (simple rules; expand later)
  const nextStep = useMemo(()=>{
    const pending = displayJobs.find(j=>j.status==='Pending')
    if (pending) return {
      title: `Follow up on "${pending.title}"`,
      desc: 'Check status and communicate with your contractor',
      href: `/jobs/${pending.id}`,
      type: 'job' as const,
      icon: '📋',
      tone: 'blue' as const
    }
    const profile = completeness.find(f=>!f.done)
    if (profile) return {
      title: profile.label,
      desc: 'Complete your profile to build trust with professionals',
      href: profile.href,
      type: 'profile' as const,
      icon: '👤',
      tone: 'amber' as const
    }
    return {
      title: 'Post your next emergency job',
      desc: 'Get help from verified professionals in your area',
      href: '/post-job',
      type: 'post' as const,
      icon: '🚨',
      tone: 'emerald' as const
    }
  }, [displayJobs, completeness])

  // Transform messages for display with proper sender names - MUST BE BEFORE CONDITIONAL RETURNS
  const displayMessages = useMemo(() => {
    const realMessages = messages || []
    return realMessages.map(msg => ({
      ...msg,
      sender_name: msg.sender_id === '00000000-0000-0000-0000-000000000000'
        ? 'Rushr Support'
        : msg.sender_name || 'Unknown',
      preview: msg.content?.substring(0, 100) || 'No content'
    }))
  }, [messages])

  // Fetch trusted contractors - MUST BE BEFORE CONDITIONAL RETURNS
  useEffect(() => {
    const fetchTrustedPros = async () => {
      if (!user) return

      try {
        // First, check if there are any trusted contractors at all
        const { data, error } = await supabase
          .from('trusted_contractors')
          .select('*')
          .eq('homeowner_id', user.id)
          .order('last_job_date', { ascending: false })
          .limit(5)

        if (error) {
          console.error('Error fetching trusted contractors:', error?.message || error || 'Unknown error')
          setSavedPros([]) // Set empty array on error
          return
        }

        if (!data || data.length === 0) {
          setSavedPros([])
          return
        }

        // Fetch contractor details for each trusted contractor
        const contractorIds = data.map(tc => tc.contractor_id)
        const { data: contractors, error: contractorError } = await supabase
          .from('contractor_profiles')
          .select('*')
          .in('id', contractorIds)

        if (contractorError) {
          console.error('Error fetching contractor details:', contractorError)
          // Still show trusted contractors data without full contractor info
          setSavedPros(data.map(tc => ({
            ...tc,
            contractor_profiles: {
              name: 'Unknown Contractor',
              business_name: null,
              rating: 0,
              jobs_completed: 0,
              categories: [],
              service_area_zips: [],
              phone: null,
              email: null,
              avatar_url: null
            }
          })))
          return
        }

        // Combine trusted contractor data with contractor profile data
        const combinedData = data.map(tc => {
          const contractor = contractors.find(c => c.id === tc.contractor_id)
          return {
            ...tc,
            contractor_profiles: contractor || {
              name: 'Unknown Contractor',
              business_name: null,
              rating: 0,
              jobs_completed: 0,
              categories: [],
              service_area_zips: [],
              phone: null,
              email: null,
              avatar_url: null
            }
          }
        })

        setSavedPros(combinedData)
      } catch (err) {
        console.error('Error fetching trusted contractors:', err)
      } finally {
        setLoadingTrustedPros(false)
      }
    }

    fetchTrustedPros()
  }, [user])

  // Auto-detect jobs with accepted bids for tracking
  useEffect(() => {
    if (!user || !realJobs || realJobs.length === 0) return

    // Find jobs with accepted bids that are in progress
    const jobInProgress = realJobs.find(job =>
      (job.status === 'in_progress' || job.status === 'In Progress') && job.contractor_id
    )

    if (jobInProgress) {
      // Fetch contractor details for this job
      const fetchContractorDetails = async () => {
        const { data: contractor } = await supabase
          .from('contractor_profiles')
          .select('name, phone')
          .eq('id', jobInProgress.contractor_id)
          .single()

        setActiveJob({
          ...jobInProgress,
          contractor_name: contractor?.name,
          contractor_phone: contractor?.phone
        })
        setShowTracker(true)
      }

      fetchContractorDetails()
    } else {
      setShowTracker(false)
      setActiveJob(null)
    }
  }, [user, realJobs])

  // NOW SAFE TO HAVE CONDITIONAL RETURNS AFTER ALL HOOKS
  // Show loading while auth is being determined
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading your dashboard..." />
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Please sign in to access your dashboard</h2>
          <Link href="/?auth=signin" className="btn-primary">Sign In</Link>
        </div>
      </div>
    )
  }

  // Real-time KPIs from database tracking
  const kpis = {
    active: stats?.active_services || 0,
    completed: stats?.completed_services || 0,
    unread: stats?.unread_messages || 0,
    saved: stats?.trusted_contractors || 0
  }

  // Show loading if user exists but profile is still loading
  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Setting up your profile..." color="emerald" />
      </div>
    )
  }

  return (
    <div className="space-y-8 pt-8">
      {/* header */}
      <div className="mb-2 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          {/* Profile Avatar */}
          <div className="w-16 h-16 flex-shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center">
            {userProfile.avatar_url ? (
              <img
                src={userProfile.avatar_url}
                alt={`${userProfile.name}'s avatar`}
                className="w-full h-full object-cover"
              />
            ) : (
              <UserRound className="h-8 w-8 text-white" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-xl lg:text-2xl font-semibold text-ink dark:text-white flex flex-wrap items-center gap-2">
              <span className="truncate">Welcome back, {userProfile.name || user.email?.split('@')[0]}</span>
              <Badge>Homeowner</Badge>
              {completenessPct >= 100 && <Badge tone="blue">✓ Profile Complete</Badge>}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Subscription: <span className="capitalize font-medium">{userProfile.subscription_type}</span>
              {completenessPct < 100 && (
                <span className="ml-3 text-amber-600 dark:text-amber-400">
                  • Profile {completenessPct}% complete
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Action buttons - horizontal scroll on mobile, flex on desktop */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0">
          <NotificationBell />
          <Link href="/post-job?urgent=1" className="btn-primary whitespace-nowrap flex-shrink-0">Emergency Help</Link>
          <Link href="/dashboard/homeowner/bids" className="btn whitespace-nowrap flex-shrink-0">Manage Bids</Link>
          <Link href="/dashboard/homeowner/billing" className="btn whitespace-nowrap flex-shrink-0 flex items-center gap-1.5">
            <Receipt className="w-4 h-4" />
            Billing
          </Link>
          <Link href="/rushrmap" className="btn whitespace-nowrap flex-shrink-0">Find a Pro</Link>
        </div>
      </div>

      {/* KPIs + Next step - Real-time tracking from database */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <StatCard
          label="Active Services"
          value={statsLoading ? "..." : kpis.active}
          hint="Pending, confirmed, in progress"
          icon={<Siren className="h-4 w-4" />}
        />
        <StatCard
          label="Completed"
          value={statsLoading ? "..." : kpis.completed}
          hint="Total completed services"
          tone="blue"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatCard
          label="Messages"
          value={statsLoading ? "..." : kpis.unread}
          hint="Unread messages"
          tone="amber"
          icon={<MessageSquare className="h-4 w-4" />}
        />
        <StatCard
          label="Trusted Pros"
          value={statsLoading ? "..." : kpis.saved}
          hint="Quick booking"
          tone="rose"
          icon={<Star className="h-4 w-4" />}
        />
      </section>

      {/* Emergency Services Section */}
      <section className="mb-6">
        <div className="rounded-2xl border border-red-200 bg-white shadow-sm">
          <div className="border-b border-red-200 bg-gradient-to-r from-red-50 to-orange-50 px-6 py-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <Siren className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-red-900">🚨 Emergency Services</h3>
                  <p className="text-sm text-red-700">
                    {emergencyJobs.length > 0
                      ? `${emergencyJobs.length} active emergency request${emergencyJobs.length > 1 ? 's' : ''}`
                      : 'No active emergency requests'
                    }
                  </p>
                </div>
              </div>
              <Link
                href="/post-job"
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
              >
                Request Emergency Help
              </Link>
            </div>
          </div>

          <div className="p-6">
            {emergencyJobs.length > 0 ? (
              <div className="space-y-4">
                {emergencyJobs.map(job => (
                  <div key={job.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-1">{job.title}</h4>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded-full">
                                🚨 EMERGENCY
                              </span>
                              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                job.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                                job.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                                job.status === 'In Progress' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {job.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              Category: <span className="font-medium">{job.category}</span>
                            </p>
                            <p className="text-xs text-gray-500">
                              Posted {timeAgo(job.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {job.status === 'Pending' && (
                          <div className="text-center">
                            <div className="text-xs text-amber-600 font-medium">⏳ Finding Pro</div>
                            <div className="text-xs text-gray-500">ETA: 5-15 min</div>
                          </div>
                        )}
                        <Link
                          href={`/jobs/${job.id}`}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Siren className="h-8 w-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Emergency Services Active</h4>
                <p className="text-gray-600 mb-4">
                  When you need urgent help, emergency professionals will be displayed here.
                </p>
                <Link
                  href="/post-job"
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Request Emergency Help
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Next step card */}
        <div className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
          <SectionTitle>Next step</SectionTitle>
          <Link
            href={nextStep.href}
            className={`flex items-center justify-between rounded-xl border p-4 transition ${
              nextStep.tone==='amber' ? 'border-amber-200 bg-amber-50 hover:bg-amber-100' :
              nextStep.tone==='blue' ? 'border-blue-200 bg-blue-50 hover:bg-blue-100' :
              'border-emerald-200 bg-emerald-50 hover:bg-emerald-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-slate-700">{nextStep.icon}</span>
              <div>
                <div className="font-semibold text-ink dark:text-white">{nextStep.title}</div>
                <div className="text-sm text-slate-600">{nextStep.desc}</div>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-500" />
          </Link>
          {/* Profile nudge if completeness < 80 */}
          {completenessPct < 80 && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span>Boost trust by finishing your profile.</span>
              <Link href="/profile/settings" className="ml-auto text-brand underline">Complete it</Link>
            </div>
          )}
        </div>

        {/* Upcoming (schedule) */}
        <div className="rounded-2xl border border-slate-200 p-4">
          <SectionTitle action={<Link href="/calendar" className="text-brand underline text-sm">Calendar</Link>}>
            Upcoming
          </SectionTitle>
          {upcoming.length === 0 ? (
            <div className="text-sm text-slate-600">No appointments yet.</div>
          ) : (
            <ul className="space-y-2">
              {upcoming.map(u=>(
                <li key={u.id} className="flex items-center justify-between rounded-lg border bg-white p-3">
                  <div>
                    <div className="font-medium text-ink dark:text-white">{u.title}</div>
                    <div className="text-xs text-slate-600 flex items-center gap-1">
                      <CalendarDays className="h-4 w-4" /> {u.proName} in {timeUntil(u.nextAppt!)}
                    </div>
                  </div>
                  <Link href={`/jobs/${u.id}`} className="btn btn-outline text-sm">Details</Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Profile completeness */}
        <div className="rounded-2xl border border-emerald-200 bg-white p-4">
          <SectionTitle action={<Link href="/profile/settings" className="text-brand underline text-sm">Settings</Link>}>
            Profile completeness
          </SectionTitle>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <div className="flex items-center justify-between text-sm font-medium text-emerald-900">
              <span>Overall</span><span>{completenessPct}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-emerald-100">
              <div className="h-2 rounded-full bg-emerald-600" style={{width:`${completenessPct}%`}} />
            </div>
          </div>
          <div className="mt-3 grid gap-2">
            {completeness.map(f=>(
              <Link key={f.key} href={f.href} className={`flex items-center justify-between rounded-lg border p-3 text-sm transition ${f.done?'border-slate-200 bg-white':'border-amber-200 bg-amber-50 hover:bg-amber-100'}`}>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">{f.icon}</span>
                  <span className="text-ink dark:text-white">{f.label}</span>
                </div>
                {f.done ? <CheckCircle2 className="h-5 w-5 text-emerald-600"/> : <Circle className="h-5 w-5 text-slate-400"/>}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Jobs table */}
      <section>
        <SectionTitle action={<Link href="/history" className="text-brand underline text-sm">View all</Link>}>
          Emergency services
        </SectionTitle>
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Service</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Pro</th>
                <th className="px-4 py-3 text-left font-medium">Rate/Cost</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {displayJobs.map(j=>(
                <tr key={j.id} className={`border-t border-slate-100 ${
                  j.priority === 'Emergency' ? 'bg-red-50 border-red-100' : ''
                }`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {j.title}
                      {j.priority === 'Emergency' && (
                        <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                          🚨 EMERGENCY
                        </span>
                      )}
                      {j.priority === 'Urgent' && (
                        <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                          URGENT
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      j.status==='Pending' ? 'bg-amber-100 text-amber-700' :
                      j.status==='Confirmed' ? 'bg-blue-100 text-blue-700' :
                      j.status==='In Progress' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>{j.status}</span>
                  </td>
                  <td className="px-4 py-3">{j.proName || 'Assigning...'}</td>
                  <td className="px-4 py-3">
                    {j.totalCost ? `$${j.totalCost}` : j.hourlyRate ? `$${j.hourlyRate}/hr` : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/jobs/${j.id}`} className="text-brand underline">View</Link>
                    {j.status === 'In Progress' && (
                      <>
                        <span className="mx-2 text-slate-300">|</span>
                        <Link href={`/messages?job=${j.id}`} className="text-brand underline">Message</Link>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Messages + Trusted pros */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 p-4">
          <SectionTitle action={<Link href="/messages" className="text-brand underline text-sm">Open inbox</Link>}>
            Pro messages
          </SectionTitle>
          <div className="divide-y divide-slate-100">
            {displayMessages.length > 0 ? (
              displayMessages.slice(0, 3).map(msg => (
                <div key={msg.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{msg.sender_name}</div>
                      {!msg.read_at && <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[11px] text-amber-700">new</span>}
                      {msg.sender_name === 'Rushr Support' && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                          SUPPORT
                        </span>
                      )}
                    </div>
                    <div className="truncate text-sm text-slate-600">{msg.preview}</div>
                  </div>
                  <div className="text-xs text-slate-500">{timeAgo(msg.created_at)}</div>
                  <Link href={`/messages?conversation=${msg.conversation_id}`} className="btn btn-outline">Reply</Link>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-slate-500">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p>No messages yet</p>
                <p className="text-sm mt-1">Messages from pros will appear here</p>
              </div>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-white p-4">
          <SectionTitle action={<Link href="/rushrmap" className="text-brand underline text-sm">Browse</Link>}>
            Trusted pros
          </SectionTitle>

          {loadingTrustedPros ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
              <span className="ml-2 text-sm text-gray-600">Loading...</span>
            </div>
          ) : savedPros.length > 0 ? (
            <ul className="space-y-2">
              {savedPros.map(p=>(
                <li key={p.id} className="rounded-lg border bg-white p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-700">
                      {p.contractor_profiles?.name?.split(' ').map(s=>s[0]).join('').slice(0,2) || 'TC'}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-medium">{p.contractor_profiles?.name || p.contractor_profiles?.business_name}</div>
                      <div className="text-[11px] text-slate-500">
                        2.5 mi • {p.jobs_completed || 0} jobs • {Number(p.average_rating || p.contractor_profiles?.rating || 0).toFixed(1)}★
                      </div>
                      <div className="text-[10px] text-emerald-600 font-medium">
                        {p.trust_level === 1 ? 'Saved' : p.trust_level === 2 ? 'Preferred' : 'Trusted'} • Last: {p.last_job_date ? new Date(p.last_job_date).toLocaleDateString() : 'Unknown'}
                      </div>
                    </div>
                    <div className="ml-auto flex gap-2">
                      <Link href={`/contractors/${p.contractor_id}`} className="btn btn-outline text-sm">View</Link>
                      <Link href={`/post-job?contractor=${p.contractor_id}`} className="btn text-sm">Book</Link>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {p.contractor_profiles?.categories?.slice(0, 3).map((cat, i) => (
                      <span key={i} className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                        {cat}
                      </span>
                    ))}
                    {p.total_spent > 0 && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                        Total: ${p.total_spent.toLocaleString()}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <div className="text-sm">No trusted pros yet</div>
              <div className="text-xs mt-1">Contractors you work with will appear here</div>
            </div>
          )}
        </div>
      </section>

      {/* Payment History Section */}
      <section>
        <SectionTitle>Payment History</SectionTitle>
        <PaymentHistory userType="homeowner" />
      </section>

      {/* Contractor Tracker - Shows when job has accepted bid */}
      {/* TODO: Implement ContractorTracker component for real-time tracking */}
      {/* {showTracker && activeJob && (
        <ContractorTracker
          jobId={activeJob.id}
          contractorId={activeJob.contractor_id}
          homeownerAddress={activeJob.address || userProfile?.address || ''}
          contractorName={activeJob.contractor_name || 'Contractor'}
          contractorPhone={activeJob.contractor_phone}
          onClose={() => setShowTracker(false)}
        />
      )} */}
    </div>
  )
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92V21a1 1 0 0 1-1.09 1 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 3 3.09 1 1 0 0 1 4 2h4.09a1 1 0 0 1 1 .75l1 3.5a1 1 0 0 1-.27 1L8.91 9.91a16 16 0 0 0 6 6l2.66-1.91a1 1 0 0 1 1-.27l3.5 1a1 1 0 0 1 .75 1Z"/>
    </svg>
  )
}