// components/ProMapExplorer.tsx
'use client'

import React, { useEffect, useMemo, useState } from 'react'
import ProMapInner from './ProMapInner'
import { useApp } from '../lib/state'

type LatLng = [number, number]

const CAT_EMOJI: Record<string, string> = {
  Electrical: '⚡',
  HVAC: '❄️',
  Roofing: '🏠',
  Plumbing: '🚿',
  Carpentry: '🪚',
  General: '🧰',
  Landscaping: '🌿',
}

const ZIP_COORDS: Record<string, LatLng> = {
  '10001': [40.7506, -73.9972],
  '10002': [40.717, -73.989],
  '10017': [40.7522, -73.9725],
  '10018': [40.7557, -73.9925],
  '11201': [40.6955, -73.989],
  '11205': [40.6976, -73.9713],
  '11215': [40.6673, -73.985],
}

// Helper function to get location from ZIP code
function getLocationFromZip(zipCode: string): { lat: number; lng: number } | null {
  const coords = ZIP_COORDS[zipCode]
  if (coords) {
    return { lat: coords[0], lng: coords[1] }
  }
  // Default to NYC if ZIP not found
  return { lat: 40.7128, lng: -74.006 }
}

export default function ProMapExplorer() {
  const [allContractors, setAllContractors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [category, setCategory] = useState<keyof typeof CAT_EMOJI | ''>('')

  const [radius, setRadius] = useState(15)
  const [minRating, setMinRating] = useState(0)
  const [sort, setSort] = useState<'best' | 'distance' | 'rating'>('best')

  const [zip, setZip] = useState('')
  const [center, setCenter] = useState<LatLng>([40.7128, -74.006])
  const [showMore, setShowMore] = useState(false)
  const [showList, setShowList] = useState(false)

  // Fetch contractors from Supabase
  useEffect(() => {
    async function fetchContractors() {
      try {
        const { supabaseBrowser } = await import('../utils/supabase-browser')
        const supabase = supabaseBrowser()

        const { data, error } = await supabase
          .from('contractor_profiles')
          .select('*')
          .eq('status', 'approved')

        if (error) {
          console.error('Error fetching contractors:', error)
          setAllContractors([])
        } else {
          console.log('Fetched contractors from DB:', data)
          // Transform data to include location coordinates
          const contractorsWithLocation = (data || []).map(contractor => {
            // Use exact coordinates from database (latitude/longitude)
            // Fallback to ZIP code center if coordinates not available
            let loc = null

            if (contractor.latitude && contractor.longitude) {
              // Use exact address coordinates
              loc = {
                lat: Number(contractor.latitude),
                lng: Number(contractor.longitude)
              }
            } else {
              // Fallback: Use first ZIP from service_area_zips array
              const primaryZip = Array.isArray(contractor.service_area_zips) && contractor.service_area_zips.length > 0
                ? contractor.service_area_zips[0]
                : null
              loc = primaryZip ? getLocationFromZip(primaryZip) : null
            }

            return {
              ...contractor,
              loc,
              services: contractor.categories || [], // Map categories to services
              rating: contractor.rating || 0,
              city: contractor.address || contractor.service_area_zips?.[0] || 'NYC'
            }
          }).filter(c => c.loc !== null) // Only include contractors with valid locations

          console.log('Contractors with location:', contractorsWithLocation)
          setAllContractors(contractorsWithLocation)
        }
      } catch (err) {
        console.error('Failed to fetch contractors:', err)
        setAllContractors([])
      } finally {
        setLoading(false)
      }
    }

    fetchContractors()
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim().toLowerCase()), 200)
    return () => clearTimeout(t)
  }, [query])

  const activeCenter = useMemo<LatLng>(() => {
    if (zip && ZIP_COORDS[zip]) return ZIP_COORDS[zip]
    return center
  }, [zip, center])

  const filtered = useMemo(() => {
    const q = debouncedQuery

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

    let items = allContractors
      .map(c => ({ ...c }))
      .filter(c => {
        const name = String(c?.name || '').toLowerCase()
        const city = String(c?.city || '').toLowerCase()
        const services: string[] = Array.isArray(c?.services) ? c.services : []
        const rating = Number(c?.rating) || 0

        if (category && !services.includes(category as string)) return false
        if (minRating > 0 && rating < minRating) return false

        if (q) {
          const hay = `${name} ${city} ${services.join(' ')}`.toLowerCase()
          if (!hay.includes(q)) return false
        }

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
    } else {
      items.sort((a, b) => {
        const r = (Number(b?.rating) || 0) - (Number(a?.rating) || 0)
        if (r !== 0) return r
        return (a.__distance ?? 1e9) - (b.__distance ?? 1e9)
      })
    }

    return items
  }, [allContractors, debouncedQuery, category, minRating, radius, sort, activeCenter])

  function clearAll() {
    setQuery('')
    setCategory('')
    setRadius(15)
    setMinRating(0)
    setSort('best')
    setZip('')
  }

  function applyZip() {
    if (zip && ZIP_COORDS[zip]) {
      setCenter(ZIP_COORDS[zip])
    }
  }

  function locateMe() {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      pos => {
        const p: LatLng = [pos.coords.latitude, pos.coords.longitude]
        setCenter(p)
        setZip('')
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  return (
    <section className="flex flex-col h-full">
      {/* Map */}
      <div className="flex-1 min-h-0">
        <ProMapInner
          items={filtered}
          category={category || undefined}
          radiusMiles={radius}
          searchCenter={activeCenter}
          onSearchHere={(c) => setCenter(c)}
          searchQuery={query}
          onSearchQueryChange={setQuery}
          zipCode={zip}
          onZipCodeChange={setZip}
          onApplyZip={applyZip}
          onLocateMe={locateMe}
          selectedCategory={category}
          onCategoryChange={(c) => setCategory(c as any)}
          sortBy={sort}
          onSortChange={(s) => setSort(s as any)}
          onMoreFilters={() => setShowMore(s => !s)}
          showMoreFilters={showMore}
          onReset={clearAll}
          onToggleList={() => setShowList(s => !s)}
          showList={showList}
          radius={radius}
          onRadiusChange={setRadius}
          minRating={minRating}
          onMinRatingChange={setMinRating}
          filteredCount={filtered.length}
        />
      </div>

      {/* Optional list view */}
      {showList && (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => {
              const d = (c as any).__distance as number | undefined
              return (
                <div key={String(c?.id ?? c?.name)} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold">{c?.name || 'Contractor'}</div>
                    <div className="text-xs text-slate-500">{typeof d === 'number' ? `${d.toFixed(1)} mi` : ''}</div>
                  </div>
                  <div className="text-xs text-slate-500">
                    {c?.city ? c.city : ''}
                    {c?.rating ? ` • ★ ${Number(c.rating).toFixed(1)}` : ''}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(Array.isArray(c?.services) ? c.services : []).slice(0, 4).map((s: string) => (
                      <span key={s} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                        {CAT_EMOJI[s as keyof typeof CAT_EMOJI] || '🔧'} {s}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <a
                      href={`/pro/${encodeURIComponent(String(c?.id ?? ''))}`}
                      className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white"
                    >
                      View
                    </a>
                    <a
                      href={`/messages?to=${encodeURIComponent(String(c?.id ?? ''))}`}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-900"
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
      )}
    </section>
  )
}
