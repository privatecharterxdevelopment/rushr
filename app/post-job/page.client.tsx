'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { supabase } from '../../lib/supabaseClient'
import {
  Check,
  Clock,
  MapPin,
  Phone,
  Shield,
  Star,
  X,
  AlertTriangle,
  Info,
  Users,
  Zap,
  Wind,
  Hammer,
  Droplets,
  Wrench,
  Leaf,
  User,
} from 'lucide-react'

const ProMap = dynamic(() => import('../../components/ProMap'), { ssr: false })

type Props = { userId: string | null }

/** Emergency contractor type */
type Contractor = {
  id: string
  name: string
  rating: number
  jobs: number
  distanceKm: number
  etaMin: number
  trades: string[]
  insured: boolean
  backgroundChecked: boolean
  activeNow: boolean
}

const MOCK: Contractor[] = [
  { id: 'c1', name: 'Atlas Plumbing & Heating', rating: 4.9, jobs: 312, distanceKm: 1.2, etaMin: 14, trades: ['Water leak', 'Burst pipe', 'Gas'], insured: true, backgroundChecked: true, activeNow: true },
  { id: 'c2', name: 'BrightSpark Electrical', rating: 4.8, jobs: 201, distanceKm: 2.0, etaMin: 18, trades: ['Power outage', 'Breaker'], insured: true, backgroundChecked: true, activeNow: true },
  { id: 'c3', name: 'Shield Roofing', rating: 4.7, jobs: 167, distanceKm: 3.4, etaMin: 24, trades: ['Roof leak', 'Tarp'], insured: true, backgroundChecked: true, activeNow: true },
  { id: 'c4', name: 'Metro Restoration', rating: 4.6, jobs: 451, distanceKm: 4.1, etaMin: 27, trades: ['Flood', 'Mold'], insured: true, backgroundChecked: true, activeNow: false },
]

