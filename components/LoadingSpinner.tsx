import React from 'react'
import { Capacitor } from '@capacitor/core'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  text?: string
  fullScreen?: boolean
  className?: string
  color?: 'blue' | 'emerald'
}

// iOS Native Loading Component - Static R logo with circular spinner
function IOSNativeLoader({ size = 'lg' }: { size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const containerSizes = {
    sm: 'w-16 h-16',
    md: 'w-20 h-20',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  }

  const iconSizes = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  }

  const textSizes = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl',
    xl: 'text-5xl'
  }

  return (
    <div className={`relative ${containerSizes[size]} flex items-center justify-center`}>
      {/* Spinning circle border */}
      <div
        className={`absolute inset-0 rounded-full border-4 border-white/30 border-t-white animate-spin`}
        style={{ animationDuration: '1s' }}
      />
      {/* Static R logo in center */}
      <div className={`${iconSizes[size]} bg-white rounded-2xl flex items-center justify-center shadow-lg`}>
        <span className={`${textSizes[size]} font-bold text-emerald-600`}>R</span>
      </div>
    </div>
  )
}

export default function LoadingSpinner({
  size = 'md',
  text = 'Loading...',
  fullScreen = false,
  className = '',
  color = 'blue'
}: LoadingSpinnerProps) {
  const isNative = typeof window !== 'undefined' && Capacitor.isNativePlatform()

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  }

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  }

  // iOS Native: Green fullscreen with R icon and circular spinner
  if (isNative) {
    if (fullScreen) {
      return (
        <div
          className="fixed inset-0 bg-emerald-600 flex items-center justify-center z-50"
          style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <IOSNativeLoader size={size} />
        </div>
      )
    }

    return (
      <div
        className={`min-h-screen bg-emerald-600 flex items-center justify-center ${className}`}
        style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <IOSNativeLoader size={size} />
      </div>
    )
  }

  // Web: Original behavior with text
  const spinner = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <img
        src="https://jtrxdcccswdwlritgstp.supabase.co/storage/v1/object/public/contractor-logos/RushrLogoAnimation.gif"
        alt="Loading..."
        className={`${sizeClasses[size]} object-contain`}
      />
      {text && (
        <p className={`${textSizes[size]} text-gray-600 font-medium`}>
          {text}
        </p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    )
  }

  return spinner
}

// Inline loading spinner for buttons
export function ButtonSpinner({ className = 'w-5 h-5' }: { className?: string }) {
  const isNative = typeof window !== 'undefined' && Capacitor.isNativePlatform()

  if (isNative) {
    // iOS: Simple white spinner for buttons
    return (
      <div className={`${className} relative`}>
        <div className="absolute inset-0 rounded-full border-2 border-white/30 border-t-white animate-spin" />
      </div>
    )
  }

  return (
    <img
      src="https://jtrxdcccswdwlritgstp.supabase.co/storage/v1/object/public/contractor-logos/RushrLogoAnimation.gif"
      alt="Loading..."
      className={`${className} object-contain`}
    />
  )
}

// Page loading wrapper - iOS native aware
export function PageLoading({ children, isLoading, loadingText = 'Loading...' }: {
  children: React.ReactNode
  isLoading: boolean
  loadingText?: string
}) {
  const isNative = typeof window !== 'undefined' && Capacitor.isNativePlatform()

  if (isLoading) {
    if (isNative) {
      // iOS: Green fullscreen with R logo and spinner
      return (
        <div
          className="min-h-screen bg-emerald-600 flex items-center justify-center"
          style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <IOSNativeLoader size="lg" />
        </div>
      )
    }

    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text={loadingText} />
      </div>
    )
  }

  return <>{children}</>
}

// Dedicated iOS native loading screen component
export function IOSLoadingScreen({ size = 'lg' }: { size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  return (
    <div
      className="min-h-screen bg-emerald-600 flex items-center justify-center"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <IOSNativeLoader size={size} />
    </div>
  )
}
