// components/RequireAuth.tsx
'use client'
import { useEffect } from 'react'
import { useApp } from '@/lib/state'

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { state, openAuth } = useApp()
  useEffect(() => { if (!state.user.signedIn) openAuth() }, [state.user.signedIn, openAuth])
  if (!state.user.signedIn) return null
  return <>{children}</>
}
