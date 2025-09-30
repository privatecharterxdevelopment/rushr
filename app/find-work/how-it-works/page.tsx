'use client'
import React from 'react'
import Link from 'next/link'
import { useApp } from '../../../lib/state'
import { useRouter } from 'next/navigation'

export default function HowItWorksForProsPage(){
  const { state, openAuth, addToast } = useApp()
  const router = useRouter()

  const go = (href:string)=>{
    if(!state.user.signedIn){
      openAuth()
      addToast?.('Sign in to continue')
      return
    }
    router.push(href)
  }

  return (
    <div className="space-y-8 mt-8">

      {/* Header */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">How Rushr Works for Contractors</h1>
              <p className="text-slate-600 text-sm mt-0.5">Your complete guide to finding work and growing your business</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={()=>go('/jobs')} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors">Browse Jobs</button>
            <Link href="/signals" className="border border-emerald-600 text-emerald-600 px-4 py-2 rounded-lg font-medium hover:bg-emerald-600 hover:text-white transition-colors">Learn Signals</Link>
          </div>
        </div>
      </section>

      {/* 4-step flow */}
      <section className="section">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">How It Works</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">Follow these four simple steps to start finding and winning emergency service jobs through Rushr</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Step
            n={1}
            title="Set up your profile"
            body="Add services, service area (ZIPs/radius), licensing & insurance, and a short bio. Profiles with clear photos and specialties get contacted more."
            bullets={['Badges for license/insurance', 'Specialties & min/max rates', 'Service ZIPs/radius']}
          />
          <Step
            n={2}
            title="Find emergency work"
            body="Browse urgent jobs in your area or turn on Signals to get real-time alerts from inspections, permits, licenses & violations that match your rules."
            bullets={['Emergency jobs only', 'Instant alerts with Signals', 'No pay-to-message']}
          />
          <Step
            n={3}
            title="Respond immediately"
            body="Use line items and notes so homeowners can compare apples-to-apples. Fast emergency response and immediate availability help you win."
            bullets={['Immediate response quotes', 'Attach photos/docs', 'Emergency availability']}
          />
          <Step
            n={4}
            title="Deliver fast, grow"
            body="Handle emergency repairs quickly and keep records in one thread. Earn reviews and use 1-click rehire for future emergencies."
            bullets={['Emergency response', 'Receipts & job history', '1-click rehire']}
          />
        </div>
      </section>

      {/* Make your profile stand out */}
      <section className="section">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Build a Winning Profile</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">Homeowners hire faster when your profile answers their top questions at a glance. Here's what makes profiles successful.</p>
        </div>
        <div className="card p-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Profile Essentials</h3>
          </div>

          <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <CheckCard icon="🧾" title="Licensing & insurance" text="Upload docs to earn visible badges and build trust." />
            <CheckCard icon="🛠️" title="Specialties & services" text="List what you actually do—make it easy to match." />
            <CheckCard icon="📍" title="Service area" text="Set ZIPs/radius so you see the right jobs first." />
            <CheckCard icon="💬" title="Bio & tone" text="A short, friendly bio wins replies; keep it professional." />
            <CheckCard icon="📸" title="Before/after photos" text="Show recent work—3 to 6 strong examples are ideal." />
            <CheckCard icon="⭐" title="Reviews & repeats" text="Request reviews after completion; 1-click rehire keeps you close." />
          </div>
        </div>
      </section>

      {/* Winning bids (what homeowners compare) */}
      <section className="section">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Win More Bids</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">Our side-by-side comparison view highlights clarity and completeness. These areas consistently win jobs.</p>
        </div>
        <div className="card p-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-slate-900">What Homeowners Compare</h3>
          </div>

          <div className="mt-4 grid lg:grid-cols-3 gap-4">
            <CompareCard
              icon="🧮"
              title="Itemized scope & pricing"
              points={[
                'Materials, haul-away, cleanup, and warranty spelled out',
                'Avoid “TBD”—give ranges if needed with assumptions',
              ]}
            />
            <CompareCard
              icon="⏱️"
              title="Emergency response speed"
              points={[
                'Respond within minutes with immediate availability',
                'Offer same-day or next-hour emergency service',
              ]}
            />
            <CompareCard
              icon="🛡️"
              title="Credentials & confidence"
              points={[
                'License/insurance badges visible',
                'Relevant photos and a short, credible bio',
              ]}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="badge">Quote templates</span>
            <span className="badge">Saved messages</span>
            <span className="badge">Attachments</span>
          </div>
        </div>
      </section>

      {/* Signals — concise, value-first (optional but recommended) */}
      <section className="section">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Get Ahead with Signals</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">Be the first to know about new opportunities before homeowners even post jobs</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 relative overflow-hidden">
          <div className="absolute top-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            Pro Feature
          </div>
          <div className="relative">
            <h3 className="text-xl font-bold text-slate-900 mb-3">Be First to the Lead</h3>
            <p className="text-slate-700 mb-4 text-lg">
              Signals monitors inspection failures, permits, licenses, and violations in your state.
              Build custom rules by category, jurisdiction, and keywords to get instant alerts—so you can quote first.
            </p>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 border border-emerald-200">
                <div className="font-semibold text-slate-900 mb-1">🔍 Real-time Monitoring</div>
                <div className="text-sm text-slate-600">Watch for failed inspections and violations automatically</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-emerald-200">
                <div className="font-semibold text-slate-900 mb-1">⚡ Instant Alerts</div>
                <div className="text-sm text-slate-600">Get notified the moment opportunities match your criteria</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-emerald-200">
                <div className="font-semibold text-slate-900 mb-1">🎯 Custom Rules</div>
                <div className="text-sm text-slate-600">Set filters for location, category, and specific keywords</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/signals" className="btn btn-outline border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white">Learn How Signals Works</Link>
              <button onClick={()=>go('/signals/dashboard')} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors">Open Signals Dashboard</button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick-start checklist */}
      <section className="section">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Get Started in 10 Minutes</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">Follow this quick checklist to set up your profile and start finding work right away</p>
        </div>
        <div className="card p-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Quick Start Checklist</h3>
          </div>
          <div className="mt-3 grid md:grid-cols-2 gap-4">
            <TipCard n={1} title="Complete profile basics" lines={['Upload license/insurance', 'Add specialties & service area']} />
            <TipCard n={2} title="Set default quote template" lines={['Line items & standard notes', 'Warranty & exclusions']} />
            <TipCard n={3} title="Browse today’s jobs" lines={['Filter by ZIP & category', 'Shortlist a few to bid now']} />
            <TipCard n={4} title="Turn on Signals (optional)" lines={['Create 1–2 rules', 'Test alerts for a day']} />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button onClick={()=>go('/jobs')} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors">Browse jobs</button>
            <button onClick={()=>go('/settings')} className="border border-emerald-600 text-emerald-600 px-4 py-2 rounded-lg font-medium hover:bg-emerald-600 hover:text-white transition-colors">Edit profile</button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section">
        <div className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-2xl border border-emerald-200 p-8 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
              Ready to Start Finding Work?
            </h2>
            <p className="text-slate-700 mb-6 text-lg">
              Join thousands of contractors already using Rushr to grow their business with quality emergency service jobs.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
              <button onClick={()=>go('/jobs')} className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors w-full sm:w-auto">Browse Available Jobs</button>
              <Link href="/signals" className="border border-emerald-600 text-emerald-600 px-6 py-3 rounded-lg font-medium hover:bg-emerald-600 hover:text-white transition-colors w-full sm:w-auto">Explore Signals</Link>
            </div>
            <div className="flex items-center justify-center gap-6 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Free to use
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Small success fee only
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Signals optional
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

/* — in-file atoms to match your system — */

function Step({
  n, title, body, bullets=[]
}:{
  n:number
  title:string
  body:string
  bullets?:string[]
}){
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:bg-slate-900 dark:border-slate-800">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full grid place-items-center bg-emerald-100 text-emerald-700 font-semibold">{n}</div>
        <div className="text-[17px] md:text-lg font-semibold tracking-tight text-ink dark:text-white">{title}</div>
      </div>
      <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{body}</p>
      {bullets.length>0 && (
        <ul className="mt-3 space-y-1 text-sm text-slate-700 dark:text-slate-300">
          {bullets.map((b,i)=>(
            <li key={i} className="flex items-start gap-2">
              <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-primary" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function CheckCard({icon, title, text}:{icon:string; title:string; text:string}){
  return (
    <div className="rounded-2xl border border-slate-200 p-4 bg-white dark:bg-slate-900 dark:border-slate-800">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-xl grid place-items-center bg-emerald-50 text-2xl leading-none dark:bg-emerald-900/20">{icon}</div>
        <div>
          <div className="font-semibold text-ink dark:text-white">{title}</div>
          <p className="text-sm text-slate-700 dark:text-slate-300 mt-0.5">{text}</p>
        </div>
      </div>
    </div>
  )
}

function CompareCard({icon, title, points}:{icon:string; title:string; points:string[]}){
  return (
    <div className="rounded-2xl border border-slate-200 p-4 bg-white dark:bg-slate-900 dark:border-slate-800">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-xl grid place-items-center bg-emerald-50 text-2xl leading-none dark:bg-emerald-900/20">{icon}</div>
        <div className="flex-1">
          <div className="font-semibold text-ink dark:text-white">{title}</div>
          <ul className="mt-1 space-y-1">
            {points.map((p,i)=>(
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-primary" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function TipCard({n, title, lines}:{n:number; title:string; lines:string[]}){
  return (
    <div className="rounded-2xl border border-slate-200 p-4 bg-white dark:bg-slate-900 dark:border-slate-800">
      <div className="flex items-start gap-3">
        <div className="h-7 w-7 rounded-full grid place-items-center bg-emerald-100 text-emerald-700 text-sm font-semibold">{n}</div>
        <div className="flex-1">
          <div className="font-semibold text-ink dark:text-white">{title}</div>
          <ul className="mt-1 space-y-1">
            {lines.map((l,i)=>(
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-primary" />
                <span>{l}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
