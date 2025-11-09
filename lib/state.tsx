'use client'

import * as React from 'react'
import { createContext, useContext, useState, useEffect } from 'react'

// Fetches contractors from API for compatibility with existing components

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
  const [contractors, setContractors] = useState<Contractor[]>([])

  // Fetch contractors from API on mount
  useEffect(() => {
    const fetchContractors = async () => {
      try {
        const response = await fetch('/api/contractors')
        if (!response.ok) {
          console.error('Failed to fetch contractors')
          return
        }
        const data = await response.json()
        setContractors(data.contractors || [])
      } catch (error) {
        console.error('Error fetching contractors:', error)
      }
    }

    fetchContractors()
  }, [])

  const value: AppContextType = {
    user: null,
    userRole: null,
    setUserRole: () => {},
    contractors,
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

// Hook to access app context (now with real contractors from API)
export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    return {
      state: {
        user: null,
        userRole: null,
        contractors: [],
        signals: [],
        jobs: [],
        messages: [],
      },
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
  return {
    state: {
      user: context.user,
      userRole: context.userRole,
      contractors: context.contractors,
      signals: context.signals,
      jobs: context.jobs,
      messages: context.messages,
    },
    ...context
  }
}

// Export empty data for any remaining components that might import these
export const mockContractors: Contractor[] = []
export const mockSignals: Signal[] = []
export const mockJobs: Job[] = []

console.log('✅ Mock data system disabled - using real Supabase database')