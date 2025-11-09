// app/find-pro/page.tsx
// Two-row header. Hours of Operation = multi-select popover.
// Now using Mapbox instead of Leaflet
'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useApp } from '../../lib/state'
import dynamic from 'next/dynamic'

// Dynamically import the Mapbox component to avoid SSR issues
const FindProMapbox = dynamic(() => import('../../components/FindProMapbox'), {
  ssr: false,
  loading: () => (
    <div className="h-[360px] w-full rounded-2xl bg-slate-100 flex items-center justify-center">
      <div className="text-slate-400">Loading map...</div>
    </div>
  )
})

type LatLng = [number, number]
type HoursTag =
  | 'open_now'
  | 'open_today'
  | 'weekends'
  | 'evenings'
  | 'early_morning'
  | '24_7'

/* Keep in sync with map legend - comprehensive emergency categories */
const CAT_EMOJI: Record<string, string> = {
  // Home emergencies
  Plumbing: '🚿',
  Electrical: '⚡',
  HVAC: '❄️',
  Roofing: '🏠',
  'Water Damage': '💧',
  Locksmith: '🔒',
  'Appliance Repair': '🔧',
  Handyman: '🔨',

  // Auto emergencies
  'Auto Battery': '🔋',
  'Auto Tire': '🔧',
  'Auto Lockout': '🗝️',
  Tow: '🚗',
  'Fuel Delivery': '⛽',
  'Mobile Mechanic': '⚙️',

  // Other services
  Carpentry: '🔨',
  Landscaping: '🌿',
}

/* Optional ZIP presets (fast, no geocoding) */
const ZIP_COORDS: Record<string, LatLng> = {
  '10001': [40.7506, -73.9972],
  '10002': [40.717, -73.989],
  '10017': [40.7522, -73.9725],
  '10018': [40.7557, -73.9925],
  '11201': [40.6955, -73.989],
  '11205': [40.6976, -73.9713],
  '11215': [40.6673, -73.985],
}

