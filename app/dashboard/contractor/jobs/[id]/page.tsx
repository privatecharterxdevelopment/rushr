'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useProAuth } from '../../../../../contexts/ProAuthContext'
import { supabase } from '../../../../../lib/supabaseClient'
import dynamic from 'next/dynamic'
import LoadingSpinner from '../../../../../components/LoadingSpinner'
import { ArrowLeft, MapPin, Clock, DollarSign, User, Phone, Mail, Navigation } from 'lucide-react'
import Link from 'next/link'

// Dynamic import for chat
const JobChat = dynamic(() => import('../../../../../components/JobChat'), { ssr: false })

export default function ContractorJobDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useProAuth()
  const [job, setJob] = useState<any>(null)
  const [homeowner, setHomeowner] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [trackingEnabled, setTrackingEnabled] = useState(false)
  const [updatingLocation, setUpdatingLocation] = useState(false)
  const watchId = React.useRef<number | null>(null)

  const jobId = params.id as string

  useEffect(() => {
    if (!user || !jobId) return

    const fetchJobDetails = async () => {
      try {
        // Fetch job details
        const { data: jobData, error: jobError } = await supabase
          .from('homeowner_jobs')
          .select('*')
          .eq('id', jobId)
          .single()

        if (jobError) {
          console.error('Error fetching job:', jobError)
          return
        }

        // Verify this contractor has access to this job (has accepted bid)
        const { data: bidData } = await supabase
          .from('job_bids')
          .select('*')
          .eq('job_id', jobId)
          .eq('contractor_id', user.id)
          .eq('status', 'accepted')
          .single()

        if (!bidData) {
          console.error('Contractor does not have access to this job')
          router.push('/dashboard/contractor')
          return
        }

        setJob(jobData)

        // Fetch homeowner details
        if (jobData.homeowner_id) {
          const { data: homeownerData, error: homeownerError } = await supabase
            .from('user_profiles')
            .select('name, phone, email')
            .eq('id', jobData.homeowner_id)
            .single()

          if (homeownerError) {
            console.error('Error fetching homeowner:', homeownerError)
          } else {
            setHomeowner(homeownerData)
          }
        }

        // Check if tracking is already enabled
        const { data: locationData } = await supabase
          .from('contractor_locations')
          .select('is_tracking_enabled')
          .eq('job_id', jobId)
          .eq('contractor_id', user.id)
          .single()

        if (locationData?.is_tracking_enabled) {
          setTrackingEnabled(true)
          startLocationTracking()
        }
      } catch (error) {
        console.error('Error loading job details:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchJobDetails()

    return () => {
      stopLocationTracking()
    }
  }, [user, jobId, router])

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }

    // Start watching position
    watchId.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, heading, speed } = position.coords

        // Update location in database
        await supabase
          .from('contractor_locations')
          .upsert({
            contractor_id: user?.id,
            job_id: jobId,
            latitude,
            longitude,
            heading: heading || 0,
            speed: speed ? speed * 3.6 : 0, // Convert m/s to km/h
            accuracy: position.coords.accuracy,
            is_tracking_enabled: true,
            last_updated_at: new Date().toISOString()
          })

        console.log('[TRACKING] Location updated:', { latitude, longitude })
      },
      (error) => {
        console.error('[TRACKING] Error:', error)
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    )
  }

  const stopLocationTracking = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current)
      watchId.current = null
    }
  }

  const toggleTracking = async () => {
    setUpdatingLocation(true)

    if (!trackingEnabled) {
      // Enable tracking
      setTrackingEnabled(true)
      startLocationTracking()

      // Update database
      await supabase
        .from('contractor_locations')
        .upsert({
          contractor_id: user?.id,
          job_id: jobId,
          latitude: 0,
          longitude: 0,
          is_tracking_enabled: true
        })
    } else {
      // Disable tracking
      setTrackingEnabled(false)
      stopLocationTracking()

      // Update database
      await supabase
        .from('contractor_locations')
        .update({ is_tracking_enabled: false })
        .eq('job_id', jobId)
        .eq('contractor_id', user?.id)
    }

    setUpdatingLocation(false)
  }

  const openInMaps = () => {
    if (!job?.address) return

    const address = encodeURIComponent(job.address)
    const url = `https://maps.google.com/?q=${address}`
    window.open(url, '_blank')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading job details..." />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Job not found</h2>
          <Link href="/dashboard/contractor" className="btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const isJobConfirmed = job.status === 'confirmed' || job.status === 'in_progress'
  const showChat = isJobConfirmed && homeowner

  return (
    <div className="container-max py-8 space-y-6">
      {/* Back Button */}
      <Link
        href="/dashboard/contractor"
        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      {/* Job Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">{job.title}</h1>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                job.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                job.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                job.status === 'in_progress' ? 'bg-purple-100 text-purple-800' :
                job.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                'bg-slate-100 text-slate-800'
              }`}>
                {job.status.replace('_', ' ').toUpperCase()}
              </span>
              {job.priority === 'emergency' && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  🚨 EMERGENCY
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            {job.final_cost && (
              <div className="text-2xl font-bold text-blue-600">
                ${job.final_cost.toFixed(2)}
              </div>
            )}
            <div className="text-sm text-slate-500">
              Posted {new Date(job.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Job Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-slate-700">Location</div>
              <div className="text-slate-900">{job.address || 'Not specified'}</div>
              {job.address && (
                <button
                  onClick={openInMaps}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Navigation className="w-4 h-4" />
                  Open in Google Maps
                </button>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-slate-700">Category</div>
              <div className="text-slate-900">{job.category || 'General'}</div>
            </div>
          </div>

          {job.description && (
            <div className="md:col-span-2">
              <div className="text-sm font-medium text-slate-700 mb-1">Description</div>
              <div className="text-slate-900 bg-slate-50 p-3 rounded-lg">
                {job.description}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Homeowner Info */}
      {homeowner && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Homeowner Information</h2>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl font-bold">
              {homeowner.name?.[0] || 'H'}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">{homeowner.name || 'Homeowner'}</h3>
              <div className="flex flex-col gap-2 mt-2 text-sm text-slate-600">
                {homeowner.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <a href={`tel:${homeowner.phone}`} className="hover:text-blue-600">
                      {homeowner.phone}
                    </a>
                  </div>
                )}
                {homeowner.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <a href={`mailto:${homeowner.email}`} className="hover:text-blue-600">
                      {homeowner.email}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location Tracking Toggle */}
      {isJobConfirmed && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">📍 Location Sharing</h3>
              <p className="text-sm text-slate-600">
                {trackingEnabled
                  ? 'Homeowner can see your real-time location'
                  : 'Share your location so homeowner can track your arrival'}
              </p>
            </div>
            <button
              onClick={toggleTracking}
              disabled={updatingLocation}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                trackingEnabled
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              } disabled:opacity-50`}
            >
              {updatingLocation ? 'Updating...' : trackingEnabled ? '✓ Sharing Location' : 'Enable Sharing'}
            </button>
          </div>
        </div>
      )}

      {/* Live Chat */}
      {showChat && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">💬 Live Chat</h2>
          <JobChat
            jobId={jobId}
            homeownerName={homeowner.name || 'Homeowner'}
            contractorName={user.email?.split('@')[0] || 'You'}
          />
        </div>
      )}

      {/* Waiting for Confirmation Message */}
      {!isJobConfirmed && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <div className="text-amber-800">
            <Clock className="w-12 h-12 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">Waiting for Confirmation</h3>
            <p className="text-sm">
              Chat and location tracking will be available once the homeowner confirms the job.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
