'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '../../../../contexts/AuthContext'
import { supabase } from '../../../../lib/supabaseClient'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

interface Job {
  id: string
  title: string
  address: string
  latitude: number
  longitude: number
  status: string
  homeowner_id: string
}

interface Contractor {
  id: string
  name: string
  business_name: string
  phone: string
  avatar_url?: string
}

interface ContractorLocation {
  latitude: number
  longitude: number
  heading?: number
  speed?: number
  accuracy?: number
  distance_to_job_meters?: number
  eta_minutes?: number
  status: string
  last_update_at: string
}

export default function TrackContractorPage() {
  const { id: jobId } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()

  const [job, setJob] = useState<Job | null>(null)
  const [contractor, setContractor] = useState<Contractor | null>(null)
  const [location, setLocation] = useState<ContractorLocation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const contractorMarker = useRef<mapboxgl.Marker | null>(null)
  const homeMarker = useRef<mapboxgl.Marker | null>(null)
  const routeLine = useRef<string | null>(null)

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current || !job) return

    const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!MAPBOX_TOKEN) {
      setError('Map configuration missing')
      return
    }

    mapboxgl.accessToken = MAPBOX_TOKEN

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [job.longitude, job.latitude],
      zoom: 13,
      attributionControl: false
    })

    // Add home marker
    const homeEl = document.createElement('div')
    homeEl.className = 'w-12 h-12 flex items-center justify-center'
    homeEl.innerHTML = `
      <div class="relative">
        <div class="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-75"></div>
        <div class="relative w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white text-xl shadow-lg border-3 border-white">
          🏠
        </div>
      </div>
    `

    homeMarker.current = new mapboxgl.Marker({ element: homeEl, anchor: 'center' })
      .setLngLat([job.longitude, job.latitude])
      .addTo(map.current)

    map.current.on('load', () => {
      // Add route line layer
      map.current?.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: []
          }
        }
      })

      map.current?.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#059669',
          'line-width': 5,
          'line-opacity': 0.75
        }
      })

      routeLine.current = 'route'
    })

    return () => {
      map.current?.remove()
    }
  }, [job])

  // Fetch job and contractor data
  useEffect(() => {
    const fetchData = async () => {
      if (!user || !jobId) return

      try {
        // Fetch job
        const { data: jobData, error: jobError } = await supabase
          .from('homeowner_jobs')
          .select('*')
          .eq('id', jobId)
          .eq('homeowner_id', user.id)
          .single()

        if (jobError || !jobData) {
          setError('Job not found or access denied')
          setLoading(false)
          return
        }

        setJob(jobData)

        // Fetch accepted bid to get contractor
        const { data: bidData, error: bidError } = await supabase
          .from('job_bids')
          .select('contractor_id')
          .eq('job_id', jobId)
          .eq('status', 'accepted')
          .single()

        if (bidError || !bidData) {
          setError('No accepted bid found')
          setLoading(false)
          return
        }

        // Fetch contractor info
        const { data: contractorData, error: contractorError } = await supabase
          .from('pro_contractors')
          .select('id, name, business_name, phone, avatar_url')
          .eq('id', bidData.contractor_id)
          .single()

        if (contractorError || !contractorData) {
          setError('Contractor not found')
          setLoading(false)
          return
        }

        setContractor(contractorData)
        setLoading(false)

        // Subscribe to location updates
        subscribeToLocation(bidData.contractor_id, jobData)
      } catch (err: any) {
        console.error('Error fetching data:', err)
        setError(err.message || 'Failed to load tracking data')
        setLoading(false)
      }
    }

    fetchData()
  }, [user, jobId])

  const subscribeToLocation = (contractorId: string, jobData: Job) => {
    const channel = supabase
      .channel(`contractor-location-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contractor_location_tracking',
          filter: `job_id=eq.${jobId}`
        },
        (payload) => {
          console.log('[TRACKING] Location update:', payload)
          if (payload.new && 'latitude' in payload.new) {
            const newLocation = payload.new as any
            setLocation(newLocation)
            updateMap(newLocation, jobData)
          }
        }
      )
      .subscribe()

    // Fetch initial location
    fetchInitialLocation(contractorId, jobData)

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const fetchInitialLocation = async (contractorId: string, jobData: Job) => {
    const { data, error } = await supabase
      .from('contractor_location_tracking')
      .select('*')
      .eq('job_id', jobId)
      .eq('contractor_id', contractorId)
      .order('last_update_at', { ascending: false })
      .limit(1)
      .single()

    if (data && !error) {
      setLocation(data)
      updateMap(data, jobData)
    }
  }

  const updateMap = async (loc: ContractorLocation, jobData: Job) => {
    if (!map.current) return

    // Update or create contractor marker
    if (contractorMarker.current) {
      contractorMarker.current.setLngLat([loc.longitude, loc.latitude])
    } else {
      const contractorEl = document.createElement('div')
      contractorEl.className = 'w-12 h-12 flex items-center justify-center'
      contractorEl.innerHTML = `
        <div class="relative">
          <div class="absolute inset-0 bg-blue-500 rounded-full animate-pulse"></div>
          <div class="relative w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl shadow-lg border-3 border-white transform transition-transform" style="transform: rotate(${loc.heading || 0}deg)">
            🚗
          </div>
        </div>
      `

      contractorMarker.current = new mapboxgl.Marker({
        element: contractorEl,
        anchor: 'center'
      })
        .setLngLat([loc.longitude, loc.latitude])
        .addTo(map.current)
    }

    // Update route line
    if (routeLine.current && map.current.getSource('route')) {
      try {
        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${loc.longitude},${loc.latitude};${jobData.longitude},${jobData.latitude}?geometries=geojson&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
        )
        const data = await response.json()

        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0].geometry
          ;(map.current.getSource('route') as mapboxgl.GeoJSONSource).setData({
            type: 'Feature',
            properties: {},
            geometry: route
          })
        }
      } catch (err) {
        console.error('Error fetching route:', err)
      }
    }

    // Fit bounds to show both markers
    const bounds = new mapboxgl.LngLatBounds()
    bounds.extend([jobData.longitude, jobData.latitude])
    bounds.extend([loc.longitude, loc.latitude])
    map.current.fitBounds(bounds, { padding: 100, maxZoom: 15 })
  }

  const formatETA = (minutes?: number) => {
    if (!minutes) return 'Calculating...'
    if (minutes < 1) return 'Arriving now'
    if (minutes === 1) return '1 minute'
    return `${minutes} minutes`
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'arrived':
        return 'bg-green-500'
      case 'en_route':
        return 'bg-blue-500'
      case 'online':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-400'
    }
  }

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'arrived':
        return 'Contractor has arrived'
      case 'en_route':
        return 'Contractor is on the way'
      case 'online':
        return 'Contractor is online'
      default:
        return 'Waiting for contractor'
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading tracking...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/dashboard/homeowner')}
            className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Map */}
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Top ETA Banner */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-4 max-w-md mx-auto backdrop-blur-sm bg-white/95">
          <div className="flex items-center gap-4">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(location?.status)} animate-pulse`}></div>
            <div className="flex-1">
              <p className="text-sm text-slate-600">{getStatusText(location?.status)}</p>
              <p className="text-2xl font-bold text-slate-900">
                {location?.status === 'arrived' ? 'Arrived!' : `${formatETA(location?.eta_minutes)} away`}
              </p>
            </div>
            {location?.distance_to_job_meters && (
              <div className="text-right">
                <p className="text-sm text-slate-600">Distance</p>
                <p className="text-lg font-semibold text-slate-900">
                  {(location.distance_to_job_meters / 1000).toFixed(1)} km
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Contractor Card */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-4">
        <div className="bg-white rounded-t-3xl shadow-2xl p-6 max-w-2xl mx-auto backdrop-blur-sm bg-white/95">
          {contractor && (
            <div className="space-y-4">
              {/* Contractor Info */}
              <div className="flex items-center gap-4 pb-4 border-b border-slate-200">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {contractor.name?.charAt(0) || 'C'}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900">
                    {contractor.business_name || contractor.name}
                  </h3>
                  <p className="text-slate-600">{contractor.phone}</p>
                </div>
                <a
                  href={`tel:${contractor.phone}`}
                  className="w-12 h-12 bg-emerald-600 hover:bg-emerald-700 rounded-full flex items-center justify-center text-white shadow-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </a>
              </div>

              {/* Job Info */}
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm font-medium text-slate-700 mb-1">Job Location</p>
                <p className="text-slate-900 font-semibold">{job?.title}</p>
                <p className="text-sm text-slate-600 mt-1">{job?.address}</p>
              </div>

              {/* Additional Info */}
              {location && location.status !== 'arrived' && (
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-emerald-600">{formatETA(location.eta_minutes)}</p>
                    <p className="text-xs text-slate-600 mt-1">ETA</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      {location.speed ? Math.round(location.speed * 3.6) : 0}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">km/h</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">
                      {location.distance_to_job_meters ? (location.distance_to_job_meters / 1000).toFixed(1) : '0'}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">km away</p>
                  </div>
                </div>
              )}

              {location?.status === 'arrived' && (
                <div className="bg-green-50 border-2 border-green-500 rounded-xl p-4 text-center">
                  <div className="text-4xl mb-2">🎉</div>
                  <p className="text-lg font-bold text-green-900">Contractor has arrived!</p>
                  <p className="text-sm text-green-700 mt-1">They should be knocking on your door soon</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Back Button */}
      <button
        onClick={() => router.push('/dashboard/homeowner')}
        className="absolute top-4 left-4 z-20 w-10 h-10 bg-white hover:bg-slate-100 rounded-full shadow-lg flex items-center justify-center transition-colors"
      >
        <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    </div>
  )
}
