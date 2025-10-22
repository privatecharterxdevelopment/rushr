// components/Hero.tsx
'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
import { openAuth } from './AuthModal'
import dynamic from 'next/dynamic'

const AnimatedPhoneMockup = dynamic(() => import('./AnimatedPhoneMockup'), { ssr: false })

// Category mapping based on keywords
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Plumber': ['plumb', 'leak', 'pipe', 'drain', 'water', 'toilet', 'sink', 'faucet', 'sewer'],
  'Electrician': ['electric', 'power', 'outlet', 'breaker', 'wiring', 'light', 'switch'],
  'HVAC': ['hvac', 'heat', 'cool', 'ac', 'furnace', 'thermostat', 'air condition'],
  'Roofer': ['roof', 'shingle', 'gutter', 'ceiling leak'],
  'Locksmith': ['lock', 'key', 'locked out', 'door lock'],
  'Appliance Repair': ['appliance', 'fridge', 'washer', 'dryer', 'dishwasher', 'oven', 'stove'],
  'Pest Control': ['pest', 'bug', 'rat', 'mouse', 'termite', 'roach', 'ant'],
  'Cleaner': ['clean', 'mold', 'carpet', 'deep clean'],
  'Handyman': ['handyman', 'repair', 'fix']
}

function detectCategory(searchText: string): string | null {
  const lowerText = searchText.toLowerCase()
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return category
    }
  }
  return null
}

export default function Hero(){
  const router = useRouter()
  const { user } = useAuth()

  const [searchQuery, setSearchQuery] = useState('')
  const [location, setLocation] = useState('')
  const [loadingLocation, setLoadingLocation] = useState(false)

  // Get user's location and convert to ZIP
  const getUserLocation = async () => {
    setLoadingLocation(true)

    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      setLoadingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords

        try {
          // Reverse geocode to get ZIP code
          const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
          if (MAPBOX_TOKEN) {
            const response = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}&types=postcode`
            )
            const data = await response.json()

            if (data.features && data.features.length > 0) {
              const zip = data.features[0].text
              setLocation(zip)
              localStorage.setItem('housecall.defaultZip', zip)
            } else {
              setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
            }
          }
        } catch (error) {
          console.error('Error reverse geocoding:', error)
          setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
        }

        setLoadingLocation(false)
      },
      (error) => {
        console.error('Geolocation error:', error)
        alert('Unable to get your location. Please enter your ZIP code manually.')
        setLoadingLocation(false)
      }
    )
  }

  const onFindPro = (e: React.FormEvent)=>{
    e.preventDefault()
    if(!user){
      openAuth('signup')
      return
    }

    // Extract zip code from location or search query
    const zipMatch = (location + ' ' + searchQuery).match(/\b\d{5}\b/)
    const zip = zipMatch ? zipMatch[0] : location.trim()

    if (zip && typeof window !== 'undefined') {
      try { localStorage.setItem('housecall.defaultZip', zip) } catch {}
    }

    // Detect category from search query
    const detectedCategory = detectCategory(searchQuery)

    const q = new URLSearchParams()
    if(zip) q.set('near', zip)
    if(detectedCategory) q.set('category', detectedCategory)

    router.push(`/rushrmap${q.toString() ? `?${q.toString()}` : ''}`)
  }

  return (
    <section className="relative -mx-3 sm:-mx-4 lg:-mx-6 overflow-visible">
      {/* Dark emerald gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800" />

      <div className="relative container-max px-5 md:px-10 lg:px-16 py-10 md:py-14 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column - Content */}
          <div className="text-white space-y-3 lg:space-y-4 flex flex-col justify-center">
            <h1 className="text-3xl md:text-4xl lg:text-4xl font-bold leading-tight">
              Emergency help,<br />
              <span className="text-emerald-200">on the way in minutes</span>
            </h1>

            <p className="text-sm md:text-base text-emerald-50 max-w-xl">
              Tap once. Get matched with a vetted pro. Track their live ETA.<br />
              Upfront pricing and no hidden fees.
            </p>

            {/* Search Form */}
            <form onSubmit={onFindPro} className="flex flex-col gap-2 max-w-xl">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="What emergency do you need? (e.g., plumber, electrician)"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full px-5 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="ZIP"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      className="w-24 px-3 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={getUserLocation}
                    disabled={loadingLocation}
                    className="p-3 bg-white hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Use my location"
                  >
                    {loadingLocation ? (
                      <svg className="animate-spin h-5 w-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gray-900 hover:bg-black text-white font-semibold rounded-lg transition-colors whitespace-nowrap text-sm"
                  >
                    Find a Pro
                  </button>
                </div>
              </div>
            </form>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-emerald-50">
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">★★★★★</span>
                <span className="font-semibold">4.5 average</span>
                <span className="text-emerald-300">(10k+ jobs)</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Background-checked pros</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 text-emerald-100">
                <svg className="w-5 h-5 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">Price shown before booking</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-100">
                <svg className="w-5 h-5 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-sm">Secure payments</span>
              </div>
            </div>
          </div>

          {/* Right Column - Phone Mockup Animation */}
          <div className="hidden lg:flex justify-center items-end relative">
            <div style={{ transform: 'scale(0.95)', transformOrigin: 'bottom center', marginBottom: '-20px' }}>
              <AnimatedPhoneMockup />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
