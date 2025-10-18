'use client'
import React from 'react'
import Image from 'next/image'

export default function BrandLogo({
  variant='cloud',
  size=32,
  className=''
}:{ variant?:'cloud'|'wordmark'; size?:number; className?:string }){
  if (variant === 'wordmark') {
    // Wordmark scales roughly 4.2x the height
    const w = Math.round(size * 4.2)
    return (
      <span className={`inline-flex items-center ${className}`}>
        {/* Light mode wordmark */}
        <Image
          src="/housecall-wordmark.png"
          alt="Rushr"
          width={w}
          height={size}
          priority
          className="block dark:hidden"
        />
        {/* Dark mode wordmark (optional). If you didn’t add it, remove this line. */}
        <Image
          src="/housecall-wordmark-dark.png"
          alt="Rushr"
          width={w}
          height={size}
          priority
          className="hidden dark:block"
        />
      </span>
    )
  }

  // Icon mark
  return (
    <span className={`inline-flex items-center ${className}`}>
      <Image
        src="/housecall-icon.png"
        alt="Rushr"
        width={size}
        height={size}
        priority
        className="rounded-2xl"
      />
    </span>
  )
}