/** UI components */
function Stars({ value }: { value: number }) {
  const full = Math.floor(value)
  const half = value - full >= 0.5
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rated ${value} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < full
              ? 'fill-yellow-400 stroke-yellow-400'
              : half && i === full
              ? 'fill-yellow-300 stroke-yellow-300'
              : 'stroke-slate-300'
          }`}
        />
      ))}
    </div>
  )
}

function EmergencyBanner() {
  return (
    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
        <div>
          <div className="font-semibold">Life-threatening emergency?</div>
          <div className="text-sm">If this is an immediate danger or life-threatening emergency, call 911 first.</div>
        </div>
      </div>
    </div>
  )
}

function SafetyNotice() {
  return (
    <div className="card p-4 flex items-start gap-3 bg-emerald-50 border-emerald-200">
      <Shield className="h-5 w-5 text-emerald-600 flex-shrink-0" />
      <div className="text-sm text-slate-700">
        <div className="font-medium text-emerald-800 mb-1">Safety First</div>
        Shut off water or power if safe to do so. Keep children and pets away from hazards. If you smell gas, call your utility company and 911.
      </div>
    </div>
  )
}

function Field({
  label,
  required,
  children,
  helper,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
  helper?: string
}) {
  return (
    <div>
      <label className={`block text-sm font-medium text-slate-700 mb-2 ${required ? 'after:content-["*"] after:text-red-500 after:ml-1' : ''}`}>
        {label}
      </label>
      {children}
      {helper ? <div className="mt-2 text-xs text-slate-500">{helper}</div> : null}
    </div>
  )
}

function ContractorCard({
  c,
  selected,
  onPick,
}: {
  c: Contractor
  selected?: boolean
  onPick?: () => void
}) {
  return (
    <div className={`card p-4 flex items-center justify-between gap-4 transition-all hover:shadow-lg ${selected ? 'ring-2 ring-emerald-500 bg-emerald-50' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="grid place-items-center h-10 w-10 rounded-xl bg-emerald-100 text-emerald-600">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <div className="font-semibold text-slate-900">{c.name}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <Stars value={c.rating} />
            <span>•</span>
            <span>{c.jobs} jobs</span>
            <span>•</span>
            <span>{c.distanceKm.toFixed(1)} km</span>
            {c.insured && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">Insured</span>}
            {c.backgroundChecked && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Verified</span>}
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {c.trades.map((t) => (
              <span key={t} className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs">{t}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {c.activeNow ? (
          <div className="text-right">
            <div className="text-xs text-emerald-600 font-medium">Available Now</div>
            <div className="text-xs text-slate-500">Will share ETA & price</div>
          </div>
        ) : (
          <div className="text-right text-xs text-slate-500">Currently unavailable</div>
        )}
        <button
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            c.activeNow
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-slate-200 text-slate-500 cursor-not-allowed'
          }`}
          onClick={onPick}
          disabled={!c.activeNow}
        >
          Select
        </button>
      </div>
    </div>
  )
}

function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  body,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  body: string
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <div>
            <div className="font-semibold text-slate-900">{title}</div>
            <p className="mt-1 text-sm text-slate-600">{body}</p>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={onConfirm}>
            Send Emergency Request
          </button>
        </div>
      </div>
    </div>
  )
}

/** Emergency categories and services */
const EMERGENCY_CATEGORIES = [
  { key: 'home', label: '🏠 Home Emergency' },
  { key: 'auto', label: '🚗 Auto Emergency' }
] as const

const EMERGENCY_TYPES_MAP: Record<string, Array<{key: string, label: string, icon: string}>> = {
  'home': [
    { key: 'plumbing', label: 'Plumbing Emergency', icon: '🚢' },
    { key: 'electrical', label: 'Electrical Emergency', icon: '⚡' },
    { key: 'hvac', label: 'HVAC Emergency', icon: '❄️' },
    { key: 'roofing', label: 'Roof Emergency', icon: '🏠' },
    { key: 'water-damage', label: 'Water Damage', icon: '💧' },
    { key: 'locksmith', label: 'Lockout Emergency', icon: '🔐' },
    { key: 'appliance', label: 'Appliance Emergency', icon: '🔧' },
    { key: 'other', label: 'Other Home Emergency', icon: '🔨' }
  ],
  'auto': [
    { key: 'battery', label: 'Dead Battery', icon: '🔋' },
    { key: 'tire', label: 'Flat Tire', icon: '🚗' },
    { key: 'lockout', label: 'Car Lockout', icon: '🔑' },
    { key: 'tow', label: 'Need Towing', icon: '🚚' },
    { key: 'fuel', label: 'Out of Fuel', icon: '⛽' },
    { key: 'mechanic', label: 'Breakdown/Repair', icon: '⚙️' },
    { key: 'other', label: 'Other Auto Emergency', icon: '🆘' }
  ]
}

function CategoryPill({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm flex items-center gap-2 transition-all ${
        active ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg' : 'border-slate-200 hover:bg-emerald-50 hover:border-emerald-200'
      }`}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  )
}

function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="card p-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-200" />
              <div>
                <div className="h-4 w-40 rounded bg-slate-200" />
                <div className="mt-2 flex gap-2">
                  <div className="h-3 w-16 rounded bg-slate-200" />
                  <div className="h-3 w-10 rounded bg-slate-200" />
                  <div className="h-3 w-14 rounded bg-slate-200" />
                </div>
              </div>
            </div>
            <div className="h-8 w-20 rounded bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  )
}

