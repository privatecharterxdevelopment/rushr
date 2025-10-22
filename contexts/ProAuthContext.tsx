'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/navigation'

export interface ContractorProfile {
  id: string
  email: string
  name?: string
  business_name?: string
  phone?: string
  license_number?: string
  license_state?: string
  insurance_carrier?: string
  status: 'pending' | 'approved' | 'rejected'
  kyc_status: 'not_started' | 'in_progress' | 'completed' | 'failed'
  subscription_type: 'free' | 'pro'
  service_area_zips?: string[]
  base_zip?: string
  service_radius_miles?: number
  created_at: string
  profile_approved_at?: string
  kyc_completed_at?: string
}

interface ProAuthContextType {
  user: User | null
  contractorProfile: ContractorProfile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string; success?: boolean }>
  signUp: (email: string, password: string, contractorData: ContractorSignupData) => Promise<{ error?: string; success?: boolean; needsKYC?: boolean }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateKYCStatus: (status: ContractorProfile['kyc_status']) => Promise<void>
  isProUser: boolean
  requiresKYC: boolean
}

interface ContractorSignupData {
  name: string
  businessName: string
  phone: string
  licenseNumber: string
  licenseState: string
  insuranceCarrier: string
  categories: string[]
  baseZip: string
}

const ProAuthContext = createContext<ProAuthContextType | undefined>(undefined)

