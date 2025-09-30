'use client'

import * as React from 'react'
import { createContext, useContext } from 'react'

// This file has been replaced to remove ALL mock data
// All functionality now uses real Supabase database queries

/* ======================= Types (exported for compatibility) ======================= */
export type UserRole = 'HOMEOWNER' | 'CONTRACTOR' | null

export type Signal = {
  id: string
  title?: string
  summary?: string
  details?: string
  status?: string
  type?: string
  category?: string
  city?: string
  county?: string
  jurisdiction?: string
  zip?: string
  date?: string
  timestamp?: string | number
  scope?: string
}

export type Contractor = {
  id: string
  name: string
  services: string[]
  badges: string[]
  bio?: string
  rating?: number
  housecallScore?: number
  city?: string
  zip?: string
  serviceZips: string[]
  loc?: { lat: number; lng: number }
}

export type Job = {
  id: string
  title: string
  category: string
  description: string
  status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'emergency'
  budget?: number
  location?: string
  created_at: string
  updated_at: string
}

/* ======================= DEPRECATED CONTEXT ======================= */
// This context is deprecated - all functionality now uses real database queries
// Components should use AuthContext, ProAuthContext, and direct Supabase calls

interface AppContextType {
  // All methods return empty/default values since we use real data now
  user: null
  userRole: null
  setUserRole: () => void
  contractors: Contractor[]
  signals: Signal[]
  jobs: Job[]
  messages: any[]
  // Deprecated methods that do nothing
  addJob: () => void
  updateJob: () => void
  addMessage: () => void
  markMessageRead: () => void
  saveSignal: () => void
  saveContractor: () => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
  console.warn('AppProvider is deprecated. Use AuthContext and direct Supabase queries instead.')

  const value: AppContextType = {
    user: null,
    userRole: null,
    setUserRole: () => {},
    contractors: [],
    signals: [],
    jobs: [],
    messages: [],
    addJob: () => {},
    updateJob: () => {},
    addMessage: () => {},
    markMessageRead: () => {},
    saveSignal: () => {},
    saveContractor: () => {},
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// Deprecated hook - components should use AuthContext instead
export function useApp() {
  console.warn('useApp() is deprecated. Use useAuth() or useProAuth() and direct Supabase queries instead.')
  const context = useContext(AppContext)
  if (context === undefined) {
    return {
      user: null,
      userRole: null,
      setUserRole: () => {},
      contractors: [],
      signals: [],
      jobs: [],
      messages: [],
      addJob: () => {},
      updateJob: () => {},
      addMessage: () => {},
      markMessageRead: () => {},
      saveSignal: () => {},
      saveContractor: () => {},
    }
  }
  return context
}

// Export empty data for any remaining components that might import these
export const mockContractors: Contractor[] = []
export const mockSignals: Signal[] = []
export const mockJobs: Job[] = []

console.log('✅ Mock data system disabled - using real Supabase database')