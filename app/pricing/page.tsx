'use client'
import React, { useState } from 'react'
import Link from 'next/link'

export default function PricingPage(){
  const [annual, setAnnual] = useState(true)

  // Pro Plus is the only paid subscription; homeowners & pros are free (success fee after completion)
  const price = (monthly:number)=> annual ? Math.round(monthly * 12 * 0.83) : monthly
  const per = annual ? '/yr' : '/mo'
  const saveTag = annual ? 'Save ~17%' : undefined

  return (
    <section className="section">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="card p-6">
          <h1 className="text-3xl font-bold text-ink">Pricing</h1>
          <p className="text-slate-700 mt-2">
            Homeowners and Pros use Rushr for <span className="font-semibold">free</span>.
            Pros pay a <span className="font-semibold">success fee</span> only after a completed job.
            <br className="hidden md:block" />
            Upgrade to <span className="font-semibold">Pro Plus</span> for priority access and advanced features.
          </p>

          {/* Billing toggle for Pro Plus */}
          <div className="mt-4 flex items-center gap-3">
            <span className={!annual ? 'font-semibold text-ink' : ''}>Monthly</span>
            <button
              type="button"
              onClick={()=>setAnnual(a=>!a)}
              className="relative inline-flex h-7 w-14 items-center rounded-full bg-slate-200"
              aria-pressed={annual}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition ${
                  annual ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={annual ? 'font-semibold text-ink' : ''}>Annual</span>
            {saveTag && <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{saveTag}</span>}
          </div>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-4 items-stretch">
          {/* Homeowner (Free) */}
          <div className="card p-6 h-full flex flex-col">
            <div className="text-sm font-semibold text-emerald-700">Homeowner</div>
            <h3 className="mt-1 text-xl font-semibold text-ink">Free</h3>
            <p className="text-sm text-slate-700 mt-1">Post jobs, receive bids, hire with confidence.</p>
            <ul className="mt-4 text-sm space-y-2">
              <li>• Post unlimited jobs</li>
              <li>• Chat with contractors</li>
              <li>• Photo & file uploads</li>
              <li>• No platform fees</li>
            </ul>
            <div className="mt-auto pt-4">
              <Link href="/post-job" className="btn-primary w-full text-center">Post a job</Link>
            </div>
          </div>

          {/* Pro (Free + success fee after completion) */}
          <div className="card p-6 h-full flex flex-col border-emerald-300">
            <div className="text-sm font-semibold text-emerald-700">Pro</div>
            <div className="mt-1 flex items-end gap-2">
              <h3 className="text-xl font-semibold text-ink">Free</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">Success fee on completed jobs</span>
            </div>
            <p className="text-sm text-slate-700 mt-1">
              Win work and pay nothing upfront. A success fee is applied only when a job completes.
            </p>
            <ul className="mt-4 text-sm space-y-2">
              <li>• Browse & filter jobs</li>
              <li>• Quick-bid templates</li>
              <li>• Saved searches & alerts</li>
              <li>• Profile & reviews</li>
            </ul>
            <div className="mt-auto pt-4">
              <Link href="/dashboard" className="btn btn-outline w-full text-center">Go to contractor dashboard</Link>
            </div>
          </div>

          {/* Pro Plus (Paid add-on) */}
          <div className="card p-6 h-full flex flex-col">
            <div className="text-sm font-semibold text-emerald-700">Pro Plus</div>
            <div className="mt-1 flex items-end gap-2">
              <h3 className="text-xl font-semibold text-ink">
                ${price(99)}
                <span className="text-sm text-slate-600">{per}</span>
              </h3>
            </div>
            <p className="text-sm text-slate-700 mt-1">
              Get priority access to new job opportunities and advanced professional tools.
            </p>
            <ul className="mt-4 text-sm space-y-2">
              <li>• Priority job notifications</li>
              <li>• Advanced search filters</li>
              <li>• Analytics dashboard</li>
              <li>• Priority support</li>
            </ul>
            <div className="mt-auto pt-4">
              <Link href="/pro" className="btn-primary w-full text-center">Upgrade to Pro Plus</Link>
            </div>
          </div>
        </div>

        {/* Success fee explainer */}
        <div className="card p-4">
          <div className="font-semibold text-ink">About the success fee</div>
          <p className="text-sm text-slate-700 mt-1">
            The success fee applies only after a job is marked complete and funds are released. No monthly costs, no pay-to-bid.
            Exact fee and payout timing appear at checkout for each job.
          </p>
        </div>

        {/* Footnote */}
        <div className="text-xs text-slate-500">
          Prices shown are indicative and may change. Taxes may apply. Annual reflects a discount vs. month-to-month.
        </div>
      </div>
    </section>
  )
}
