'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'

export default function AnimatedPhoneMockupVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    // Auto-play video when component mounts
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.log('Autoplay prevented:', err)
      })
    }
  }, [])

  return (
    <div className="relative flex items-end justify-center w-full h-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative w-full max-w-xl"
        style={{ filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.4))' }}
      >
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-auto"
          style={{ maxHeight: '700px', display: 'block' }}
        >
          {/* MP4 for broad compatibility */}
          <source src="/iphone-mockup-animation.mp4" type="video/mp4" />
          {/* WebM for better quality/smaller file size in modern browsers */}
          <source src="/iphone-mockup-animation.webm" type="video/webm" />

          {/* Fallback: Show first frame as static image if video fails */}
          <img
            src="/iphonemockupgif/iphone-spin-up-export-webm 2/frame_0001.png"
            alt="iPhone Mockup"
            className="w-full h-auto"
            style={{ maxHeight: '700px' }}
          />
        </video>
      </motion.div>
    </div>
  )
}
