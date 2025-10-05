'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

export default function AnimatedPhoneMockup() {
  const [currentFrame, setCurrentFrame] = useState(0)
  const totalFrames = 881
  const fps = 60 // Increased FPS for smoother playback
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageCache = useRef<Map<number, HTMLImageElement>>(new Map())
  const preloadedFrames = useRef(0)

  // Preload frames in batches
  useEffect(() => {
    const preloadBatch = async (startFrame: number, count: number) => {
      const promises = []
      for (let i = startFrame; i < Math.min(startFrame + count, totalFrames); i++) {
        if (!imageCache.current.has(i)) {
          const promise = new Promise<void>((resolve) => {
            const img = new Image()
            img.onload = () => {
              imageCache.current.set(i, img)
              preloadedFrames.current++
              resolve()
            }
            img.onerror = resolve
            img.src = `/gif_screenmockup/frame_${i.toString().padStart(6, '0')}.png`
          })
          promises.push(promise)
        }
      }
      await Promise.all(promises)
    }

    // Preload first 60 frames immediately for smooth start
    preloadBatch(0, 60).then(() => {
      // Then preload rest in background
      preloadBatch(60, totalFrames - 60)
    })
  }, [totalFrames])

  // Render frame to canvas
  const renderFrame = useCallback((frameNumber: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const img = imageCache.current.get(frameNumber)
    if (img && img.complete) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, 390, 844)
    }
  }, [])

  // Animation loop
  useEffect(() => {
    let animationFrame: number
    let lastTime = performance.now()
    const frameInterval = 1000 / fps

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime

      if (deltaTime >= frameInterval) {
        const nextFrame = (currentFrame + 1) % totalFrames
        setCurrentFrame(nextFrame)
        renderFrame(nextFrame)
        lastTime = currentTime - (deltaTime % frameInterval)
      }

      animationFrame = requestAnimationFrame(animate)
    }

    // Only start animation after first batch is preloaded
    if (preloadedFrames.current >= 60) {
      animationFrame = requestAnimationFrame(animate)
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [currentFrame, totalFrames, fps, renderFrame])

  // Initial render
  useEffect(() => {
    renderFrame(currentFrame)
  }, [currentFrame, renderFrame])

  return (
    <div className="relative flex items-center justify-center">
      <div className="relative" style={{ filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.5))' }}>
        <canvas
          ref={canvasRef}
          width={390}
          height={844}
          style={{
            display: 'block',
            width: '390px',
            height: '844px'
          }}
        />
      </div>
    </div>
  )
}
