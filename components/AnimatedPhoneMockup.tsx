'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function AnimatedPhoneMockup() {
  const [currentFrame, setCurrentFrame] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const totalFrames = 881
  const fps = 30

  useEffect(() => {
    // Start playing after component mounts
    const timer = setTimeout(() => setIsPlaying(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % totalFrames)
    }, 1000 / fps)

    return () => clearInterval(interval)
  }, [isPlaying, totalFrames, fps])

  const frameNumber = currentFrame.toString().padStart(6, '0')

  return (
    <div className="relative flex items-center justify-center">
      <div className="relative" style={{ filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.5))' }}>
        <Image
          src={`/gif_screenmockup/frame_${frameNumber}.png`}
          alt="Phone mockup animation"
          width={390}
          height={844}
          priority
          unoptimized
          style={{ display: 'block' }}
        />
      </div>
    </div>
  )
}
