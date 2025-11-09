'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import Image from 'next/image'

export default function AnimatedPhoneMockupOptimized() {
  const [currentFrame, setCurrentFrame] = useState(1)
  const totalFrames = 924
  const fps = 30
  const frameRef = useRef<number>(1)
  const lastTimeRef = useRef<number>(0)
  const rafRef = useRef<number>()

  useEffect(() => {
    // Use requestAnimationFrame for smoother animation
    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp

      const elapsed = timestamp - lastTimeRef.current

      // Update frame if enough time has passed (33.33ms for 30fps)
      if (elapsed >= 1000 / fps) {
        frameRef.current = frameRef.current >= totalFrames ? 1 : frameRef.current + 1
        setCurrentFrame(frameRef.current)
        lastTimeRef.current = timestamp
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  // Format frame number with leading zeros
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
          style={{
            maxHeight: '700px',
            display: 'block',
            // Use GPU acceleration for smoother rendering
            transform: 'translateZ(0)',
            willChange: 'contents'
          }}
          priority={currentFrame === 1}
          unoptimized // Disable Next.js optimization for animation frames
        />
      </motion.div>
    </div>
  )
}
