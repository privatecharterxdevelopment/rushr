'use client'

import React, { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

interface ContractorLocation {
  latitude: number
  longitude: number
  heading?: number
  speed?: number
  accuracy?: number
  last_updated_at: string
}

interface ContractorTrackerProps {
  jobId: string
  contractorId: string
  homeownerLocation?: { lat: number; lng: number }
  onLocationUpdate?: (location: ContractorLocation) => void
}

export default function ContractorTracker({
  jobId,
  contractorId,
  homeownerLocation,
  onLocationUpdate
}: ContractorTrackerProps) {
  const [location, setLocation] = useState<ContractorLocation | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [eta, setEta] = useState<string | null>(null)
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const contractorMarker = useRef<mapboxgl.Marker | null>(null)
  const homeownerMarker = useRef<mapboxgl.Marker | null>(null)

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!MAPBOX_TOKEN) {
      console.error('Mapbox token not configured')
      return
    }

    mapboxgl.accessToken = MAPBOX_TOKEN

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: homeownerLocation ? [homeownerLocation.lng, homeownerLocation.lat] : [-74.006, 40.7128],
      zoom: 13
    })

    // Add homeowner marker if location provided
    if (homeownerLocation) {
      const el = document.createElement('div')
      el.className = 'homeowner-marker'
      el.innerHTML = '🏠'
      el.style.fontSize = '32px'

      homeownerMarker.current = new mapboxgl.Marker(el)
        .setLngLat([homeownerLocation.lng, homeownerLocation.lat])
        .setPopup(new mapboxgl.Popup().setHTML('<strong>Your Location</strong>'))
        .addTo(map.current)
    }

    return () => {
      map.current?.remove()
    }
  }, [homeownerLocation])

  // Subscribe to real-time location updates
  useEffect(() => {
    const channel = supabase
      .channel(`contractor-location-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contractor_locations',
          filter: `job_id=eq.${jobId}`
        },
        (payload) => {
          console.log('[TRACKER] Location update:', payload)
          if (payload.new && 'latitude' in payload.new) {
            const newLocation = payload.new as any
            setLocation(newLocation)
            setIsTracking(newLocation.is_tracking_enabled)
            onLocationUpdate?.(newLocation)

            // Update contractor marker on map
            if (map.current && contractorMarker.current) {
              contractorMarker.current.setLngLat([newLocation.longitude, newLocation.latitude])
            } else if (map.current) {
              // Create contractor marker
              const el = document.createElement('div')
              el.className = 'contractor-marker'
              el.innerHTML = '🚗'
              el.style.fontSize = '32px'
              el.style.transform = newLocation.heading ? `rotate(${newLocation.heading}deg)` : ''

              contractorMarker.current = new mapboxgl.Marker(el)
                .setLngLat([newLocation.longitude, newLocation.latitude])
                .setPopup(new mapboxgl.Popup().setHTML('<strong>Contractor En Route</strong>'))
                .addTo(map.current)

              // Fit map to show both markers
              if (homeownerLocation) {
                const bounds = new mapboxgl.LngLatBounds()
                bounds.extend([homeownerLocation.lng, homeownerLocation.lat])
                bounds.extend([newLocation.longitude, newLocation.latitude])
                map.current.fitBounds(bounds, { padding: 50 })
              }
            }

            // Calculate ETA if we have both locations
            if (homeownerLocation) {
              calculateETA(newLocation, homeownerLocation)
            }
          }
        }
      )
      .subscribe()

    // Fetch initial location
    fetchCurrentLocation()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [jobId, contractorId, homeownerLocation, onLocationUpdate])

  const fetchCurrentLocation = async () => {
    const { data, error } = await supabase
      .from('contractor_locations')
      .select('*')
      .eq('job_id', jobId)
      .eq('contractor_id', contractorId)
      .order('last_updated_at', { ascending: false })
      .limit(1)
      .single()

    if (data && !error) {
      setLocation(data)
      setIsTracking(data.is_tracking_enabled)
    }
  }

  const calculateETA = async (contractorLoc: ContractorLocation, homeLoc: { lat: number; lng: number }) => {
    const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!MAPBOX_TOKEN) return

    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${contractorLoc.longitude},${contractorLoc.latitude};${homeLoc.lng},${homeLoc.lat}?access_token=${MAPBOX_TOKEN}&geometries=geojson`
      )
      const data = await response.json()

      if (data.routes && data.routes.length > 0) {
        const durationMinutes = Math.round(data.routes[0].duration / 60)
        setEta(`${durationMinutes} min`)
      }
    } catch (error) {
      console.error('Error calculating ETA:', error)
    }
  }

  if (!isTracking) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
        <div className="text-slate-500 mb-2">
          <svg className="w-12 h-12 mx-auto mb-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="font-medium text-slate-700">Location tracking not active yet</p>
          <p className="text-sm mt-1">Contractor will share their location once they confirm the job</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ETA Banner */}
      {eta && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-emerald-900">Estimated Arrival</div>
                <div className="text-emerald-700">{eta}</div>
              </div>
            </div>
            {location?.speed && (
              <div className="text-right text-sm text-emerald-700">
                <div>Speed: {location.speed.toFixed(0)} km/h</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Map */}
      <div
        ref={mapContainer}
        className="w-full h-96 rounded-lg overflow-hidden border border-slate-200"
      />

      {/* Last Updated */}
      {location && (
        <div className="text-xs text-slate-500 text-center">
          Last updated: {new Date(location.last_updated_at).toLocaleTimeString()}
        </div>
      )}
    </div>
  )
}
