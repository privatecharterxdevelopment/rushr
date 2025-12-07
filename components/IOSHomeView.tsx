// components/IOSHomeView.tsx
// iOS app homepage - Grab/Uber style with full-screen map and bottom sheet
'use client'

import React, { useEffect, useMemo, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useApp } from '../lib/state'
import { useAuth } from '../contexts/AuthContext'
import { openAuth } from './AuthModal'
import dynamic from 'next/dynamic'
import IOSRegistration from './IOSRegistration'

// Dynamically import the Mapbox component
const FindProMapbox = dynamic(() => import('./FindProMapbox'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
      <div className="text-slate-400">Loading map...</div>
    </div>
  )
})

type LatLng = [number, number]

// Service categories with icons
const SERVICE_CATEGORIES = [
  { id: 'Plumbing', label: 'Plumbing', icon: '🚿' },
  { id: 'Electrical', label: 'Electrical', icon: '⚡' },
  { id: 'HVAC', label: 'HVAC', icon: '❄️' },
  { id: 'Locksmith', label: 'Locksmith', icon: '🔐' },
  { id: 'Auto Battery', label: 'Jump Start', icon: '🔋' },
  { id: 'Tow', label: 'Towing', icon: '🚗' },
]

export default function IOSHomeView() {
  const { state } = useApp()
  const { user, userProfile, loading: authLoading } = useAuth()
  const router = useRouter()
  const allContractors: any[] = Array.isArray((state as any)?.contractors)
    ? (state as any).contractors
    : []

  // Get first name for greeting
  const firstName = userProfile?.name?.split(' ')[0] || ''

  // UI state
  const [sheetExpanded, setSheetExpanded] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Location state
  const [center, setCenter] = useState<LatLng>([40.7128, -74.006])
  const [fetchingLocation, setFetchingLocation] = useState(false)
  const [locationName, setLocationName] = useState('Finding location...')

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      setFetchingLocation(true)
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          setCenter([latitude, longitude])
          setFetchingLocation(false)

          // Reverse geocode to get location name
          try {
            const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
            if (MAPBOX_TOKEN) {
              const res = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}&types=neighborhood,locality,place`
              )
              const data = await res.json()
              if (data.features?.[0]) {
                setLocationName(data.features[0].place_name?.split(',')[0] || 'Your Location')
              }
            }
          } catch {
            setLocationName('Your Location')
          }
        },
        () => {
          setFetchingLocation(false)
          setLocationName('New York')
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    }
  }, [])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim().toLowerCase()), 200)
    return () => clearTimeout(t)
  }, [searchQuery])

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
        const name = String(c?.name || '').toLowerCase()
        const city = String(c?.city || '').toLowerCase()
        const svc: string[] = Array.isArray(c?.services) ? c.services : []

        // Text search
        if (debouncedQuery) {
          const hay = `${name} ${city} ${svc.join(' ')}`.toLowerCase()
          if (!hay.includes(debouncedQuery)) return false
        }

        // Service filter
        if (selectedService && !svc.includes(selectedService)) return false

        // Location filter
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
  }, [allContractors, debouncedQuery, selectedService, center])

  // Show registration/login screen if not authenticated
  if (!authLoading && !user) {
    return <IOSRegistration />
  }

  // Loading state
  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  // Main app view
  return (
    <div className="fixed inset-0 bg-white flex flex-col">
      {/* GREEN HEADER with greeting */}
      <div className="relative z-30 bg-emerald-600 safe-area-top">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Menu button */}
          <button
            onClick={() => router.push('/dashboard/homeowner')}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Greeting */}
          <div className="text-center">
            <p className="text-emerald-200 text-xs">Good {getTimeOfDay()}</p>
            <h1 className="text-white font-bold text-lg">
              {firstName ? `Hello, ${firstName}` : 'Find a Pro'}
            </h1>
          </div>

          {/* Get Help button */}
          <Link
            href="/post-job"
            className="bg-white text-emerald-600 px-3 py-2 rounded-xl font-semibold text-sm"
          >
            Get Help
          </Link>
        </div>
      </div>

      {/* Full-screen Map */}
      <div className="absolute inset-0 pt-[88px]">
        <FindProMapbox
          items={filtered}
          category={selectedService || undefined}
          radiusMiles={25}
          searchCenter={center}
          onSearchHere={(c) => setCenter(c)}
        />
      </div>

      {/* Floating controls on map */}
      <div className="absolute top-[100px] right-4 z-10 flex flex-col gap-2">
        {/* My Location button */}
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
          className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center"
        >
          {fetchingLocation ? (
            <div className="w-5 h-5 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </button>
      </div>

      {/* Bottom Sheet */}
      <div
        className={`absolute left-0 right-0 bottom-0 bg-white rounded-t-3xl shadow-2xl transition-all duration-300 ease-out z-20 ${
          sheetExpanded ? 'top-20' : 'top-auto'
        }`}
        style={{
          maxHeight: sheetExpanded ? 'calc(100% - 80px)' : '320px',
          minHeight: sheetExpanded ? 'calc(100% - 80px)' : '280px'
        }}
      >
        {/* Sheet Handle */}
        <div
          className="flex justify-center py-3 cursor-pointer"
          onClick={() => setSheetExpanded(!sheetExpanded)}
        >
          <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          {/* Search Input - Grab style */}
          <div
            className={`bg-gray-100 rounded-2xl transition-all ${searchFocused ? 'ring-2 ring-emerald-500' : ''}`}
          >
            <div className="flex items-center px-4 py-3">
              <div className="w-3 h-3 bg-emerald-500 rounded-full mr-3"></div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => { setSearchFocused(true); setSheetExpanded(true); }}
                onBlur={() => setSearchFocused(false)}
                placeholder="I need help with..."
                className="flex-1 bg-transparent text-gray-900 placeholder-gray-500 outline-none text-base"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="p-1">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Service Categories - Horizontal scroll */}
        <div className="px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
            {SERVICE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedService(selectedService === cat.id ? null : cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  selectedService === cat.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{cat.icon}</span>
                <span className="text-sm font-medium">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto px-4 pb-safe">
          {filtered.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 mb-2">{filtered.length} pros nearby</p>
              {filtered.map((c) => {
                const d = (c as any).__distance as number | undefined
                const svc: string[] = Array.isArray(c?.services) ? c.services : []
                const logoUrl = c?.logo_url || c?.avatar_url
                return (
                  <div
                    key={String(c?.id ?? c?.name)}
                    className="bg-gray-50 rounded-2xl p-3 flex items-center gap-3"
                  >
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {logoUrl ? (
                        <img src={logoUrl} alt="" className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-xl">👷</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 truncate">{c?.name || 'Contractor'}</span>
                        {c?.rating && (
                          <span className="text-xs text-gray-500 flex items-center gap-0.5">
                            <span className="text-amber-500">★</span> {Number(c.rating).toFixed(1)}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {svc.slice(0, 2).join(' • ')}
                        {typeof d === 'number' && ` • ${d.toFixed(1)} mi`}
                      </div>
                    </div>

                    {/* Action */}
                    <button
                      onClick={() => {
                        if (!user) openAuth()
                        else router.push(`/post-job?contractor=${c?.id}`)
                      }}
                      className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors flex-shrink-0"
                    >
                      Book
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-gray-500">No pros found nearby</p>
              <Link
                href="/post-job"
                className="inline-block mt-4 bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold"
              >
                Post a Job Request
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Custom styles */}
      <style jsx>{`
        .safe-area-top {
          padding-top: env(safe-area-inset-top, 0);
        }
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom, 20px);
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}

// Helper to get time of day greeting
function getTimeOfDay(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}
