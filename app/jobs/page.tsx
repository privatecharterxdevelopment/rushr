// app/jobs/page.tsx
export const dynamic = 'force-dynamic'
import { Suspense } from 'react'
import JobsInner from './page.client'

export default function Page() {
  return (
    <Suspense fallback={null}>
      <JobsInner />
    </Suspense>
  )
}
