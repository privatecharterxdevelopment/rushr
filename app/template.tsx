// app/template.tsx
'use client'

import { Suspense } from 'react'

export default function Template({ children }: { children: React.ReactNode }) {
  // A global Suspense wrapper so any useSearchParams/useRouter-read is legal at build.
  return <Suspense fallback={null}>{children}</Suspense>
}
