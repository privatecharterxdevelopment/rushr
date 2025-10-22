'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { showGlobalToast } from '../components/Toast'
import { WelcomeService } from '../lib/welcomeService'

export type SubscriptionType = 'free' | 'pro' | 'signals'

export interface UserProfile {
  id: string
  email: string
  name?: string
  subscription_type: SubscriptionType
  role: 'homeowner' | 'contractor'
  created_at: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  additional_zip_codes?: string[]
  emergency_contact?: string
  emergency_phone?: string
  avatar_url?: string
  kyc_verified?: boolean
  first_job_completed?: boolean
  notification_preferences?: {
    email: boolean
    sms: boolean
    push: boolean
  }
}

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string; success?: boolean }>
  signUp: (email: string, password: string, name: string, role: 'homeowner' | 'contractor') => Promise<{ error?: string; success?: boolean; needsConfirmation?: boolean; message?: string }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)

        // If profile doesn't exist, create one for existing users
        if (error.code === 'PGRST116') {
          console.log('No profile found, creating one for existing user')

          // Get user email from auth
          const { data: { user: authUser } } = await supabase.auth.getUser()
          if (authUser) {
            const { data: newProfile, error: createError } = await supabase
              .from('user_profiles')
              .insert({
                id: userId,
                email: authUser.email!,
                name: authUser.user_metadata?.name || '',
                role: authUser.user_metadata?.role || 'homeowner',
                subscription_type: 'free',
                created_at: new Date().toISOString()
              })
              .select()
              .single()

            if (createError) {
              console.error('Error creating profile:', createError)
              setUserProfile(null)
            } else {
              setUserProfile(newProfile)
            }
          }
        } else {
          setUserProfile(null)
        }
        return
      }

      if (data) {
        setUserProfile(data)
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err)
      setUserProfile(null)
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id)
    }
  }


  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession()

        if (!mounted) return

        if (error) {
          console.error('Error getting session:', {
            message: error.message,
            status: error.status,
            statusText: error.statusText
          })
          setLoading(false)
          return
        }

        // Set initial auth state
        setSession(session)
        setUser(session?.user ?? null)

        // Fetch profile if user exists
        if (session?.user) {
          await fetchUserProfile(session.user.id)
        }

        setLoading(false)
      } catch (err) {
        console.error('Auth initialization error:', err)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    // Initialize auth state
    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        console.log('[HOMEOWNER-AUTH] Event:', event, 'User:', session?.user?.id?.substring(0, 8))
        setSession(session)
        setUser(session?.user ?? null)

        // Handle SIGNED_OUT event
        if (event === 'SIGNED_OUT') {
          setUserProfile(null)
          return
        }

        if (session?.user) {
          await fetchUserProfile(session.user.id)
          // NO AUTO-REDIRECT - let pages handle routing
        } else {
          setUserProfile(null)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router])

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return { error: error.message }
      }

      // Check if this user is a contractor - homeowner login should reject contractors
      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()

        if (!profileError && profile && profile.role === 'contractor') {
          // Sign out the contractor immediately
          await supabase.auth.signOut()
          return {
            error: 'This is a contractor account. Please use the contractor login at /pro/sign-in instead.'
          }
        }
      }

      showGlobalToast('Signed in successfully!', 'success')
      return { success: true }
    } catch (err: any) {
      return { error: err?.message || 'Sign in failed' }
    }
  }

  const signUp = async (email: string, password: string, name: string, role: 'homeowner' | 'contractor') => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role
          }
        }
      })

      if (error) {
        return { error: error.message }
      }

      // Create homeowner profile immediately (contractors handled by ProAuthContext)
      if (data.user && role === 'homeowner') {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            name,
            role: 'homeowner',
            subscription_type: 'free',
            created_at: new Date().toISOString()
          })

        if (profileError) {
          console.error('Error creating homeowner profile:', profileError)
        }
      }

      // Check if user needs email confirmation
      if (data.user && !data.user.email_confirmed_at) {
        return {
          success: true,
          needsConfirmation: true,
          message: "Please check your email and click the confirmation link to complete your registration."
        }
      }

      showGlobalToast('Account created successfully!', 'success')
      return { success: true }
    } catch (err: any) {
      return { error: err?.message || 'Registration failed' }
    }
  }

  const signOut = async () => {
    console.log('[HOMEOWNER-AUTH] Signing out homeowner - clearing session')

    // 1. Clear React state
    setUser(null)
    setUserProfile(null)
    setSession(null)

    // 2. Sign out from Supabase (this clears auth tokens)
    try {
      await supabase.auth.signOut({ scope: 'local' })
    } catch (err) {
      console.error('[HOMEOWNER-AUTH] Signout error:', err)
    }

    // 3. Force reload to home to ensure clean state
    // The supabase.auth.signOut() already cleared the session
    window.location.href = '/'
  }

  const value = {
    user,
    userProfile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}