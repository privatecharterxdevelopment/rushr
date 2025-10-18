'use client'
import React, { useState } from 'react'

type Slide = { Icon: (p: React.SVGProps<SVGSVGElement>) => JSX.Element; title: string; desc: string }

const homeowner: Slide[] = [
  { Icon: IconClipboard,    title: 'Post your job',        desc: 'Issue, ZIP, timing, and photos.' },
  { Icon: IconLightning,    title: 'Get bids fast',        desc: 'Local pros send quotes or instant estimates.' },
  { Icon: IconShieldCheck,  title: 'Hire with confidence', desc: 'Chat, review profiles, award the job.' },
]

const contractor: Slide[] = [
  { Icon: IconSearch,       title: 'See local demand',     desc: 'Jobs filtered by your services and area.' },
  { Icon: IconPaperPlane,   title: 'Bid in seconds',       desc: 'Templates and rate guard for fast quotes.' },
  { Icon: IconActivity,     title: 'Signals advantage',    desc: 'Live license/permit/inspection events.' },
]

export default function HowItWorksSlider() {
  const [tab, setTab] = useState<'homeowner' | 'contractor'>('homeowner')
  const slides = tab === 'homeowner' ? homeowner : contractor

  return (
    <section className="section">
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-ink text-center">How it works</h2>

        {/* Centered iOS pill */}
        <div className="mt-4 flex justify-center">
          <div className="relative w-[320px] rounded-full bg-emerald-50 ring-1 ring-emerald-200 p-1">
            <div className="absolute inset-1 pointer-events-none">
              <div
                className="h-8 rounded-full bg-white shadow-soft w-1/2 transition-transform"
                style={{ transform: tab === 'homeowner' ? 'translateX(0%)' : 'translateX(100%)' }}
              />
            </div>
            <div className="relative grid grid-cols-2 text-sm font-medium">
              <button
                className={`h-8 rounded-full z-10 ${tab === 'homeowner' ? 'text-ink' : 'text-emerald-700/70'}`}
                onClick={() => setTab('homeowner')}
              >
                Homeowner
              </button>
              <button
                className={`h-8 rounded-full z-10 ${tab === 'contractor' ? 'text-ink' : 'text-emerald-700/70'}`}
                onClick={() => setTab('contractor')}
              >
                Contractor
              </button>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="grid sm:grid-cols-3 gap-4 mt-6">
          {slides.map((s, i) => (
            <div key={i} className="card p-5">
              <s.Icon className="h-6 w-6 text-emerald-700" />
              <div className="font-semibold mt-2">{s.title}</div>
              <p className="text-sm mt-1 text-slate-600">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ==== Uniform green icons (dependency-free) ==== */
function IconClipboard(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <rect x="6" y="4" width="12" height="16" rx="2" strokeWidth="2" />
      <path strokeWidth="2" d="M9 4h6v3H9zM9 10h6M9 14h6" />
    </svg>
  )
}
function IconLightning(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M13 2L3 14h6l-2 8 10-12h-6l2-8z" />
    </svg>
  )
}
function IconShieldCheck(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path strokeWidth="2" d="M12 3l8 4v5c0 5-3.4 8.6-8 9-4.6-.4-8-4-8-9V7l8-4z" />
      <path strokeWidth="2" d="M9 12l2 2 4-4" />
    </svg>
  )
}
function IconSearch(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <circle cx="11" cy="11" r="7" strokeWidth="2" />
      <path strokeWidth="2" d="M16.5 16.5L21 21" />
    </svg>
  )
}
function IconPaperPlane(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path strokeWidth="2" d="M22 2L11 13" />
      <path strokeWidth="2" d="M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  )
}
function IconActivity(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path strokeWidth="2" d="M3 12h4l2 7 4-14 2 7h4" />
    </svg>
  )
}
