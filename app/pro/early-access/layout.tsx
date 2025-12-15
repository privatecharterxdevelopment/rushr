import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Early Access | Rushr Pro',
  description: 'Join the Rushr Pro early access waitlist for exclusive benefits and priority access.',
  icons: {
    icon: '/favicon.png',
  },
}

export default function EarlyAccessLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
