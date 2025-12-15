import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Early Access | Rushr Pro',
  description: 'Join the Rushr Pro early access waitlist for exclusive benefits and priority access.',
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
    ],
  },
}

export default function EarlyAccessLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
