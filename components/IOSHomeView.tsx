// components/IOSHomeView.tsx
// iOS app main view - True native experience
'use client'

import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useApp } from '../lib/state'
import { useAuth } from '../contexts/AuthContext'
import dynamic from 'next/dynamic'
import IOSRegistration from './IOSRegistration'
import IOSTabBar, { TabId } from './IOSTabBar'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { StatusBar, Style } from '@capacitor/status-bar'
import { Keyboard } from '@capacitor/keyboard'

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

// Home Tab Content - Map with Green Header and Search Input
function HomeTab({ center, setCenter, filtered, fetchingLocation, setFetchingLocation, firstName }: {
  center: LatLng
  setCenter: (c: LatLng) => void
  filtered: any[]
  fetchingLocation: boolean
  setFetchingLocation: (b: boolean) => void
  firstName: string
}) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = React.useState('')

  const handleBookPro = async () => {
    await triggerHaptic(ImpactStyle.Medium)
    router.push('/post-job')
  }

  const handleSearch = async () => {
    await triggerHaptic(ImpactStyle.Medium)
    if (searchQuery.trim()) {
      router.push(`/post-job?service=${encodeURIComponent(searchQuery)}`)
    } else {
      router.push('/post-job')
    }
  }

  const handleLocation = async () => {
    await triggerHaptic()
    if (navigator.geolocation) {
      setFetchingLocation(true)
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCenter([pos.coords.latitude, pos.coords.longitude])
          setFetchingLocation(false)
        },
        () => setFetchingLocation(false)
      )
    }
  }

  return (
    <div className="absolute inset-0 flex flex-col">
      {/* Green Header */}
      <div
        className="relative z-20"
        style={{
          background: 'linear-gradient(135deg, #10b981, #059669)',
          paddingTop: 'env(safe-area-inset-top, 44px)'
        }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          {/* Hello username - White text */}
          <p className="text-white font-semibold text-[16px]">
            {firstName ? `Hello, ${firstName}` : 'Hello'}
          </p>

          {/* Book a Pro button - White pill */}
          <button
            onClick={handleBookPro}
            className="px-4 py-2 rounded-full font-semibold text-[14px] text-emerald-600 bg-white active:scale-95 transition-transform"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
          >
            Book a Pro
          </button>
        </div>
      </div>

      {/* Full-screen Map */}
      <div className="flex-1 relative">
        <FindProMapbox
          items={filtered}
          radiusMiles={25}
          searchCenter={center}
          onSearchHere={(c) => setCenter(c)}
          fullscreen={true}
        />

        {/* My Location button - positioned above search bar and tab bar */}
        <div className="absolute right-4 z-10" style={{ bottom: 'calc(80px + 65px + max(env(safe-area-inset-bottom, 20px), 20px))' }}>
          <button
            onClick={handleLocation}
            className="w-11 h-11 rounded-full flex items-center justify-center active:scale-95 transition-transform"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.15)'
            }}
          >
            {fetchingLocation ? (
              <div className="w-5 h-5 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
              </svg>
            )}
          </button>
        </div>

        {/* Floating Search Input at Bottom - above tab bar */}
        <div className="absolute left-4 right-4 z-10" style={{ bottom: 'calc(16px + 65px + max(env(safe-area-inset-bottom, 20px), 20px))' }}>
          <div
            className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3"
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
          >
            <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="What do you need help with?"
              className="flex-1 text-[16px] text-gray-900 placeholder-gray-400 bg-transparent outline-none"
            />
            <button
              onClick={handleSearch}
              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Jobs Tab Content
function JobsTab() {
  return (
    <div
      className="absolute inset-0 flex flex-col bg-white"
      style={{ paddingBottom: 'calc(65px + max(env(safe-area-inset-bottom, 20px), 20px))' }}
    >
      {/* Green Header - consistent with Home tab */}
      <div
        className="relative z-20"
        style={{
          background: 'linear-gradient(135deg, #10b981, #059669)',
          paddingTop: 'env(safe-area-inset-top, 44px)'
        }}
      >
        <div className="flex items-center justify-center px-4 py-3">
          <p className="text-white font-semibold text-[16px]">My Jobs</p>
        </div>
      </div>

      {/* Empty State */}
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
    </div>
  )
}

