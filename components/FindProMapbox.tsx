// components/FindProMapbox.tsx
'use client'

import 'mapbox-gl/dist/mapbox-gl.css'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'

type LatLng = [number, number]
type HoursTag =
  | 'open_now'
  | 'open_today'
  | 'weekends'
  | 'evenings'
  | 'early_morning'
  | '24_7'

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
  // Other
  Carpentry: '🔨',
  Landscaping: '🌿',
}

interface Props {
  items: any[]
  radiusMiles: number
  searchCenter: LatLng
  onSearchHere?: (center: LatLng) => void
  category?: string
  fullscreen?: boolean
}

export default function FindProMapbox({
  items = [],
  radiusMiles = 10,
  searchCenter,
  onSearchHere,
  category,
  fullscreen = false,
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapObjRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const radiusLayerId = 'radius-circle'
  const radiusSourceId = 'radius-source'

  // Helper function to create a circle GeoJSON
  const createRadiusCircle = (center: LatLng, radiusMiles: number) => {
    const points = 64
    const coords = []
    const distanceInMeters = radiusMiles * 1609.34 // Convert miles to meters
    const earthRadius = 6371000 // Earth's radius in meters

    const lat = center[0] * Math.PI / 180
    const lng = center[1] * Math.PI / 180

    for (let i = 0; i < points; i++) {
      const angle = (i * 360 / points) * Math.PI / 180

      const dx = distanceInMeters * Math.cos(angle)
      const dy = distanceInMeters * Math.sin(angle)

      const deltaLat = dy / earthRadius
      const deltaLng = dx / (earthRadius * Math.cos(lat))

      const pointLat = lat + deltaLat
      const pointLng = lng + deltaLng

      coords.push([
        pointLng * 180 / Math.PI,
        pointLat * 180 / Math.PI
      ])
    }

    // Close the circle
    coords.push(coords[0])

    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [coords]
      }
    }
  }

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapObjRef.current) return

    const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!MAPBOX_TOKEN) {
      console.error('MAPBOX_TOKEN not configured')
      return
    }

    mapboxgl.accessToken = MAPBOX_TOKEN

    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [searchCenter[1], searchCenter[0]], // Mapbox uses [lng, lat]
      zoom: 11,
      projection: { name: 'mercator' } as any,
    })

    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl(), 'top-right')

    // Add radius circle when map loads
    map.on('load', () => {
      // Add source for radius circle
      map.addSource(radiusSourceId, {
        type: 'geojson',
        data: createRadiusCircle(searchCenter, radiusMiles) as any
      })

      // Add fill layer for radius circle
      map.addLayer({
        id: radiusLayerId,
        type: 'fill',
        source: radiusSourceId,
        paint: {
          'fill-color': '#10b981',
          'fill-opacity': 0.1
        }
      })

      // Add outline for radius circle
      map.addLayer({
        id: `${radiusLayerId}-outline`,
        type: 'line',
        source: radiusSourceId,
        paint: {
          'line-color': '#10b981',
          'line-width': 2,
          'line-opacity': 0.5
        }
      })
    })

    // Add search here button
    const searchHereBtn = document.createElement('button')
    searchHereBtn.className = 'mapboxgl-ctrl-search-here'
    searchHereBtn.textContent = '🔍 Search this area'
    searchHereBtn.style.cssText = `
      position: absolute;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      background: white;
      border: 1px solid #ddd;
      padding: 8px 16px;
      border-radius: 20px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      z-index: 1;
    `
    searchHereBtn.addEventListener('click', () => {
      const center = map.getCenter()
      onSearchHere?.([center.lat, center.lng])
    })
    mapRef.current.appendChild(searchHereBtn)

    mapObjRef.current = map

    return () => {
      map.remove()
      mapObjRef.current = null
    }
  }, [])

  // Update markers when items change
  useEffect(() => {
    const map = mapObjRef.current
    if (!map) return

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    // Add new markers
    items.forEach((item: any) => {
      // Support both loc.lat/lng format and direct latitude/longitude fields
      const lat = Number(item?.loc?.lat ?? item?.latitude)
      const lng = Number(item?.loc?.lng ?? item?.longitude)
      if (!isFinite(lat) || !isFinite(lng)) return

      const svcs: string[] = Array.isArray(item?.services) ? item.services : []
      const svc = category && svcs.includes(category) ? category : svcs[0]
      const emoji = CAT_EMOJI[svc as keyof typeof CAT_EMOJI] ?? '🔧'

      // Create marker element
      const el = document.createElement('div')
      el.className = 'custom-marker'
      el.innerHTML = `
        <div style="
          background: #d1fae5;
          border: 2px solid #10b981;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        ">
          ${emoji}
        </div>
      `

      // Create popup
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 8px;">
          <h3 style="font-weight: 600; margin: 0 0 4px 0;">${item?.name || 'Contractor'}</h3>
          <p style="margin: 0; font-size: 12px; color: #666;">${item?.city || ''}</p>
          ${item?.rating ? `<p style="margin: 4px 0 0 0; font-size: 12px;">⭐ ${Number(item.rating).toFixed(1)}</p>` : ''}
        </div>
      `)

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'center' // Center the marker exactly on coordinates
      })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map)

      markersRef.current.push(marker)
    })

    // Fit bounds to markers if we have items
    if (items.length > 0) {
      const bounds = new mapboxgl.LngLatBounds()
      items.forEach((item: any) => {
        const lat = Number(item?.loc?.lat)
        const lng = Number(item?.loc?.lng)
        if (isFinite(lat) && isFinite(lng)) {
          bounds.extend([lng, lat])
        }
      })
      map.fitBounds(bounds, { padding: 50, maxZoom: 13 })
    }
  }, [items, category])

  // Update center when searchCenter changes
  useEffect(() => {
    const map = mapObjRef.current
    if (!map) return
    map.flyTo({ center: [searchCenter[1], searchCenter[0]], zoom: 11 })
  }, [searchCenter])

  // Update radius circle when radius or center changes
  useEffect(() => {
    const map = mapObjRef.current
    if (!map) return

    // Wait for map to be loaded
    const updateRadius = () => {
      const source = map.getSource(radiusSourceId) as mapboxgl.GeoJSONSource
      if (source) {
        source.setData(createRadiusCircle(searchCenter, radiusMiles) as any)
      }
    }

    if (map.isStyleLoaded()) {
      updateRadius()
    } else {
      map.on('load', updateRadius)
    }
  }, [radiusMiles, searchCenter])

  return (
    <div className={fullscreen ? "absolute inset-0" : "relative"}>
      <div
        ref={mapRef}
        className={`${fullscreen ? 'h-full' : 'h-[360px]'} w-full ${fullscreen ? '' : 'rounded-2xl'} overflow-hidden bg-slate-100`}
        style={{ zIndex: 0 }}
      />
      {!fullscreen && (
        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-3 px-2.5 py-1.5 rounded-xl bg-white/90 text-xs border border-slate-200 shadow"
          style={{ zIndex: 1100 }}
        >
          Radius: {radiusMiles} mi
        </div>
      )}
    </div>
  )
}
