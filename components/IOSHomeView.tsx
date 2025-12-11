// components/IOSHomeView.tsx
// iOS app main view - True native experience with full database integration
'use client'

import React, { useEffect, useMemo, useState, useCallback, Component, ErrorInfo, ReactNode, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useApp } from '../lib/state'
import { useAuth } from '../contexts/AuthContext'
import { useHomeownerStats, HomeownerJob } from '../lib/hooks/useHomeownerStats'
import { useConversations } from '../lib/hooks/useMessaging'
import { supabase } from '../lib/supabaseClient'
import dynamic from 'next/dynamic'
import IOSRegistration from './IOSRegistration'
import IOSTabBar, { TabId } from './IOSTabBar'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { StatusBar, Style } from '@capacitor/status-bar'
import { Keyboard } from '@capacitor/keyboard'
import { getCurrentLocation as getNativeLocation, isNativePlatform } from '../lib/nativeLocation'
import type { FindProMapboxHandle } from './FindProMapbox'
import PaymentModal from './PaymentModal'
import OfferJobModal from './OfferJobModal'

// Error Boundary to catch render errors
interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class IOSErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('IOSHomeView Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-white flex flex-col items-center justify-center p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-500 text-center mb-4 text-sm">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-full font-medium active:scale-95 transition-transform"
          >
            Reload App
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

// Dynamically import the Mapbox component
const FindProMapbox = dynamic(() => import('./FindProMapbox'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
      <LoadingLogo />
    </div>
  )
})

type LatLng = [number, number]

// Haptic feedback helper
const triggerHaptic = async (style: ImpactStyle = ImpactStyle.Light) => {
  try {
    await Haptics.impact({ style })
  } catch (e) {
    // Haptics not available
  }
}

// Animated loading logo - Native iOS style
const LoadingLogo = () => (
  <div className="flex flex-col items-center justify-center">
    <div className="relative flex items-center justify-center">
      <div
        className="absolute w-16 h-16 rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(16, 185, 129, 0.1))',
          animation: 'pulse-ring 1.5s ease-in-out infinite'
        }}
      />
      <div className="relative w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
        <span className="text-white font-bold text-xl">R</span>
      </div>
    </div>
    <style jsx>{`
      @keyframes pulse-ring {
        0% { transform: scale(0.95); opacity: 0.7; }
        50% { transform: scale(1.1); opacity: 0.3; }
        100% { transform: scale(0.95); opacity: 0.7; }
      }
    `}</style>
  </div>
)

// Native iOS List Item component
const ListItem = ({
  icon,
  title,
  subtitle,
  href,
  onClick,
  danger = false,
  showChevron = true
}: {
  icon: React.ReactNode
  title: string
  subtitle?: string
  href?: string
  onClick?: () => void
  danger?: boolean
  showChevron?: boolean
}) => {
  const handlePress = async () => {
    await triggerHaptic()
    onClick?.()
  }

  const content = (
    <div
      className="flex items-center justify-between py-3.5 px-4 active:bg-gray-100"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <div className="flex items-center gap-3">
        <div className={danger ? 'text-red-500' : 'text-gray-500'}>{icon}</div>
        <div>
          <p className={`text-[15px] ${danger ? 'text-red-500' : 'text-gray-900'}`}>{title}</p>
          {subtitle && <p className="text-[13px] text-gray-400">{subtitle}</p>}
        </div>
      </div>
      {showChevron && (
        <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} onClick={handlePress}>
        {content}
      </Link>
    )
  }

  return (
    <button onClick={handlePress} className="w-full text-left">
      {content}
    </button>
  )
}

// Native iOS Card component
const IOSCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`bg-white rounded-xl overflow-hidden ${className}`}
    style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
  >
    {children}
  </div>
)

// Divider component
const Divider = () => <div className="h-px bg-gray-100 ml-14" />

// Bottom Sheet Component for Contractor Card (Uber-style)
interface ContractorBottomSheetProps {
  contractor: any
  onClose: () => void
  onContact: (contractor: any) => void
}

