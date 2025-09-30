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
              Pros get Signals to respond to emergencies first.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/post-job" className="btn-primary">Post a job</Link>
              <Link href="/find-pro" className="btn btn-outline">Find a pro</Link>
              <Link href="/signals" className="btn btn-ghost">Signals for pros</Link>
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
                Make home projects simple and transparent for everyone. Rushr reduces
                back-and-forth, standardizes quotes, and gives pros the tools to respond fast.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <ValueItem icon={<IconLightning className="h-5 w-5 text-emerald-700" />} title="Speed with substance">
                  Post in minutes, quote in minutes — without losing detail.
                </ValueItem>
                <ValueItem icon={<IconScale className="h-5 w-5 text-emerald-700" />} title="Fairness for both sides">
                  Homeowners pay 0. Pros pay a small success fee only when they win.
                </ValueItem>
                <ValueItem icon={<IconLock className="h-5 w-5 text-emerald-700" />} title="Privacy by default">
                  Your contact details stay private until you choose to share.
                </ValueItem>
                <ValueItem icon={<IconTarget className="h-5 w-5 text-emerald-700" />} title="No junk leads">
                  Signals and filters keep noise out so pros focus on fit.
                </ValueItem>
              </div>
            </div>

            <div className="relative">
              <div className="mx-auto max-w-md rounded-2xl border bg-white p-4 shadow-soft dark:bg-slate-900 dark:border-slate-800">
                <div className="rounded-lg border bg-slate-50 p-3 dark:bg-slate-800 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-slate-500">Quotes</div>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Demo</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="h-10 rounded-md bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700" />
                    <div className="h-10 rounded-md bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700" />
                    <div className="h-10 rounded-md bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700" />
                  </div>
                  <div className="mt-3 flex items-center justify-end">
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">Compare</span>
                  </div>
                </div>
              </div>
              <div className="pointer-events-none absolute -left-6 -top-6 h-36 w-36 rounded-full bg-emerald-100/60 blur-2xl" />
            </div>
          </div>
        </div>
      </section>

{/* ===== How it works (exact pill slider) ===== */}
<section className="bg-white">
  <div className="container-max py-10 md:py-14">
    <h2 className="text-center text-2xl font-semibold text-ink dark:text-white">How it works</h2>
    <div className="mt-4">
      <HowItWorksSlider />
    </div>
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

      {/* ===== Business model (aligned checks/bullets) ===== */}
      <section className="relative">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white to-emerald-50/40" />
        <div className="container-max py-10 md:py-14">
          <h3 className="text-center text-2xl font-semibold text-ink dark:text-white">How we make money</h3>
          <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-slate-700 dark:text-slate-300">
            Rushr is free for homeowners. Contractors use the platform for free and pay a small success fee after a completed job.
            Signals is an optional subscription for instant alerts.
          </p>

          <div className="mx-auto mt-6 max-w-3xl overflow-hidden rounded-2xl border bg-white shadow-soft dark:bg-slate-900 dark:border-slate-800">
            <div className="grid grid-cols-2 text-sm">
              <div className="p-5">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1 text-[12px] font-semibold text-emerald-700">
                  <IconHome className="h-4 w-4" /> Homeowners
                </div>
                <AlignedList
                  items={[
                    { good: true,  label: 'Post jobs, message, hire' },
                    { good: true,  label: 'No fees for posting or hiring' },
                    { good: false, label: 'Optional tips for great work' },
                  ]}
                />
              </div>
              <div className="border-l p-5 dark:border-slate-800">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1 text-[12px] font-semibold text-emerald-700">
                  <IconBriefcase className="h-4 w-4" /> Contractors
                </div>
                <AlignedList
                  items={[
                    { good: true,  label: 'Quote free, chat free' },
                    { good: true,  label: 'Success fee only when you win' },
                    { good: false, label: 'Signals optional subscription' },
                  ]}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Testimonials (scroll) ===== */}
      <section className="section">
        <div className="card p-6 md:p-8">
          <h2 className="text-lg font-semibold text-ink dark:text-white">What people say</h2>
          <div className="mt-4 flex gap-4 overflow-x-auto snap-x pb-2">
            {TESTIMONIALS.map(t => (
              <Testimonial key={t.id} quote={t.quote} name={t.name} role={t.role} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== Contact (wide slab) ===== */}
<section className="section">
  <div className="rounded-2xl border bg-gradient-to-br from-emerald-50 via-white to-white p-6 md:p-8 shadow-soft dark:from-emerald-900/20 dark:via-slate-900 dark:to-slate-900 dark:border-slate-800">
    <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-2.5 py-1 text-[12px] font-semibold text-emerald-800">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
            <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth="2"/>
            <path strokeWidth="2" d="M3 7l9 6 9-6"/>
          </svg>
          Contact us
        </div>
        <h3 className="mt-2 text-xl font-semibold text-ink dark:text-white">We’re here to help</h3>
        <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
          Questions about a job, quotes, or Signals? Reach the team directly.
        </p>
      </div>

      <div className="flex flex-col items-start gap-2 text-sm">
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
        <div className="card p-6 md:p-8">
          <h2 className="text-lg font-semibold text-ink dark:text-white">FAQ</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Need more help? <Link href="/contact" className="text-emerald-700 font-semibold hover:text-emerald-800">Contact support</Link>.
          </p>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {FAQ_ITEMS.map((it) => (
              <FAQ key={it.q} q={it.q}>{it.a}</FAQ>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="section">
        <div className="card p-8 md:p-10 text-center">
          <h3 className="text-xl md:text-2xl font-semibold text-ink dark:text-white">
            Ready to try Rushr?
          </h3>
          <p className="mt-2 text-slate-700 dark:text-slate-300">
            Post your project or start winning jobs with Signals.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Link href="/post-job" className="btn-primary">Post a job</Link>
            <Link href="/jobs" className="btn btn-outline">Browse jobs</Link>
            <Link href="/signals" className="btn btn-ghost">Signals for pros</Link>
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
    <div className="flex items-start gap-3 rounded-xl border p-3 bg-white dark:bg-slate-900 dark:border-slate-800">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50">
        {icon}
      </div>
      <div>
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
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}><path strokeWidth="2" d="M3 12l9-7 9 7"/><path strokeWidth="2" d="M9 21V9h6v12"/></svg>)
}
function IconBriefcase(props: React.SVGProps<SVGSVGElement>) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}><rect x="3" y="7" width="18" height="12" rx="2" strokeWidth="2"/><path strokeWidth="2" d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2"/><path strokeWidth="2" d="M3 12h18"/></svg>)
}
function IconCheck(props: React.SVGProps<SVGSVGElement>) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}><path strokeWidth="2" d="M20 6L9 17l-5-5"/></svg>)
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

