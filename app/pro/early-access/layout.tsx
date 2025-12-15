import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Early Access | Rushr Pro',
  description: 'Join the Rushr Pro early access waitlist for exclusive benefits and priority access.',
  icons: {
    icon: 'https://i.ibb.co/ZzN4M99F/Screenshot-2025-12-16-at-5-11-31.png',
  },
}

export default function EarlyAccessLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
