// components/IOSHomeView.tsx
// iOS app-specific homepage with green header, find contractors, and get help button
'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useApp } from '../lib/state'
import { useAuth } from '../contexts/AuthContext'
import { openAuth } from './AuthModal'
import dynamic from 'next/dynamic'

// Dynamically import the Mapbox component to avoid SSR issues
const FindProMapbox = dynamic(() => import('./FindProMapbox'), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-full rounded-2xl bg-slate-100 flex items-center justify-center">
      <div className="text-slate-400">Loading map...</div>
    </div>
  )
})

type LatLng = [number, number]

/* Optional ZIP presets (fast, no geocoding) */
const ZIP_COORDS: Record<string, LatLng> = {
  '10001': [40.7506, -73.9972],
  '10002': [40.717, -73.989],
  '10017': [40.7522, -73.9725],
  '11201': [40.6955, -73.989],
}

export default function IOSHomeView() {
  const { state } = useApp()
  const { user, userProfile, loading: authLoading } = useAuth()
  const router = useRouter()
  const allContractors: any[] = Array.isArray((state as any)?.contractors)
    ? (state as any).contractors
    : []

  // Get first name for greeting
  const firstName = userProfile?.name?.split(' ')[0] || ''

  // Filter states
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [services, setServices] = useState<string[]>([])
  const [radius, setRadius] = useState(15)
  const [center, setCenter] = useState<LatLng>([40.7128, -74.006])
  const [zip, setZip] = useState('')
  const [fetchingLocation, setFetchingLocation] = useState(false)
  const [sort, setSort] = useState<'best' | 'distance' | 'rating'>('best')

  // Debounce query
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim().toLowerCase()), 140)
    return () => clearTimeout(t)
  }, [query])

  // Auto-center when ZIP typed
  useEffect(() => {
    const z = zip.trim()
    if (z.length === 5 && ZIP_COORDS[z]) setCenter(ZIP_COORDS[z])
  }, [zip])

  // Get user location
  const fetchUserLocation = async () => {
    setFetchingLocation(true)
    try {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported')
        return
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setCenter([latitude, longitude])
          setZip('')
          setFetchingLocation(false)
        },
        (error) => {
          console.error('Location error:', error)
          alert('Unable to get location')
          setFetchingLocation(false)
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    } catch {
      setFetchingLocation(false)
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
    const q = debouncedQuery
    let items = (allContractors || [])
      .map((c) => ({ ...c }))
      .filter((c) => {
        const name = String(c?.name || '').toLowerCase()
        const city = String(c?.city || '').toLowerCase()
        const svc: string[] = Array.isArray(c?.services) ? c.services : []

        if (q) {
          const hay = `${name} ${city} ${svc.join(' ')}`.toLowerCase()
          if (!hay.includes(q)) return false
        }

        if (services.length && !svc.some((s) => services.includes(s))) return false

        const lat = Number(c?.loc?.lat ?? c?.latitude)
        const lng = Number(c?.loc?.lng ?? c?.longitude)
        if (!isFinite(lat) || !isFinite(lng)) return false

        const d = distMiles(center, [lat, lng])
        ;(c as any).__distance = d
        if (d > radius) return false

        return true
      })

    if (sort === 'distance') {
      items.sort((a, b) => (a.__distance ?? 1e9) - (b.__distance ?? 1e9))
    } else if (sort === 'rating') {
      items.sort((a, b) => (Number(b?.rating) || 0) - (Number(a?.rating) || 0))
    } else {
      items.sort((a, b) => {
        const r = (Number(b?.rating) || 0) - (Number(a?.rating) || 0)
        if (r !== 0) return r
        return (a.__distance ?? 1e9) - (b.__distance ?? 1e9)
      })
    }

    return items
  }, [allContractors, debouncedQuery, services, radius, sort, center])

  // Service categories
  const serviceCategories = {
    'Home': ['Plumbing', 'Electrical', 'HVAC', 'Roofing', 'Water Damage', 'Locksmith', 'Appliance Repair', 'Handyman'],
    'Auto': ['Auto Battery', 'Auto Tire', 'Auto Lockout', 'Tow', 'Fuel Delivery', 'Mobile Mechanic']
  }

  // Show login/registration if not logged in
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Green Header */}
        <div className="bg-emerald-600 px-4 py-6 text-white">
          <h1 className="text-2xl font-bold">Welcome to Rushr</h1>
          <p className="mt-1 text-emerald-100">Find trusted pros near you</p>
        </div>

        {/* Login/Register Options */}
        <div className="p-4 space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Get Started</h2>

            <button
              onClick={() => openAuth('signin')}
              className="w-full py-3 px-4 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors mb-3"
            >
              Sign In
            </button>

            <button
              onClick={() => openAuth('signup')}
              className="w-full py-3 px-4 border-2 border-emerald-600 text-emerald-600 rounded-xl font-semibold hover:bg-emerald-50 transition-colors"
            >
              Create Account
            </button>

            <div className="mt-4 text-center text-sm text-gray-500">
              <Link href="/pro/contractor-signup" className="text-blue-600 font-medium">
                Are you a contractor? Join as Pro
              </Link>
            </div>
          </div>

          {/* Browse without account */}
          <button
            onClick={() => router.push('/find-pro')}
            className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            Browse Pros Without Account
          </button>
        </div>
      </div>
    )
  }

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  // Logged in view
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Green Header with Greeting and Get Help button */}
      <div className="bg-emerald-600 px-4 py-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-emerald-200 text-sm">Welcome back</p>
            <h1 className="text-xl font-bold">
              Hello, {firstName || 'there'}
            </h1>
          </div>
          <Link
            href="/post-job"
            className="bg-white text-emerald-600 px-4 py-2 rounded-xl font-semibold text-sm hover:bg-emerald-50 transition-colors"
          >
            Get Help
          </Link>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="px-3 py-3 space-y-3">
        {/* Search Bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-2.5 shadow-sm">
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, city, or service"
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
            />
            <input
              value={zip}
              onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
              placeholder="ZIP"
              maxLength={5}
              className="w-20 rounded-lg border border-gray-200 px-2 py-2 text-sm outline-none focus:border-emerald-400"
            />
            <button
              onClick={fetchUserLocation}
              disabled={fetchingLocation}
              className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-600 hover:bg-emerald-100 disabled:opacity-50"
              title="Use my location"
            >
              {fetchingLocation ? (
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>

          {/* Service chips */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {Object.values(serviceCategories).flat().slice(0, 6).map((svc) => {
              const active = services.includes(svc)
              return (
                <button
                  key={svc}
                  onClick={() => setServices(prev =>
                    active ? prev.filter(s => s !== svc) : [...prev, svc]
                  )}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    active
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {svc}
                </button>
              )
            })}
            {services.length > 0 && (
              <button
                onClick={() => setServices([])}
                className="px-2.5 py-1 rounded-full text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Map */}
        <FindProMapbox
          items={filtered}
          category={services[0] || undefined}
          radiusMiles={radius}
          searchCenter={center}
          onSearchHere={(c) => setCenter(c)}
        />

        {/* Results header */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-600">
            <span className="font-semibold text-gray-900">{filtered.length}</span> pros within {radius} mi
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
          >
            <option value="best">Best match</option>
            <option value="distance">Distance</option>
            <option value="rating">Rating</option>
          </select>
        </div>

        {/* Contractor list */}
        <div className="space-y-2">
          {filtered.map((c) => {
            const d = (c as any).__distance as number | undefined
            const svc: string[] = Array.isArray(c?.services) ? c.services : []
            const logoUrl = c?.logo_url || c?.avatar_url
            return (
              <div
                key={String(c?.id ?? c?.name)}
                className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  {logoUrl && (
                    <img
                      src={logoUrl}
                      alt={c?.name || 'Contractor'}
                      className="h-12 w-12 rounded-lg object-contain border border-gray-200 bg-white flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{c?.name || 'Contractor'}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {c?.city}
                      {c?.rating && ` • ★ ${Number(c.rating).toFixed(1)}`}
                      {typeof d === 'number' && ` • ${d.toFixed(1)} mi`}
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {svc.slice(0, 3).map((s: string) => (
                        <span
                          key={s}
                          className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => {
                      if (!user) {
                        openAuth()
                      } else {
                        router.push(`/post-job?contractor=${c?.id}`)
                      }
                    }}
                    className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    Offer Job
                  </button>
                  <Link
                    href={`/contractors/${encodeURIComponent(String(c?.id ?? ''))}`}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    View
                  </Link>
                </div>
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center">
              <p className="text-gray-600 mb-4">No contractors found</p>
              <Link
                href="/post-job"
                className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold"
              >
                Post a Job Instead
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
