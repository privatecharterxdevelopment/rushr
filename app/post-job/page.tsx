// app/post-job/page.tsx
export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import PostJobInner from './page.client'

export default async function PostJobPage() {
  // No auth gate while backend is paused.
  return (
    <Suspense fallback={null}>
      <PostJobInner userId={null} />
    </Suspense>
  )
}