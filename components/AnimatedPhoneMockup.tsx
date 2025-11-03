'use client'

import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import Image from 'next/image'

export default function AnimatedPhoneMockup() {
  const [currentFrame, setCurrentFrame] = useState(1)
  const totalFrames = 924
  const fps = 30 // Frames per second

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev >= totalFrames ? 1 : prev + 1))
    }, 1000 / fps)

    return () => clearInterval(interval)
  }, [])

  // Format frame number with leading zeros (e.g., 0001, 0002, etc.)
  const frameNumber = String(currentFrame).padStart(4, '0')

  return (
    <div className="relative flex items-end justify-center w-full h-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative w-full max-w-xl"
        style={{ filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.4))' }}
      >
        <Image
          src={`/iphonemockupgif/iphone-spin-up-export-webm 2/frame_${frameNumber}.png`}
          alt="iPhone Mockup Animation"
          width={600}
          height={1200}
          className="w-full h-auto"
          style={{ maxHeight: '700px', display: 'block' }}
          priority
        />
      </motion.div>
    </div>
  )
}