// Messages Tab Content
function MessagesTab() {
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
          paddingTop: 'env(safe-area-inset-top, 44px)'
        }}
      >
        <div className="flex items-center justify-center px-4 py-3">
          <p className="text-white font-semibold text-[16px]">Messages</p>
        </div>
      </div>

      {/* Empty State */}
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
    </div>
  )
}

// Notifications Tab Content
function NotificationsTab() {
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
          paddingTop: 'env(safe-area-inset-top, 44px)'
        }}
      >
        <div className="flex items-center justify-center px-4 py-3">
          <p className="text-white font-semibold text-[16px]">Notifications</p>
        </div>
      </div>

      {/* Empty State */}
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
    </div>
  )
}

// Profile Tab Content
function ProfileTab({ firstName, email, onSignOut }: { firstName: string; email: string; onSignOut: () => void }) {
  const router = useRouter()

  const handleSignOut = async () => {
    await triggerHaptic(ImpactStyle.Medium)
    onSignOut()
  }

  const handleNavigation = async (href: string) => {
    await triggerHaptic()
    router.push(href)
  }

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
          paddingTop: 'env(safe-area-inset-top, 44px)'
        }}
      >
        <div className="flex items-center gap-3 px-4 py-4">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-white font-bold text-lg">{firstName?.[0]?.toUpperCase() || 'U'}</span>
          </div>
          {/* User Info */}
          <div className="flex-1">
            <p className="text-white font-semibold text-[16px]">{firstName || 'User'}</p>
            <p className="text-white/70 text-[13px]">{email}</p>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto">
        {/* Menu Items */}
        <div className="px-4 pt-4 space-y-3">
          {/* Account Section */}
          <IOSCard>
            <button onClick={() => handleNavigation('/dashboard/homeowner')} className="w-full">
              <div className="flex items-center justify-between py-3 px-4 active:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <span className="text-[15px] text-gray-900">Dashboard</span>
                </div>
                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
            <div className="h-px bg-gray-100 ml-14" />
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
          </IOSCard>

          {/* Settings Section */}
          <IOSCard>
            <button onClick={() => handleNavigation('/profile/settings')} className="w-full">
              <div className="flex items-center justify-between py-3 px-4 active:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span className="text-[15px] text-gray-900">Profile Settings</span>
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
  const router = useRouter()
  const allContractors: any[] = Array.isArray((state as any)?.contractors)
    ? (state as any).contractors
    : []

  // Tab state
  const [activeTab, setActiveTab] = useState<TabId>('home')

  // Get first name for greeting
  const firstName = userProfile?.name?.split(' ')[0] || ''
  const email = userProfile?.email || user?.email || ''

  // Location state
  const [center, setCenter] = useState<LatLng>([40.7128, -74.006])
  const [fetchingLocation, setFetchingLocation] = useState(false)

  // Initialize native plugins
  useEffect(() => {
    const initNative = async () => {
      try {
        // Set status bar style
        await StatusBar.setStyle({ style: Style.Light })
        await StatusBar.setBackgroundColor({ color: '#ffffff' })
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

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      setFetchingLocation(true)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setCenter([latitude, longitude])
          setFetchingLocation(false)
        },
        () => {
          setFetchingLocation(false)
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    }
  }, [])

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
        />
      )}
      {activeTab === 'jobs' && <JobsTab />}
      {activeTab === 'messages' && <MessagesTab />}
      {activeTab === 'notifications' && <NotificationsTab />}
      {activeTab === 'profile' && (
        <ProfileTab
          firstName={firstName}
          email={email}
          onSignOut={signOut}
        />
      )}

      {/* Bottom Tab Bar */}
      <IOSTabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  )
}
