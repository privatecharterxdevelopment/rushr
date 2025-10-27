// components/Hero.tsx
'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useApp } from '../lib/state'

export default function Hero(){
  const router = useRouter()
  const { state, openAuth, addToast } = useApp()

  // Keep ZIP empty by default; persist after submit
  const [zip, setZip] = useState('')
  const [service, setService] = useState('')

  const onPost = (e: React.FormEvent)=>{
    e.preventDefault()
    if(!state.user.signedIn){
      openAuth()
      addToast?.('Sign in to post your job')
      return
    }
    if (typeof window !== 'undefined' && zip) {
      try { localStorage.setItem('housecall.defaultZip', zip.trim()) } catch {}
    }
    const q = new URLSearchParams()
    if(zip) q.set('zip', zip.trim())
    // Use "desc" for maximum compatibility with the Post Job reader (it also accepts "service"/"need"/"q")
    if(service) q.set('desc', service.trim())
    router.push(`/post-job${q.toString() ? `?${q.toString()}` : ''}`)
  }

  return (
    <section className="container-max mt-4">
      <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-50 dark:from-emerald-900/15 dark:via-slate-900 dark:to-emerald-900/10">
        {/* soft pattern */}
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-[0.15] dark:opacity-[0.15]">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="p" width="28" height="28" patternUnits="userSpaceOnUse">
                <path d="M28 0H0V28" fill="none" stroke="#10b981" strokeOpacity="0.20"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#p)" />
          </svg>
        </div>

        <div className="relative px-5 md:px-10 py-8 md:py-10">
          {/* centered pill */}
          <div className="flex justify-center">
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium shadow-soft ring-1 ring-emerald-200 backdrop-blur dark:bg-white/10 dark:text-emerald-100 dark:ring-emerald-700"
            >
              <span className="inline-block h-2 w-2 rounded-full bg-primary" />
              How it works
            </Link>
          </div>

          {/* headline + subcopy */}
          <div className="mt-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold leading-tight text-ink dark:text-white">
              Post your job. <span className="text-primary">Get bids fast.</span>
            </h1>
            <p className="mt-2 text-slate-700 dark:text-slate-300 max-w-2xl mx-auto">
              Tell us what you need and we’ll bring local pros to you. Compare bids, message safely,
              and hire with confidence—all in minutes.
            </p>
          </div>

          {/* compact quick-post form */}
          <form onSubmit={onPost} className="mt-5 max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-[1fr,120px,auto] gap-2">
            <input
              className="input"
              placeholder="What do you need done? (e.g., Replace water heater)"
              value={service}
              onChange={e=>setService(e.target.value)}
            />
            <input
              className="input"
              placeholder="ZIP code"
              inputMode="numeric"
              value={zip}
              onChange={e=>setZip(e.target.value)}
            />
            <button className="btn-primary">Post your job</button>
          </form>

          {/* trust + stat bubbles */}
          <div className="mt-4 flex flex-col items-center gap-3">
            <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-slate-700 dark:text-slate-300">
              <li className="flex items-center gap-2"><span>✅</span> Free for homeowners</li>
              <li className="flex items-center gap-2"><span>🔒</span> Private contact info</li>
              <li className="flex items-center gap-2"><span>🕒</span> ~2 minutes to post</li>
            </ul>

            {/* bubbles row */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Bubble>Licensed & Insured</Bubble>
              <Bubble>Background Checked</Bubble>
              <Bubble>Clear & Upfront Bids</Bubble>
              <Bubble>Quick Messaging</Bubble>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* — tiny atoms — */
function Bubble({ children }:{ children: React.ReactNode }){
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/85 px-3 py-1.5 text-xs
                 text-emerald-800 shadow-soft ring-1 ring-white/60 backdrop-blur
                 dark:bg-slate-900/70 dark:text-emerald-200 dark:border-emerald-900/40 dark:ring-slate-900/40"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
      {children}
    </span>
  )
}