export default function FindProPage() {
  const { state } = useApp()
  const searchParams = useSearchParams()
  const allContractors: any[] = Array.isArray((state as any)?.contractors)
    ? (state as any).contractors
    : []

  // Top bar — line 1
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  // multi-select services
  const [services, setServices] = useState<string[]>([])

  // Top bar — line 2 (filters)
  const [radius, setRadius] = useState(15) // miles
  const [minRating, setMinRating] = useState(0)
  const [minYears, setMinYears] = useState(0) // 0,3,5,10
  const [hoursTags, setHoursTags] = useState<HoursTag[]>([]) // multi-select

  // Map + ZIP
  const [center, setCenter] = useState<LatLng>(() => {
    // Check URL params for lat/lng
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    if (lat && lng) {
      return [parseFloat(lat), parseFloat(lng)]
    }
    return [40.7128, -74.006] // Default to NYC
  })
  const [zip, setZip] = useState('')
  const [fetchingLocation, setFetchingLocation] = useState(false)

  // Fetch user's current location
  const fetchUserLocation = async () => {
    setFetchingLocation(true)
    try {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser')
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setCenter([latitude, longitude])
          setZip('') // Clear ZIP when using precise location
          setFetchingLocation(false)
        },
        (error) => {
          console.error('Error getting location:', error)
          alert('Unable to get your location. Please ensure location permissions are enabled.')
          setFetchingLocation(false)
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    } catch (error) {
      console.error('Location error:', error)
      setFetchingLocation(false)
    }
  }

  // Initialize from URL parameters
  useEffect(() => {
    const category = searchParams.get('category')
    const near = searchParams.get('near')

    if (category) {
      setServices([category])
    }
    if (near) {
      setZip(near)
    }
  }, [searchParams])

  // Results sort (BELOW the map)
  const [sort, setSort] = useState<'best' | 'distance' | 'rating' | 'experience'>('best')

  // Debounce query so typing is smooth
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim().toLowerCase()), 140)
    return () => clearTimeout(t)
  }, [query])

  // Auto-center when a known 5-digit ZIP is typed
  useEffect(() => {
    const z = zip.trim()
    if (z.length === 5 && ZIP_COORDS[z]) setCenter(ZIP_COORDS[z])
  }, [zip])

  const activeCenter = center

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

  // Hours matching — STRICT when selected: require affirmative data to match
  function matchesHours(c: any): boolean {
    if (!hoursTags.length) return true
    const h = c?.hours || {}
    const weekend = h.weekend === true || c?.weekendAvailable === true
    const evenings = h.evenings === true || c?.eveningAvailable === true
    const early = h.early === true || c?.earlyMorning === true
    const openNow = h.openNow === true || c?.openNow === true
    const openToday = h.openToday === true || c?.openToday === true
    const is247 = c?.twentyFourSeven === true || c?.['24_7'] === true

    for (const tag of hoursTags) {
      if (tag === 'weekends' && !weekend) return false
      if (tag === 'evenings' && !evenings) return false
      if (tag === 'early_morning' && !early) return false
      if (tag === 'open_now' && !openNow) return false
      if (tag === 'open_today' && !openToday) return false
      if (tag === '24_7' && !is247) return false
    }
    return true
  }

  // Filter + sort
  const filtered = useMemo(() => {
    const q = debouncedQuery

    let items = allContractors
      .map((c) => ({ ...c }))
      .filter((c) => {
        const name = String(c?.name || '').toLowerCase()
        const city = String(c?.city || '').toLowerCase()
        const svc: string[] = Array.isArray(c?.services) ? c.services : []
        const rating = Number(c?.rating) || 0
        const years = Number(c?.years) || 0

        // multi-service include (match ANY selected)
        if (services.length && !svc.some((s) => services.includes(s))) return false

        if (q) {
          const hay = `${name} ${city} ${svc.join(' ')}`.toLowerCase()
          if (!hay.includes(q)) return false
        }
        if (minRating > 0 && rating < minRating) return false
        if (minYears > 0 && years < minYears) return false

        if (!matchesHours(c)) return false

        const lat = Number(c?.loc?.lat)
        const lng = Number(c?.loc?.lng)
        if (!isFinite(lat) || !isFinite(lng)) return false

        const d = distMiles(activeCenter, [lat, lng])
        ;(c as any).__distance = d
        if (d > radius) return false

        return true
      })

    if (sort === 'distance') {
      items.sort((a, b) => (a.__distance ?? 1e9) - (b.__distance ?? 1e9))
    } else if (sort === 'rating') {
      items.sort((a, b) => (Number(b?.rating) || 0) - (Number(a?.rating) || 0))
    } else if (sort === 'experience') {
      items.sort((a, b) => (Number(b?.years) || 0) - (Number(a?.years) || 0))
    } else {
      items.sort((a, b) => {
        const r = (Number(b?.rating) || 0) - (Number(a?.rating) || 0)
        if (r !== 0) return r
        return (a.__distance ?? 1e9) - (b.__distance ?? 1e9)
      })
    }

    return items
  }, [
    allContractors,
    debouncedQuery,
    services,
    minRating,
    minYears,
    hoursTags,
    radius,
    sort,
    activeCenter,
  ])

  function resetAll() {
    setQuery('')
    setServices([])
    setRadius(15)
    setMinRating(0)
    setMinYears(0)
    setHoursTags([])
    setZip('')
    // keep polygon until user clears via map "Clear All"
  }

  // Categorized service options
  const serviceCategories = {
    'Home': ['Plumbing', 'Electrical', 'HVAC', 'Roofing', 'Water Damage', 'Locksmith', 'Appliance Repair', 'Handyman'],
    'Auto': ['Auto Battery', 'Auto Tire', 'Auto Lockout', 'Tow', 'Fuel Delivery', 'Mobile Mechanic']
  }

  return (
    <>
      <section className="mx-auto max-w-6xl space-y-3 px-3 py-3">
        {/* TOP BAR — TWO ROWS (unchanged look) */}
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm">
          {/* LINE 1 */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-[220px] grow">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, city, or service"
                className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-[13px] outline-none transition focus:border-emerald-400"
              />
            </div>

            {/* Services dropdown with checkboxes */}
            <details className="relative">
              <summary className="inline-flex select-none items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[13px] leading-none text-slate-800 hover:bg-slate-50 cursor-pointer min-w-[220px]">
                <span className="truncate">
                  {services.length ? `Services: ${services.join(', ')}` : 'Services: Any'}
                </span>
                <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 opacity-60">
                  <path d="M5.5 7.5l4.5 4 4.5-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </summary>

              {/* click-away to close */}
              <button
                type="button"
                aria-hidden="true"
                className="fixed inset-0 z-[2500] cursor-default bg-transparent"
                onClick={(e) => {
                  e.preventDefault()
                  ;(e.currentTarget.closest('details') as HTMLDetailsElement)?.removeAttribute('open')
                }}
              />

              <div className="absolute z-[3000] mt-2 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
                <div className="mb-2 flex items-center justify-between px-1">
                  <div className="text-[12px] font-medium text-slate-700">Select services</div>
                  <button
                    className="rounded-lg px-2 py-1 text-[12px] text-slate-600 hover:bg-slate-50"
                    onClick={(e) => {
                      e.preventDefault()
                      setServices([])
                    }}
                  >
                    Clear All
                  </button>
                </div>

                {/* Categorized options */}
                <div className="space-y-3">
                  {Object.entries(serviceCategories).map(([categoryName, categoryServices]) => (
                    <div key={categoryName}>
                      <div className="text-[11px] font-semibold text-emerald-700 mb-1.5 px-1 uppercase tracking-wide">
                        {categoryName}
                      </div>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 px-1">
                        {categoryServices.map((opt) => {
                          const checked = services.includes(opt)
                          return (
                            <label key={opt} className="flex items-center gap-2 rounded-md px-1 py-1 text-[12px] hover:bg-slate-50">
                              <input
                                type="checkbox"
                                className="h-3.5 w-3.5 rounded border-slate-300 accent-emerald-500"
                                checked={checked}
                                onChange={(e) => {
                                  e.stopPropagation()
                                  setServices((prev) =>
                                    checked ? prev.filter((s) => s !== opt) : [...prev, opt]
                                  )
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <span className="text-slate-800">{opt}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-2 flex justify-end">
                  <button
                    className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[12px] font-semibold text-white"
                    onClick={(e) => {
                      e.preventDefault()
                      ;(e.currentTarget.closest('details') as HTMLDetailsElement)?.removeAttribute('open')
                    }}
                  >
                    Done
                  </button>
                </div>
              </div>
            </details>

            <div className="flex items-center gap-2">
              <input
                value={zip}
                onChange={(e) =>
                  setZip(e.target.value.replace(/\D/g, '').slice(0, 5))
                }
                placeholder="ZIP"
                maxLength={5}
                className="w-[78px] rounded-xl border border-slate-200 px-2.5 py-1.5 text-[13px] outline-none transition focus:border-emerald-400"
              />
              <button
                onClick={fetchUserLocation}
                disabled={fetchingLocation}
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[13px] text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                title="Use my current location"
              >
                {fetchingLocation ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Finding...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Use My Location</span>
                  </>
                )}
              </button>
            </div>

            <button
              onClick={resetAll}
              className="ml-auto rounded-xl border border-slate-200 px-2.5 py-1.5 text-[13px] hover:bg-slate-50"
              title="Reset filters"
            >
              Reset
            </button>
          </div>

          {/* LINE 2 */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <div className="flex min-w-0 items-center gap-2 grow">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">Radius</span>
                <input
                  type="range"
                  min={1}
                  max={50}
                  step={1}
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="accent-emerald-500"
                />
                <div className="w-12 text-right text-[11px] text-slate-700">
                  {radius} mi
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">Min rating</span>
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                  className="rounded-xl border border-slate-200 px-2.5 py-1.5 text-[13px]"
                >
                  <option value={0}>Any</option>
                  <option value={3}>3.0+</option>
                  <option value={3.5}>3.5+</option>
                  <option value={4}>4.0+</option>
                  <option value={4.5}>4.5+</option>
                </select>

                <span className="ml-1 text-[11px] text-slate-500">Experience</span>
                <select
                  value={minYears}
                  onChange={(e) => setMinYears(Number(e.target.value))}
                  className="rounded-xl border border-slate-200 px-2.5 py-1.5 text-[13px]"
                  title="Minimum years in business"
                >
                  <option value={0}>Any</option>
                  <option value={3}>3+ yrs</option>
                  <option value={5}>5+ yrs</option>
                  <option value={10}>10+ yrs</option>
                </select>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2">
              {(() => {
                const topActive = minRating >= 4.5
                return (
                  <button
                    onClick={() => setMinRating(topActive ? 0 : 4.5)}
                    className={
                      'rounded-full px-3 py-1.5 text-[12px] font-medium transition ' +
                      (topActive
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100')
                    }
                    title="Only show 4.5★ and up"
                  >
                    ★ Top rated
                  </button>
                )
              })()}

              {(() => {
                const OPTIONS: { value: HoursTag; label: string }[] = [
                  { value: 'open_now', label: 'Open now' },
                  { value: 'open_today', label: 'Open today' },
                  { value: 'weekends', label: 'Open weekends' },
                  { value: 'evenings', label: 'Evenings' },
                  { value: 'early_morning', label: 'Early morning' },
                  { value: '24_7', label: '24/7' },
                ]
                const pretty = (t: HoursTag) =>
                  OPTIONS.find((o) => o.value === t)?.label ?? t
                const toggle = (tag: HoursTag) => {
                  setHoursTags((prev) =>
                    prev.includes(tag)
                      ? prev.filter((t) => t !== tag)
                      : [...prev, tag]
                  )
                }

                return (
                  <details className="relative">
                    <summary className="inline-flex select-none items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[13px] leading-none text-slate-800 hover:bg-slate-50 cursor-pointer">
                      <span className="truncate max-w-[220px]">
                        {hoursTags.length
                          ? `Hours: ${hoursTags.map(pretty).join(', ')}`
                          : 'Hours: Any'}
                      </span>
                      <svg
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                        className="h-4 w-4 opacity-60"
                      >
                        <path
                          d="M5.5 7.5l4.5 4 4.5-4"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </summary>

                    <button
                      type="button"
                      aria-hidden="true"
                      className="fixed inset-0 z-[2500] cursor-default bg-transparent"
                      onClick={(e) => {
                        e.preventDefault()
                        ;(e.currentTarget.closest('details') as HTMLDetailsElement)?.removeAttribute(
                          'open'
                        )
                      }}
                    />

                    <div className="absolute right-0 z-[3000] mt-2 w-60 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                      <button
                        className="w-full rounded-lg px-2 py-1.5 text-left text-[13px] hover:bg-slate-50"
                        onClick={(e) => {
                          e.preventDefault()
                          setHoursTags([])
                          ;(e.currentTarget.closest('details') as HTMLDetailsElement)?.removeAttribute(
                            'open'
                          )
                        }}
                      >
                        Any
                      </button>
                      <div className="my-1 h-px bg-slate-100" />
                      <div className="max-h-48 overflow-auto pr-1">
                        {OPTIONS.map((opt) => (
                          <label
                            key={opt.value}
                            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] hover:bg-slate-50"
                          >
                            <input
                              type="checkbox"
                              className="h-3.5 w-3.5 rounded border-slate-300 accent-emerald-500"
                              checked={hoursTags.includes(opt.value)}
                              onChange={() => toggle(opt.value)}
                            />
                            <span className="text-slate-800">{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </details>
                )
              })()}

            </div>
          </div>
        </div>

        {/* REMOVED: specialty bar (chips) */}

        {/* MAP (Mapbox component) */}
        <FindProMapbox
          items={filtered}
          category={services[0] || undefined} // just for pin emoji preference
          radiusMiles={radius}
          searchCenter={activeCenter}
          onSearchHere={(c) => setCenter(c)}
        />

        {/* Results header + sort */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-[12px] text-slate-600">
            Showing{' '}
            <span className="font-semibold text-slate-900">{filtered.length}</span>{' '}
            within <span className="font-semibold text-slate-900">{radius} mi</span>
            {filtered.length === 0 && (
              <span className="ml-2">
                —{' '}
                <Link
                  href="/get-help-now"
                  className="font-semibold text-emerald-600 hover:text-emerald-700 underline"
                >
                  Get Help Now
                </Link>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[12px] text-slate-500">Sort</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="rounded-xl border border-slate-200 px-2.5 py-1.5 text-[13px]"
              title="Sort results"
            >
              <option value="best">Best match</option>
              <option value="distance">Distance</option>
              <option value="rating">Rating</option>
              <option value="experience">Experience</option>
            </select>
          </div>
        </div>

        {/* Results list */}
        <div className="rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm">
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => {
              const d = (c as any).__distance as number | undefined
              const svc: string[] = Array.isArray(c?.services) ? c.services : []
              return (
                <div
                  key={String(c?.id ?? c?.name)}
                  className="rounded-xl border border-slate-200 p-2.5 transition hover:shadow-[0_1px_12px_rgba(2,6,23,.06)]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="truncate text-[14px] font-semibold text-slate-900">
                      {c?.name || 'Contractor'}
                    </div>
                    <div className="shrink-0 text-[11px] text-slate-500">
                      {typeof d === 'number' ? `${d.toFixed(1)} mi` : ''}
                    </div>
                  </div>

                  <div className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">
                    {c?.city ? c.city : ''}
                    {c?.rating ? ` • ★ ${Number(c.rating).toFixed(1)}` : ''}
                    {Number(c?.years) ? ` • ${Number(c.years)} yrs` : ''}
                    {c?.emergency || c?.emergencyService ? ' • 🚨 Emergency' : ''}
                    {c?.twentyFourSeven || c?.['24_7'] ? ' • 24/7' : ''}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1">
                    {svc.slice(0, 5).map((s: string) => (
                      <span
                        key={s}
                        className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700"
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  <div className="mt-2.5 flex gap-1.5">
                    <a
                      href={`/contractors/${encodeURIComponent(String(c?.id ?? ''))}`}
                      className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1.5 text-[12px] font-semibold text-white transition-colors"
                    >
                      View Pro
                    </a>
                    <a
                      href={`/messages?to=${encodeURIComponent(String(c?.id ?? ''))}`}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] font-semibold text-slate-900"
                    >
                      Message
                    </a>
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 && (
              <div className="col-span-full rounded-xl border border-dashed border-slate-300 p-6 text-center text-slate-500">
                No results. Widen the radius or clear filters.
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
