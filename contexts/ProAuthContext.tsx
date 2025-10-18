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

    // Listen for auth changes (when user manually logs in)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          setSession(session)
          setUser(session?.user ?? null)

          if (session?.user) {
            // Only fetch contractor profile if user_metadata says they're a contractor
            if (session.user.user_metadata?.role === 'contractor') {
              await fetchContractorProfile(session.user.id)

              // Redirect to contractor dashboard after successful login/signup
              if (event === 'SIGNED_IN' && session.user.email_confirmed_at) {
                router.push('/dashboard/contractor')
              }
            }
          } else {
            setContractorProfile(null)
          }
        } catch (err) {
          console.error('Error in auth state change:', err)
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
        }
      }
    })

    if (authError) {
      return { error: authError.message }
    }

    if (authData.user) {
      // Create contractor profile
      const { error: profileError } = await supabase
        .from('pro_contractors')
        .insert({
          id: authData.user.id,
          email: email,
          name: contractorData.name,
          business_name: contractorData.businessName,
          phone: contractorData.phone,
          license_number: contractorData.licenseNumber,
          license_state: contractorData.licenseState,
          insurance_carrier: contractorData.insuranceCarrier,
          categories: contractorData.categories,
          base_zip: contractorData.baseZip,
          status: 'pending',
          kyc_status: 'not_started',
          created_at: new Date().toISOString()
        })

      if (profileError) {
        if (typeof window !== 'undefined') {
          console.error('Error creating contractor profile:', profileError)
        }
        return { error: 'Failed to create contractor profile' }
      }

      // Auto-approve for now and require KYC
      const { error: approveError } = await supabase
        .from('pro_contractors')
        .update({
          status: 'approved',
          profile_approved_at: new Date().toISOString()
        })
        .eq('id', authData.user.id)

      if (approveError) {
        if (typeof window !== 'undefined') {
          console.error('Error approving contractor:', approveError)
        }
      }

      // Check if user needs email confirmation
      if (!authData.user.email_confirmed_at) {
        return {
          success: true,
          needsKYC: true,
          message: "Please check your email and click the confirmation link, then complete KYC verification."
        }
      }

      return {
        success: true,
        needsKYC: true,
        message: "Account created successfully. Please complete KYC verification to access Pro features."
      }
    }

    return { error: 'Failed to create account' }
  }

  const signOut = async () => {
    // Clear local state
    setUser(null)
    setContractorProfile(null)
    setSession(null)

    // Clear storage
    try {
      localStorage.clear()
      sessionStorage.clear()
    } catch (err) {
      console.error('Failed to clear storage:', err)
    }

    // Supabase sign out
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error('Supabase signout error:', err)
    }

    // Redirect to homepage
    window.location.href = '/'
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