function ContractorBottomSheet({ contractor, onClose, onContact }: ContractorBottomSheetProps) {
  const router = useRouter()

  const handleContact = async () => {
    await triggerHaptic(ImpactStyle.Medium)
    onContact(contractor)
  }

  const handleViewProfile = async () => {
    await triggerHaptic()
    router.push(`/contractors/${contractor.id}`)
  }

  const services = Array.isArray(contractor?.services) ? contractor.services : []
  const rating = contractor?.rating ? Number(contractor.rating).toFixed(1) : null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />
      {/* Bottom Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-h-[70vh] overflow-y-auto"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + 65px)',
          animation: 'slideUp 0.3s ease-out'
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2 sticky top-0 bg-white z-10">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Content */}
        <div className="px-4 pb-4">
          {/* Contractor Info */}
          <div className="flex items-start gap-3 mb-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <span className="text-emerald-700 font-bold text-lg">
                {(contractor?.name || 'C')[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[17px] font-semibold text-gray-900 truncate">
                {contractor?.name || 'Contractor'}
              </h3>
              <p className="text-[13px] text-gray-500">{contractor?.city || 'Local Pro'}</p>
              <div className="flex items-center gap-3 mt-1">
                {rating && (
                  <span className="text-[13px] text-gray-700 flex items-center gap-1">
                    <span className="text-amber-400">★</span> {rating}
                  </span>
                )}
                {contractor?.years_experience && (
                  <span className="text-[13px] text-gray-500">
                    {contractor.years_experience}+ yrs
                  </span>
                )}
                {contractor?.__distance && (
                  <span className="text-[13px] text-gray-500">
                    {contractor.__distance.toFixed(1)} mi
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Services */}
          {services.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {services.slice(0, 4).map((svc: string) => (
                <span
                  key={svc}
                  className="px-2.5 py-1 bg-gray-100 rounded-lg text-[12px] text-gray-700"
                >
                  {svc}
                </span>
              ))}
              {services.length > 4 && (
                <span className="px-2.5 py-1 bg-gray-100 rounded-lg text-[12px] text-gray-500">
                  +{services.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleViewProfile}
              className="flex-1 py-3 rounded-xl font-medium text-[15px] text-gray-700 bg-gray-100 active:scale-98 transition-transform"
            >
              View Profile
            </button>
            <button
              onClick={handleContact}
              className="flex-1 py-3 rounded-xl font-semibold text-[15px] text-white active:scale-98 transition-transform"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
            >
              Send Offer
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>
  )
}

// Uber-style Bid Tracking Overlay
interface Bid {
  id: string
  contractor_id: string
  contractor_name: string
  contractor_rating?: number
  bid_amount: number
  message?: string
  eta_minutes?: number
  created_at: string
  // For distance/ETA calculation
  contractor_latitude?: number
  contractor_longitude?: number
  calculated_eta?: number
  calculated_distance?: string
}

interface BidTrackingOverlayProps {
  job: HomeownerJob | null
  bids: Bid[]
  loading: boolean
  onAccept: (bid: Bid) => void
  onDecline: (bid: Bid) => void
  onClose: () => void
  isMinimized: boolean
  onToggleMinimize: () => void
}

function BidTrackingOverlay({
  job,
  bids,
  loading,
  onAccept,
  onDecline,
  onClose,
  isMinimized,
  onToggleMinimize
}: BidTrackingOverlayProps) {
  const handleAccept = async (bid: Bid) => {
    await triggerHaptic(ImpactStyle.Medium)
    onAccept(bid)
  }

  const handleDecline = async (bid: Bid) => {
    await triggerHaptic()
    onDecline(bid)
  }

  if (!job) return null

  // Minimized state - small pill at top
  if (isMinimized) {
    return (
      <button
        onClick={onToggleMinimize}
        className="fixed top-0 left-4 right-4 z-40 bg-emerald-600 rounded-b-2xl py-3 px-4 flex items-center justify-between active:bg-emerald-700"
        style={{ top: 'calc(env(safe-area-inset-top, 44px) + 110px)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="text-white font-medium text-[14px]">
            {loading ? 'Finding pros...' : `${bids.length} bid${bids.length !== 1 ? 's' : ''} received`}
          </span>
        </div>
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    )
  }

  // Full overlay
  return (
    <div
      className="fixed inset-0 z-40 flex flex-col"
      style={{ paddingTop: 'env(safe-area-inset-top, 44px)' }}
    >
      {/* Semi-transparent map overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onToggleMinimize} />

      {/* Content Container */}
      <div className="relative flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-emerald-600 px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white font-semibold text-[17px]">Finding Pros</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleMinimize}
                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <p className="text-white/80 text-[14px]">{job.title}</p>
        </div>

        {/* Loading Animation */}
        {loading && (
          <div className="bg-white px-4 py-6 flex flex-col items-center">
            <div className="relative w-20 h-20 mb-4">
              {/* Pulsing circles */}
              <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-25" />
              <div className="absolute inset-2 rounded-full bg-emerald-200 animate-ping opacity-25" style={{ animationDelay: '0.2s' }} />
              <div className="absolute inset-4 rounded-full bg-emerald-300 animate-ping opacity-25" style={{ animationDelay: '0.4s' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <p className="text-gray-600 font-medium">Searching for available pros...</p>
            <p className="text-gray-400 text-[13px] mt-1">This usually takes 30-60 seconds</p>
          </div>
        )}

        {/* Bids List */}
        <div
          className="flex-1 bg-gray-50 overflow-auto"
          style={{ paddingBottom: 'calc(65px + env(safe-area-inset-bottom, 20px))' }}
        >
          {bids.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-600 font-medium">Waiting for bids</p>
              <p className="text-gray-400 text-[13px] mt-1 text-center">Pros in your area will respond soon</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {bids.map((bid) => (
                <div
                  key={bid.id}
                  className="bg-white rounded-xl p-4"
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                >
                  {/* Contractor Info */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-emerald-700 font-bold">
                        {(bid.contractor_name || 'C')[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-[15px] text-gray-900">{bid.contractor_name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        {bid.contractor_rating && (
                          <span className="text-[13px] text-gray-600">
                            <span className="text-amber-400">★</span> {bid.contractor_rating.toFixed(1)}
                          </span>
                        )}
                        {bid.eta_minutes && (
                          <span className="text-[13px] text-emerald-600 font-medium">
                            ~{bid.eta_minutes} min away
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[18px] font-bold text-gray-900">${bid.bid_amount}</p>
                      <p className="text-[11px] text-gray-400">quoted</p>
                    </div>
                  </div>

                  {/* Message */}
                  {bid.message && (
                    <p className="text-[13px] text-gray-600 mb-3 line-clamp-2">{bid.message}</p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDecline(bid)}
                      className="flex-1 py-2.5 rounded-lg font-medium text-[14px] text-gray-600 bg-gray-100 active:bg-gray-200 transition-colors"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleAccept(bid)}
                      className="flex-1 py-2.5 rounded-lg font-semibold text-[14px] text-white active:opacity-90 transition-opacity"
                      style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                    >
                      Accept
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Category bubbles for quick access
const CATEGORY_BUBBLES = [
  { key: 'plumbing', label: 'Plumbing', icon: '🔧' },
  { key: 'electrical', label: 'Electrical', icon: '⚡' },
  { key: 'hvac', label: 'HVAC', icon: '❄️' },
  { key: 'roofing', label: 'Roofing', icon: '🏠' },
  { key: 'water-damage', label: 'Water', icon: '💧' },
  { key: 'locksmith', label: 'Locksmith', icon: '🔐' },
  { key: 'appliance', label: 'Appliance', icon: '🔧' },
  { key: 'other', label: 'Other', icon: '🔨' },
]

// Home Tab Content - Split view: Map on top half, Jobs with live bids below
function HomeTab({ center, setCenter, filtered, fetchingLocation, setFetchingLocation, firstName, jobs, jobsLoading, activeJob, bids, bidsLoading, onAcceptBid, onDeclineBid, onCloseBidOverlay, user }: {
  center: LatLng
  setCenter: (c: LatLng) => void
  filtered: any[]
  fetchingLocation: boolean
  setFetchingLocation: (b: boolean) => void
  firstName: string
  jobs: HomeownerJob[]
  jobsLoading: boolean
  activeJob: HomeownerJob | null
  bids: Bid[]
  bidsLoading: boolean
  onAcceptBid: (bid: Bid) => void
  onDeclineBid: (bid: Bid) => void
  onCloseBidOverlay: () => void
  user: any
}) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedContractor, setSelectedContractor] = React.useState<any>(null)
  const [selectedBid, setSelectedBid] = React.useState<Bid | null>(null)
  const [bidDistance, setBidDistance] = React.useState<string | null>(null)
  const [bidAddress, setBidAddress] = React.useState<string | null>(null)
  const [loadingDistance, setLoadingDistance] = React.useState(false)
  const [showPaymentModal, setShowPaymentModal] = React.useState(false)
  const [enrichedBids, setEnrichedBids] = React.useState<Bid[]>([])
  const [loadingETAs, setLoadingETAs] = React.useState(false)
  const [showOfferModal, setShowOfferModal] = React.useState(false)
  const [offerContractor, setOfferContractor] = React.useState<any>(null)

  // Map ref for zoom controls
  const mapRef = useRef<FindProMapboxHandle>(null)

  // Bottom sheet state - minimized shows only the drag handle stripe, expanded covers the map
  const [sheetExpanded, setSheetExpanded] = React.useState(false)
  const [sheetMinimized, setSheetMinimized] = React.useState(false)
  const [isDragging, setIsDragging] = React.useState(false)
  const [startY, setStartY] = React.useState(0)
  const [currentTranslate, setCurrentTranslate] = React.useState(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    setStartY(e.touches[0].clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    const diff = startY - e.touches[0].clientY
    // Limit the drag range based on current state
    // Three states: minimized (stripe only) -> normal (45%) -> expanded (70%)
    const maxUp = 200
    const maxDown = 200
    let clampedDiff: number

    if (sheetMinimized) {
      // From minimized, can only drag up
      clampedDiff = Math.max(0, Math.min(maxUp, diff))
    } else if (sheetExpanded) {
      // From expanded, can only drag down
      clampedDiff = Math.max(-maxDown, Math.min(0, diff))
    } else {
      // From normal, can drag either way
      clampedDiff = Math.max(-maxDown, Math.min(maxUp, diff))
    }
    setCurrentTranslate(clampedDiff)
  }

  const handleTouchEnd = async () => {
    setIsDragging(false)
    const threshold = 60

    if (sheetMinimized) {
      // From minimized: drag up to normal
      if (currentTranslate > threshold) {
        await triggerHaptic()
        setSheetMinimized(false)
      }
    } else if (sheetExpanded) {
      // From expanded: drag down to normal
      if (currentTranslate < -threshold) {
        await triggerHaptic()
        setSheetExpanded(false)
      }
    } else {
      // From normal: drag up to expand, drag down to minimize
      if (currentTranslate > threshold) {
        await triggerHaptic()
        setSheetExpanded(true)
      } else if (currentTranslate < -threshold) {
        await triggerHaptic()
        setSheetMinimized(true)
      }
    }
    setCurrentTranslate(0)
  }

  // Get only the most recent pending job for HomeTab
  // Once a job is confirmed/in_progress/completed, it moves to Jobs tab
  const mostRecentPendingJob = useMemo(() => {
    const pendingJobs = jobs.filter(j => j.status === 'pending')
    return pendingJobs.length > 0 ? pendingJobs[0] : null
  }, [jobs])

  const handleBookPro = async () => {
    await triggerHaptic(ImpactStyle.Medium)
    router.push('/post-job')
  }

  const handleSearch = async () => {
    await triggerHaptic(ImpactStyle.Medium)
    if (searchQuery.trim()) {
      router.push(`/find-pro?search=${encodeURIComponent(searchQuery)}`)
    } else {
      router.push('/find-pro')
    }
  }

  const handleCategoryPress = async (categoryKey: string) => {
    await triggerHaptic()
    router.push(`/find-pro?category=${categoryKey}`)
  }

  const handleLocation = async () => {
    await triggerHaptic()
    setFetchingLocation(true)

    const result = await getNativeLocation()
    if (result.success && result.coordinates) {
      setCenter([result.coordinates.latitude, result.coordinates.longitude])
    }
    setFetchingLocation(false)
  }

  const handleContractorSelect = async (contractor: any) => {
    await triggerHaptic()
    setSelectedContractor(contractor)
  }

  const handleContactContractor = (contractor: any) => {
    // Open the offer modal instead of navigating to post-job
    setOfferContractor(contractor)
    setShowOfferModal(true)
    setSelectedContractor(null)
  }

  // Fetch driving distance and address from Mapbox APIs
  const fetchDistance = async (bid: Bid) => {
    setLoadingDistance(true)
    setBidDistance(null)
    setBidAddress(null)

    try {
      // Get contractor coordinates - use bid location or contractor's address
      const contractorLat = (bid as any).contractor_latitude || (bid as any).latitude
      const contractorLng = (bid as any).contractor_longitude || (bid as any).longitude

      if (!contractorLat || !contractorLng) {
        // If no contractor location, show estimated time based on ETA
        if (bid.eta_minutes) {
          setBidDistance(`~${bid.eta_minutes} min away`)
        } else {
          setBidDistance('Distance unavailable')
        }
        setLoadingDistance(false)
        return
      }

      const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
      if (!MAPBOX_TOKEN) {
        setBidDistance('Distance unavailable')
        setLoadingDistance(false)
        return
      }

      // Fetch directions and reverse geocoding in parallel
      const [directionsResponse, geocodeResponse] = await Promise.all([
        // Mapbox Directions API for driving distance/duration
        fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${contractorLng},${contractorLat};${center[1]},${center[0]}?access_token=${MAPBOX_TOKEN}`
        ),
        // Mapbox Geocoding API for street address
        fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${contractorLng},${contractorLat}.json?access_token=${MAPBOX_TOKEN}&types=address,poi`
        )
      ])

      // Parse directions
      if (directionsResponse.ok) {
        const data = await directionsResponse.json()
        if (data.routes && data.routes[0]) {
          const distanceMeters = data.routes[0].distance
          const durationSeconds = data.routes[0].duration
          const distanceMiles = (distanceMeters / 1609.34).toFixed(1)
          const durationMinutes = Math.round(durationSeconds / 60)
          setBidDistance(`${distanceMiles} mi • ${durationMinutes} min drive`)
        } else {
          setBidDistance('Route unavailable')
        }
      } else {
        setBidDistance('Distance unavailable')
      }

      // Parse address from reverse geocoding
      if (geocodeResponse.ok) {
        const geoData = await geocodeResponse.json()
        if (geoData.features && geoData.features.length > 0) {
          // Get the most relevant feature (first one)
          const feature = geoData.features[0]
          // Extract short address (street name only or POI name)
          const placeName = feature.text || ''
          const context = feature.context || []
          const neighborhood = context.find((c: any) => c.id.startsWith('neighborhood'))?.text
          const locality = context.find((c: any) => c.id.startsWith('locality') || c.id.startsWith('place'))?.text

          // Build a short, readable address
          if (placeName && locality) {
            setBidAddress(`${placeName}, ${locality}`)
          } else if (neighborhood && locality) {
            setBidAddress(`${neighborhood}, ${locality}`)
          } else if (locality) {
            setBidAddress(locality)
          } else if (placeName) {
            setBidAddress(placeName)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching distance:', error)
      setBidDistance('Distance unavailable')
    } finally {
      setLoadingDistance(false)
    }
  }

  // When a bid is selected, fetch its distance and show route on map
  React.useEffect(() => {
    if (selectedBid) {
      fetchDistance(selectedBid)

      // Show route on map if contractor has location
      const contractorLat = (selectedBid as any).contractor_latitude
      const contractorLng = (selectedBid as any).contractor_longitude
      if (contractorLat && contractorLng && mapRef.current) {
        mapRef.current.showRoute(contractorLat, contractorLng, center[0], center[1])
      }
    } else {
      // Clear route when bid is deselected
      if (mapRef.current) {
        mapRef.current.clearRoute()
      }
    }
  }, [selectedBid, center])

  // Calculate ETA for all bids when bids change
  React.useEffect(() => {
    const calculateAllETAs = async () => {
      if (bids.length === 0) {
        setEnrichedBids([])
        return
      }

      setLoadingETAs(true)
      const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

      if (!MAPBOX_TOKEN) {
        setEnrichedBids(bids)
        setLoadingETAs(false)
        return
      }

      // Calculate ETA for each bid in parallel
      const enrichedBidsPromises = bids.map(async (bid) => {
        const contractorLat = (bid as any).contractor_latitude || (bid as any).latitude
        const contractorLng = (bid as any).contractor_longitude || (bid as any).longitude

        // If no contractor location, return bid as-is with existing eta_minutes
        if (!contractorLat || !contractorLng) {
          return { ...bid, calculated_eta: bid.eta_minutes }
        }

        try {
          const response = await fetch(
            `https://api.mapbox.com/directions/v5/mapbox/driving/${contractorLng},${contractorLat};${center[1]},${center[0]}?access_token=${MAPBOX_TOKEN}`
          )

          if (response.ok) {
            const data = await response.json()
            if (data.routes && data.routes[0]) {
              const durationSeconds = data.routes[0].duration
              const distanceMeters = data.routes[0].distance
              const durationMinutes = Math.round(durationSeconds / 60)
              const distanceMiles = (distanceMeters / 1609.34).toFixed(1)
              return {
                ...bid,
                calculated_eta: durationMinutes,
                calculated_distance: `${distanceMiles} mi`
              }
            }
          }
        } catch (error) {
          console.error('Error calculating ETA for bid:', bid.id, error)
        }

        return { ...bid, calculated_eta: bid.eta_minutes }
      })

      const results = await Promise.all(enrichedBidsPromises)
      setEnrichedBids(results)
      setLoadingETAs(false)
    }

    calculateAllETAs()
  }, [bids, center])

  const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  return (
    <div
      className="absolute inset-0 flex flex-col"
      style={{ paddingBottom: 'calc(65px + max(env(safe-area-inset-bottom, 20px), 20px))' }}
    >
      {/* Full-screen Map Background - extends behind status bar (time/wifi icons) */}
      <div className="ios-fullscreen-map z-0">
        <FindProMapbox
          ref={mapRef}
          items={filtered}
          radiusMiles={25}
          searchCenter={center}
          onSearchHere={(c) => setCenter(c)}
          onContractorSelect={handleContractorSelect}
          fullscreen={true}
          hideSearchButton={true}
          hideControls={true}
        />
      </div>

      {/* Floating Search Bar with Dropdown - Fixed position, moved down below status bar */}
      <div
        className="fixed left-4 right-4 z-30"
        style={{ top: 'max(calc(env(safe-area-inset-top, 59px) + 8px), 67px)' }}
      >
        <div
          className="flex items-center gap-3 bg-white rounded-xl px-3 py-2.5"
          style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
        >
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Find a pro..."
            className="flex-1 text-[14px] text-gray-900 placeholder-gray-400 bg-transparent outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center"
            >
              <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <button
            onClick={handleSearch}
            className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center active:scale-95 transition-transform"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
          >
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>

        {/* Category Dropdown - shows when typing */}
        {searchQuery.length > 0 && (
          <div
            className="mt-2 bg-white rounded-xl overflow-hidden"
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
          >
            <div className="p-2">
              <p className="text-[10px] text-gray-400 uppercase font-semibold px-2 mb-2">Categories</p>
              <div className="grid grid-cols-4 gap-1.5">
                {CATEGORY_BUBBLES.filter(cat =>
                  cat.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  cat.key.toLowerCase().includes(searchQuery.toLowerCase())
                ).slice(0, 8).map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => {
                      handleCategoryPress(cat.key)
                      setSearchQuery('')
                    }}
                    className="flex flex-col items-center gap-0.5 p-2 rounded-lg bg-gray-50 active:bg-gray-100 active:scale-95 transition-all"
                  >
                    <span className="text-[14px]">{cat.icon}</span>
                    <span className="text-[8px] font-medium text-gray-600 text-center leading-tight">{cat.label}</span>
                  </button>
                ))}
              </div>
              {CATEGORY_BUBBLES.filter(cat =>
                cat.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                cat.key.toLowerCase().includes(searchQuery.toLowerCase())
              ).length === 0 && (
                <p className="text-center text-gray-400 text-[12px] py-3">No matching categories</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Map Controls - Zoom and Location buttons - Fixed position */}
      <div
        className="fixed right-4 z-30 flex flex-col gap-2"
        style={{ top: 'max(calc(env(safe-area-inset-top, 59px) + 70px), 129px)' }}
      >
        {/* Zoom In */}
        <button
          onClick={() => mapRef.current?.zoomIn()}
          className="w-10 h-10 rounded-lg flex items-center justify-center active:scale-95 transition-transform"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
          }}
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
          </svg>
        </button>

        {/* Zoom Out */}
        <button
          onClick={() => mapRef.current?.zoomOut()}
          className="w-10 h-10 rounded-lg flex items-center justify-center active:scale-95 transition-transform"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
          }}
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
          </svg>
        </button>

        {/* My Location */}
        <button
          onClick={handleLocation}
          className="w-10 h-10 rounded-lg flex items-center justify-center active:scale-95 transition-transform"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
          }}
        >
          {fetchingLocation ? (
            <div className="w-4 h-4 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
            </svg>
          )}
        </button>
      </div>

      {/* Jobs Section - Draggable Bottom Sheet - Fixed position above tab bar */}
      <div
        className={`fixed left-0 right-0 bg-white rounded-t-2xl z-20 flex flex-col ${!isDragging ? 'transition-all duration-300 ease-out' : ''}`}
        style={{
          boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
          height: sheetMinimized ? '80px' : sheetExpanded ? '70%' : '45%',
          transform: `translateY(${-currentTranslate}px)`,
          paddingBottom: sheetMinimized ? '0' : '16px',
          bottom: 'calc(65px + env(safe-area-inset-bottom, 0px))'
        }}
      >
        {/* Pull handle - draggable area */}
        <div
          className="flex flex-col items-center cursor-grab active:cursor-grabbing flex-shrink-0 pt-3 pb-2"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={async () => {
            await triggerHaptic()
            if (sheetMinimized) {
              setSheetMinimized(false)
            } else if (sheetExpanded) {
              setSheetExpanded(false)
            } else {
              setSheetExpanded(true)
            }
          }}
        >
          <div className={`w-12 h-1.5 rounded-full transition-colors ${sheetMinimized ? 'bg-gray-400' : sheetExpanded ? 'bg-emerald-400' : 'bg-gray-300'}`} />
        </div>

        {/* Minimized Preview - shows header row with hint to expand */}
        {sheetMinimized && (
          <div
            className="px-4 flex items-center justify-between"
            onClick={async () => {
              await triggerHaptic()
              setSheetMinimized(false)
            }}
          >
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-[14px] text-gray-900">
                {mostRecentPendingJob ? 'Active Request' : 'Get a Pro Now'}
              </h3>
              {mostRecentPendingJob && (
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              )}
            </div>
            <div className="flex items-center gap-1 text-gray-400">
              <span className="text-[12px]">Tap to expand</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </div>
          </div>
        )}

        {/* Scrollable Content - hidden when minimized */}
        <div className={`flex-1 overflow-auto ${sheetMinimized ? 'hidden' : ''}`}>
          {/* Section Header */}
          <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[15px] text-gray-900">
              {mostRecentPendingJob ? 'Active Request' : 'Get a Pro Now'}
            </h3>
            {mostRecentPendingJob && (
              <span className="px-2 py-0.5 bg-amber-100 rounded-full text-[11px] font-semibold text-amber-700 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                Finding Pros
              </span>
            )}
          </div>
          <button
            onClick={() => router.push('/post-job')}
            className="text-emerald-600 text-[13px] font-medium flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New
          </button>
        </div>

        {/* Single Pending Job with Live Bids */}
        <div className="px-4 pb-4">
          {jobsLoading ? (
            // Loading skeleton
            <div className="bg-gray-50 rounded-xl p-4 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            </div>
          ) : !mostRecentPendingJob ? (
            // Empty state - no pending jobs
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-gray-900 font-semibold text-[17px] mb-1">Post a Job Now</p>
              <p className="text-gray-500 text-[13px] mb-4">Get instant quotes from nearby pros</p>
              <button
                onClick={handleBookPro}
                className="px-6 py-3 rounded-xl font-semibold text-[15px] text-white active:scale-95 transition-transform"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
              >
                Post a Job Now
              </button>
            </div>
          ) : (
            // Contractor bids displayed as avatar cards
            <div className="space-y-3">
              {/* Live Bid Loading Animation */}
              {bidsLoading && bids.length === 0 && (
                <div className="flex flex-col items-center py-6">
                  <div className="relative w-16 h-16 mb-3">
                    <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-25" />
                    <div className="absolute inset-2 rounded-full bg-emerald-200 animate-ping opacity-25" style={{ animationDelay: '0.2s' }} />
                    <div className="absolute inset-4 rounded-full bg-emerald-300 animate-ping opacity-25" style={{ animationDelay: '0.4s' }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 font-medium text-[13px]">Finding available pros...</p>
                  <p className="text-gray-400 text-[11px] mt-1">Usually takes 30-60 seconds</p>
                </div>
              )}

              {/* Contractor Bids - Horizontal scroll of avatar cards with ETA */}
              {(enrichedBids.length > 0 || bids.length > 0) && (
                <div className="overflow-x-auto pb-2 -mx-4 px-4">
                  <div className="flex gap-3" style={{ minWidth: 'min-content' }}>
                    {(enrichedBids.length > 0 ? enrichedBids : bids).map((bid) => {
                      const displayEta = bid.calculated_eta || bid.eta_minutes
                      return (
                        <button
                          key={bid.id}
                          onClick={() => setSelectedBid(bid)}
                          className="flex flex-col items-center p-3 bg-white rounded-xl border border-gray-100 active:scale-95 transition-transform"
                          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)', minWidth: '100px' }}
                        >
                          {/* Avatar */}
                          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-2 relative">
                            <span className="text-emerald-700 font-bold text-[18px]">
                              {(bid.contractor_name || 'C')[0].toUpperCase()}
                            </span>
                            {bid.contractor_rating && (
                              <div className="absolute -bottom-1 -right-1 bg-white rounded-full px-1.5 py-0.5 border border-gray-100 flex items-center gap-0.5">
                                <span className="text-amber-400 text-[10px]">★</span>
                                <span className="text-[10px] font-medium text-gray-700">{bid.contractor_rating.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                          {/* Bid Amount */}
                          <p className="text-[18px] font-bold text-gray-900">${bid.bid_amount}</p>
                          {/* ETA - calculated from Mapbox or fallback */}
                          {displayEta ? (
                            <p className="text-[11px] text-emerald-600 font-medium">~{displayEta} min</p>
                          ) : loadingETAs ? (
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 border border-emerald-300 border-t-emerald-600 rounded-full animate-spin" />
                              <span className="text-[10px] text-gray-400">ETA...</span>
                            </div>
                          ) : bid.calculated_distance ? (
                            <p className="text-[10px] text-gray-500">{bid.calculated_distance}</p>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* No Bids Yet (after loading) */}
              {!bidsLoading && bids.length === 0 && (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 text-[13px] font-medium">Waiting for contractors</p>
                  <p className="text-gray-400 text-[11px] mt-0.5">Pros will respond soon</p>
                </div>
              )}
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Contractor Bottom Sheet */}
      {selectedContractor && (
        <ContractorBottomSheet
          contractor={selectedContractor}
          onClose={() => setSelectedContractor(null)}
          onContact={handleContactContractor}
        />
      )}

      {/* Direct Offer Modal */}
      {showOfferModal && offerContractor && (
        <OfferJobModal
          contractor={{
            id: offerContractor.id,
            name: offerContractor.name || offerContractor.business_name || 'Contractor',
            services: offerContractor.services || [],
            city: offerContractor.city,
            state: offerContractor.state,
            rating: offerContractor.rating
          }}
          onClose={() => {
            setShowOfferModal(false)
            setOfferContractor(null)
          }}
          onSuccess={() => {
            setShowOfferModal(false)
            setOfferContractor(null)
          }}
        />
      )}

      {/* Bid Detail Overlay - Shows when contractor bid is selected */}
      {selectedBid && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSelectedBid(null)}
          />

          {/* Bottom Sheet */}
          <div
            className="relative w-full bg-white rounded-t-3xl"
            style={{
              paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 20px))',
              animation: 'slideUp 0.3s ease-out'
            }}
          >
            {/* Pull Handle */}
            <div className="flex justify-center pt-3 pb-4">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>

            {/* Content */}
            <div className="px-6">
              {/* Contractor Info */}
              <div className="flex items-center gap-4 mb-5">
                {/* Large Avatar */}
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center relative">
                  <span className="text-emerald-700 font-bold text-[28px]">
                    {(selectedBid.contractor_name || 'C')[0].toUpperCase()}
                  </span>
                  {selectedBid.contractor_rating && (
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full px-2 py-1 border border-gray-200 flex items-center gap-1 shadow-sm">
                      <span className="text-amber-400 text-[12px]">★</span>
                      <span className="text-[12px] font-semibold text-gray-700">{selectedBid.contractor_rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {/* Name and Info */}
                <div className="flex-1">
                  <h3 className="text-[20px] font-bold text-gray-900">
                    {selectedBid.contractor_name || 'Contractor'}
                  </h3>
                  <div className="mt-1 space-y-1">
                    {loadingDistance ? (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                        <span className="text-[13px] text-gray-500">Calculating distance...</span>
                      </div>
                    ) : (
                      <>
                        {bidDistance && (
                          <div className="flex items-center gap-1.5 text-emerald-600">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            <span className="text-[13px] font-medium">{bidDistance}</span>
                          </div>
                        )}
                        {bidAddress && (
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-[12px]">{bidAddress}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Bid Details Card */}
              <div className="bg-gray-50 rounded-2xl p-4 mb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[12px] text-gray-500 uppercase font-medium">Their Bid</p>
                    <p className="text-[32px] font-bold text-gray-900">${selectedBid.bid_amount}</p>
                  </div>
                  {selectedBid.eta_minutes && (
                    <div className="text-right">
                      <p className="text-[12px] text-gray-500 uppercase font-medium">Can Arrive In</p>
                      <p className="text-[24px] font-bold text-emerald-600">~{selectedBid.eta_minutes} min</p>
                    </div>
                  )}
                </div>
                {selectedBid.message && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-[13px] text-gray-600">{selectedBid.message}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    triggerHaptic()
                    setSelectedBid(null)
                    setBidDistance(null)
                    setBidAddress(null)
                  }}
                  className="flex-1 py-4 rounded-xl font-semibold text-[16px] text-gray-700 bg-gray-100 active:scale-95 transition-transform"
                >
                  Decline
                </button>
                <button
                  onClick={async () => {
                    await triggerHaptic(ImpactStyle.Medium)
                    // Open payment modal
                    setShowPaymentModal(true)
                  }}
                  className="flex-1 py-4 rounded-xl font-semibold text-[16px] text-white active:scale-95 transition-transform"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                >
                  Accept & Pay
                </button>
              </div>
            </div>
          </div>

          {/* Animation styles */}
          <style jsx>{`
            @keyframes slideUp {
              from { transform: translateY(100%); }
              to { transform: translateY(0); }
            }
          `}</style>
        </div>
      )}

      {/* Stripe Payment Modal */}
      {selectedBid && mostRecentPendingJob && user && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          bidId={selectedBid.id}
          jobId={mostRecentPendingJob.id}
          amount={selectedBid.bid_amount}
          contractorName={selectedBid.contractor_name || 'Contractor'}
          jobTitle={mostRecentPendingJob.title}
          homeownerId={user.id}
          onPaymentSuccess={() => {
            setShowPaymentModal(false)
            setSelectedBid(null)
            setBidDistance(null)
            setBidAddress(null)
            // Refresh jobs to update status
            triggerHaptic(ImpactStyle.Heavy)
          }}
        />
      )}
    </div>
  )
}

// Jobs Tab Content - Connected to real database
function JobsTab({ jobs, loading }: { jobs: HomeownerJob[]; loading: boolean }) {
  const router = useRouter()

  const handleJobPress = async (jobId: string) => {
    await triggerHaptic()
    router.push(`/jobs/${jobId}`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' }
      case 'confirmed': return { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' }
      case 'in_progress': return { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' }
      case 'completed': return { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' }
      case 'cancelled': return { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' }
      default: return { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' }
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div
      className="absolute inset-0 flex flex-col bg-white"
      style={{ paddingBottom: 'calc(65px + max(env(safe-area-inset-bottom, 20px), 20px))' }}
    >
      {/* Green Header */}
      <div
        className="relative z-20"
        style={{
          background: 'linear-gradient(135deg, #10b981, #059669)',
          paddingTop: 'max(env(safe-area-inset-top, 59px), 59px)'
        }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-white font-semibold text-[16px]">My Jobs</p>
          <Link
            href="/post-job"
            className="px-3 py-1.5 rounded-full text-[13px] font-medium text-emerald-600 bg-white active:scale-95 transition-transform"
          >
            + New Job
          </Link>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      ) : jobs.length === 0 ? (
        /* Empty State */
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)' }}
          >
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-900 text-[16px] font-semibold mb-1">No Jobs Yet</p>
          <p className="text-gray-500 text-[14px] text-center mb-5">Book a pro to see your jobs here</p>
          <Link
            href="/post-job"
            className="px-5 py-2.5 rounded-full font-semibold text-[14px] text-white active:scale-95 transition-transform"
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
            }}
          >
            Book a Pro
          </Link>
        </div>
      ) : (
        /* Jobs List */
        <div className="flex-1 overflow-auto">
          <div className="px-4 py-3 space-y-3">
            {jobs.map((job) => {
              const statusStyle = getStatusColor(job.status)
              const createdDate = new Date(job.created_at)
              const timeAgo = (() => {
                const now = new Date()
                const diff = now.getTime() - createdDate.getTime()
                const mins = Math.floor(diff / 60000)
                const hours = Math.floor(mins / 60)
                const days = Math.floor(hours / 24)
                if (mins < 60) return `${mins}m ago`
                if (hours < 24) return `${hours}h ago`
                if (days < 7) return `${days}d ago`
                return createdDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              })()
              return (
                <button
                  key={job.id}
                  onClick={() => handleJobPress(job.id)}
                  className="w-full bg-white rounded-xl p-4 text-left active:scale-[0.98] transition-transform"
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold text-gray-900 line-clamp-1">{job.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[12px] text-gray-500">{job.category}</span>
                        {job.priority === 'emergency' && (
                          <span className="bg-red-100 text-red-700 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                            URGENT
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full ${statusStyle.bg} flex items-center gap-1 flex-shrink-0`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                      <span className={`text-[11px] font-medium ${statusStyle.text} capitalize`}>
                        {job.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Details row */}
                  <div className="flex items-center gap-3 text-[12px] text-gray-500 mb-2">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {timeAgo}
                    </span>
                    {job.address && (
                      <span className="flex items-center gap-1 truncate max-w-[140px]">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        <span className="truncate">{job.address.split(',')[0]}</span>
                      </span>
                    )}
                    {job.scheduled_date && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(job.scheduled_date)}
                      </span>
                    )}
                  </div>

                  {/* Footer row */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                      {(job.bids_count !== undefined && job.bids_count > 0) && (
                        <span className="flex items-center gap-1 text-[12px] text-emerald-600 font-semibold">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          {job.bids_count} bid{job.bids_count > 1 ? 's' : ''}
                        </span>
                      )}
                      {job.estimated_cost && (
                        <span className="text-[13px] font-semibold text-gray-700">
                          Est. ${job.estimated_cost}
                        </span>
                      )}
                      {job.final_cost && (
                        <span className="text-[13px] font-bold text-emerald-600">
                          ${job.final_cost}
                        </span>
                      )}
                    </div>
                    <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// Messages Tab Content - Connected to real conversations
function MessagesTab({ conversations, loading, unreadCount }: {
  conversations: any[]
  loading: boolean
  unreadCount: number
}) {
  const router = useRouter()

  const handleConversationPress = async (conversationId: string) => {
    await triggerHaptic()
    router.push(`/messages?conversation=${conversationId}`)
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return 'now'
    if (minutes < 60) return `${minutes}m`
    if (hours < 24) return `${hours}h`
    if (days < 7) return `${days}d`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div
      className="absolute inset-0 flex flex-col bg-white"
      style={{ paddingBottom: 'calc(65px + max(env(safe-area-inset-bottom, 20px), 20px))' }}
    >
      {/* Green Header */}
      <div
        className="relative z-20"
        style={{
          background: 'linear-gradient(135deg, #10b981, #059669)',
          paddingTop: 'max(env(safe-area-inset-top, 59px), 59px)'
        }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <p className="text-white font-semibold text-[16px]">Messages</p>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 bg-white/20 rounded-full text-[11px] text-white font-medium">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      ) : conversations.length === 0 ? (
        /* Empty State */
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)' }}
          >
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-gray-900 text-[16px] font-semibold mb-1">No Messages</p>
          <p className="text-gray-500 text-[14px] text-center">Your conversations will appear here</p>
        </div>
      ) : (
        /* Conversations List */
        <div className="flex-1 overflow-auto">
          <div className="divide-y divide-gray-100">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => handleConversationPress(conv.id)}
                className="w-full px-4 py-3 flex items-center gap-3 active:bg-gray-50 text-left"
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-700 font-semibold text-[15px]">
                    {(conv.pro_name || conv.homeowner_name || 'R')[0].toUpperCase()}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className={`text-[15px] ${conv.unread_count > 0 ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'} truncate`}>
                      {conv.pro_name || conv.homeowner_name || conv.title || 'Rushr Support'}
                    </p>
                    <span className="text-[12px] text-gray-400 flex-shrink-0 ml-2">
                      {formatTime(conv.last_message_at)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={`text-[13px] truncate ${conv.unread_count > 0 ? 'text-gray-700' : 'text-gray-500'}`}>
                      {conv.last_message_content || 'No messages yet'}
                    </p>
                    {conv.unread_count > 0 && (
                      <span className="ml-2 w-5 h-5 rounded-full bg-emerald-500 text-white text-[11px] font-semibold flex items-center justify-center flex-shrink-0">
                        {conv.unread_count > 9 ? '9+' : conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Notification type
interface Notification {
  id: string
  type: 'bid' | 'message' | 'job_update' | 'payment' | 'system'
  title: string
  body: string
  read: boolean
  created_at: string
  data?: {
    job_id?: string
    bid_id?: string
    conversation_id?: string
  }
}

// Notifications Tab Content
function NotificationsTab({ userId }: { userId: string }) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (fetchError) {
        console.error('Failed to fetch notifications:', fetchError.message)
        setError('Failed to load notifications')
        setNotifications([])
      } else {
        setNotifications(data || [])
      }
    } catch (err) {
      console.error('Error fetching notifications:', err)
      setError('Failed to load notifications')
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()

    // Only subscribe if user exists
    if (!userId) return

    // Subscribe to real-time notifications (will fail silently if table doesn't exist)
    const subscription = supabase
      .channel('notifications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        () => {
          fetchNotifications()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userId])

  const handleNotificationPress = async (notification: Notification) => {
    await triggerHaptic()

    // Mark as read in database
    if (!notification.read) {
      try {
        await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', notification.id)
      } catch (e) {
        // Ignore errors if table doesn't exist
      }
    }

    // Navigate based on type
    if (notification.data?.job_id) {
      router.push(`/jobs/${notification.data.job_id}`)
    } else if (notification.data?.conversation_id) {
      router.push(`/messages?conversation=${notification.data.conversation_id}`)
    } else if (notification.data?.bid_id) {
      router.push(`/dashboard/homeowner/bids`)
    }
  }

  const markAllAsRead = async () => {
    await triggerHaptic()

    // Update local state first
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))

    // Try to update database (ignore errors if table doesn't exist)
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false)
    } catch (e) {
      // Ignore errors
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'bid':
        return (
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
      case 'message':
        return (
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        )
      case 'job_update':
        return (
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        )
      case 'payment':
        return (
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
        )
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
        )
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return 'now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div
      className="absolute inset-0 flex flex-col bg-white"
      style={{ paddingBottom: 'calc(65px + max(env(safe-area-inset-bottom, 20px), 20px))' }}
    >
      {/* Green Header */}
      <div
        className="relative z-20"
        style={{
          background: 'linear-gradient(135deg, #10b981, #059669)',
          paddingTop: 'max(env(safe-area-inset-top, 59px), 59px)'
        }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <p className="text-white font-semibold text-[16px]">Notifications</p>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 bg-white/20 rounded-full text-[11px] text-white font-medium">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-[13px] text-white/80 active:text-white"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      ) : error ? (
        /* Error State with Reload Button */
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg, #fee2e2, #fecaca)' }}
          >
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-gray-900 text-[16px] font-semibold mb-1">{error}</p>
          <p className="text-gray-500 text-[14px] text-center mb-4">Please check your connection and try again</p>
          <button
            onClick={() => fetchNotifications()}
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-full text-[14px] font-medium active:bg-emerald-700 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reload
          </button>
        </div>
      ) : notifications.length === 0 ? (
        /* Empty State */
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)' }}
          >
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <p className="text-gray-900 text-[16px] font-semibold mb-1">All Caught Up</p>
          <p className="text-gray-500 text-[14px] text-center">No new notifications</p>
        </div>
      ) : (
        /* Notifications List */
        <div className="flex-1 overflow-auto">
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationPress(notification)}
                className={`w-full px-4 py-3 flex items-start gap-3 text-left active:bg-gray-50 ${!notification.read ? 'bg-emerald-50/50' : ''}`}
              >
                {getNotificationIcon(notification.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-[14px] ${!notification.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'} line-clamp-1`}>
                      {notification.title}
                    </p>
                    <span className="text-[11px] text-gray-400 flex-shrink-0">
                      {formatTime(notification.created_at)}
                    </span>
                  </div>
                  <p className="text-[13px] text-gray-500 line-clamp-2 mt-0.5">
                    {notification.body}
                  </p>
                </div>
                {!notification.read && (
                  <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 mt-2" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Profile Tab Content - Full Homeowner Dashboard (identical to web version)
function ProfileTab({
  firstName,
  email,
  userRole,
  userProfile,
  user,
  stats,
  jobs,
  jobsLoading,
  onSignOut
}: {
  firstName: string
  email: string
  userRole: string
  userProfile: any
  user: any
  stats: any
  jobs: HomeownerJob[]
  jobsLoading: boolean
  onSignOut: () => void
}) {
  const router = useRouter()
  const isContractor = userRole === 'contractor' || userRole === 'pro'

  const handleSignOut = async () => {
    await triggerHaptic(ImpactStyle.Medium)
    onSignOut()
  }

  const handleNavigation = async (href: string) => {
    await triggerHaptic()
    router.push(href)
  }

  // Compute profile completeness
  const completeness = useMemo(() => {
    if (!user || !userProfile) return []
    return [
      { key: 'email', label: 'Verify email', weight: 15, done: !!user.email_confirmed_at },
      { key: 'phone', label: 'Add phone number', weight: 15, done: !!userProfile.phone },
      { key: 'address', label: 'Add property address', weight: 20, done: !!userProfile.address },
      { key: 'avatar', label: 'Profile photo', weight: 10, done: !!userProfile.avatar_url },
      { key: 'kyc', label: 'Identity verification', weight: 25, done: !!userProfile.kyc_verified },
      { key: 'first', label: 'Book first service', weight: 15, done: !!userProfile.first_job_completed },
    ]
  }, [user, userProfile])

  const completenessPct = useMemo(() => {
    if (completeness.length === 0) return 0
    const totalWeight = completeness.reduce((sum, field) => sum + field.weight, 0)
    const doneWeight = completeness.filter(f => f.done).reduce((sum, field) => sum + field.weight, 0)
    return Math.round((doneWeight / totalWeight) * 100)
  }, [completeness])

  // Get active jobs (not completed)
  const activeJobs = useMemo(() =>
    jobs.filter(j => j.status !== 'completed').slice(0, 5),
    [jobs]
  )

  // Get past/completed jobs
  const pastJobs = useMemo(() =>
    jobs.filter(j => j.status === 'completed').slice(0, 3),
    [jobs]
  )

  // Stats from database
  const kpis = {
    active: stats?.active_services || 0,
    completed: stats?.completed_services || 0,
    unread: stats?.unread_messages || 0,
    saved: stats?.trusted_contractors || 0
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' }
      case 'confirmed': return { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' }
      case 'in_progress': return { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' }
      case 'completed': return { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' }
      case 'cancelled': return { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' }
      default: return { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' }
    }
  }

  // If contractor, show simple profile links
  if (isContractor) {
    return (
      <div
        className="absolute inset-0 flex flex-col bg-gray-50"
        style={{ paddingBottom: 'calc(65px + max(env(safe-area-inset-bottom, 20px), 20px))' }}
      >
        {/* Green Header with Profile Info */}
        <div
          className="relative z-20"
          style={{
            background: 'linear-gradient(135deg, #10b981, #059669)',
            paddingTop: 'max(env(safe-area-inset-top, 59px), 59px)'
          }}
        >
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-white font-bold text-lg">{firstName?.[0]?.toUpperCase() || 'U'}</span>
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-[16px]">{firstName || 'User'}</p>
              <p className="text-white/70 text-[13px]">{email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 bg-white/20 rounded-full text-[11px] text-white font-medium">
                Pro Account
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="px-4 pt-4 space-y-3">
            <IOSCard>
              <button onClick={() => handleNavigation('/dashboard/contractor')} className="w-full">
                <div className="flex items-center justify-between py-3 px-4 active:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <span className="text-[15px] text-gray-900">Pro Dashboard</span>
                  </div>
                  <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </IOSCard>

            <IOSCard>
              <button onClick={handleSignOut} className="w-full">
                <div className="flex items-center justify-center py-3 px-4 active:bg-gray-50">
                  <span className="text-[15px] text-red-500 font-medium">Sign Out</span>
                </div>
              </button>
            </IOSCard>
          </div>
        </div>
      </div>
    )
  }

  // Homeowner Dashboard - Full content identical to web version
  return (
    <div
      className="absolute inset-0 flex flex-col bg-gray-50"
      style={{ paddingBottom: 'calc(65px + max(env(safe-area-inset-bottom, 20px), 20px))' }}
    >
      {/* Green Header with Profile Info */}
      <div
        className="relative z-20"
        style={{
          background: 'linear-gradient(135deg, #10b981, #059669)',
          paddingTop: 'max(env(safe-area-inset-top, 59px), 59px)'
        }}
      >
        <div className="flex items-center gap-3 px-4 py-4">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
            {userProfile?.avatar_url ? (
              <img src={userProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold text-xl">{firstName?.[0]?.toUpperCase() || 'U'}</span>
            )}
          </div>
          {/* User Info */}
          <div className="flex-1">
            <p className="text-white font-semibold text-[17px]">Welcome, {firstName || 'User'}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="px-2 py-0.5 bg-white/20 rounded-full text-[11px] text-white font-medium">
                Homeowner
              </span>
              {completenessPct >= 100 && (
                <span className="px-2 py-0.5 bg-blue-500/30 rounded-full text-[11px] text-white font-medium">
                  ✓ Complete
                </span>
              )}
            </div>
            <p className="text-white/60 text-[12px] mt-1">
              {userProfile?.subscription_type === 'free' ? 'Free Plan' : userProfile?.subscription_type || 'Free Plan'}
              {completenessPct < 100 && ` • Profile ${completenessPct}%`}
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 px-4 pb-4 overflow-x-auto">
          <button
            onClick={() => handleNavigation('/post-job?urgent=1')}
            className="px-4 py-2 rounded-lg font-semibold text-[13px] text-red-600 bg-white flex items-center gap-1.5 active:scale-95 transition-transform whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Emergency
          </button>
          <button
            onClick={() => handleNavigation('/profile/settings')}
            className="px-4 py-2 rounded-lg font-medium text-[13px] text-white/90 bg-white/20 flex items-center gap-1.5 active:scale-95 transition-transform whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Profile
          </button>
          <button
            onClick={() => handleNavigation('/dashboard/homeowner/billing')}
            className="px-4 py-2 rounded-lg font-medium text-[13px] text-white/90 bg-white/20 flex items-center gap-1.5 active:scale-95 transition-transform whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Billing
          </button>
        </div>
      </div>

      {/* Scrollable Dashboard Content */}
      <div className="flex-1 overflow-auto">
        <div className="px-4 py-4 space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Active Services */}
            <div className="bg-white rounded-xl p-3 border border-emerald-100" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[11px] uppercase tracking-wide text-gray-500">Active</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{kpis.active}</p>
              <p className="text-[11px] text-gray-500">services in progress</p>
            </div>

            {/* Completed Services */}
            <div className="bg-white rounded-xl p-3 border border-blue-100" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-[11px] uppercase tracking-wide text-gray-500">Completed</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{kpis.completed}</p>
              <p className="text-[11px] text-gray-500">total services</p>
            </div>

            {/* Unread Messages */}
            <div className="bg-white rounded-xl p-3 border border-amber-100" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-[11px] uppercase tracking-wide text-gray-500">Messages</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{kpis.unread}</p>
              <p className="text-[11px] text-gray-500">unread messages</p>
            </div>

            {/* Trusted Contractors */}
            <div className="bg-white rounded-xl p-3 border border-purple-100" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-[11px] uppercase tracking-wide text-gray-500">Trusted</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{kpis.saved}</p>
              <p className="text-[11px] text-gray-500">contractors saved</p>
            </div>
          </div>

          {/* Active Emergencies Section */}
          <div className="bg-white rounded-xl overflow-hidden border border-red-100" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div className="bg-gradient-to-r from-red-50 to-orange-50 px-4 py-3 flex items-center justify-between border-b border-red-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-red-900 text-[14px]">Active Emergencies</p>
                  <p className="text-[11px] text-red-700">
                    {activeJobs.length > 0 ? `${activeJobs.length} active` : 'No active requests'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleNavigation('/post-job')}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-[12px] font-medium active:scale-95 transition-transform"
              >
                Request Help
              </button>
            </div>

            <div className="p-3">
              {jobsLoading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="w-6 h-6 border-2 border-red-200 border-t-red-600 rounded-full animate-spin" />
                </div>
              ) : activeJobs.length > 0 ? (
                <div className="space-y-2">
                  {activeJobs.map((job) => {
                    const statusStyle = getStatusColor(job.status)
                    const createdDate = new Date(job.created_at)
                    const timeAgo = (() => {
                      const now = new Date()
                      const diff = now.getTime() - createdDate.getTime()
                      const mins = Math.floor(diff / 60000)
                      const hours = Math.floor(mins / 60)
                      const days = Math.floor(hours / 24)
                      if (mins < 60) return `${mins}m ago`
                      if (hours < 24) return `${hours}h ago`
                      if (days < 7) return `${days}d ago`
                      return createdDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    })()
                    return (
                      <button
                        key={job.id}
                        onClick={() => handleNavigation(`/jobs/${job.job_number || job.id}`)}
                        className="w-full bg-red-50 rounded-lg p-3 text-left active:bg-red-100 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0" />
                              <p className="font-semibold text-gray-900 text-[14px] truncate">{job.title}</p>
                            </div>
                            {/* Status row */}
                            <div className="flex items-center gap-2 flex-wrap mb-1.5">
                              {job.priority === 'emergency' && (
                                <span className="bg-red-100 text-red-800 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                                  EMERGENCY
                                </span>
                              )}
                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                                {job.status.replace('_', ' ')}
                              </span>
                              <span className="text-[11px] text-gray-500">{job.category}</span>
                            </div>
                            {/* Details row */}
                            <div className="flex items-center gap-3 text-[11px] text-gray-500">
                              <span className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {timeAgo}
                              </span>
                              {job.address && (
                                <span className="flex items-center gap-1 truncate max-w-[120px]">
                                  <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  </svg>
                                  <span className="truncate">{job.address.split(',')[0]}</span>
                                </span>
                              )}
                              {(job.bids_count !== undefined && job.bids_count > 0) && (
                                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                  {job.bids_count} bid{job.bids_count > 1 ? 's' : ''}
                                </span>
                              )}
                              {job.estimated_cost && (
                                <span className="font-medium text-gray-700">${job.estimated_cost}</span>
                              )}
                            </div>
                          </div>
                          <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium text-[14px]">No Active Emergencies</p>
                  <p className="text-gray-500 text-[12px] mt-1">Request help when you need it</p>
                </div>
              )}
            </div>
          </div>

          {/* Profile Completeness */}
          {completenessPct < 100 && (
            <div className="bg-white rounded-xl p-4 border border-emerald-100" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-gray-900 text-[14px]">Profile Completeness</p>
                <button
                  onClick={() => handleNavigation('/profile/settings')}
                  className="text-emerald-600 text-[12px] font-medium"
                >
                  Complete Now
                </button>
              </div>
              <div className="bg-emerald-50 rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between text-[12px] font-medium text-emerald-900 mb-1.5">
                  <span>Overall</span>
                  <span>{completenessPct}%</span>
                </div>
                <div className="h-2 rounded-full bg-emerald-100">
                  <div className="h-2 rounded-full bg-emerald-600" style={{ width: `${completenessPct}%` }} />
                </div>
              </div>
              <div className="space-y-2">
                {completeness.filter(f => !f.done).slice(0, 3).map((f) => (
                  <button
                    key={f.key}
                    onClick={() => handleNavigation('/profile/settings')}
                    className="w-full flex items-center justify-between p-2.5 bg-amber-50 rounded-lg text-left active:bg-amber-100 transition-colors"
                  >
                    <span className="text-[13px] text-gray-700">{f.label}</span>
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Past Jobs Section */}
          {pastJobs.length > 0 && (
            <div className="bg-white rounded-xl overflow-hidden border border-gray-100" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
                <p className="font-semibold text-gray-900 text-[14px]">Recent Jobs</p>
                <button
                  onClick={() => handleNavigation('/history')}
                  className="text-emerald-600 text-[12px] font-medium flex items-center gap-1"
                >
                  View All
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <div className="p-3 space-y-2">
                {pastJobs.map((job) => {
                  const completedDate = job.completed_date ? new Date(job.completed_date) : new Date(job.created_at)
                  const dateStr = completedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  return (
                    <button
                      key={job.id}
                      onClick={() => handleNavigation(`/jobs/${job.job_number || job.id}`)}
                      className="w-full bg-gray-50 rounded-lg p-3 text-left active:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4.5 h-4.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="font-semibold text-gray-900 text-[13px] truncate">{job.title}</p>
                            {job.final_cost && (
                              <span className="text-[14px] font-bold text-emerald-600 flex-shrink-0">${job.final_cost}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                              Completed
                            </span>
                            <span className="text-[11px] text-gray-500">{job.category}</span>
                          </div>
                          {/* Details row */}
                          <div className="flex items-center gap-3 text-[11px] text-gray-500">
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {dateStr}
                            </span>
                            {job.address && (
                              <span className="flex items-center gap-1 truncate">
                                <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                </svg>
                                <span className="truncate">{job.address.split(',')[0]}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Quick Links */}
          <IOSCard>
            <button onClick={() => handleNavigation('/dashboard/homeowner/billing')} className="w-full">
              <div className="flex items-center justify-between py-3 px-4 active:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <span className="text-[15px] text-gray-900">Billing & Payments</span>
                </div>
                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
            <div className="h-px bg-gray-100 ml-14" />
            <button onClick={() => handleNavigation('/dashboard/homeowner/transactions')} className="w-full">
              <div className="flex items-center justify-between py-3 px-4 active:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                    </svg>
                  </div>
                  <span className="text-[15px] text-gray-900">Transaction History</span>
                </div>
                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
            <div className="h-px bg-gray-100 ml-14" />
            <button onClick={() => handleNavigation('/contact')} className="w-full">
              <div className="flex items-center justify-between py-3 px-4 active:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-[15px] text-gray-900">Help & Support</span>
                </div>
                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </IOSCard>

          {/* Sign Out */}
          <IOSCard>
            <button onClick={handleSignOut} className="w-full">
              <div className="flex items-center justify-center py-3 px-4 active:bg-gray-50">
                <span className="text-[15px] text-red-500 font-medium">Sign Out</span>
              </div>
            </button>
          </IOSCard>

          {/* App Version */}
          <p className="text-center text-gray-400 text-[12px] pt-2 pb-4">Rushr v1.0.0</p>
        </div>
      </div>
    </div>
  )
}

export default function IOSHomeView() {
  const { state } = useApp()
  const { user, userProfile, loading: authLoading, signOut } = useAuth()
  const allContractors: any[] = Array.isArray((state as any)?.contractors)
    ? (state as any).contractors
    : []

  // Database hooks - fetch real data from Supabase
  const { jobs, stats, loading: jobsLoading } = useHomeownerStats()
  const { conversations, loading: conversationsLoading } = useConversations()

  // Tab state
  const [activeTab, setActiveTab] = useState<TabId>('home')

  // Get first name for greeting
  const firstName = userProfile?.name?.split(' ')[0] || ''
  const email = userProfile?.email || user?.email || ''

  // Location state
  const [center, setCenter] = useState<LatLng>([40.7128, -74.006])
  const [fetchingLocation, setFetchingLocation] = useState(false)

  // Bid tracking state for Uber-style overlay
  const [activeJob, setActiveJob] = useState<HomeownerJob | null>(null)
  const [bids, setBids] = useState<Bid[]>([])
  const [bidsLoading, setBidsLoading] = useState(false)

  // Initialize native plugins
  useEffect(() => {
    const initNative = async () => {
      try {
        // Enable overlay mode so content draws behind status bar (for fullscreen map)
        await StatusBar.setOverlaysWebView({ overlay: true })
        // Set status bar style (dark text on transparent background)
        await StatusBar.setStyle({ style: Style.Dark })
      } catch (e) {
        // Status bar not available
      }

      try {
        // Setup keyboard listeners
        Keyboard.addListener('keyboardWillShow', () => {
          document.body.classList.add('keyboard-open')
        })
        Keyboard.addListener('keyboardWillHide', () => {
          document.body.classList.remove('keyboard-open')
        })
      } catch (e) {
        // Keyboard plugin not available
      }
    }

    initNative()
  }, [])

  // Get user location on mount - uses native Capacitor Geolocation
  useEffect(() => {
    const fetchLocation = async () => {
      setFetchingLocation(true)
      const result = await getNativeLocation()
      if (result.success && result.coordinates) {
        setCenter([result.coordinates.latitude, result.coordinates.longitude])
      }
      setFetchingLocation(false)
    }

    fetchLocation()
  }, [])

  // Check for active jobs (pending with no contractor) when jobs update
  useEffect(() => {
    if (jobs && jobs.length > 0) {
      // Find the most recent pending job waiting for bids
      const pendingJob = jobs.find(
        (job) => job.status === 'pending' && !job.contractor_id
      )
      if (pendingJob && !activeJob) {
        setActiveJob(pendingJob)
        setBidsLoading(true)
        // Set loading to false after a brief delay to show the animation
        const timer = setTimeout(() => setBidsLoading(false), 3000)
        return () => clearTimeout(timer)
      }
    }
  }, [jobs])

  // Real-time subscription for bids on the active job
  useEffect(() => {
    if (!activeJob || !user) return

    // Subscribe to direct_offers for this job
    const subscription = supabase
      .channel(`bids_${activeJob.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'direct_offers',
          filter: `job_id=eq.${activeJob.id}`
        },
        async (payload) => {
          // Fetch the updated bids list
          const { data } = await supabase
            .from('direct_offers')
            .select(`
              id,
              contractor_id,
              price,
              message,
              status,
              created_at,
              user_profiles:contractor_id (
                name,
                rating
              )
            `)
            .eq('job_id', activeJob.id)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })

          if (data) {
            const formattedBids: Bid[] = data.map((offer: any) => ({
              id: offer.id,
              contractor_id: offer.contractor_id,
              contractor_name: offer.user_profiles?.name || 'Contractor',
              contractor_rating: offer.user_profiles?.rating,
              bid_amount: offer.price,
              message: offer.message,
              created_at: offer.created_at
            }))
            setBids(formattedBids)
          }
        }
      )
      .subscribe()

    // Initial fetch of existing bids
    const fetchExistingBids = async () => {
      const { data } = await supabase
        .from('direct_offers')
        .select(`
          id,
          contractor_id,
          price,
          message,
          status,
          created_at,
          user_profiles:contractor_id (
            name,
            rating
          )
        `)
        .eq('job_id', activeJob.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (data) {
        const formattedBids: Bid[] = data.map((offer: any) => ({
          id: offer.id,
          contractor_id: offer.contractor_id,
          contractor_name: offer.user_profiles?.name || 'Contractor',
          contractor_rating: offer.user_profiles?.rating,
          bid_amount: offer.price,
          message: offer.message,
          created_at: offer.created_at
        }))
        setBids(formattedBids)
      }
    }

    fetchExistingBids()

    return () => {
      subscription.unsubscribe()
    }
  }, [activeJob, user])

  // Handler for accepting a bid
  const handleAcceptBid = async (bid: Bid) => {
    if (!activeJob) return

    try {
      // Update the direct_offer status to accepted
      await supabase
        .from('direct_offers')
        .update({ status: 'accepted' })
        .eq('id', bid.id)

      // Update the job with the contractor
      await supabase
        .from('homeowner_jobs')
        .update({
          contractor_id: bid.contractor_id,
          status: 'confirmed',
          estimated_cost: bid.bid_amount
        })
        .eq('id', activeJob.id)

      // Decline all other pending bids
      await supabase
        .from('direct_offers')
        .update({ status: 'declined' })
        .eq('job_id', activeJob.id)
        .neq('id', bid.id)
        .eq('status', 'pending')

      // Clear the active job overlay
      setActiveJob(null)
      setBids([])
    } catch (error) {
      console.error('Error accepting bid:', error)
    }
  }

  // Handler for declining a bid
  const handleDeclineBid = async (bid: Bid) => {
    try {
      // Update the direct_offer status to declined
      await supabase
        .from('direct_offers')
        .update({ status: 'declined' })
        .eq('id', bid.id)

      // Remove from local state
      setBids((prev) => prev.filter((b) => b.id !== bid.id))
    } catch (error) {
      console.error('Error declining bid:', error)
    }
  }

  // Distance helper
  function distMiles(a: LatLng, b: LatLng) {
    const toRad = (d: number) => (d * Math.PI) / 180
    const R = 3958.8
    const dLat = toRad(b[0] - a[0])
    const dLng = toRad(b[1] - a[1])
    const s1 = Math.sin(dLat / 2)
    const s2 = Math.sin(dLng / 2)
    const t = s1 * s1 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * s2 * s2
    const c = 2 * Math.atan2(Math.sqrt(t), Math.sqrt(1 - t))
    return R * c
  }

  // Filter contractors
  const filtered = useMemo(() => {
    let items = (allContractors || [])
      .map((c) => ({ ...c }))
      .filter((c) => {
        const lat = Number(c?.loc?.lat ?? c?.latitude)
        const lng = Number(c?.loc?.lng ?? c?.longitude)
        if (!isFinite(lat) || !isFinite(lng)) return false

        const d = distMiles(center, [lat, lng])
        ;(c as any).__distance = d
        if (d > 25) return false

        return true
      })

    items.sort((a, b) => (a.__distance ?? 1e9) - (b.__distance ?? 1e9))
    return items.slice(0, 10)
  }, [allContractors, center])

  // Show registration/login screen if not authenticated
  if (!authLoading && !user) {
    return <IOSRegistration />
  }

  // Loading state with animated logo
  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <LoadingLogo />
      </div>
    )
  }

  // Main app view with bottom tabs
  return (
    <IOSErrorBoundary>
      <div className="fixed inset-0 bg-gray-50 flex flex-col">
        {/* Tab Content */}
        {activeTab === 'home' && (
          <HomeTab
            center={center}
            setCenter={setCenter}
            filtered={filtered}
            fetchingLocation={fetchingLocation}
            setFetchingLocation={setFetchingLocation}
            firstName={firstName}
            jobs={jobs}
            jobsLoading={jobsLoading}
            activeJob={activeJob}
            bids={bids}
            bidsLoading={bidsLoading}
            onAcceptBid={handleAcceptBid}
            onDeclineBid={handleDeclineBid}
            onCloseBidOverlay={() => setActiveJob(null)}
            user={user}
          />
        )}
        {activeTab === 'jobs' && <JobsTab jobs={jobs} loading={jobsLoading} />}
        {activeTab === 'messages' && (
          <MessagesTab
            conversations={conversations}
            loading={conversationsLoading}
            unreadCount={conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0)}
          />
        )}
        {activeTab === 'notifications' && <NotificationsTab userId={user?.id || ''} />}
        {activeTab === 'profile' && (
          <ProfileTab
            firstName={firstName}
            email={email}
            userRole={userProfile?.role || 'homeowner'}
            userProfile={userProfile}
            user={user}
            stats={stats}
            jobs={jobs}
            jobsLoading={jobsLoading}
            onSignOut={signOut}
          />
        )}

        {/* Bottom Tab Bar */}
        <IOSTabBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          unreadMessages={conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0)}
          unreadNotifications={stats?.unread_messages || 0}
        />
      </div>
    </IOSErrorBoundary>
  )
}
