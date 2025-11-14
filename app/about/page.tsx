'use client'
import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import HowItWorksSlider from '../../components/HowItWorksSlider'

export default function AboutPage(){
  return (
    <div className="space-y-0">
      {/* ===== Hero (unchanged structure) ===== */}
      <section className="section">
        <div className="relative overflow-hidden card p-8 md:p-12">
          <div className="pointer-events-none absolute inset-0">
            <Orb className="top-[-120px] left-[-120px] w-[520px] h-[520px]" from="rgba(16,185,129,0.18)" />
            <Orb className="bottom-[-160px] right-[-110px] w-[480px] h-[480px]" from="rgba(52,211,153,0.14)" />
          </div>

          <div className="relative">
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-200">
              Emergency services only
            </span>
            <h1 className="mt-3 text-3xl md:text-4xl font-bold text-ink dark:text-white tracking-tight">
              Emergency repairs, without the wait.
            </h1>
            <p className="mt-3 max-w-2xl text-slate-700 dark:text-slate-300">
              Rushr connects homeowners with vetted emergency service pros — fast, urgent, and reliable.
              Post your emergency in minutes, get immediate quotes, and hire contractors ready for same-day service.
              Pros get real-time alerts to respond to emergencies first.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/post-job" className="btn-primary">Post a job</Link>
              <Link href="/rushrmap" className="btn btn-outline">Find a pro</Link>
              <Link href="/pro" className="btn btn-ghost">For professionals</Link>
            </div>
          </div>

          <div className="relative mt-6 rounded-xl border border-slate-200 bg-white shadow-soft dark:bg-slate-900 dark:border-slate-800">
            <PeekStrip />
          </div>
        </div>
      </section>

      {/* ===== Mission (split layout, circular icon badges) ===== */}
      <WaveTop />
      <section className="bg-gradient-to-br from-emerald-50/60 via-white to-white">
        <div className="container-max py-10 md:py-14">
          <div className="grid items-center gap-6 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-semibold text-ink dark:text-white">Our mission</h2>
              <p className="mt-2 text-slate-700 dark:text-slate-300">
                When emergencies strike, every minute matters. Rushr connects homeowners with verified local professionals instantly—no waiting, no endless calls, just fast help when you need it most.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <ValueItem icon={<IconClock className="h-5 w-5 text-emerald-700" />} title="Lightning-fast response">
                  Average 4-minute response time. Get help when emergencies can't wait.
                </ValueItem>
                <ValueItem icon={<IconShieldCheck className="h-5 w-5 text-emerald-700" />} title="Verified professionals">
                  Background-checked, licensed pros ready for same-day service.
                </ValueItem>
                <ValueItem icon={<IconUsers className="h-5 w-5 text-emerald-700" />} title="Built for emergencies">
                  24/7 availability with pros trained to handle urgent situations.
                </ValueItem>
                <ValueItem icon={<IconHeart className="h-5 w-5 text-emerald-700" />} title="Transparent pricing">
                  Clear quotes upfront. Homeowners post free, pros pay only on success.
                </ValueItem>
              </div>
            </div>

            <div className="relative">
              <div className="mx-auto max-w-md">
                <div className="rounded-2xl border bg-gradient-to-br from-white to-slate-50 p-5 shadow-lg dark:from-slate-900 dark:to-slate-900 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                        <IconClock className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-ink dark:text-white">Burst Pipe Emergency</div>
                        <div className="text-xs text-slate-500">Posted 4 min ago</div>
                      </div>
                    </div>
                    <span className="rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-bold text-red-700">URGENT</span>
                  </div>

                  <div className="space-y-2.5">
                    {/* Quote 1 - Winner */}
                    <div className="rounded-lg bg-white p-3.5 ring-2 ring-emerald-500 shadow-sm dark:bg-slate-800">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm flex-shrink-0">JM</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <div className="text-sm font-bold text-ink dark:text-white">Mike's Plumbing</div>
                              <span className="text-xs">⭐</span>
                              <span className="text-xs font-semibold text-slate-700">4.9</span>
                            </div>
                            <div className="text-xs text-slate-500">Licensed • 2.1 mi away</div>
                            <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">"On my way. Can be there in 15 minutes."</div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-base font-bold text-emerald-700">$285</div>
                          <div className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 rounded px-1.5 py-0.5 mt-0.5">15 MIN ETA</div>
                        </div>
                      </div>
                    </div>

                    {/* Quote 2 */}
                    <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200 shadow-sm dark:bg-slate-800 dark:ring-slate-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">AP</div>
                          <div>
                            <div className="flex items-center gap-1">
                              <div className="text-sm font-semibold text-ink dark:text-white">AllPro Services</div>
                              <span className="text-xs">⭐ 4.7</span>
                            </div>
                            <div className="text-xs text-slate-500">3.8 mi away</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-slate-700">$320</div>
                          <div className="text-xs text-slate-500">30 min</div>
                        </div>
                      </div>
                    </div>

                    {/* Quote 3 */}
                    <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200 shadow-sm dark:bg-slate-800 dark:ring-slate-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-9 w-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm">RR</div>
                          <div>
                            <div className="flex items-center gap-1">
                              <div className="text-sm font-semibold text-ink dark:text-white">Rapid Repair</div>
                              <span className="text-xs">⭐ 5.0</span>
                            </div>
                            <div className="text-xs text-slate-500">5.2 mi away</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-slate-700">$350</div>
                          <div className="text-xs text-slate-500">45 min</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <div className="text-center">
                      <div className="text-xs font-semibold text-emerald-700">Average response time: 4 minutes</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pointer-events-none absolute -left-8 -top-8 h-40 w-40 rounded-full bg-emerald-100/50 blur-3xl" />
              <div className="pointer-events-none absolute -right-6 -bottom-6 h-32 w-32 rounded-full bg-red-100/40 blur-2xl" />
            </div>
          </div>
        </div>
      </section>

{/* ===== How it works (exact pill slider) ===== */}
<section className="bg-white">
  <div className="container-max py-10 md:py-14">
    <HowItWorksSlider />
  </div>
</section>


      {/* ===== Trust & Safety ===== */}
      <section className="relative">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white via-emerald-50/50 to-white" />
        <div className="container-max py-10 md:py-14">
          <div className="rounded-2xl border bg-white p-6 md:p-8 shadow-soft dark:bg-slate-900 dark:border-slate-800 relative overflow-hidden">
            <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-emerald-100 blur-3xl" />
            <div className="flex items-center gap-2">
              <IconShieldCheck className="h-5 w-5 text-emerald-700" />
              <h3 className="text-lg font-semibold text-ink dark:text-white">Trust and safety</h3>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm text-slate-700 dark:text-slate-300">
              <Bullet>License and insurance visibility where applicable</Bullet>
              <Bullet>Background check indicators where provided</Bullet>
              <Bullet>Private in app messaging by default</Bullet>
              <Bullet>Clear reporting and quick support follow up</Bullet>
              <Bullet>Job history and document retention</Bullet>
              <Bullet>Abuse prevention and moderation policies</Bullet>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Coverage & Data (Nationwide at launch) ===== */}
      <section className="bg-white">
        <div className="container-max py-10 md:py-14">
          <div className="grid gap-4 md:grid-cols-[1.2fr,0.8fr]">
            <div className="rounded-2xl border bg-white p-6 shadow-soft dark:bg-slate-900 dark:border-slate-800">
              <h3 className="text-lg font-semibold text-ink dark:text-white">Coverage and data</h3>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                Signals is nationwide at launch. We monitor inspections, permits, licenses, and
                violations across supported sources and continue to expand depth over time.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Capsule>Inspections</Capsule>
                <Capsule>Permits</Capsule>
                <Capsule>Licenses</Capsule>
                <Capsule>Violations</Capsule>
                <Capsule>Planned: Utilities</Capsule>
              </div>
              <div className="mt-6 rounded-xl border bg-white p-4 dark:bg-slate-900 dark:border-slate-800">
                <div className="text-xs font-medium text-slate-500">Signals coverage snapshot</div>
                <CoverageBar full />
                <div className="mt-2 text-xs text-slate-500">Nationwide at launch.</div>
              </div>
            </div>

            <div className="rounded-2xl border bg-gradient-to-br from-emerald-50 to-white p-6 dark:from-emerald-900/20 dark:to-slate-900 dark:border-slate-800">
              <h4 className="text-sm font-semibold text-emerald-800">Quick stats</h4>
              <div className="mt-3 grid gap-3">
                <StatRow label="Avg time to first response" value="~8 min" />
                <StatRow label="Average pro rating" value="4.8★" />
                <StatRow label="Jobs completed after hire" value="97%" />
                <StatRow label="Signals coverage" value="Nationwide" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Testimonials (scroll) ===== */}
      <section className="section">
        <div className="card p-6 md:p-8">
          <h2 className="text-lg font-semibold text-ink dark:text-white text-center">What people say</h2>
          <div className="mt-4 flex gap-4 overflow-x-auto snap-x pb-2 justify-center">
            {TESTIMONIALS.map(t => (
              <Testimonial key={t.id} quote={t.quote} name={t.name} role={t.role} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== Contact (wide slab) ===== */}
<section className="section">
  <div className="rounded-2xl border bg-gradient-to-br from-emerald-50 via-white to-white p-6 md:p-8 shadow-soft dark:from-emerald-900/20 dark:via-slate-900 dark:to-slate-900 dark:border-slate-800">
    <div className="flex flex-col items-center gap-4 text-center">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-2.5 py-1 text-[12px] font-semibold text-emerald-800">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
            <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth="2"/>
            <path strokeWidth="2" d="M3 7l9 6 9-6"/>
          </svg>
          Contact us
        </div>
        <h3 className="mt-2 text-xl font-semibold text-ink dark:text-white">We're here to help</h3>
        <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
          Questions about a job, quotes, or Signals? Reach the team directly.
        </p>
      </div>

      <div className="flex flex-col items-center gap-2 text-sm">
        <a href="mailto:hello@userushr.com" className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 hover:bg-emerald-50 dark:bg-slate-900 dark:border-slate-800">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-700" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="9" strokeWidth="2"/>
            <circle cx="12" cy="12" r="4" strokeWidth="2"/>
            <path strokeWidth="2" d="M4.6 7.5l3.4 2.3M19.4 7.5l-3.4 2.3M4.6 16.5l3.4-2.3M19.4 16.5l-3.4-2.3"/>
          </svg>
          Support hello@userushr.com
        </a>
        <a href="mailto:press@userushr.com" className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 hover:bg-emerald-50 dark:bg-slate-900 dark:border-slate-800">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-700" fill="none" stroke="currentColor">
            <path strokeWidth="2" d="M3 11v2a2 2 0 002 2h2l5 4V5L7 9H5a2 2 0 00-2 2z"/>
            <path strokeWidth="2" d="M14 7l7-3v16l-7-3"/>
          </svg>
          Media and partnerships press@userushr.com
        </a>
      </div>
    </div>
  </div>
</section>


      {/* ===== Full FAQ ===== */}
      <section className="section" id="faq">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-ink dark:text-white">Frequently Asked Questions</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Need more help? <Link href="/contact" className="text-emerald-700 font-semibold hover:text-emerald-800">Contact support</Link>.
          </p>
        </div>

        <div className="mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Homeowner Pillar */}
            <div className="rounded-2xl border bg-white p-6 shadow-soft dark:bg-slate-900 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100">
                  <IconHome className="h-4 w-4 text-emerald-700" />
                </div>
                <h3 className="text-base font-semibold text-emerald-700">For Homeowners</h3>
              </div>
              <div className="space-y-2">
                {HOMEOWNER_FAQ.map((it) => (
                  <FAQ key={it.q} q={it.q}>{it.a}</FAQ>
                ))}
              </div>
            </div>

            {/* Contractor Pillar */}
            <div className="rounded-2xl border bg-white p-6 shadow-soft dark:bg-slate-900 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100">
                  <IconBriefcase className="h-4 w-4 text-blue-700" />
                </div>
                <h3 className="text-base font-semibold text-blue-700">For Contractors</h3>
              </div>
              <div className="space-y-2">
                {CONTRACTOR_FAQ.map((it) => (
                  <FAQ key={it.q} q={it.q}>{it.a}</FAQ>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="section">
        <div className="card p-8 md:p-10 text-center">
          <h3 className="text-xl md:text-2xl font-semibold text-ink dark:text-white">
            Ready to get help fast?
          </h3>
          <p className="mt-2 text-slate-700 dark:text-slate-300">
            Post your emergency or start winning jobs as a verified pro.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Link href="/post-job" className="btn-primary">Post an emergency</Link>
            <Link href="/pro" className="btn btn-outline">For professionals</Link>
          </div>
        </div>
      </section>
    </div>
  )
}

/* ===================== Components ===================== */

function WaveTop(){
  return <div className="relative h-6"><div className="absolute inset-x-0 -top-6 h-6 bg-[radial-gradient(60%_20px_at_50%_100%,#e2f6ee,transparent)]" /></div>
}
function WaveBottom(){
  return <div className="relative -mt-2 h-6"><div className="absolute inset-x-0 -bottom-6 h-6 bg-[radial-gradient(60%_20px_at_50%_0%,#e2f6ee,transparent)]" /></div>
}

function Orb({ className, from }:{ className?:string; from:string }){
  return (
    <div
      className={`absolute rounded-full opacity-80 ${className || ''}`}
      style={{ background: `radial-gradient(closest-side, ${from}, transparent 70%)` }}
      aria-hidden
    />
  )
}

function Card({title, children}:{title:string; children:React.ReactNode}){
  return (
    <div className="rounded-2xl border border-slate-200 p-6 bg-white shadow-soft dark:bg-slate-900 dark:border-slate-800">
      <div className="font-semibold text-ink dark:text-white">{title}</div>
      <div className="mt-2 text-slate-700 dark:text-slate-300 text-sm">{children}</div>
    </div>
  )
}

function Bullet({children}:{children:React.ReactNode}){
  return (
    <div className="flex items-start gap-2">
      <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-primary" />
      <span className="text-sm">{children}</span>
    </div>
  )
}

function ValueItem({ icon, title, children }:{
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}){
  return (
    <div className="flex items-start gap-3 rounded-xl border p-4 bg-white dark:bg-slate-900 dark:border-slate-800">
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50 ring-2 ring-emerald-100">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-ink dark:text-white">{title}</div>
        <div className="text-sm text-slate-600 dark:text-slate-300">{children}</div>
      </div>
    </div>
  )
}

function Capsule({ children }:{ children: React.ReactNode }){
  return (
    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[12px] font-medium text-emerald-700">
      {children}
    </span>
  )
}

function StatRow({ label, value }:{ label:string; value:string }){
  return (
    <div className="flex items-center justify-between rounded-lg border bg-white p-3 text-sm dark:bg-slate-900 dark:border-slate-800">
      <span className="text-slate-600 dark:text-slate-300">{label}</span>
      <span className="font-semibold text-ink dark:text-white">{value}</span>
    </div>
  )
}

function CoverageBar({ full }: { full?: boolean }){
  return (
    <div className="mt-2 h-2 w-full rounded bg-slate-100 dark:bg-slate-800 overflow-hidden">
      <div className={`h-2 ${full ? 'w-full' : 'w-2/5'} bg-primary`} />
    </div>
  )
}

function AlignedList({ items }:{ items:{ good:boolean; label:string }[] }){
  return (
    <ul className="space-y-2">
      {items.map((it, i)=>(
        <li key={i} className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center">
            {it.good ? <IconCheck className="h-4 w-4 text-primary" /> : <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />}
          </span>
          <span className="text-slate-700 dark:text-slate-300">{it.label}</span>
        </li>
      ))}
    </ul>
  )
}

/* ---------- How it works (exact pill) ---------- */
function HowItWorksTabs(){
  const [tab, setTab] = useState<'homeowner'|'contractor'>('homeowner')
  const steps = useMemo(()=> tab === 'homeowner' ? HOMEOWNER_STEPS : PRO_STEPS, [tab])

  return (
    <div className="mt-5">
      <div className="mx-auto w-full max-w-sm">
        <div className="flex items-center rounded-full border bg-white p-1 text-xs shadow-sm">
          <button
            onClick={()=>setTab('homeowner')}
            className={`flex-1 rounded-full px-3 py-1.5 font-semibold transition ${tab==='homeowner' ? 'bg-emerald-600 text-white' : 'text-slate-700 hover:bg-slate-50'}`}
            aria-selected={tab==='homeowner'}
          >
            Homeowner
          </button>
          <button
            onClick={()=>setTab('contractor')}
            className={`flex-1 rounded-full px-3 py-1.5 font-semibold transition ${tab==='contractor' ? 'bg-emerald-600 text-white' : 'text-slate-700 hover:bg-slate-50'}`}
            aria-selected={tab==='contractor'}
          >
            Contractor
          </button>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <div className="grid min-w-[720px] grid-cols-4 gap-3">
          {steps.map((s, i)=>(
            <div key={i} className="rounded-2xl border bg-white p-4 shadow-soft dark:bg-slate-900 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">{i+1}</span>
                <div className="font-medium text-sm text-ink dark:text-white">{s.title}</div>
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ===== FAQ item ===== */
function FAQ({ q, children }:{ q:string; children:React.ReactNode }){
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:bg-slate-900 dark:border-slate-800">
      <button
        className="flex w-full items-center justify-between text-left"
        aria-expanded={open}
        onClick={()=>setOpen(o=>!o)}
      >
        <span className="font-medium text-ink dark:text-white">{q}</span>
        <span className={`ml-3 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && <div className="mt-2 text-sm text-slate-700 dark:text-slate-300">{children}</div>}
    </div>
  )
}

/* ---------- Compact product peek ---------- */
function PeekStrip(){
  return (
    <div className="h-[84px] md:h-[104px] w-full overflow-hidden rounded-xl">
      <div className="grid h-full grid-cols-3 gap-2 p-2">
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 dark:bg-slate-900 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-500">Homeowner</div>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-2 w-24 rounded bg-slate-200" />
            <div className="h-2 w-16 rounded bg-slate-200" />
          </div>
          <div className="mt-2 h-5 w-24 rounded bg-primary/80" />
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 dark:bg-slate-900 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-500">Quotes</div>
          <div className="mt-1 h-8 rounded bg-slate-100 dark:bg-slate-800" />
          <div className="mt-2 h-2 w-20 rounded bg-slate-200" />
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 dark:bg-slate-900 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-500">Signals</div>
          <div className="mt-1 h-2 w-24 rounded bg-slate-200" />
          <div className="mt-1 h-2 w-28 rounded bg-slate-200" />
          <div className="mt-2 h-4 w-full rounded bg-emerald-100 dark:bg-emerald-950/40" />
        </div>
      </div>
    </div>
  )
}

/* ---------- Small testimonial card ---------- */
function Testimonial({ quote, name, role }:{ quote:string; name:string; role:string }){
  return (
    <figure className="min-w-[260px] max-w-sm snap-start rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:bg-slate-900 dark:border-slate-800">
      <blockquote className="text-sm text-slate-700 dark:text-slate-300">“{quote}”</blockquote>
      <figcaption className="mt-3">
        <div className="text-sm font-medium text-ink dark:text-white">{name}</div>
        <div className="text-xs text-slate-500">{role}</div>
      </figcaption>
    </figure>
  )
}

/* ===== Icons ===== */
function IconLightning(props: React.SVGProps<SVGSVGElement>) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}><path strokeWidth="2" d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/></svg>)
}
function IconScale(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path strokeWidth="2" d="M12 3v18M5 7h14" />
      <path strokeWidth="2" d="M7 7l-3 5a4 4 0 008 0l-3-5M17 7l-3 5a4 4 0 008 0l-3-5" />
    </svg>
  )
}
function IconLock(props: React.SVGProps<SVGSVGElement>) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}><rect x="5" y="11" width="14" height="9" rx="2" strokeWidth="2"/><path strokeWidth="2" d="M8 11V8a4 4 0 118 0v3"/></svg>)
}
function IconTarget(props: React.SVGProps<SVGSVGElement>) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}><circle cx="12" cy="12" r="8" strokeWidth="2"/><circle cx="12" cy="12" r="4" strokeWidth="2"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>)
}
function IconShieldCheck(props: React.SVGProps<SVGSVGElement>) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}><path strokeWidth="2" d="M12 3l8 4v5c0 5-3.4 8.6-8 9-4.6-.4-8-4-8-9V7l8-4z"/><path strokeWidth="2" d="M9 12l2 2 4-4"/></svg>)
}
function IconHome(props: React.SVGProps<SVGSVGElement>) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}><path strokeWidth="2" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeWidth="2" d="M9 22V12h6v10"/></svg>)
}
function IconBriefcase(props: React.SVGProps<SVGSVGElement>) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}><rect x="3" y="7" width="18" height="12" rx="2" strokeWidth="2"/><path strokeWidth="2" d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2"/><path strokeWidth="2" d="M3 12h18"/></svg>)
}
function IconCheck(props: React.SVGProps<SVGSVGElement>) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}><path strokeWidth="2" d="M20 6L9 17l-5-5"/></svg>)
}
function IconClock(props: React.SVGProps<SVGSVGElement>) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}><circle cx="12" cy="12" r="9" strokeWidth="2"/><path strokeWidth="2" d="M12 7v5l3 3"/></svg>)
}
function IconUsers(props: React.SVGProps<SVGSVGElement>) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}><path strokeWidth="2" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4" strokeWidth="2"/><path strokeWidth="2" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>)
}
function IconHeart(props: React.SVGProps<SVGSVGElement>) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}><path strokeWidth="2" d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>)
}

/* ===== Data ===== */
const HOMEOWNER_STEPS = [
  { title: 'Post your project', body: 'Describe the job, add photos, choose timing.' },
  { title: 'Compare quotes', body: 'Prices, timelines, and reviews in one place.' },
  { title: 'Hire and message', body: 'Chat privately and schedule visits.' },
  { title: 'Pay after completion', body: 'Homeowners pay 0. Pros pay success fee.' },
]
const PRO_STEPS = [
  { title: 'Browse or get Signals', body: 'See nearby work or get instant alerts.' },
  { title: 'Quote fast', body: 'Templates and attachments for clarity.' },
  { title: 'Build reputation', body: 'Verification and reviews that stand out.' },
  { title: 'Pay on success', body: 'No pay to bid. Fee only when you win.' },
]

const HOMEOWNER_FAQ = [
  { q: 'What is Rushr?', a: 'Rushr is an emergency response platform that connects you with verified local professionals when you need help fast. We average a 4-minute response time and operate 24/7 for urgent situations like burst pipes, lockouts, electrical issues, and more.' },
  { q: 'How fast will I actually get help?', a: 'Most homeowners see their first response within minutes—many in under 60 seconds. Our pros receive instant push notifications when you post, so help is on the way almost immediately.' },
  { q: 'Is this really available 24/7?', a: 'Yes! We have verified professionals ready to respond to emergencies around the clock, including nights, weekends, and holidays. When you have a 2am burst pipe, we have pros ready to help.' },
  { q: 'What types of emergencies do you cover?', a: 'We handle urgent home situations like plumbing leaks, gas odors, electrical hazards, no heat or AC in extreme weather, lockouts, storm damage, and more. If it cannot wait, we are here to help.' },
  { q: 'Does Rushr cost anything for homeowners?', a: 'Nope! Rushr is completely free for homeowners. You can post jobs, chat with pros, compare quotes, and hire—all at no cost to you.' },
  { q: 'How do I know the pros are qualified and safe?', a: 'Every professional on Rushr is verified and background-checked. You can view their licenses, ratings from other homeowners, past work, and verification badges before deciding who to hire.' },
  { q: 'What happens right after I post my emergency?', a: 'The moment you post, nearby pros who specialize in your type of emergency get instant notifications. They will start responding with their availability, quotes, and estimated arrival times within minutes.' },
  { q: 'Can I see who is responding before I hire?', a: 'Absolutely. You will see each pro profile, star rating, distance from you, estimated arrival time, and their quote. You are in complete control of who you choose.' },
  { q: 'Do I need to pay anything upfront?', a: 'No. Payment is only processed after the work is completed to your satisfaction. You will never be charged before the job is done.' },
  { q: 'Can I just hire the pro directly and pay them off the platform?', a: 'No—all transactions must happen through Rushr for your protection. If you take things off-platform, we cannot help with disputes, refunds, or any issues that arise. Staying on-platform keeps you safe.' },
  { q: 'What if something goes wrong with the job?', a: 'If you kept everything on-platform, we have your back. We can review messages, quotes, and work documentation to help resolve disputes or process refunds. Off-platform transactions leave you without any protection or recourse.' },
]

const CONTRACTOR_FAQ = [
  { q: 'How do I get emergency job leads on Rushr?', a: 'You will receive real-time push notifications the moment a job is posted that matches your trade and service area. The faster you respond, the better your chances of winning the work.' },
  { q: 'How much does Rushr cost for contractors?', a: 'It is free to browse jobs and send quotes. We only charge a small success fee when you win and complete work through the platform—no upfront costs or subscription fees.' },
  { q: 'Do I have to be available 24/7 to use Rushr?', a: 'Not at all. You set your own hours and availability. That said, pros who offer 24/7 emergency service tend to get priority placement and win more high-value jobs.' },
  { q: 'How quickly should I respond to job alerts?', a: 'Speed matters. Our top-performing pros respond in under 2 minutes. Homeowners are in crisis mode and often hire the first qualified pro who responds with confidence.' },
  { q: 'How do I get started on Rushr?', a: 'Sign up, complete your profile with your trade, licenses, and service area, then start browsing jobs or wait for emergency alerts. The verification process is quick and we will have you up and running fast.' },
  { q: 'Can I set my own service area and rates?', a: 'Absolutely. You control your service radius, the types of jobs you take, and your pricing. Rushr gives you the tools to run your business your way while connecting you with urgent work.' },
  { q: 'How do I get paid for completed jobs?', a: 'All payments are processed securely through Rushr after you complete the job. This protects both you and the homeowner and ensures a smooth transaction.' },
  { q: 'Can I ask the homeowner to pay me directly off-platform?', a: 'No. Taking payment off-platform is strictly prohibited and violates our terms of service. It also removes all dispute protection and platform support if anything goes wrong.' },
  { q: 'What happens if I accept off-platform payment?', a: 'Your account will be suspended, you will lose access to all platform protections, and you will have no support if disputes arise. We take this seriously to protect both pros and homeowners.' },
  { q: 'What types of emergency work can I get through Rushr?', a: 'We cover plumbing emergencies, electrical hazards, HVAC failures, lockouts, storm damage, roadside assistance, and more. If it is urgent and cannot wait, it is on Rushr.' },
  { q: 'How does the rating system work?', a: 'After each job, homeowners rate you from 1 to 5 stars and can leave a review. Higher ratings mean better visibility in search results, more job offers, and higher earnings potential.' },
]

const TESTIMONIALS = [
  { id:'t1', quote:'We had three quotes within an hour and picked the winner that afternoon.', name:'Lindsey R.', role:'Homeowner • Austin, TX' },
  { id:'t2', quote:'The instant alerts are the difference between being first or being too late.', name:'Marco D.', role:'HVAC Pro • Jersey City, NJ' },
  { id:'t3', quote:'Clear scope templates saved us so much back and forth.', name:'Priya K.', role:'Homeowner • Seattle, WA' },
]
