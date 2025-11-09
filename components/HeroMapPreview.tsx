'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import dynamic from 'next/dynamic'

// Dynamically import ProMapInner to avoid SSR issues with Mapbox
const ProMapInner = dynamic(() => import('./ProMapInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 rounded-3xl flex items-center justify-center">
      <div className="text-gray-400">Loading map...</div>
    </div>
  )
})

export default function HeroMapPreview() {
  const [contractors, setContractors] = useState<any[]>([])

  useEffect(() => {
    // Fetch some sample contractors for the hero map preview
    const fetchContractors = async () => {
      try {
        const response = await fetch('/api/contractors?limit=10')
        if (!response.ok) {
          console.warn('Contractors API not available, using empty list for hero preview')
          setContractors([])
          return
        }
        const text = await response.text()
        if (!text) {
          setContractors([])
          return
        }
        const data = JSON.parse(text)
        setContractors(data.contractors || [])
      } catch (error) {
        console.error('Failed to fetch contractors for map preview:', error)
        setContractors([]) // Continue with empty list
      }
    }

    fetchContractors()
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 1,
        delay: 0.3,
        ease: [0.16, 1, 0.3, 1] // Custom ease curve
      }}
      className="relative"
      style={{
        filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.4))',
        width: '240px',
        height: '500px',
      }}
    >
      {/* iPhone-style frame */}
      <div
        className="relative bg-black rounded-[3rem] p-2.5 h-full"
      >
        {/* iPhone notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-black rounded-b-3xl w-32 h-6 z-10" />

        {/* Screen content - Full map */}
        <div className="relative w-full h-full bg-white rounded-[2.5rem] overflow-hidden">
          <ProMapInner
            items={contractors}
            hideSidebar={true}
            searchCenter={[40.7128, -74.006]} // Show NYC center as user location
            radiusMiles={5}
          />
        </div>
      </div>
    </motion.div>
  )
}