const FAQ_ITEMS = [
  { q: 'What is Rushr?', a: 'Rushr connects homeowners with local, verified contractors. Post your job, compare quotes, and manage everything in one place.' },
  { q: 'Is Rushr free to use for homeowners?', a: 'Yes. Posting jobs, chatting with pros, and receiving quotes is 100 percent free.' },
  { q: 'How do pros get work on Rushr?', a: 'Contractors can browse jobs in their trade and service area, or get matched instantly when homeowners post a job.' },
  { q: 'How do I know contractors are trustworthy?', a: 'Every pro maintains a public profile with ratings, past work photos, and verification badges. You can review before you hire.' },
  { q: 'Can I share photos or videos of my project?', a: 'Yes. Attach them in messages to help pros quote more accurately and save time on site.' },
  { q: 'What is Rushr Signals?', a: 'Signals is our real time alert system. Contractors get notified about permits, violations, or inspections in their area before anyone else.' },
  { q: 'Do I have to accept the first quote I get?', a: 'No. You can accept, decline, or request changes. You are always in control.' },
  { q: 'How do contractors pay for Rushr?', a: 'Contractors do not pay per lead. Rushr charges a small success fee only when work is secured through the platform.' },
  { q: 'How quickly will I get quotes?', a: 'Many homeowners see first responses within minutes. For urgent jobs, use the Emergency tag to alert nearby pros.' },
  { q: 'Can I hire a pro outside of Rushr?', a: 'We strongly encourage keeping the project on platform. It keeps your messages, quotes, and agreements organized, and helps keep the service free for homeowners.' },
  { q: 'How does Rushr handle my personal data?', a: 'Your contact details stay private. Pros message you directly through the platform until you choose to share more.' },
  { q: 'Can pros filter jobs by type and location?', a: 'Yes. Contractors set their trade, service radius, and preferences to only see relevant leads.' },
  { q: 'What if a job does not go as planned?', a: 'Use the built in messaging and quote history as a record. We encourage transparent communication and can provide support if issues arise.' },
  { q: 'How do ratings work?', a: 'After each job, homeowners leave a 1 to 5 star rating and optional review. Higher rated pros appear more prominently in search and featured lists.' },
]

const TESTIMONIALS = [
  { id:'t1', quote:'We had three quotes within an hour and picked the winner that afternoon.', name:'Lindsey R.', role:'Homeowner • Austin, TX' },
  { id:'t2', quote:'Signals is the difference between saw it late and won it.', name:'Marco D.', role:'HVAC Pro • Jersey City, NJ' },
  { id:'t3', quote:'Clear scope templates saved us so much back and forth.', name:'Priya K.', role:'Homeowner • Seattle, WA' },
]
