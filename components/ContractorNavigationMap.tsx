'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { supabase } from '../lib/supabaseClient'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

interface ContractorNavigationMapProps {
  jobId: string
  jobAddress: string
  jobLatitude: number
  jobLongitude: number
  contractorId: string
  onNavigationStart?: () => void
  onArrival?: () => void
}

export default function ContractorNavigationMap({
  jobId,
  jobAddress,
  jobLatitude,
  jobLongitude,
  contractorId,
  onNavigationStart,
  onArrival
}: ContractorNavigationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const userMarker = useRef<mapboxgl.Marker | null>(null)
  const destinationMarker = useRef<mapboxgl.Marker | null>(null)
  const routeSource = useRef<string>('route-source')

  const [isTracking, setIsTracking] = useState(false)
  const [hasArrived, setHasArrived] = useState(false)
  const [currentPosition, setCurrentPosition] = useState<GeolocationPosition | null>(null)
  const [eta, setEta] = useState<string>('')
  const [distance, setDistance] = useState<string>('')
  const watchId = useRef<number | null>(null)

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/navigation-day-v1',
      center: [jobLongitude, jobLatitude],
      zoom: 15
    })

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    // Add destination marker (job location)
    const destEl = document.createElement('div')
    destEl.innerHTML = '🏠'
    destEl.style.fontSize = '40px'

    destinationMarker.current = new mapboxgl.Marker(destEl)
      .setLngLat([jobLongitude, jobLatitude])
      .setPopup(new mapboxgl.Popup().setHTML(`<strong>Destination</strong><br>${jobAddress}`))
      .addTo(map.current)

    return () => {
      if (watchId.current) {
        navigator.geolocation.clearWatch(watchId.current)
      }
      map.current?.remove()
    }
  }, [])

  async function startNavigation() {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }

    setIsTracking(true)
    onNavigationStart?.()

    // Start watching position
    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        updatePosition(position)
      },
      (error) => {
        console.error('Geolocation error:', error)
        alert(`Location error: ${error.message}`)
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000
      }
    )
  }

  async function updatePosition(position: GeolocationPosition) {
    setCurrentPosition(position)
    const { latitude, longitude, accuracy, heading, speed } = position.coords

    if (!map.current) return

    // Update or create user marker
    if (!userMarker.current) {
      const userEl = document.createElement('div')
      userEl.innerHTML = '📍'
      userEl.style.fontSize = '32px'
      if (heading) {
        userEl.style.transform = `rotate(${heading}deg)`
      }

      userMarker.current = new mapboxgl.Marker(userEl)
        .setLngLat([longitude, latitude])
        .addTo(map.current)

      // Center on user for first time
      map.current.flyTo({ center: [longitude, latitude], zoom: 16 })
    } else {
      userMarker.current.setLngLat([longitude, latitude])
      const el = userMarker.current.getElement()
      if (heading) {
        el.style.transform = `rotate(${heading}deg)`
      }
    }

    // Get route from Mapbox Directions API
    const route = await getRoute(longitude, latitude, jobLongitude, jobLatitude)
    if (route && map.current) {
      drawRoute(route)

      // Calculate ETA and distance
      const durationMinutes = Math.round(route.duration / 60)
      const distanceKm = (route.distance / 1000).toFixed(1)
      setEta(`${durationMinutes} min`)
      setDistance(`${distanceKm} km`)

      // Check if arrived (within 50 meters)
      const distanceToDestination = calculateDistance(
        latitude,
        longitude,
        jobLatitude,
        jobLongitude
      )

      if (distanceToDestination < 50 && !hasArrived) {
        setHasArrived(true)
        onArrival?.()

        // Update database
        await supabase.rpc('update_contractor_location', {
          p_job_id: jobId,
          p_latitude: latitude,
          p_longitude: longitude,
          p_accuracy: accuracy,
          p_heading: heading || null,
          p_speed: speed || null,
          p_is_en_route: true,
          p_has_arrived: true,
          p_distance: distanceToDestination
        })
      } else {
        // Update database with current location
        await supabase.rpc('update_contractor_location', {
          p_job_id: jobId,
          p_latitude: latitude,
          p_longitude: longitude,
          p_accuracy: accuracy,
          p_heading: heading || null,
          p_speed: speed || null,
          p_is_en_route: true,
          p_has_arrived: false,
          p_eta: new Date(Date.now() + route.duration * 1000).toISOString(),
          p_distance: distanceToDestination
        })
      }
    }
  }

  async function getRoute(startLng: number, startLat: number, endLng: number, endLat: number) {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${startLng},${startLat};${endLng},${endLat}?geometries=geojson&access_token=${mapboxgl.accessToken}`

    try {
      const response = await fetch(url)
      const data = await response.json()
      if (data.routes && data.routes.length > 0) {
        return data.routes[0]
      }
    } catch (error) {
      console.error('Error fetching route:', error)
    }
    return null
  }

  function drawRoute(route: any) {
    if (!map.current) return

    const geojson = {
      type: 'Feature',
      properties: {},
      geometry: route.geometry
    }

    // Remove existing route if any
    if (map.current.getSource(routeSource.current)) {
      map.current.removeLayer('route')
      map.current.removeSource(routeSource.current)
    }

    // Add route source and layer
    map.current.addSource(routeSource.current, {
      type: 'geojson',
      data: geojson as any
    })

    map.current.addLayer({
      id: 'route',
      type: 'line',
      source: routeSource.current,
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#3B82F6',
        'line-width': 6,
        'line-opacity': 0.8
      }
    })
  }

  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3 // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c // Distance in meters
  }

  function openNativeMaps() {
    // Open native maps app for turn-by-turn navigation
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    const url = isMobile
      ? `https://maps.google.com/maps?daddr=${jobLatitude},${jobLongitude}`
      : `https://www.google.com/maps/dir/?api=1&destination=${jobLatitude},${jobLongitude}`

    window.open(url, '_blank')
  }

  return (
    <div className="relative w-full h-full">
      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full rounded-lg" />

      {/* Control Panel */}
      <div className="absolute top-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-gray-900">📍 Navigating to Job</div>
            <div className="text-sm text-gray-600 mt-1">{jobAddress}</div>
          </div>

          {!isTracking ? (
            <button
              onClick={startNavigation}
              className="btn btn-primary flex items-center gap-2"
            >
              🧭 Start Navigation
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={openNativeMaps}
                className="btn btn-outline flex items-center gap-2"
              >
                🗺️ Open Maps
              </button>
            </div>
          )}
        </div>

        {isTracking && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-600">ETA</div>
                <div className="text-lg font-semibold text-blue-600">{eta || 'Calculating...'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600">Distance</div>
                <div className="text-lg font-semibold text-gray-900">{distance || 'Calculating...'}</div>
              </div>
            </div>

            {hasArrived && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-green-800 font-medium flex items-center gap-2">
                  ✅ You have arrived at the job location!
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Location Accuracy Indicator */}
      {currentPosition && (
        <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg px-3 py-2 text-xs">
          <div className="text-gray-600">
            GPS Accuracy: ±{Math.round(currentPosition.coords.accuracy)}m
          </div>
        </div>
      )}
    </div>
  )
}
