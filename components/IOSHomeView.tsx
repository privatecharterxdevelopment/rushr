// components/IOSHomeView.tsx
// iOS app main view - Native app experience with bottom tabs
'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useApp } from '../lib/state'
import { useAuth } from '../contexts/AuthContext'
import dynamic from 'next/dynamic'
import IOSRegistration from './IOSRegistration'
import IOSTabBar, { TabId } from './IOSTabBar'

// Dynamically import the Mapbox component
const FindProMapbox = dynamic(() => import('./FindProMapbox'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center">
          <span className="text-white font-bold text-xl">R</span>
        </div>
      </div>
    </div>
  )
})

type LatLng = [number, number]

// Animated loading logo
const LoadingLogo = () => (
  <div className="fixed inset-0 bg-white flex flex-col items-center justify-center">
    <div className="relative flex items-center justify-center">
      <div className="absolute w-20 h-20 bg-emerald-400/20 rounded-2xl animate-ping" style={{ animationDuration: '2s' }} />
      <div className="relative w-14 h-14 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
        <span className="text-white font-bold text-2xl">R</span>
      </div>
    </div>
  </div>
)

// Home Tab Content - Map with Book a Pro
function HomeTab({ center, setCenter, filtered, fetchingLocation, setFetchingLocation, firstName }: {
  center: LatLng
  setCenter: (c: LatLng) => void
  filtered: any[]
  fetchingLocation: boolean
  setFetchingLocation: (b: boolean) => void
  firstName: string
}) {
  return (
    <div className="absolute inset-0 pb-20">
      {/* Full-screen Map */}
      <div className="absolute inset-0">
        <FindProMapbox
          items={filtered}
          radiusMiles={25}
          searchCenter={center}
          onSearchHere={(c) => setCenter(c)}
        />
      </div>

      {/* Floating Top Bar */}
      <div className="absolute top-0 left-0 right-0 pt-safe px-4 pb-3 z-10">
        <div className="flex items-center justify-between pt-2">
          {/* Hello username */}
          <div className="bg-white rounded-full px-4 py-2 shadow-lg">
            <p className="text-gray-900 font-medium text-sm">
              {firstName ? `Hello, ${firstName}` : 'Hello'}
            </p>
          </div>

          {/* Book a Pro button */}
          <Link
            href="/post-job"
            className="bg-emerald-600 text-white px-5 py-2.5 rounded-full font-semibold text-sm shadow-lg active:bg-emerald-700"
          >
            Book a Pro
          </Link>
        </div>
      </div>

      {/* My Location button */}
      <div className="absolute bottom-24 right-4 z-10">
        <button
          onClick={() => {
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
          }}
          className="w-11 h-11 bg-white rounded-full shadow-lg flex items-center justify-center active:bg-gray-50"
        >
          {fetchingLocation ? (
            <div className="w-5 h-5 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}

// Jobs Tab Content
function JobsTab() {
  return (
    <div className="flex-1 bg-gray-50 pt-safe">
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-gray-900">My Jobs</h1>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-gray-500 text-sm text-center">No jobs yet</p>
        <p className="text-gray-400 text-xs text-center mt-1">Book a pro to see your jobs here</p>
        <Link
          href="/post-job"
          className="mt-4 bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm active:bg-emerald-700"
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
    <div className="flex-1 bg-gray-50 pt-safe">
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-gray-900">Messages</h1>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="text-gray-500 text-sm text-center">No messages yet</p>
        <p className="text-gray-400 text-xs text-center mt-1">Your conversations will appear here</p>
      </div>
    </div>
  )
}

// Notifications Tab Content
function NotificationsTab() {
  return (
    <div className="flex-1 bg-gray-50 pt-safe">
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <p className="text-gray-500 text-sm text-center">No notifications</p>
        <p className="text-gray-400 text-xs text-center mt-1">You're all caught up!</p>
      </div>
    </div>
  )
}

// Profile Tab Content
function ProfileTab({ firstName, email, onSignOut }: { firstName: string, email: string, onSignOut: () => void }) {
  return (
    <div className="flex-1 bg-gray-50 pt-safe">
      <div className="px-4 pt-4 pb-4">
        <h1 className="text-xl font-bold text-gray-900">Profile</h1>
      </div>

      {/* Profile Card */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
              <span className="text-emerald-600 font-bold text-xl">{firstName?.[0] || 'U'}</span>
            </div>
            <div>
              <p className="text-gray-900 font-semibold">{firstName || 'User'}</p>
              <p className="text-gray-400 text-sm">{email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-4 space-y-2 pb-24">
        <Link href="/dashboard" className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm active:bg-gray-50">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-gray-900 text-sm font-medium">Job History</span>
          </div>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <Link href="/settings" className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm active:bg-gray-50">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-gray-900 text-sm font-medium">Settings</span>
          </div>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <Link href="/help" className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm active:bg-gray-50">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-gray-900 text-sm font-medium">Help & Support</span>
          </div>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <button
          onClick={onSignOut}
          className="w-full flex items-center justify-between bg-white rounded-xl p-4 shadow-sm active:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="text-red-500 text-sm font-medium">Sign Out</span>
          </div>
        </button>
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
        if (d > 25) return false // 25 mile radius

        return true
      })

    // Sort by distance
    items.sort((a, b) => (a.__distance ?? 1e9) - (b.__distance ?? 1e9))
    return items.slice(0, 10) // Limit to 10 nearest
  }, [allContractors, center])

  // Show registration/login screen if not authenticated
  if (!authLoading && !user) {
    return <IOSRegistration />
  }

  // Loading state with animated logo
  if (authLoading) {
    return <LoadingLogo />
  }

  // Main app view with bottom tabs
  return (
    <div className="fixed inset-0 bg-white flex flex-col">
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
