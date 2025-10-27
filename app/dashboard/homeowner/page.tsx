'use client'

import React, { useMemo, useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../../../contexts/AuthContext'
import { useHomeownerStats } from '../../../lib/hooks/useHomeownerStats'
import { supabase } from '../../../lib/supabaseClient'
import LoadingSpinner from '../../../components/LoadingSpinner'
import dynamic from 'next/dynamic'

// const ContractorTracker = dynamic(() => import('../../../components/ContractorTracker'), { ssr: false })
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
  Bell,
  CreditCard,
  ThumbsUp,
  X,
  Home,
  Building2,
  Plus,
  Settings,
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


  // Contractor tracking state
  const [activeJob, setActiveJob] = useState<any>(null)
  const [showTracker, setShowTracker] = useState(false)

  // Add Address modal state
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [addressForm, setAddressForm] = useState({
    address: '',
    name: '',
    tags: '',
    instructions: ''
  })

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

  // Compute pending actions for the banner
  type PendingAction = {
    id: string
    type: 'rate' | 'confirm_completion' | 'add_payment' | 'kyc' | 'bid_action'
    title: string
    description: string
    href: string
    icon: React.ReactNode
  }

  const pendingActions = useMemo((): PendingAction[] => {
    const actions: PendingAction[] = []

    // Jobs needing rating (completed jobs without rating)
    const jobsNeedingRating = displayJobs.filter(j => j.status === 'Completed' && !j.rated)
    if (jobsNeedingRating.length > 0) {
      actions.push({
        id: 'rate-jobs',
        type: 'rate',
        title: `Rate ${jobsNeedingRating.length} completed ${jobsNeedingRating.length === 1 ? 'job' : 'jobs'}`,
        description: 'Help other homeowners by rating your experience',
        href: `/jobs/${jobsNeedingRating[0].id}`,
        icon: <Star className="h-4 w-4" />
      })
    }

    // Jobs needing completion confirmation (for escrow release)
    const jobsNeedingConfirmation = displayJobs.filter(j =>
      j.status === 'In Progress' && j.contractor_marked_complete
    )
    if (jobsNeedingConfirmation.length > 0) {
      actions.push({
        id: 'confirm-completion',
        type: 'confirm_completion',
        title: `Confirm ${jobsNeedingConfirmation.length} completed ${jobsNeedingConfirmation.length === 1 ? 'job' : 'jobs'}`,
        description: 'Release payment to contractor',
        href: `/jobs/${jobsNeedingConfirmation[0].id}`,
        icon: <ThumbsUp className="h-4 w-4" />
      })
    }

    // Missing payment method
    if (userProfile && !userProfile.stripe_customer_id) {
      actions.push({
        id: 'add-payment',
        type: 'add_payment',
        title: 'Add payment method',
        description: 'Required for emergency services',
        href: '/dashboard/homeowner/billing',
        icon: <CreditCard className="h-4 w-4" />
      })
    }

    // KYC not verified
    if (userProfile && !userProfile.kyc_verified) {
      actions.push({
        id: 'complete-kyc',
        type: 'kyc',
        title: 'Verify your identity',
        description: 'Required for platform trust and security',
        href: '/profile/kyc',
        icon: <ShieldCheck className="h-4 w-4" />
      })
    }

    return actions
  }, [displayJobs, userProfile])

  const upcoming = useMemo(()=> displayJobs.filter(j=>j.status==='Confirmed' && j.nextAppt).slice(0,3),[displayJobs])

  // Get past (completed) jobs for the Past Jobs section
  const pastJobs = useMemo(() =>
    displayJobs.filter(j => j.status === 'Completed').slice(0, 3),
    [displayJobs]
  )

  // Get active jobs for the Jobs Table (pending, confirmed, in progress - NOT completed)
  const activeJobs = useMemo(() =>
    displayJobs.filter(j => j.status !== 'Completed'),
    [displayJobs]
  )

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
          <Link href="/post-job?urgent=1" className="btn-primary whitespace-nowrap flex-shrink-0">Emergency Help</Link>
          <Link href="/profile" className="btn whitespace-nowrap flex-shrink-0 flex items-center gap-1.5">
            <UserRound className="w-4 h-4" />
            Profile
          </Link>
          <Link href="/profile/settings" className="btn whitespace-nowrap flex-shrink-0 flex items-center gap-1.5">
            <Settings className="w-4 h-4" />
            Account Settings
          </Link>
          <Link href="/dashboard/homeowner/billing" className="btn whitespace-nowrap flex-shrink-0 flex items-center gap-1.5">
            <Receipt className="w-4 h-4" />
            Billing
          </Link>
        </div>
      </div>

      {/* Pending Actions Banner */}
      {pendingActions.length > 0 && (
        <section className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
              <Bell className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-amber-900 mb-2">Action Needed</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {pendingActions.slice(0, 4).map(action => (
                  <Link
                    key={action.id}
                    href={action.href}
                    className="flex items-center gap-3 p-3 bg-white rounded-lg border border-amber-200 hover:border-amber-300 hover:shadow-sm transition-all group"
                  >
                    <div className="p-2 bg-amber-50 rounded-lg text-amber-600 group-hover:bg-amber-100 transition-colors">
                      {action.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 truncate">{action.title}</div>
                      <div className="text-xs text-gray-600 truncate">{action.description}</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  </Link>
                ))}
              </div>
              {pendingActions.length > 4 && (
                <p className="text-xs text-amber-700 mt-2">
                  +{pendingActions.length - 4} more action{pendingActions.length - 4 !== 1 ? 's' : ''} needed
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Active Emergencies Section */}
      <section className="mb-6">
        <div className="rounded-2xl border border-red-200 bg-white shadow-sm">
          <div className="border-b border-red-200 bg-gradient-to-r from-red-50 to-orange-50 px-6 py-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <Siren className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-red-900">Active Emergencies</h3>
                <p className="text-sm text-red-700">
                  {activeJobs.length > 0
                    ? `${activeJobs.length} active emergency ${activeJobs.length > 1 ? 'requests' : 'request'}`
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

          <div className="p-6">
            {activeJobs.length > 0 ? (
              <div className="space-y-4">
                {activeJobs.map(job => (
                  <div key={job.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 mb-1">{job.title}</h4>
                            <div className="flex items-center gap-2 mb-2">
                              {job.priority === 'Emergency' && (
                                <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded-full">
                                  🚨 EMERGENCY
                                </span>
                              )}
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
                            {job.proName && (
                              <p className="text-sm text-gray-600">
                                Contractor: <span className="font-medium">{job.proName}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {job.status === 'Pending' && (
                          <div className="text-center mr-2">
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
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Active Emergencies</h4>
                <p className="text-gray-600 mb-4">
                  When you need urgent help, your active emergencies will be displayed here
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

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Saved Addresses */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
          <SectionTitle action={<Link href="/profile/settings" className="text-brand underline text-sm">Manage</Link>}>
            Saved Addresses
          </SectionTitle>
          <div className="space-y-2">
            {userProfile?.address ? (
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-950 rounded-lg">
                    <Home className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 dark:text-white">Primary Address</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 truncate">{userProfile.address}</div>
                  </div>
                  <button className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
                    Use
                  </button>
                </div>
              </div>
            ) : null}

            <button
              onClick={() => setShowAddressModal(true)}
              className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 p-4 text-slate-600 dark:text-slate-400 hover:border-emerald-500 hover:text-emerald-600 transition-colors w-full"
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm font-medium">Add Address</span>
            </button>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Save addresses for faster emergency requests
            </p>
          </div>
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

      {/* Past Jobs Section */}
      <section className="mb-6">
        <div className="rounded-2xl border border-slate-200 bg-white dark:bg-slate-900 shadow-sm">
          <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-6 py-4 rounded-t-2xl flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Recent Jobs</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Your most recent completed emergencies
              </p>
            </div>
            <Link
              href="/history"
              className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              View All
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="p-6">
            {pastJobs.length > 0 ? (
              <div className="space-y-3">
                {pastJobs.map(job => (
                  <div key={job.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-slate-900 dark:text-white mb-1">{job.title}</h4>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                              <span className="flex items-center gap-1">
                                <span className="font-medium">{job.category}</span>
                              </span>
                              {job.proName && (
                                <>
                                  <span className="text-slate-400">•</span>
                                  <span>{job.proName}</span>
                                </>
                              )}
                              {job.endTime && (
                                <>
                                  <span className="text-slate-400">•</span>
                                  <span>{new Date(job.endTime).toLocaleDateString()}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {job.totalCost && (
                          <div className="text-right">
                            <div className="text-lg font-bold text-slate-900 dark:text-white">
                              ${job.totalCost.toFixed(2)}
                            </div>
                          </div>
                        )}
                        <Link
                          href={`/jobs/${job.id}`}
                          className="btn btn-outline text-sm"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-slate-400" />
                </div>
                <h4 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No Completed Jobs Yet</h4>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Your completed emergency services will appear here
                </p>
                <Link
                  href="/post-job"
                  className="btn-primary"
                >
                  Post Your First Emergency
                </Link>
              </div>
            )}
          </div>
        </div>
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

      {/* Add Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Add New Address</h3>
              <button
                onClick={() => setShowAddressModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Address Input */}
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  value={addressForm.address}
                  onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                  placeholder="123 Main St, City, State 12345"
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {/* Static Map Placeholder */}
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Location Preview
                </label>
                <div className="relative w-full h-48 bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 flex items-center justify-center overflow-hidden">
                  {/* Map background pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                      backgroundImage: 'linear-gradient(rgba(0,0,0,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.1) 1px, transparent 1px)',
                      backgroundSize: '20px 20px'
                    }}></div>
                  </div>

                  {/* Pin marker */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center shadow-lg mb-2">
                      <MapPin className="h-7 w-7 text-white" />
                    </div>
                    <div className="bg-white dark:bg-slate-800 px-3 py-1 rounded-full shadow-md">
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        {addressForm.address || 'Enter address above'}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Static location preview
                </p>
              </div>

              {/* Name/Label Input */}
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Name/Label
                </label>
                <input
                  type="text"
                  value={addressForm.name}
                  onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                  placeholder="e.g., Home, Work, Mom's House"
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {/* Tags Input */}
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  value={addressForm.tags}
                  onChange={(e) => setAddressForm({ ...addressForm, tags: e.target.value })}
                  placeholder="e.g., residential, frequent, side-entrance"
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Separate tags with commas
                </p>
              </div>

              {/* Instructions Textarea */}
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Special Instructions
                </label>
                <textarea
                  value={addressForm.instructions}
                  onChange={(e) => setAddressForm({ ...addressForm, instructions: e.target.value })}
                  placeholder="e.g., Use side entrance, Call when arrived, Dog in backyard"
                  rows={4}
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddressModal(false)
                  setAddressForm({ address: '', name: '', tags: '', instructions: '' })
                }}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // TODO: Save address to database
                  console.log('Saving address:', addressForm)
                  setShowAddressModal(false)
                  setAddressForm({ address: '', name: '', tags: '', instructions: '' })
                }}
                disabled={!addressForm.address.trim()}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
              >
                Save Address
              </button>
            </div>
          </div>
        </div>
      )}
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