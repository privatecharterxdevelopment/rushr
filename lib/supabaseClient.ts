import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()!

// Singleton instance to prevent multiple clients
let supabaseInstance: SupabaseClient | null = null

export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'rushr-auth-token',
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: { 'x-my-custom-header': 'rushr-app' },
      },
    })
  }
  return supabaseInstance
})()