function TopProgress({ active }: { active: boolean }) {
  return (
    <div className={`fixed inset-x-0 top-0 z-[70] ${active ? '' : 'hidden'}`}>
      <div className="h-1 w-full overflow-hidden bg-transparent">
        <div className="h-full w-1/3 animate-[progress_1.2s_ease-in-out_infinite] bg-emerald-600" />
      </div>
      <style jsx>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(50%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  )
}

export default function PostJobInner({ userId }: Props) {
  // Form state
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [category, setCategory] = useState('')
  const [emergencyType, setEmergencyType] = useState('')
  const [issueTitle, setIssueTitle] = useState('')
  const [details, setDetails] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)

  // Form validation state
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [uploadError, setUploadError] = useState<string>('')

  // Emergency flow state
  const [sendAll, setSendAll] = useState(true)
  const [picked, setPicked] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [sending, setSending] = useState(false)

  // Get user's current location
  const getCurrentLocation = () => {
    console.log('getCurrentLocation called!')

    if (!navigator.geolocation) {
      console.error('Geolocation not supported')
      alert('Geolocation is not supported by your browser.')
      return
    }

    console.log('Requesting geolocation permission...')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Geolocation success!', position.coords)
        const { latitude, longitude } = position.coords
        // Store as [lat, lng] for ProMapInner
        setUserLocation([latitude, longitude])
        setAddress(`Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`)
        console.log('Set userLocation:', [latitude, longitude])
        console.log('Set address:', `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`)
      },
      (error) => {
        console.error('Geolocation error:', error)
        console.error('Error code:', error.code)
        console.error('Error message:', error.message)

        let errorMessage = 'Could not get your location. '
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Permission denied. Please allow location access in your browser settings.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.'
            break
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.'
            break
          default:
            errorMessage += 'An unknown error occurred.'
        }

        alert(errorMessage)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  // Geocode address (e.g., "New York City" → coordinates + formatted address)
  const geocodeAddress = async (searchText: string) => {
    const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!MAPBOX_TOKEN) {
      console.error('Mapbox token not configured')
      return
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchText)}.json?access_token=${MAPBOX_TOKEN}&limit=1`
      )
      const data = await response.json()

      if (data.features && data.features.length > 0) {
        const feature = data.features[0]
        const [lng, lat] = feature.center
        const formattedAddress = feature.place_name

        setUserLocation([lat, lng])
        setAddress(formattedAddress)
        console.log('Geocoded:', searchText, '→', formattedAddress, [lat, lng])
      }
    } catch (error) {
      console.error('Geocoding error:', error)
    }
  }

  // Debounced geocoding when user types in address field
  useEffect(() => {
    if (!address || address.length < 3) return
    if (address.startsWith('Current Location')) return

    const timer = setTimeout(() => {
      geocodeAddress(address)
    }, 1000) // Wait 1 second after user stops typing

    return () => clearTimeout(timer)
  }, [address])

  // Form validation functions
  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors }

    switch (field) {
      case 'address':
        if (!value.trim()) {
          newErrors.address = 'Address is required'
        } else if (value.trim().length < 5) {
          newErrors.address = 'Please enter a complete address'
        } else {
          delete newErrors.address
        }
        break

      case 'phone':
        const phoneRegex = /^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/
        if (!value.trim()) {
          newErrors.phone = 'Phone number is required'
        } else if (!phoneRegex.test(value.trim())) {
          newErrors.phone = 'Please enter a valid phone number'
        } else {
          delete newErrors.phone
        }
        break

      case 'category':
        if (!value) {
          newErrors.category = 'Please select an emergency category'
        } else {
          delete newErrors.category
        }
        break

      case 'emergencyType':
        if (!value) {
          newErrors.emergencyType = 'Please select the type of emergency'
        } else {
          delete newErrors.emergencyType
        }
        break

      case 'issueTitle':
        if (!value.trim()) {
          newErrors.issueTitle = 'Please describe your emergency'
        } else if (value.trim().length < 10) {
          newErrors.issueTitle = 'Please provide more details (at least 10 characters)'
        } else {
          delete newErrors.issueTitle
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateForm = () => {
    const isAddressValid = validateField('address', address)
    const isPhoneValid = validateField('phone', phone)
    const isCategoryValid = validateField('category', category)
    const isEmergencyTypeValid = validateField('emergencyType', emergencyType)
    const isIssueTitleValid = validateField('issueTitle', issueTitle)

    return isAddressValid && isPhoneValid && isCategoryValid && isEmergencyTypeValid && isIssueTitleValid
  }

  const handleFieldBlur = (field: string, value: string) => {
    setTouched({ ...touched, [field]: true })
    validateField(field, value)
  }

  // Read URL parameters
  const searchParams = useSearchParams()

  useEffect(() => {
    const categoryParam = searchParams.get('category')
    if (categoryParam) {
      setCategory(categoryParam)
    }
  }, [searchParams])

  // Auto-fetch user location on page load
  useEffect(() => {
    console.log('Auto-fetching user location on page load...')
    getCurrentLocation()
  }, []) // Empty dependency array = runs once on mount

  // Pro list filters
  const [onlyActive, setOnlyActive] = useState(true)
  const [sortBy, setSortBy] = useState<'eta' | 'distance' | 'rating'>('eta')
  const [nearbyContractors, setNearbyContractors] = useState<Contractor[]>([])
  const [loadingContractors, setLoadingContractors] = useState(false)

  // Fetch nearby contractors - Filter by ZIP and category
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    async function fetchNearbyContractors() {
      // Extract ZIP from address
      const zipMatch = address.match(/\b\d{5}\b/)
      const homeownerZip = zipMatch ? zipMatch[0] : null

      if (!homeownerZip) {
        console.log('[POST-JOB] No ZIP code yet, waiting for address')
        setNearbyContractors([])
        return
      }

      setLoadingContractors(true)

      try {
        // Get ALL contractors and filter client-side by ZIP
        let query = supabase
          .from('pro_contractors')
          .select('id, name, business_name, categories, base_zip, service_area_zips, phone, status')
          .eq('status', 'approved')

        // Filter by emergency category if selected
        if (emergencyType) {
          query = query.contains('categories', [emergencyType])
        }

        const { data: contractors, error } = await query.limit(100)

        if (error) {
          console.error('[POST-JOB] Database error:', error)
          setNearbyContractors([])
          return
        }

        if (contractors && contractors.length > 0) {
          // Filter contractors by ZIP - check if homeowner ZIP is in their service area
          const matchingContractors = contractors.filter(c => {
            const serviceZips = c.service_area_zips || []
            const baseZip = c.base_zip
            return serviceZips.includes(homeownerZip) || baseZip === homeownerZip
          })

          // Map database contractors to UI Contractor type
          const mappedContractors: Contractor[] = matchingContractors.map((c, index) => ({
            id: c.id,
            name: c.business_name || c.name || 'Contractor',
            rating: 4.5 + (Math.random() * 0.5),
            jobs: Math.floor(Math.random() * 500),
            distanceKm: (index + 1) * 1.5,
            etaMin: (index + 1) * 10 + 5,
            trades: c.categories || [],
            insured: true,
            backgroundChecked: true,
            activeNow: true,
          }))

          console.log(`[POST-JOB] Found ${mappedContractors.length} contractors for ZIP ${homeownerZip}, category: ${emergencyType || 'ALL'}`)
          setNearbyContractors(mappedContractors)
        } else {
          console.log(`[POST-JOB] No contractors found for category: ${emergencyType || 'ALL'}`)
          setNearbyContractors([])
        }
      } catch (err) {
        console.error('[POST-JOB] Error fetching contractors:', err)
        setNearbyContractors([])
      } finally {
        setLoadingContractors(false)
      }
    }

    fetchNearbyContractors()
  }, [emergencyType, address])

  const filteredNearby = useMemo(() => {
    // Only show contractors if we have a location (userLocation OR valid ZIP in address)
    const hasLocation = userLocation !== null || address.match(/\d{5}/)
    if (!hasLocation) return []

    const base = nearbyContractors.length > 0
      ? (onlyActive ? nearbyContractors.filter(m => m.activeNow) : nearbyContractors)
      : [] // Don't fallback to MOCK - only show real data
    const sorted = [...base].sort((a, b) =>
      sortBy === 'eta' ? a.etaMin - b.etaMin : sortBy === 'distance' ? a.distanceKm - b.distanceKm : b.rating - a.rating
    )
    return sorted
  }, [nearbyContractors, onlyActive, sortBy, userLocation, address])

  const selectedContractor = useMemo(() =>
    nearbyContractors.find((m) => m.id === picked) || null
  , [picked, nearbyContractors])

  function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    setUploadError('')

    // Validate file types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/mov', 'video/avi']
    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type))

    if (invalidFiles.length > 0) {
      setUploadError('Please upload only images (JPG, PNG, GIF, WebP) or videos (MP4, MOV, AVI)')
      return
    }

    // Validate file sizes (10MB for images, 50MB for videos)
    const oversizedFiles = files.filter(file => {
      const isVideo = file.type.startsWith('video/')
      const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024
      return file.size > maxSize
    })

    if (oversizedFiles.length > 0) {
      setUploadError('Files too large. Images must be under 10MB, videos under 50MB')
      return
    }

    // Check total file count
    if (photos.length + files.length > 6) {
      setUploadError('Maximum 6 files allowed. Please remove some files first.')
      return
    }

    setPhotos((prev) => [...prev, ...files])
  }

  function removePhoto(i: number) {
    setPhotos((prev) => prev.filter((_, idx) => idx !== i))
    setUploadError('') // Clear any upload errors when removing files
  }

  function submit() {
    setConfirmOpen(true)
  }

  async function actuallySend() {
    setConfirmOpen(false)
    setSending(true)

    try {
      console.log('Submitting emergency job to database...')

      // Import supabase
      const { supabase } = await import('../../lib/supabaseClient')

      // Prepare job data
      const jobData = {
        title: issueTitle,
        description: details || issueTitle,
        category: emergencyType || category,
        priority: 'emergency', // All post-job submissions are emergency
        status: 'pending', // Waiting for contractors to accept
        address: address,
        latitude: userLocation ? userLocation[0] : null,
        longitude: userLocation ? userLocation[1] : null,
        zip_code: address.match(/\d{5}/)?.[0] || null,
        phone: phone,
        homeowner_id: userId, // Current user ID
        created_at: new Date().toISOString(),
      }

      console.log('Job data:', jobData)

      // Insert job into database
      const { data: insertedJob, error } = await supabase
        .from('homeowner_jobs')
        .insert([jobData])
        .select()
        .single()

      if (error) {
        console.error('Error creating job:', error)
        alert('Failed to submit emergency request. Please try again.')
        setSending(false)
        return
      }

      console.log('Job created successfully:', insertedJob)

      // Redirect to homeowner dashboard
      setSending(false)
      window.location.href = '/dashboard/homeowner'

    } catch (err) {
      console.error('Error submitting job:', err)
      alert('Failed to submit emergency request. Please try again.')
      setSending(false)
    }
  }

  return (
    <>
      <TopProgress active={sending} />

      <div className="container-max section">
        <ConfirmModal
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={actuallySend}
          title="Send Emergency Request?"
          body={
            sendAll
              ? 'We will instantly alert all active emergency pros in your area. The first to accept will be shown with live ETA tracking.'
              : selectedContractor
              ? `We will notify ${selectedContractor.name} immediately about your emergency.`
              : 'Please select a contractor or choose "Alert All Nearby" option.'
          }
        />

        {/* Emergency banner */}
        <EmergencyBanner />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          {/* Left column: Emergency form */}
          <div className="space-y-6 lg:col-span-2">
            <div className="card p-6 space-y-6">
              <Field label="Emergency Location" required helper="Precise location helps emergency responders find you faster.">
                <div className="flex gap-2">
                  <input
                    className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                      touched.address && errors.address ? 'border-red-500' : 'border-slate-200'
                    }`}
                    placeholder="Street address"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value)
                      if (touched.address) validateField('address', e.target.value)
                    }}
                    onBlur={(e) => handleFieldBlur('address', e.target.value)}
                    aria-invalid={touched.address && errors.address ? 'true' : 'false'}
                    aria-describedby={touched.address && errors.address ? 'address-error' : undefined}
                  />
                  <button
                    type="button"
                    className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1 text-sm"
                    onClick={getCurrentLocation}
                    title="Use current location"
                  >
                    <MapPin className="h-4 w-4" />
                  </button>
                </div>
                {touched.address && errors.address && (
                  <div id="address-error" className="mt-1 text-sm text-red-600">
                    {errors.address}
                  </div>
                )}
              </Field>

              <Field label="Contact Number" required>
                <div className="flex gap-2">
                  <input
                    className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                      touched.phone && errors.phone ? 'border-red-500' : 'border-slate-200'
                    }`}
                    placeholder="Mobile number"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value)
                      if (touched.phone) validateField('phone', e.target.value)
                    }}
                    onBlur={(e) => handleFieldBlur('phone', e.target.value)}
                    aria-invalid={touched.phone && errors.phone ? 'true' : 'false'}
                    aria-describedby={touched.phone && errors.phone ? 'phone-error' : undefined}
                  />
                  <button
                    className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1 text-sm"
                    onClick={() => setPhone('(555) 123-4567')}
                    title="Autofill from profile"
                  >
                    <User className="h-4 w-4" />
                  </button>
                </div>
                {touched.phone && errors.phone && (
                  <div id="phone-error" className="mt-1 text-sm text-red-600">
                    {errors.phone}
                  </div>
                )}
              </Field>

              <Field label="Emergency Category" required>
                <select
                  value={category}
                  onChange={(e) => {
                    const newCategory = e.target.value
                    setCategory(newCategory)
                    if (newCategory && EMERGENCY_TYPES_MAP[newCategory]?.length > 0) {
                      setEmergencyType(EMERGENCY_TYPES_MAP[newCategory][0].key) // Set first emergency type as default
                    } else {
                      setEmergencyType('')
                    }
                  }}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                >
                  <option value="">Select One</option>
                  {EMERGENCY_CATEGORIES.map(({ key, label }) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>

              {category && (
                <Field label="Emergency Type" required>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {EMERGENCY_TYPES_MAP[category]?.map(({ key, label, icon }) => (
                      <label
                        key={key}
                        className={`relative flex flex-col items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all hover:bg-slate-50 ${
                          emergencyType === key
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-slate-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="emergencyType"
                          value={key}
                          checked={emergencyType === key}
                          onChange={(e) => setEmergencyType(e.target.value)}
                          className="sr-only"
                        />
                        <span className="text-xl">{icon}</span>
                        <div className="text-center">
                          <div className="text-sm font-medium text-slate-900 leading-tight">{label}</div>
                        </div>
                        {emergencyType === key && (
                          <div className="absolute top-2 right-2 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </label>
                    )) || []}
                  </div>
                </Field>
              )}

              <Field label="Emergency Description" required helper="Be specific about the problem. Example: 'Water pouring from ceiling in kitchen'">
                <input
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Brief, clear description of the emergency"
                  value={issueTitle}
                  onChange={(e) => setIssueTitle(e.target.value)}
                />
              </Field>

              <Field label="Additional Details">
                <textarea
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 min-h-[100px]"
                  placeholder="Any additional details that might help the professional..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                />
              </Field>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Photos or Video
                  <span className="text-sm font-normal text-slate-500">
                    (Optional - helps pros assess your emergency faster)
                  </span>
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={onUpload}
                  className={`w-full px-4 py-3 border rounded-lg ${
                    uploadError ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
                {uploadError && (
                  <div className="mt-1 text-sm text-red-600">
                    {uploadError}
                  </div>
                )}
                {photos.length > 0 && (
                  <div className="mt-2 text-sm text-slate-600">
                    {photos.length}/6 files uploaded
                  </div>
                )}
                {!!photos.length && (
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {photos.map((f, i) => (
                      <div key={i} className="relative">
                        <div className="h-24 w-full rounded-lg bg-slate-100 flex items-center justify-center">
                          <span className="text-xs text-slate-500">{f.name.slice(0, 10)}...</span>
                        </div>
                        <button
                          className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                          onClick={() => removePhoto(i)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <SafetyNotice />
            </div>

            {/* Send mode */}
            <div className="card p-6">
              <label className="block text-sm font-medium text-slate-700 mb-4">Emergency Response Mode</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  className={`p-4 rounded-lg border text-left transition-all ${
                    sendAll ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 hover:border-slate-300'
                  }`}
                  onClick={() => setSendAll(true)}
                >
                  <div className="font-medium">Alert All Nearby</div>
                  <div className="text-sm opacity-75">Fastest response</div>
                </button>
                <button
                  className={`p-4 rounded-lg border text-left transition-all ${
                    !sendAll ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 hover:border-slate-300'
                  }`}
                  onClick={() => setSendAll(false)}
                >
                  <div className="font-medium">Select Pro</div>
                  <div className="text-sm opacity-75">Choose specific contractor</div>
                </button>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                "Alert All" notifies all available emergency pros in your area for the fastest response time.
              </p>
            </div>

            <div className="card p-4 flex items-start gap-3 bg-blue-50 border-blue-200">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <div className="font-medium mb-1">Emergency Pricing</div>
                Emergency calls typically include a service fee plus hourly rates. You'll approve all costs before work begins.
              </div>
            </div>
          </div>

          {/* Right column: Map and emergency pros */}
          <div className="space-y-6 lg:col-span-3">
            <div className="card p-0 overflow-hidden relative">
              {/* Always show the map */}
              <ProMap
                centerZip={address.match(/\d{5}/)?.[0] || '10001'}
                category={category}
                radiusMiles={10}
                searchCenter={userLocation || undefined}
              />

              {/* Overlay prompt when no location */}
              {!userLocation && !address.match(/\d{5}/) && (
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/95 to-white/95 z-10 grid place-items-center">
                  <div className="text-center">
                    <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-emerald-100 text-emerald-600">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div className="font-medium text-slate-900">Click to see nearby pros on the map</div>
                    <p className="mt-1 text-sm text-slate-500">Use your location or enter an address above</p>
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                    >
                      📍 Use My Current Location
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Emergency pros filters */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="text-lg font-semibold text-slate-900">Emergency Professionals Nearby</div>
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="accent-emerald-600"
                    checked={onlyActive}
                    onChange={(e) => setOnlyActive(e.target.checked)}
                  />
                  <span className="text-sm text-slate-600">Available now</span>
                </label>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                >
                  <option value="eta">Sort: Response Time</option>
                  <option value="distance">Sort: Distance</option>
                  <option value="rating">Sort: Rating</option>
                </select>
              </div>
            </div>

            {/* Professionals list */}
            {sending ? (
              <ListSkeleton rows={3} />
            ) : !userLocation && !address.match(/\d{5}/) ? (
              <div className="card p-8 text-center bg-slate-50">
                <MapPin className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">Provide Your Location</h3>
                <p className="text-slate-600 mb-4">
                  Enter your address or use your current location to see available emergency professionals nearby.
                </p>
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                >
                  📍 Use My Current Location
                </button>
              </div>
            ) : filteredNearby.length === 0 ? (
              <div className="card p-8 text-center bg-slate-50">
                <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">Loading Contractors...</h3>
                <p className="text-slate-600">
                  Searching for emergency professionals in your area.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNearby.map((c) => (
                  <ContractorCard
                    key={c.id}
                    c={c}
                    selected={picked === c.id}
                    onPick={() => setPicked(c.id)}
                  />
                ))}
              </div>
            )}

            <div className="flex items-center justify-between gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Phone className="h-4 w-4" />
                Your contact info is shared only after a pro accepts your emergency request.
              </div>
              <button
                className={`px-8 py-3 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 ${
                  sending || (!sendAll && !picked)
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white shadow-lg'
                }`}
                disabled={sending || (!sendAll && !picked)}
                onClick={submit}
              >
                {sending ? 'Sending Emergency Request...' : sendAll ? '🚨 Alert All Emergency Pros' : selectedContractor ? `Alert ${selectedContractor.name}` : 'Send Emergency Request'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}