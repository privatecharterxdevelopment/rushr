// app/how-it-works/page.tsx
'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useApp } from '../../lib/state'

export default function HowItWorksPage(){
  const { state, openAuth, addToast } = useApp()
  const [activeStep, setActiveStep] = useState(0)

  const postOrAuth = ()=>{
    if(!state.user.signedIn){
      openAuth()
      addToast?.('Sign in to post your emergency job')
      return
    }
    window.location.href = '/post-job'
  }

  return (
    <div className="space-y-8">

      {/* Hero */}
      <section className="section">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-emerald-50/40 to-emerald-100/60 p-8 md:p-10 border border-emerald-200">
          {/* Subtle background pattern */}
          <div className="pointer-events-none absolute inset-0 opacity-20">
            <div className="h-full w-full" style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgb(16 185 129 / 0.1) 1px, transparent 0)`,
              backgroundSize: '24px 24px'
            }} />
          </div>

          <div className="relative text-center">
            {/* Professional badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-white/90 backdrop-blur-sm px-4 py-2 text-sm font-medium shadow-lg ring-1 ring-emerald-200 border border-emerald-100">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-emerald-800">PROFESSIONAL SERVICES PLATFORM</span>
            </div>

            {/* Main title */}
            <h1 className="mt-6 text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-none tracking-tight">
              How Rushr works
            </h1>

            {/* Subtitle */}
            <p className="mt-6 max-w-3xl mx-auto text-lg text-slate-700 leading-relaxed">
              Connect with verified professionals in your area quickly and efficiently.
              Get quotes, compare options, and hire with confidence.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={postOrAuth}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg transition-colors"
              >
                Post a Job
              </button>

              <Link
                href="/find-pro"
                className="bg-white hover:bg-gray-50 text-emerald-700 hover:text-emerald-800 px-8 py-4 rounded-xl font-semibold text-lg shadow-lg border border-emerald-200 hover:border-emerald-300 transition-colors"
              >
                Browse Professionals
              </Link>
            </div>

            {/* Stats bar */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-emerald-200 shadow-sm">
                <div className="text-2xl font-bold text-emerald-600">Fast</div>
                <div className="text-sm text-slate-600 font-medium">Quick responses</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-emerald-200 shadow-sm">
                <div className="text-2xl font-bold text-emerald-600">24/7</div>
                <div className="text-sm text-slate-600 font-medium">Always available</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-emerald-200 shadow-sm">
                <div className="text-2xl font-bold text-emerald-600">Verified</div>
                <div className="text-sm text-slate-600 font-medium">Trusted professionals</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Response Flow */}
      <section className="section">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-ink dark:text-white">Emergency Response in 4 Steps</h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400">From crisis to resolution in minutes</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <EmergencyStep
            n={1}
            title="Report Emergency"
            body="Quickly describe your emergency situation with our smart form. Location auto-detected, urgency level assessed instantly."
            bullets={['30 seconds to post', '24/7 availability', 'Auto location detection']}
            icon="🚨"
            color="emerald"
            isActive={activeStep === 0}
            onClick={() => setActiveStep(0)}
          />
          <EmergencyStep
            n={2}
            title="Instant Matching"
            body="Emergency pros in your area are instantly notified and can respond within 2-5 minutes with availability and quotes."
            bullets={['Average 4-min response', 'Emergency-certified pros', 'Real-time availability']}
            icon="⚡"
            color="emerald"
            isActive={activeStep === 1}
            onClick={() => setActiveStep(1)}
          />
          <EmergencyStep
            n={3}
            title="Live Communication"
            body="Chat directly with responding pros, share photos/videos, get live location tracking and ETA updates."
            bullets={['Live chat & video', 'GPS tracking', 'Photo sharing']}
            icon="📱"
            color="emerald"
            isActive={activeStep === 2}
            onClick={() => setActiveStep(2)}
          />
          <EmergencyStep
            n={4}
            title="Emergency Resolved"
            body="Professional arrives, completes emergency work, and you're back to normal. Payment and documentation handled securely."
            bullets={['Secure payment', 'Work documentation', 'Follow-up support']}
            icon="✅"
            color="emerald"
            isActive={activeStep === 3}
            onClick={() => setActiveStep(3)}
          />
        </div>
      </section>

      {/* Emergency Categories */}
      <section className="section">
        <div className="card p-8">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-ink dark:text-white">Emergency Services We Cover</h3>
            <p className="mt-2 text-slate-700 dark:text-slate-300">
              From home disasters to auto emergencies, we've got you covered 24/7
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <EmergencyCategory
              title="Home Emergencies"
              icon="🏠"
              bgColor="bg-emerald-50 dark:bg-emerald-900/20"
              borderColor="border-emerald-200 dark:border-emerald-800"
              services={[
                '⚡ Electrical failures',
                '💧 Plumbing leaks & bursts',
                '❄️ HVAC breakdowns',
                '🔒 Lockout situations',
                '🌪️ Storm damage repairs',
                '🔥 Emergency board-ups'
              ]}
            />
            <EmergencyCategory
              title="Auto Emergencies"
              icon="🚗"
              bgColor="bg-emerald-50 dark:bg-emerald-900/20"
              borderColor="border-emerald-200 dark:border-emerald-800"
              services={[
                '🔋 Dead battery jump',
                '🔧 Tire changes & repairs',
                '🗝️ Car lockout service',
                '🚛 Emergency towing',
                '⛽ Fuel delivery',
                '⚙️ Mobile mechanic'
              ]}
            />
            <EmergencyCategory
              title="General Emergencies"
              icon="🚨"
              bgColor="bg-emerald-50 dark:bg-emerald-900/20"
              borderColor="border-emerald-200 dark:border-emerald-800"
              services={[
                '🌳 Tree removal (fallen)',
                '🐛 Pest control urgency',
                '🏠 Glass repair & replacement',
                '🔧 Appliance breakdowns',
                '🧹 Emergency cleanup',
                '🔒 Security system fixes'
              ]}
            />
          </div>

          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-emerald-100 px-4 py-2 rounded-full text-sm font-medium border border-emerald-200">
              <span className="text-emerald-600">🚨</span>
              <span className="text-slate-700">Don't see your emergency? Post it anyway - our pros handle all types of urgent situations!</span>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Response Features */}
      <section className="section">
        <div className="card p-8">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-ink dark:text-white">Why Choose Rushr for Emergencies?</h3>
            <p className="mt-2 text-slate-700 dark:text-slate-300">
              Built specifically for urgent situations where every minute matters
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <FeatureCard
              icon="⚡"
              title="Lightning Fast Response"
              features={[
                'Average 4-minute professional response time',
                'Real-time notifications to nearby pros',
                'Instant availability confirmation',
                'Emergency priority routing system'
              ]}
              bgColor="bg-emerald-50 dark:bg-emerald-900/20"
              iconColor="text-emerald-600"
            />
            <FeatureCard
              icon="🛡️"
              title="Emergency-Certified Pros"
              features={[
                'Background-checked emergency responders',
                'Licensed and insured professionals',
                '24/7 availability verification',
                'Emergency response training certified'
              ]}
              bgColor="bg-emerald-50 dark:bg-emerald-900/20"
              iconColor="text-emerald-600"
            />
            <FeatureCard
              icon="📱"
              title="Real-Time Tracking"
              features={[
                'Live GPS tracking of responding pro',
                'ETA updates every 2 minutes',
                'Photo/video sharing capabilities',
                'Direct emergency hotline'
              ]}
              bgColor="bg-emerald-50 dark:bg-emerald-900/20"
              iconColor="text-emerald-600"
            />
          </div>

          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <div className="text-2xl font-bold text-emerald-600">4min</div>
              <div className="text-sm text-slate-600">Average Response</div>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <div className="text-2xl font-bold text-emerald-600">24/7</div>
              <div className="text-sm text-slate-600">Always Available</div>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <div className="text-2xl font-bold text-emerald-600">100%</div>
              <div className="text-sm text-slate-600">Verified Pros</div>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <div className="text-2xl font-bold text-emerald-600">GPS</div>
              <div className="text-sm text-slate-600">Live Tracking</div>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Trust & Safety */}
      <section className="section">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-ink dark:text-white">Emergency Trust & Safety</h3>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Your safety and security are our top priorities</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <EmergencySafetyCard
            icon="🆔"
            title="Identity Verified"
            lines={['Government ID verification required', 'Real-time background checks', 'Emergency certification badges']}
            bgColor="bg-emerald-50 dark:bg-emerald-900/20"
          />
          <EmergencySafetyCard
            icon="🛡️"
            title="Emergency Protocol"
            lines={['24/7 emergency support hotline', 'Live GPS tracking for your safety', 'Instant emergency services backup']}
            bgColor="bg-emerald-50 dark:bg-emerald-900/20"
          />
          <EmergencySafetyCard
            icon="💬"
            title="Secure Communication"
            lines={['Encrypted emergency messaging', 'Photo/video sharing capability', 'Live status updates']}
            bgColor="bg-emerald-50 dark:bg-emerald-900/20"
          />
          <EmergencySafetyCard
            icon="📊"
            title="Complete Documentation"
            lines={['Full emergency response records', 'Work completion documentation', 'Payment protection guarantee']}
            bgColor="bg-emerald-50 dark:bg-emerald-900/20"
          />
        </div>
      </section>

      {/* Emergency CTA */}
      <section className="section">
        <div className="card relative overflow-hidden p-8 md:p-12 text-center">
          {/* Emergency gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-emerald-400/10 to-emerald-600/15"></div>

          <div className="relative">
            <div className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/30 px-4 py-2 rounded-full text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-4">
              <span className="animate-pulse">🚨</span>
              Emergency Response Ready
            </div>

            <h3 className="text-3xl md:text-4xl font-bold text-ink dark:text-white">
              Ready for Emergency Help?
            </h3>
            <p className="mt-4 text-lg text-slate-700 dark:text-slate-300 max-w-2xl mx-auto">
              Don't wait when emergencies strike. Get connected with verified emergency professionals in your area right now.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <button onClick={postOrAuth} className="btn-primary px-10 py-5 text-xl font-bold shadow-xl transition-all transform hover:scale-105">
                🚨 Get Emergency Help Now
              </button>
              <Link href="/find-pro" className="bg-slate-600 hover:bg-slate-700 text-white px-10 py-5 rounded-xl font-bold text-xl shadow-xl transition-all transform hover:scale-105 border border-emerald-500/30">
                🔍 Browse Emergency Pros
              </Link>
            </div>

            <div className="mt-6 flex items-center justify-center gap-8 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span className="text-emerald-500 text-lg">⚡</span>
                <span className="font-semibold">4-minute average response</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-500 text-lg">📱</span>
                <span className="font-semibold">24/7 availability</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-500 text-lg">🛡️</span>
                <span className="font-semibold">100% verified professionals</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Link to About */}
      <section className="section">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 text-sm text-slate-700 dark:text-slate-300 dark:border-emerald-800 dark:bg-emerald-900/10 text-center">
          <span className="text-emerald-500">🚨</span> Learn more about our emergency response mission on our <Link href="/about" className="underline font-semibold text-emerald-600 hover:text-emerald-700">About</Link> page.
        </div>
      </section>
    </div>
  )
}

/* — Emergency-focused components — */

function EmergencyStep({
  n, title, body, bullets=[], icon, color, isActive, onClick
}:{
  n:number
  title:string
  body:string
  bullets?:string[]
  icon:string
  color:string
  isActive:boolean
  onClick:()=>void
}){
  const colorClasses = {
    emerald: 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20'
  }

  return (
    <div
      className={`rounded-2xl border p-6 shadow-lg cursor-pointer transition-all transform hover:scale-105 ${
        isActive ? colorClasses[color] : 'border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="text-3xl">{icon}</div>
        <div className="h-8 w-8 rounded-full grid place-items-center bg-slate-100 text-slate-700 font-bold text-sm">{n}</div>
      </div>
      <div className="text-lg font-bold tracking-tight text-ink dark:text-white mb-2">{title}</div>
      <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">{body}</p>
      {bullets.length>0 && (
        <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
          {bullets.map((b,i)=>(
            <li key={i} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function EmergencyCategory({title, icon, bgColor, borderColor, services}:{
  title:string; icon:string; bgColor:string; borderColor:string; services:string[]
}){
  return (
    <div className={`rounded-2xl border ${borderColor} ${bgColor} p-6`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="text-3xl">{icon}</div>
        <div className="text-xl font-bold text-ink dark:text-white">{title}</div>
      </div>
      <ul className="space-y-2">
        {services.map((service,i)=>(
          <li key={i} className="text-sm text-slate-700 dark:text-slate-300">
            {service}
          </li>
        ))}
      </ul>
    </div>
  )
}

function FeatureCard({icon, title, features, bgColor, iconColor}:{
  icon:string; title:string; features:string[]; bgColor:string; iconColor:string
}){
  return (
    <div className={`rounded-2xl ${bgColor} p-6 border border-slate-200 dark:border-slate-700`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`text-3xl ${iconColor}`}>{icon}</div>
        <div className="text-lg font-bold text-ink dark:text-white">{title}</div>
      </div>
      <ul className="space-y-2">
        {features.map((feature,i)=>(
          <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
            <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function EmergencySafetyCard({icon, title, lines, bgColor}:{
  icon:string; title:string; lines:string[]; bgColor:string
}){
  return (
    <div className={`rounded-2xl ${bgColor} p-6 border border-slate-200 dark:border-slate-700`}>
      <div className="flex items-start gap-4">
        <div className="text-3xl">{icon}</div>
        <div className="flex-1">
          <div className="text-lg font-bold text-ink dark:text-white mb-2">{title}</div>
          <ul className="space-y-2">
            {lines.map((l,i)=>(
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>{l}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