export function ProAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [contractorProfile, setContractorProfile] = useState<ContractorProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchContractorProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('pro_contractors')
        .select('*')
        .eq('id', userId)
        .maybeSingle() // Use maybeSingle instead of single to avoid PGRST116 error

      if (error) {
        if (typeof window !== 'undefined') {
          console.error('Error fetching contractor profile:', error)
        }

        // Handle specific error cases
        if (error.code === 'PGRST116') {
          // Profile doesn't exist - user needs to complete contractor signup
          console.log('No contractor profile found - user needs to complete signup')
          setContractorProfile(null)
          return null
        } else if (error.code === 'PGRST301' || error.code === 'PGRST204') {
          // Permission denied or no rows returned due to RLS - user needs to complete signup
          console.log('No contractor profile found - user needs to complete signup')
          setContractorProfile(null)
          return null
        } else if (error.code === '42P01') {
          // Table doesn't exist
          if (typeof window !== 'undefined') {
            console.error('SETUP ERROR: pro_contractors table does not exist. Please run the Pro database setup SQL.')
          }
          setContractorProfile(null)
          return null
        } else if (error.code === 'PGRST301') {
          // Permission denied or RLS policy issue
          if (typeof window !== 'undefined') {
            console.error('Permission denied accessing pro_contractors table. Check RLS policies.')
          }
          setContractorProfile(null)
          return null
        }

        // For other errors, still return null but log details
        if (typeof window !== 'undefined') {
          console.error('Database error details:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          })
        }
        setContractorProfile(null)
        return null
      }

      // Handle the case where no data is returned (no contractor profile exists)
      if (!data) {
        console.log('No contractor profile found - user needs to complete signup')
        setContractorProfile(null)
        return null
      }

      // Map database fields to ContractorProfile interface
      const mappedProfile: ContractorProfile = {
        id: data.id, // Primary key is just id
        email: data.email,
        name: data.name,
        business_name: data.business_name,
        phone: data.phone,
        license_number: data.license_number,
        license_state: data.license_state,
        insurance_carrier: data.insurance_carrier,
        status: data.status || 'pending', // Default status
        kyc_status: data.kyc_status || 'not_started', // Default KYC status
        subscription_type: 'pro', // All contractors are pro users
        created_at: data.created_at,
        profile_approved_at: data.profile_approved_at,
        kyc_completed_at: data.kyc_completed_at
      }

      setContractorProfile(mappedProfile)
      return mappedProfile
    } catch (err) {
      if (typeof window !== 'undefined') {
        console.error('Failed to fetch contractor profile:', err)
      }
      setContractorProfile(null)
      return null
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchContractorProfile(user.id)
    }
  }

  const updateKYCStatus = async (status: ContractorProfile['kyc_status']) => {
    if (!user) return

    try {
      const updateData: any = { kyc_status: status }
      if (status === 'completed') {
        updateData.kyc_completed_at = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('pro_contractors')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        if (typeof window !== 'undefined') {
          console.error('Error updating KYC status:', error)
        }
      } else if (data) {
        setContractorProfile(data)
      }
    } catch (err) {
      if (typeof window !== 'undefined') {
        console.error('Failed to update KYC status:', err)
      }
    }
  }


  useEffect(() => {
    // Get initial session state
    const getInitialSession = async () => {
      try {
        setLoading(true)
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Error getting session:', error)
          setSession(null)
          setUser(null)
          setContractorProfile(null)
          return
        }

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user && session.user.user_metadata?.role === 'contractor') {
          await fetchContractorProfile(session.user.id)
        } else {
          setContractorProfile(null)
        }
      } catch (err) {
        console.error('Failed to get initial session:', err)
        setSession(null)
        setUser(null)
        setContractorProfile(null)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          console.log('[PRO-AUTH] Event:', event, 'User:', session?.user?.id?.substring(0, 8))
          setSession(session)
          setUser(session?.user ?? null)

          if (session?.user) {
            // Check if user exists in pro_contractors table
            await fetchContractorProfile(session.user.id)
            // NO AUTO-REDIRECT - let pages handle routing
          } else {
            setContractorProfile(null)
          }
        } catch (err) {
          console.error('[PRO-AUTH] Error:', err)
          setContractorProfile(null)
        } finally {
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return { error: error.message }
    }

    // Profile fetching and routing will be handled by auth state change listener
    return { success: true }
  }

  const signUp = async (email: string, password: string, contractorData: ContractorSignupData) => {
    // First, create the auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: contractorData.name,
          role: 'contractor'
        },
        // DISABLE email confirmation for development
        emailRedirectTo: undefined
      }
    })

    if (authError) {
      return { error: authError.message }
    }

    if (authData.user) {
      console.log('[SIGNUP] Creating contractor profile for user:', authData.user.id)

      // Create contractor profile - use minimal fields to avoid ambiguous column errors
      const { error: profileError } = await supabase
        .from('pro_contractors')
        .insert([{
          id: authData.user.id,
          email: email,
          name: contractorData.name,
          business_name: contractorData.businessName,
          phone: contractorData.phone || '',
          license_number: contractorData.licenseNumber || 'pending',
          license_state: contractorData.licenseState || 'pending',
          insurance_carrier: contractorData.insuranceCarrier || 'pending',
          categories: contractorData.categories || ['General'],
          base_zip: contractorData.baseZip || '00000',
          status: 'pending',
          kyc_status: 'not_started'
        }])

      if (profileError) {
        console.error('[SIGNUP] Error creating contractor profile:', profileError)
        console.error('[SIGNUP] Full error details:', JSON.stringify(profileError, null, 2))
        return { error: `Database error: ${profileError.message}. Check if pro_contractors table has triggers or policies causing conflicts.` }
      }

      console.log('[SIGNUP] Contractor profile created successfully')

      // Auto-approve for now and require KYC
      const { error: approveError } = await supabase
        .from('pro_contractors')
        .update({
          status: 'approved',
          profile_approved_at: new Date().toISOString()
        })
        .eq('id', authData.user.id)

      if (approveError) {
        console.error('[SIGNUP] Error approving contractor:', approveError)
      } else {
        console.log('[SIGNUP] Contractor auto-approved')
      }

      // Fetch the created profile to set it in context
      await fetchContractorProfile(authData.user.id)

      console.log('[SIGNUP] Signup complete, redirecting to dashboard')

      return {
        success: true,
        needsKYC: false, // Changed to false so they can access dashboard immediately
        message: "Account created successfully! Redirecting to your dashboard..."
      }
    }

    return { error: 'Failed to create account' }
  }

  const signOut = async () => {
    console.log('[PRO-AUTH] Signing out contractor')

    // Clear local state FIRST
    setUser(null)
    setContractorProfile(null)
    setSession(null)

    // Supabase sign out - use 'local' scope to only sign out from this device/browser
    // NOT 'global' which would sign out from all devices
    try {
      await supabase.auth.signOut({ scope: 'local' })
    } catch (err) {
      console.error('[PRO-AUTH] Signout error:', err)
    }

    // Redirect to contractor home page
    window.location.href = '/contractors'
  }

  const isProUser = contractorProfile?.subscription_type === 'pro' || false
  const requiresKYC = contractorProfile?.status === 'approved' &&
                      (contractorProfile?.kyc_status === 'not_started' ||
                       contractorProfile?.kyc_status === 'failed')

  const value = {
    user,
    contractorProfile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    updateKYCStatus,
    isProUser,
    requiresKYC
  }

  return <ProAuthContext.Provider value={value}>{children}</ProAuthContext.Provider>
}

export function useProAuth() {
  const context = useContext(ProAuthContext)
  if (context === undefined) {
    throw new Error('useProAuth must be used within a ProAuthProvider')
  }
  return context
}