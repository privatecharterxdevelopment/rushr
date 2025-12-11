import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()!

// Clear any stale auth tokens on initialization (client-side only)
if (typeof window !== 'undefined') {
  const storageKey = 'rushr-auth-token'
  try {
    const stored = window.localStorage.getItem(storageKey)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Clear if token is expired or malformed
      if (!parsed?.access_token || (parsed?.expires_at && parsed.expires_at * 1000 < Date.now())) {
        window.localStorage.removeItem(storageKey)
      }
    }
  } catch {
    // If parsing fails, clear the invalid token
    window.localStorage.removeItem('rushr-auth-token')
  }
}

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
