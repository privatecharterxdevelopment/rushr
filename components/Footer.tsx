'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
import { useProAuth } from '../contexts/ProAuthContext'
import { openAuth } from './AuthModal'
import LogoWordmark from './LogoWordmark'

export default function Footer() {
  const pathname = usePathname()
  const router = useRouter()
  const { user: homeownerUser } = useAuth()
  const { user: proUser } = useProAuth()

  // Determine current user and role
  const user = homeownerUser || proUser
  const userRole = homeownerUser ? 'HOMEOWNER' : proUser ? 'CONTRACTOR' : null

  // For local development, use relative paths instead of cross-site URLs
  const isLocalDev = !process.env.NEXT_PUBLIC_PRO_URL && !process.env.NEXT_PUBLIC_MAIN_URL

  const PRO_HOME  = process.env.NEXT_PUBLIC_PRO_URL  || 'http://pro.localhost:3000'
  const MAIN_HOME = process.env.NEXT_PUBLIC_MAIN_URL || 'http://localhost:3000'
  const join = (base: string, path: string) => base.replace(/\/+$/, '') + '/' + path.replace(/^\/+/, '')
  const toMain = (p: string) => isLocalDev ? p : join(MAIN_HOME, p)
  const toPro  = (p: string) => isLocalDev ? p : join(PRO_HOME, p)

  const isActiveLocal = (href: string) => pathname === href
  const isExternal = (href: string) => /^https?:\/\//i.test(href)

  const FLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
    // Only mark active for local, same-host routes
    const active = !isExternal(href) && isActiveLocal(href)
    return (
      <Link
        href={href}
        className={`flex items-center gap-2 hover:text-ink dark:hover:text-white transition ${active ? 'text-primary font-semibold' : ''}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-primary' : 'bg-transparent'}`} />
        <span>{children}</span>
      </Link>
    )
  }

  const DashboardItem = () => {
    const go = (href: string) => {
      if (isExternal(href)) window.location.href = href
      else router.push(href)
    }
    // Route based on role when signed in; otherwise open auth
    // In local dev, just use /dashboard for all roles
    const target = isLocalDev ? '/dashboard'
      : userRole === 'CONTRACTOR'
      ? toPro('/dashboard')
      : toMain('/dashboard')

    // We won't try to compute "active" across hosts; keep neutral styling
    return (
      <button
        type="button"
        onClick={() => {
          if (user) go(target)
          else openAuth('signin')
        }}
        className="flex items-center gap-2 hover:text-ink dark:hover:text-white transition text-left"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-transparent" />
        <span>Dashboard</span>
      </button>
    )
  }

  const year = new Date().getFullYear()

  return (
    <footer className="mt-20 border-t border-slate-100 bg-white dark:bg-slate-900 dark:border-slate-800">
      <div className="container-max py-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-sm text-slate-600 dark:text-slate-300">
        <div>
          <LogoWordmark className="mb-2" />
          <p className="max-w-xs">
            Linking Homeowners with Local Pros Instantly. Post a job, get bids, hire with confidence.
          </p>
        </div>

        <div>
          <div className="font-semibold text-ink dark:text-white mb-2">Company</div>
          <ul className="space-y-2">
            <li><FLink href={toMain('/about')}>About</FLink></li>
            <li><FLink href={toMain('/pricing')}>Pricing</FLink></li>
            <li><DashboardItem /></li>
            <li><FLink href={MAIN_HOME}>Rushr for Homeowners</FLink></li>
            <li><FLink href={PRO_HOME}>Rushr For Pros</FLink></li>
          </ul>
        </div>

        <div>
          <div className="font-semibold text-ink dark:text-white mb-2">Explore</div>
          <ul className="space-y-2">
            <li><FLink href={toMain('/')}>Home</FLink></li>
            <li><FLink href={toMain('/how-it-works')}>How It Works</FLink></li>
            <li><FLink href={toPro('/find-work/how-it-works')}>How it Works For Pros</FLink></li>
            <li><FLink href={toMain('/teams')}>Rushr Teams</FLink></li>
            <li><FLink href={toMain('/find-pro')}>Search For A Pro</FLink></li>
            <li><FLink href={toPro('/jobs')}>Browse Jobs</FLink></li>
              <li><FLink href={toMain('/post-job')}>Post a Job</FLink></li>
            <li><FLink href={toPro('/signals')}>Signals</FLink></li>
          </ul>
        </div>

        <div>
          <div className="font-semibold text-ink dark:text-white mb-2">Legal & Contact</div>
          <ul className="space-y-2">
            <li><FLink href={toMain('/terms')}>Terms</FLink></li>
            <li><FLink href={toMain('/privacy')}>Privacy</FLink></li>
            <li><FLink href={toMain('/contact')}>Contact</FLink></li>
            <li>
              <a className="hover:text-ink dark:hover:text-white" href="mailto:hello@userushr.com">
                hello@userushr.com
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800">
        <div className="container-max py-4 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-3">
          <span>© {year} Rushr</span>
          <span className="mx-2 hidden sm:inline">•</span>
          <span>Made for homeowners &amp; contractors</span>
        </div>
      </div>
    </footer>
  )
}
