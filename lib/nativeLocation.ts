// lib/nativeLocation.ts
// Native location helper for iOS/Android using Capacitor Geolocation
import { Capacitor } from '@capacitor/core'
import { Geolocation, PermissionStatus } from '@capacitor/geolocation'

export interface LocationCoordinates {
  latitude: number
  longitude: number
  accuracy?: number
}

export interface LocationResult {
  success: boolean
  coordinates?: LocationCoordinates
  error?: string
}

/**
 * Check if running on native iOS/Android platform
 */
export function isNativePlatform(): boolean {
  return typeof window !== 'undefined' && Capacitor.isNativePlatform()
}

/**
 * Request location permissions on native platform
 */
export async function requestLocationPermission(): Promise<boolean> {
  if (!isNativePlatform()) {
    return true // Web handles permissions through browser
  }

  try {
    const status = await Geolocation.checkPermissions()

    if (status.location === 'granted') {
      return true
    }

    if (status.location === 'prompt' || status.location === 'prompt-with-rationale') {
      const request = await Geolocation.requestPermissions()
      return request.location === 'granted'
    }

    return false
  } catch (error) {
    console.error('[LOCATION] Permission check failed:', error)
    return false
  }
}

/**
 * Get current location using native Capacitor Geolocation on iOS/Android
 * Falls back to browser geolocation on web
 */
export async function getCurrentLocation(): Promise<LocationResult> {
  const isNative = isNativePlatform()
  console.log('[LOCATION] Getting location, native:', isNative)

  if (isNative) {
    // Use Capacitor Geolocation for native platforms
    try {
      // Request permission first
      const hasPermission = await requestLocationPermission()
      if (!hasPermission) {
        return {
          success: false,
          error: 'Location permission denied. Please enable location access in Settings.'
        }
      }

      console.log('[LOCATION] Requesting native location...')
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      })

      console.log('[LOCATION] Native location success:', position.coords)
      return {
        success: true,
        coordinates: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        }
      }
    } catch (error: any) {
      console.error('[LOCATION] Native location error:', error)

      let errorMessage = 'Could not get your location. '
      if (error.message?.includes('denied')) {
        errorMessage = 'Location permission denied. Please enable location access in Settings.'
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Location request timed out. Please try again.'
      } else if (error.message?.includes('unavailable')) {
        errorMessage = 'Location services unavailable. Please ensure GPS is enabled.'
      } else {
        errorMessage = error.message || 'Unknown location error.'
      }

      return {
        success: false,
        error: errorMessage
      }
    }
  } else {
    // Use browser Geolocation API for web
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({
          success: false,
          error: 'Geolocation is not supported by your browser.'
        })
        return
      }

      console.log('[LOCATION] Requesting browser location...')
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('[LOCATION] Browser location success:', position.coords)
          resolve({
            success: true,
            coordinates: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy
            }
          })
        },
        (error) => {
          console.error('[LOCATION] Browser location error:', error)

          let errorMessage = 'Could not get your location. '
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Permission denied. Please allow location access in your browser settings.'
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable.'
              break
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.'
              break
            default:
              errorMessage = 'An unknown error occurred.'
          }

          resolve({
            success: false,
            error: errorMessage
          })
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    })
  }
}

/**
 * Watch position changes (for real-time tracking)
 */
export function watchPosition(
  onSuccess: (coords: LocationCoordinates) => void,
  onError: (error: string) => void
): () => void {
  const isNative = isNativePlatform()

  if (isNative) {
    let watchId: string | null = null

    Geolocation.watchPosition(
      { enableHighAccuracy: true },
      (position, err) => {
        if (err) {
          onError(err.message || 'Watch position error')
          return
        }
        if (position) {
          onSuccess({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          })
        }
      }
    ).then(id => {
      watchId = id
    })

    return () => {
      if (watchId) {
        Geolocation.clearWatch({ id: watchId })
      }
    }
  } else {
    // Web fallback
    if (!navigator.geolocation) {
      onError('Geolocation not supported')
      return () => {}
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        onSuccess({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        })
      },
      (error) => {
        onError(error.message)
      },
      { enableHighAccuracy: true }
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }
}

/**
 * Reverse geocode coordinates to an address
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string | null> {
  try {
    console.log('[LOCATION] Reverse geocoding:', latitude, longitude)

    // Try Nominatim (OpenStreetMap) first
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'Rushr Emergency Services App'
        }
      }
    )

    const data = await response.json()

    if (data.display_name) {
      console.log('[LOCATION] Reverse geocoded:', data.display_name)
      return data.display_name
    }

    // Fallback to coordinates
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
  } catch (error) {
    console.error('[LOCATION] Reverse geocoding failed:', error)
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
  }
}
