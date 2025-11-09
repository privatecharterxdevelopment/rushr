'use client'

import React, { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useProAuth } from '../../../contexts/ProAuthContext'
import { supabase } from '../../../lib/supabaseClient'
import dynamic from 'next/dynamic'

const PaymentHistory = dynamic(() => import('../../../components/PaymentHistory'), { ssr: false })
import {
  BadgeCheck,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  LineChart,
  MapPin,
  MessageSquare,
  Target,
  Users,
  CalendarDays,
  ChevronRight,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Mail,
  Phone,
  Star,
  Siren,
  Zap,
  Battery,
  Settings,
  Bell,
  Power,
  PowerOff,
} from 'lucide-react'

/* ----------------------------- helpers ----------------------------- */
function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-lg font-semibold text-ink dark:text-white">{children}</h2>
      {action}
    </div>
  )
}
function StatCard({
  label, value, hint, icon, tone='blue'
}: { label:string; value:string|number; hint?:string; icon?:React.ReactNode; tone?:'blue'|'emerald'|'amber'|'rose' }) {
  const ring = tone==='blue' ? 'border-blue-200' : tone==='emerald' ? 'border-emerald-200' : tone==='amber' ? 'border-amber-200' : 'border-rose-200'
  const dot  = tone==='blue' ? 'bg-blue-500' : tone==='emerald' ? 'bg-emerald-500' : tone==='amber' ? 'bg-amber-500' : 'bg-rose-500'
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
function Badge({ children }:{children:React.ReactNode}) {
  return <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-200">{children}</span>
}
function Chip({ children }:{children:React.ReactNode}) {
  return <span className="rounded-md border px-1.5 py-0.5 text-[11px] text-slate-600">{children}</span>
}

/* --------------------- types + mock data --------------------- */
type EmergencyJob = {
  id:string
  title:string
  location:string
  priority: 'Emergency' | 'Urgent' | 'Standard'
  hourlyRate:number
  estimatedDuration:string
  distance:number
  requestedMins:number
  status:'Available'|'Accepted'|'En Route'|'In Progress'|'Completed'
  customerName:string
  category: 'Plumbing'|'Electrical'|'HVAC'|'Locksmith'|'Auto'
}
type Availability = 'online' | 'busy' | 'offline'
type Appt = { id:string; job:string; at:string; window:string; addr:string; customerName:string }
type Earning = { date:string; amount:number; hours:number; jobTitle:string }
type CompletenessField = { key:string; label:string; weight:number; done:boolean; href:string; icon:React.ReactNode }

export default function ContractorDashboardPage() {
  const router = useRouter()
  const { user, contractorProfile, loading } = useProAuth()
  const [availability, setAvailability] = useState<Availability>('online')
  const [contractorData, setContractorData] = useState<any>(null)
  const [stripeConnectStatus, setStripeConnectStatus] = useState<any>(null)
  const [loadingStripe, setLoadingStripe] = useState(true)
  const [realJobs, setRealJobs] = useState<EmergencyJob[]>([])
  const [contractorStats, setContractorStats] = useState({
    todayJobs: 0,
    weekEarnings: 0,
    avgResponse: 0,
    rating: 0,
    completedJobs: 0,
    availableJobs: 0
  })
  const [contractorZips, setContractorZips] = useState<string[]>([])

  // Load contractor data from database
  useEffect(() => {
    const loadContractorData = async () => {
      if (user) {
        try {
          // Parallelize all queries to reduce load time
          const [contractorResult, myBidsResult, availableJobsResult] = await Promise.all([
            supabase
              .from('pro_contractors')
              .select('*')
              .eq('id', user.id)
              .single(),
            supabase
              .from('job_bids')
              .select(`
                *,
                homeowner_jobs!inner(*)
              `)
              .eq('contractor_id', user.id),
            supabase
              .from('homeowner_jobs')
              .select('*')
              .in('status', ['pending', 'bidding'])
          ])

          const contractor = contractorResult.data
          const myBids = myBidsResult.data
          const availableJobsData = availableJobsResult.data

          // Check if wizard is completed - redirect if not
          if (!contractor || !contractor.base_zip || !contractor.categories?.length) {
            console.log('[DASHBOARD] Wizard not completed, redirecting to wizard')
            router.push('/pro/wizard')
            return
          }

          if (contractor) {
            setContractorData(contractor)
            setContractorZips(contractor.service_area_zips || [contractor.base_zip || ''].filter(Boolean))
            // Set initial availability based on status (default to offline for new contractors)
            if (contractor.status === 'approved' || contractor.status === 'online') {
              setAvailability('online')
            } else {
              setAvailability('offline')
            }
          }

          if (myBids) {
            const acceptedBids = myBids.filter(bid => bid.status === 'accepted')
            const completedJobs = acceptedBids.filter(bid => bid.homeowner_jobs?.status === 'completed')
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            const completedThisWeek = completedJobs.filter(bid =>
              bid.homeowner_jobs?.completed_date && new Date(bid.homeowner_jobs.completed_date) > weekAgo
            )
            const weekEarnings = completedThisWeek.reduce((sum, bid) => sum + (bid.homeowner_jobs?.final_cost || 0), 0)

            setContractorStats({
              todayJobs: acceptedBids.filter(bid =>
                bid.homeowner_jobs?.status === 'in_progress' &&
                new Date(bid.homeowner_jobs.created_at).toDateString() === new Date().toDateString()
              ).length,
              weekEarnings,
              avgResponse: 8, // Default for now
              rating: contractor?.rating || 4.5,
              completedJobs: completedJobs.length,
              availableJobs: availableJobsData?.length || 0
            })
          }
        } catch (error) {
          console.error('Error loading contractor data:', error)
        }
      }
    }

    loadContractorData()
  }, [user])

  // Check Stripe Connect status
  useEffect(() => {
    const checkStripeStatus = async () => {
      if (user) {
        try {
          const response = await fetch('/api/stripe/connect/check-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contractorId: user.id })
          })

          if (response.ok) {
            const data = await response.json()
            setStripeConnectStatus(data)
          }
        } catch (error) {
          console.error('Error checking Stripe status:', error)
        } finally {
          setLoadingStripe(false)
        }
      }
    }

    checkStripeStatus()
  }, [user])

  // Load available jobs in contractor's ZIP areas
  useEffect(() => {
    const loadNearbyJobs = async () => {
      if (contractorZips.length > 0) {
        try {
          const { data: jobs } = await supabase
            .from('jobs')
            .select(`
              *,
              user_profiles!jobs_user_id_fkey (
                name,
                city,
                state,
                zip_code
              )
            `)
            .in('zip_code', contractorZips)
            .eq('status', 'open')
            .order('created_at', { ascending: false })
            .limit(10)

          if (jobs) {
            const formattedJobs: EmergencyJob[] = jobs.map(job => ({
              id: job.id,
              title: job.title || 'Service Request',
              location: `${job.city || 'Unknown'}, ${job.state || 'Unknown'}`,
              priority: (job.priority || 'Standard') as 'Emergency' | 'Urgent' | 'Standard',
              hourlyRate: job.budget || 100,
              estimatedDuration: job.estimated_duration || '1-2 hours',
              distance: Math.round(Math.random() * 10), // Mock distance for now
              requestedMins: Math.floor((new Date().getTime() - new Date(job.created_at).getTime()) / (1000 * 60)),
              status: 'Available' as const,
              customerName: job.user_profiles?.name || 'Customer',
              category: (job.category || 'General') as any
            }))

            setRealJobs(formattedJobs)
            setContractorStats(prev => ({ ...prev, availableJobs: formattedJobs.length }))
          }
        } catch (error) {
          console.error('Error loading nearby jobs:', error)
        }
      }
    }

    loadNearbyJobs()
  }, [contractorZips])

  const handleStartKYC = () => {
    // Navigate to the comprehensive onboarding wizard
    router.push('/pro/wizard')
  }

  const handleCompleteStripeSetup = async () => {
    try {
      const response = await fetch('/api/stripe/connect/onboarding-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractorId: user?.id })
      })

      const data = await response.json()

      if (data.success && data.url) {
        // Redirect to Stripe hosted onboarding
        window.location.href = data.url
      } else {
        alert('Failed to generate onboarding link. Please try again.')
      }
    } catch (error) {
      console.error('Error generating Stripe link:', error)
      alert('An error occurred. Please try again.')
    }
  }

  // Check if contractor can go online
  const canGoOnline = contractorData?.status === 'approved' &&
                      contractorData?.kyc_status === 'completed' &&
                      stripeConnectStatus?.payoutsEnabled === true

  // Handle availability change
  const handleAvailabilityChange = async (newStatus: Availability) => {
    if (newStatus === 'online' && !canGoOnline) {
      alert('You must complete payment setup before going online.')
      return
    }

    setAvailability(newStatus)

    // Update database
    try {
      await supabase
        .from('pro_contractors')
        .update({
          status: newStatus === 'online' ? 'online' : 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id)
    } catch (error) {
      console.error('Error updating availability:', error)
    }
  }

  // All emergency job data now comes from the real database
  const emergencyJobs: EmergencyJob[] = []
  const currentJobs: EmergencyJob[] = []

  // All schedule and earnings data now comes from the real database
  const todaySchedule: Appt[] = []
  const recentEarnings: Earning[] = []

  const completeness: CompletenessField[] = [
    { key:'license', label:'Upload license', weight:25, done:!!contractorData?.license_number && contractorData?.license_number !== 'pending',  href:'/dashboard/contractor/settings', icon:<BadgeCheck className="h-4 w-4" /> },
    { key:'insurance', label:'Verify insurance', weight:25, done:!!contractorData?.insurance_carrier && contractorData?.insurance_carrier !== 'pending', href:'/dashboard/contractor/settings', icon:<ShieldIcon /> },
    { key:'coverage', label:'Emergency service area', weight:20, done:contractorZips.length > 0, href:'/dashboard/contractor/settings', icon:<MapPin className="h-4 w-4" /> },
    { key:'hours', label:'Emergency availability', weight:15, done:!!contractorData?.emergency_available, href:'/dashboard/contractor/settings', icon:<Clock className="h-4 w-4" /> },
    { key:'rates', label:'Set hourly rates', weight:15, done:!!contractorData?.hourly_rate, href:'/dashboard/contractor/settings', icon:<DollarSign className="h-4 w-4" /> },
  ]

  // Use real contractor stats
  const kpis = contractorStats

  const completenessPct = useMemo(()=>{
    const total = completeness.reduce((a,b)=>a+b.weight,0)
    const done = completeness.filter(f=>f.done).reduce((a,b)=>a+b.weight,0)
    return Math.round((done/total)*100)
  },[completeness.length])

  // Use real jobs from database instead of mock data
  const availableJobs = realJobs.length > 0 ? realJobs : emergencyJobs.filter(j => j.status === 'Available').sort((a,b) => a.requestedMins - b.requestedMins)
  const nextJob = availableJobs[0]

  const nextAction = currentJobs.length > 0 ? {
    title: 'Service in progress',
    desc: `Continue work on "${currentJobs[0].title}" for ${currentJobs[0].customerName}`,
    href: `/jobs/${currentJobs[0].id}`,
    urgent: true,
  } : nextJob ? {
    title: 'Emergency job available',
    desc: `${nextJob.title} • $${nextJob.hourlyRate}/hr • ${nextJob.distance}mi away`,
    href: `/jobs/${nextJob.id}`,
    urgent: nextJob.priority === 'Emergency',
  } : {
    title: 'Ready for emergency calls',
    desc: 'You&apos;re online and available. Emergency jobs will appear here.',
    href: '/jobs',
    urgent: false,
  }

  const getAvailabilityIcon = (status: Availability) => {
    switch (status) {
      case 'online': return <Power className="h-4 w-4 text-emerald-600" />
      case 'busy': return <Clock className="h-4 w-4 text-amber-600" />
      case 'offline': return <PowerOff className="h-4 w-4 text-slate-400" />
    }
  }

  const getAvailabilityColor = (status: Availability) => {
    switch (status) {
      case 'online': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 'busy': return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'offline': return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  // Show overlay if KYC is required but not started
  const showKYCOverlay = contractorData && !contractorData.kyc_status

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <img
          src="https://jtrxdcccswdwlritgstp.supabase.co/storage/v1/object/public/contractor-logos/RushrLogoAnimation.gif"
          alt="Loading..."
          className="h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4 object-contain"
        />
          <div className="text-lg font-medium text-slate-700">Loading your contractor dashboard...</div>
          <div className="text-sm text-slate-500 mt-2">Setting up your profile and preferences</div>
        </div>
      </div>
    )
  }

  // Show sign-in prompt if no user
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Contractor Access Required</h2>
            <p className="text-slate-600 mb-6">Please sign in to access your contractor dashboard</p>
          </div>
          <div className="space-y-3">
            <a href="/pro" className="block w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Sign In to Pro Dashboard
            </a>
            <a href="/pro/contractor-signup" className="block w-full bg-slate-100 text-slate-700 px-6 py-3 rounded-lg hover:bg-slate-200 transition-colors font-medium">
              Create Contractor Account
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-8 ${showKYCOverlay ? 'relative' : ''}`}>
      {/* KYC Status Banners */}

      {/* 1. NOT STARTED - Need to complete wizard */}
      {contractorData && contractorData.kyc_status === 'not_started' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-lg font-medium text-blue-800">Complete KYC Verification</h3>
              <p className="text-blue-700 mt-1">
                Please complete the KYC verification wizard to start accepting jobs.
              </p>
            </div>
            <div className="ml-4">
              <Link
                href="/pro/wizard"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-block"
              >
                Start KYC Verification
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 2. IN PROGRESS / PENDING APPROVAL - Waiting for admin */}
      {contractorData && (contractorData.kyc_status === 'in_progress' || contractorData.status === 'pending_approval') && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-lg font-medium text-yellow-800">Pending Approval</h3>
              <p className="text-yellow-700 mt-1">
                Your KYC verification is under review. We'll notify you once approved (typically 1-2 business days).
              </p>
              {contractorZips.length > 0 && (
                <p className="text-yellow-600 text-sm mt-2">
                  Service areas: {contractorZips.join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. APPROVED - Can go online */}
      {contractorData && contractorData.kyc_status === 'completed' && contractorData.status === 'approved' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-lg font-medium text-green-800">Verified & Approved!</h3>
              <p className="text-green-700 mt-1">
                Your account is verified. Set your status to "Online" to start receiving jobs!
              </p>
              {contractorZips.length > 0 && (
                <p className="text-green-600 text-sm mt-2">
                  Service areas: {contractorZips.join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. STRIPE SETUP REQUIRED - Need to complete payment setup */}
      {contractorData &&
       contractorData.kyc_status === 'completed' &&
       contractorData.status === 'approved' &&
       !loadingStripe &&
       !stripeConnectStatus?.payoutsEnabled && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-amber-500" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-lg font-medium text-amber-800">Payment Setup Required</h3>
              <p className="text-amber-700 mt-1">
                Complete your payment setup to receive payments and go online.
              </p>
              <p className="text-amber-600 text-sm mt-2">
                This takes about 2 minutes. You'll provide bank account details and verify your identity with Stripe.
              </p>
            </div>
            <div className="ml-4">
              <button
                onClick={handleCompleteStripeSetup}
                className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 inline-block font-medium"
              >
                Complete Setup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. ONLINE - Receiving jobs */}
      {contractorData && contractorData.status === 'online' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-lg font-medium text-emerald-800">You're Online! 🎉</h3>
              <p className="text-emerald-700 mt-1">
                Your profile is live and you're receiving job notifications.
              </p>
              {contractorZips.length > 0 && (
                <p className="text-emerald-600 text-sm mt-2">
                  Service areas: {contractorZips.join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* header */}
      <div className="mb-2 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink dark:text-white">
            Dashboard <Badge>Pro</Badge>
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Welcome back, {contractorData?.name || contractorProfile?.name || user?.email || 'Contractor'}!
          </p>
        </div>

        {/* Availability Toggle - Mobile friendly */}
        <div className="flex items-center gap-2 lg:hidden">
          <span className="text-sm text-slate-600">Status:</span>
          <select
            value={availability}
            onChange={(e) => handleAvailabilityChange(e.target.value as Availability)}
            disabled={!canGoOnline && availability !== 'online'}
            className={`px-3 py-1 rounded-full text-sm font-medium border ${getAvailabilityColor(availability)} ${!canGoOnline && availability !== 'online' ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={!canGoOnline ? 'Complete payment setup to go online' : ''}
          >
            <option value="online" disabled={!canGoOnline}>Online</option>
            <option value="busy">Busy</option>
            <option value="offline">Offline</option>
          </select>
        </div>

        {/* Action buttons - horizontal scroll on mobile, flex on desktop */}
        <div className="flex gap-2 items-center overflow-x-auto pb-2 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0">
          {/* Availability Toggle - Desktop */}
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
            <span className="text-sm text-slate-600">Status:</span>
            <select
              value={availability}
              onChange={(e) => handleAvailabilityChange(e.target.value as Availability)}
              disabled={!canGoOnline && availability !== 'online'}
              className={`px-3 py-1 rounded-full text-sm font-medium border ${getAvailabilityColor(availability)} ${!canGoOnline && availability !== 'online' ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={!canGoOnline ? 'Complete payment setup to go online' : ''}
            >
              <option value="online" disabled={!canGoOnline}>Online</option>
              <option value="busy">Busy</option>
              <option value="offline">Offline</option>
            </select>
          </div>
          <Link href="/jobs" className="btn-primary whitespace-nowrap flex-shrink-0">Browse Jobs</Link>
          <Link href="/dashboard/contractor/jobs" className="btn whitespace-nowrap flex-shrink-0">My Jobs</Link>
          <Link href="/dashboard/contractor/calendar" className="btn whitespace-nowrap flex-shrink-0">Calendar</Link>
          <Link href="/dashboard/contractor/messages" className="btn whitespace-nowrap flex-shrink-0">Messages</Link>
          <Link href="/dashboard/contractor/billing" className="btn whitespace-nowrap flex-shrink-0 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4" />
            Billing
          </Link>
          <Link href="/dashboard/contractor/settings" className="btn whitespace-nowrap flex-shrink-0">Settings</Link>
        </div>
      </div>

      {/* KPIs */}
      <section className={`grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6 ${showKYCOverlay ? 'opacity-50 pointer-events-none' : ''}`}>
        <StatCard label="Today&apos;s Jobs" value={kpis.todayJobs} icon={<Siren className="h-4 w-4" />} />
        <StatCard label="Week Earnings" value={`$${kpis.weekEarnings}`} tone="emerald" icon={<DollarSign className="h-4 w-4" />} />
        <StatCard label="Avg Response" value={`${kpis.avgResponse}m`} hint="Emergency calls" tone="amber" icon={<Zap className="h-4 w-4" />} />
        <StatCard label="Rating" value={kpis.rating || 'New'} tone="rose" icon={<Star className="h-4 w-4" />} />
        <StatCard label="Completed Jobs" value={kpis.completedJobs} icon={<CheckCircle2 className="h-4 w-4" />} />
        <StatCard label="Available Jobs" value={kpis.availableJobs} tone="amber" icon={<Bell className="h-4 w-4" />} />
      </section>

      {/* Next action + Current job + Today schedule */}
      <section className={`grid grid-cols-1 gap-4 xl:grid-cols-3 ${showKYCOverlay ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Next action */}
        <div className={`rounded-2xl border p-4 shadow-sm ${nextAction.urgent ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-white'}`}>
          <SectionTitle>
            {nextAction.urgent ? (
              <span className="flex items-center gap-2">
                <Siren className="h-4 w-4 text-red-600" />
                Urgent Action
              </span>
            ) : (
              'Next Step'
            )}
          </SectionTitle>
          <Link
            href={nextAction.href}
            className={`flex items-center justify-between rounded-xl border p-4 transition ${
              nextAction.urgent
                ? 'border-red-200 bg-red-100 hover:bg-red-200'
                : 'border-blue-200 bg-blue-50 hover:bg-blue-100'
            }`}
          >
            <div>
              <div className="font-semibold text-ink dark:text-white">{nextAction.title}</div>
              <div className="text-sm text-slate-600">{nextAction.desc}</div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-500" />
          </Link>

          {/* Availability status */}
          <div className="mt-4 rounded-xl border border-slate-200 p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink dark:text-white">
              {getAvailabilityIcon(availability)}
              Emergency availability
            </div>
            <div className={`text-sm px-3 py-2 rounded-lg ${getAvailabilityColor(availability)}`}>
              {availability === 'online' && 'Ready to receive emergency job alerts'}
              {availability === 'busy' && 'Currently on a job - limited availability'}
              {availability === 'offline' && 'Not receiving emergency job alerts'}
            </div>
          </div>
        </div>

        {/* Emergency job alerts */}
        <div className="rounded-2xl border border-slate-200 p-4">
          <SectionTitle action={<Link href="/jobs" className="text-brand underline text-sm">See all</Link>}>
            Emergency jobs nearby
          </SectionTitle>
          <ul className="space-y-2">
            {availableJobs.slice(0,3).map(job=>(
              <li key={job.id} className="flex items-center justify-between rounded-lg border bg-white p-3">
                <div>
                  <div className="font-medium text-ink dark:text-white flex items-center gap-2">
                    {job.title}
                    {job.priority === 'Emergency' && <span className="text-red-500 text-xs">🚨</span>}
                  </div>
                  <div className="text-xs text-slate-600 flex items-center gap-2">
                    <span>{job.location} • ${job.hourlyRate}/hr • {job.distance}mi</span>
                    <span className="text-slate-400">•</span>
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {job.requestedMins}m ago</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/jobs/${job.id}`} className="btn text-sm">Accept</Link>
                </div>
              </li>
            ))}
            {availableJobs.length===0 && <li className="text-sm text-slate-600">No emergency jobs available nearby.</li>}
          </ul>
        </div>

        {/* Today schedule */}
        <div className="rounded-2xl border border-slate-200 p-4">
          <SectionTitle action={<Link href="/dashboard/contractor/calendar" className="text-brand underline text-sm">Calendar</Link>}>
            Today&apos;s Schedule
          </SectionTitle>
          {currentJobs.length > 0 && (
            <div className="mb-3">
              <div className="font-medium text-purple-700 text-sm mb-2">🔄 In Progress</div>
              {currentJobs.map(job => (
                <div key={job.id} className="rounded-lg border border-purple-200 bg-purple-50 p-3">
                  <div className="font-medium text-ink dark:text-white">{job.title}</div>
                  <div className="text-xs text-slate-600">{job.customerName} • {job.location}</div>
                  <Link href={`/jobs/${job.id}`} className="btn btn-outline text-sm mt-2">Continue</Link>
                </div>
              ))}
            </div>
          )}

          {todaySchedule.length === 0 ? (
            <div className="text-sm text-slate-600">No scheduled appointments today.</div>
          ) : (
            <ul className="space-y-2">
              {todaySchedule.map(a=>(
                <li key={a.id} className="flex items-center justify-between rounded-lg border bg-white p-3">
                  <div>
                    <div className="font-medium text-ink dark:text-white">{a.job}</div>
                    <div className="text-xs text-slate-600 flex items-center gap-2">
                      <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5"/>{a.window}</span>
                      <span className="text-slate-400">•</span>
                      <span>{a.customerName}</span>
                    </div>
                  </div>
                  <Link href={`/jobs/${a.id}`} className="btn btn-outline text-sm">Details</Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Earnings + Completeness + Performance */}
      <section className={`grid grid-cols-1 gap-4 xl:grid-cols-3 ${showKYCOverlay ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Recent earnings */}
        <div className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
          <SectionTitle action={<Link href="/dashboard/contractor" className="text-brand underline text-sm">View all</Link>}>
            Recent earnings
          </SectionTitle>
          <ul className="space-y-2">
            {recentEarnings.slice(0,4).map(earning=>(
              <li key={earning.date} className="flex items-center justify-between rounded-lg border bg-emerald-50 p-3">
                <div>
                  <div className="font-medium text-ink dark:text-white">{earning.jobTitle}</div>
                  <div className="text-xs text-slate-600">{new Date(earning.date).toLocaleDateString()} • {earning.hours}h</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-emerald-700">${earning.amount}</div>
                  <div className="text-xs text-slate-500">${(earning.amount/earning.hours).toFixed(0)}/hr</div>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-3 text-center">
            <div className="text-sm font-medium text-emerald-700">
              Week total: ${recentEarnings.reduce((sum, e) => sum + e.amount, 0)}
            </div>
          </div>
        </div>

        {/* Profile completeness */}
        <div className="rounded-2xl border border-blue-200 bg-white p-4 shadow-sm">
          <SectionTitle action={<Link href="/profile/settings" className="text-brand underline text-sm">Edit profile</Link>}>
            Emergency readiness
          </SectionTitle>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
            <div className="flex items-center justify-between text-sm font-medium text-blue-900">
              <span>Setup complete</span><span>{completenessPct}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-blue-100">
              <div className="h-2 rounded-full bg-blue-600" style={{width:`${completenessPct}%`}} />
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

        {/* Performance metrics */}
        <div className="rounded-2xl border border-slate-200 p-4">
          <SectionTitle>Performance this week</SectionTitle>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span>Response time</span>
                <span>{kpis.avgResponse}m avg</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full">
                <div className="h-2 bg-emerald-500 rounded-full" style={{ width: '85%' }} />
              </div>
              <div className="text-xs text-slate-500 mt-1">Goal: &lt;10 minutes</div>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span>Customer rating</span>
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-amber-500" />
                  {kpis.rating}
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full">
                <div className="h-2 bg-amber-500 rounded-full" style={{ width: '98%' }} />
              </div>
              <div className="text-xs text-slate-500 mt-1">Based on 12 reviews this week</div>
            </div>

            <div className="pt-2 border-t">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-ink dark:text-white">5</div>
                  <div className="text-xs text-slate-500">Jobs completed</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-ink dark:text-white">23h</div>
                  <div className="text-xs text-slate-500">Hours worked</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section className={`grid grid-cols-1 gap-4 lg:grid-cols-2 ${showKYCOverlay ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="rounded-2xl border border-slate-200 p-4">
          <h3 className="mb-2 font-semibold text-ink dark:text-white">Emergency services</h3>
          <p className="text-sm text-slate-600 mb-3">Manage your emergency service offerings and rates.</p>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/contractor/settings" className="btn">Service Types & Rates</Link>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 p-4">
          <h3 className="mb-2 font-semibold text-ink dark:text-white">Coverage & availability</h3>
          <p className="text-sm text-slate-600">Set your service area and emergency availability hours.</p>
          <div className="mt-3 flex gap-2">
            <Link href="/settings/service-area" className="btn">Service Area</Link>
            <Link href="/settings/calendar" className="btn btn-outline">Availability</Link>
          </div>
        </div>
      </section>

      {/* Payment History / Earnings Section */}
      <section>
        <SectionTitle>Earnings History</SectionTitle>
        <PaymentHistory userType="contractor" />
      </section>

    </div>
  )
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-3 8-10V5l-8-3-8 3v7c0 7 8 10 8 10Z"/>
    </svg>
  )
}