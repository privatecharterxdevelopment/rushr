// components/HeaderAuthButtons.tsx
'use client'
import { openAuth } from '../components/AuthModal'

export function SignInButton({ className }: { className?: string }) {
  return <button className={className} onClick={() => openAuth('signin')}>Sign in</button>
}

export function SignUpButton({ className }: { className?: string }) {
  return <button className={className} onClick={() => openAuth('signup')}>Create account</button>
}
