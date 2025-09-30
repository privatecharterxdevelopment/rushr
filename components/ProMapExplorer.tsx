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

export default function ProMapExplorer() {
  const { state } = useApp()
  const allContractors: any[] = Array.isArray((state as any)?.contractors)
    ? (state as any).contractors
    : []

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
    <section className="space-y-3">
      {/* Compact toolbar */}
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-[220px] grow">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name, city, or service"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              value={zip}
              onChange={e => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
              placeholder="ZIP"
              maxLength={5}
              className="w-[88px] rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={applyZip}
              className="rounded-xl border border-slate-200 px-2.5 py-2 text-xs hover:bg-slate-50"
              title="Center to ZIP"
            >
              Go
            </button>
            <button
              onClick={locateMe}
              className="rounded-xl border border-slate-200 px-2.5 py-2 text-xs hover:bg-slate-50"
              title="Use my location"
            >
              📍
            </button>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={category}
              onChange={e => setCategory(e.target.value as any)}
              className="rounded-xl border border-slate-200 px-2 py-2 text-sm"
              title="Category"
            >
              <option value="">All services</option>
              {Object.keys(CAT_EMOJI).map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>

            <select
              value={sort}
              onChange={e => setSort(e.target.value as any)}
              className="rounded-xl border border-slate-200 px-2 py-2 text-sm"
              title="Sort"
            >
              <option value="best">Best match</option>
              <option value="distance">Distance</option>
              <option value="rating">Rating</option>
            </select>

            <button
              onClick={() => setShowMore(s => !s)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
            >
              {showMore ? 'Hide filters' : 'More filters'}
            </button>

            <button
              onClick={clearAll}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
              title="Reset filters"
            >
              Reset
            </button>

            <button
              onClick={() => setShowList(s => !s)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
            >
              {showList ? 'Hide list' : 'Show list'}
            </button>
          </div>
        </div>

        {/* Collapsible advanced filters */}
        {showMore && (
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500">Radius</label>
              <input
                type="range"
                min={1}
                max={50}
                step={1}
                value={radius}
                onChange={e => setRadius(Number(e.target.value))}
              />
              <div className="w-12 text-right text-xs text-slate-700">{radius} mi</div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500">Min rating</label>
              <select
                value={minRating}
                onChange={e => setMinRating(Number(e.target.value))}
                className="rounded-xl border border-slate-200 px-2 py-2 text-sm"
              >
                <option value={0}>Any</option>
                <option value={3}>3.0+</option>
                <option value={3.5}>3.5+</option>
                <option value={4}>4.0+</option>
                <option value={4.5}>4.5+</option>
              </select>
            </div>

            <div className="text-xs text-slate-500 self-center">
              Showing <span className="font-semibold text-slate-700">{filtered.length}</span> within{' '}
              <span className="font-semibold text-slate-700">{radius} mi</span>{' '}
              {zip ? <>of ZIP <span className="font-mono">{zip}</span></> : 'of map center'}
            </div>
          </div>
        )}
      </div>

      {/* Map */}
      <ProMapInner
        items={filtered}                 // ensure ProMapInner has items?: any[]
        category={category || undefined}
        radiusMiles={radius}
        searchCenter={activeCenter}
        onSearchHere={(c) => setCenter(c)}
      />

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
