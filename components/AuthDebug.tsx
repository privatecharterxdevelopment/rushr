'use client'

import { useAuth } from '../contexts/AuthContext'

export default function AuthDebug() {
  const { user, userProfile, loading } = useAuth()

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">Auth Debug</h3>
      <div>Loading: {loading.toString()}</div>
      <div>User: {user ? user.email : 'null'}</div>
      <div>Profile: {userProfile ? JSON.stringify(userProfile, null, 2) : 'null'}</div>
      <div>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing'}</div>
      <div>Supabase Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'}</div>
    </div>
  )
}