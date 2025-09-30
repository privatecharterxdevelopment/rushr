'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function SignInRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to home with auth modal
    router.replace('/?auth=signin')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" text="Redirecting to sign in..." />
    </div>
  )
}
