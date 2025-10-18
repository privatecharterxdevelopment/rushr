'use client'
import React from 'react'
import { useHydrated } from '../lib/useHydrated'

export default function ClientOnly({
  children,
  fallback = null,
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const hydrated = useHydrated()
  if (!hydrated) return <>{fallback}</>
  return <>{children}</>
}
