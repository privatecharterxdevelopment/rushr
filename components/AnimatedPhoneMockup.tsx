'use client'

import { useEffect, useState, useRef } from 'react'

export default function AnimatedPhoneMockup() {
  const [currentFrame, setCurrentFrame] = useState(0)
  const totalFrames = 881
  const fps = 30
  const imgRef = useRef<HTMLImageElement>(null)

  // Simple animation loop for FAST loading
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % totalFrames)
    }, 1000 / fps)

    return () => clearInterval(interval)
  }, [totalFrames, fps])

  const frameNumber = currentFrame.toString().padStart(6, '0')

  return (
    <div className="relative flex items-center justify-center">
      <div className="relative" style={{ filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.5))' }}>
        <img
          ref={imgRef}
          src={`/gif_screenmockup/frame_${frameNumber}.png`}
          alt="Phone mockup"
          width={390}
          height={844}
          loading="lazy"
          decoding="async"
          style={{ display: 'block' }}
        />
      </div>
    </div>
  )
}
