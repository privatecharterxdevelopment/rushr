'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { supabase } from '../lib/supabaseClient'

type Props = {
  centerZip: string
  category?: string
  radiusMiles: number
  searchCenter?: [number, number]
  onSearchHere?: (center:[number,number]) => void
}

const ProMapInner = dynamic(() => import('./ProMapInner'), { ssr: false })

export default function ProMap(props: Props){
  const [contractors, setContractors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mapKey, setMapKey] = useState(0) // Force map re-render when location changes

  useEffect(() => {
    async function fetchContractors() {
      try {
        setLoading(true)
        console.log('ProMap: Fetching contractors from pro_contractors table...')

        const { data, error } = await supabase
          .from('pro_contractors')
          .select('*')
          // Removed kyc_status filter to show all contractors
          // .eq('kyc_status', 'completed')

        if (error) {
          console.error('ProMap: Error fetching contractors:', error)
          setContractors([])
        } else {
          console.log('ProMap: Fetched contractors from database:', data?.length || 0, 'contractors')

          // Transform data to include location - ONLY use if we have precise lat/lng
          const contractorsWithLocation = (data || []).map(contractor => {
            let loc = null

            // ONLY use contractor location if we have precise lat/lng from their address
            if (contractor.latitude && contractor.longitude) {
              loc = {
                lat: Number(contractor.latitude),
                lng: Number(contractor.longitude)
              }
            }
            // DO NOT use ZIP codes as fallback - they are too inaccurate

            return {
              ...contractor,
              loc,
              services: contractor.categories || [],
              rating: contractor.rating || 0,
              city: contractor.city || contractor.service_area_zips?.[0] || 'Unknown'
            }
          })

          // Filter out contractors without precise location
          const contractorsWithPreciseLocation = contractorsWithLocation.filter(c => c.loc !== null)

          console.log('ProMap: Contractors with precise location:', contractorsWithPreciseLocation.length, 'out of', contractorsWithLocation.length)
          setContractors(contractorsWithPreciseLocation)
        }
      } catch (err) {
        console.error('ProMap: Error loading contractors:', err)
        setContractors([])
      } finally {
        setLoading(false)
      }
    }

    fetchContractors()
  }, [])

  // Force map re-render when searchCenter changes
  useEffect(() => {
    if (props.searchCenter) {
      console.log('ProMap: searchCenter changed, forcing map re-render:', props.searchCenter)
      setMapKey(prev => prev + 1)
    }
  }, [props.searchCenter])

  console.log('ProMap render:', { loading, contractorsCount: contractors.length, props, mapKey })

  if (loading) {
    return (
      <div className="h-[360px] w-full flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <img
            src="https://jtrxdcccswdwlritgstp.supabase.co/storage/v1/object/public/contractor-logos/RushrLogoAnimation.gif"
            alt="Loading..."
            className="w-8 h-8 object-contain mx-auto mb-2"
          />
          <div className="text-sm text-slate-600">Loading map...</div>
        </div>
      </div>
    )
  }

  console.log('ProMap: Rendering ProMapInner with', contractors.length, 'contractors')
  return (
    <div className="h-[360px] w-full" key={mapKey}>
      <ProMapInner {...props} items={contractors} hideSidebar={true} />
    </div>
  )
}
