// app/auth/callback/page.tsx
export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import AuthCallbackClient from './page.client'
import LoadingSpinner from '../../../components/LoadingSpinner'

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Authenticating..." />
      </div>
    }>
      <AuthCallbackClient />
    </Suspense>
  )
}
