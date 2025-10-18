'use client'
import React from 'react'
import Link from 'next/link'

type SignalLike = {
  id?: string
  signal_type?: 'INSPECTION'|'PERMIT'|'LICENSE'|'VIOLATION'|string
  title?: string
  description?: string
  category?: string
  address?: string
  city?: string
  state?: string
  estimated_value?: number
  urgency_score?: number
  signal_date?: string
  // Legacy support for old format
  type?: 'INSPECTION'|'PERMIT'|'LICENSE'|'VIOLATION'|string
  status?: string
  subject?: string
  jurisdiction?: string
  scope?: unknown
  occurredAt?: string
}

// A fully-normalized shape we actually render with
type NormalizedSignal = {
  id: string
  type: string
  title: string
  description: string
  category: string
  jurisdiction: string
  address: string
  estimated_value: number
  urgency_score: number
  signal_date: string
}

/** Normalize weird shapes coming from state / mock data */
function normalizeSignal(s: any): NormalizedSignal {
  // Support both new database format and legacy format
  const title = String(s?.title ?? s?.subject ?? 'Signal Update')
  const description = String(s?.description ?? '')
  const category = String(s?.category ?? '')
  const type = String(s?.signal_type ?? s?.type ?? 'EVENT').toUpperCase()
  const address = String(s?.address ?? '')
  const estimated_value = Number(s?.estimated_value ?? 0)
  const urgency_score = Number(s?.urgency_score ?? 50)
  const signal_date = String(s?.signal_date ?? s?.occurredAt ?? '')

  // Build jurisdiction from city/state or use legacy jurisdiction
  let jurisdiction = String(s?.jurisdiction ?? '')
  if (!jurisdiction && (s?.city || s?.state)) {
    jurisdiction = [s?.city, s?.state].filter(Boolean).join(', ')
  }

  return {
    id: String(s?.id ?? ''),
    type,
    title,
    description,
    category,
    jurisdiction,
    address,
    estimated_value,
    urgency_score,
    signal_date
  }
}

function prettyDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso // show raw if not a date
  return d.toLocaleString(undefined, { year:'numeric', month:'short', day:'2-digit', hour:'2-digit', minute:'2-digit' })
}

function typeBadgeClr(t: string) {
  switch ((t || '').toUpperCase()) {
    case 'INSPECTION': return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'PERMIT':     return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'LICENSE':    return 'bg-sky-100 text-sky-800 border-sky-200'
    case 'VIOLATION':  return 'bg-rose-100 text-rose-800 border-rose-200'
    default:           return 'bg-slate-100 text-slate-800 border-slate-200'
  }
}

export default function SignalsCard({ s }: { s: SignalLike | any }) {
  const sig = normalizeSignal(s)

  const hasEmergency = sig.urgency_score >= 80 || /emergency|urgent|priority/i.test(`${sig.title} ${sig.description} ${sig.category}`)
  const badgeClr = typeBadgeClr(sig.type)

  return (
    <article className="card p-4 space-y-2">
      <div className="flex items-start gap-2">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium ${badgeClr}`}>
          {sig.type}
        </span>
        {sig.category ? (
          <span className="badge">{sig.category}</span>
        ) : null}
        {hasEmergency ? (
          <span className="badge bg-rose-600 text-white border-rose-600">High Priority</span>
        ) : null}
        <div className="ml-auto text-xs text-slate-500">{prettyDate(sig.signal_date)}</div>
      </div>

      <div className="text-sm text-slate-900 font-medium">
        {sig.title}
      </div>

      {sig.description ? (
        <div className="text-xs text-slate-600">
          {sig.description}
        </div>
      ) : null}

      {(sig.address || sig.jurisdiction) ? (
        <div className="text-xs text-slate-600">
          {sig.address ? <span>{sig.address}</span> : null}
          {sig.address && sig.jurisdiction ? <span> • </span> : null}
          {sig.jurisdiction ? <span>{sig.jurisdiction}</span> : null}
        </div>
      ) : null}

      {/* Signal value and urgency */}
      <div className="flex items-center gap-3 pt-2">
        {sig.estimated_value > 0 ? (
          <span className="text-xs font-medium text-green-600">
            Est. ${sig.estimated_value.toLocaleString()}
          </span>
        ) : null}
        <span className={`text-xs px-2 py-1 rounded-full ${
          sig.urgency_score >= 80 ? 'bg-red-100 text-red-700' :
          sig.urgency_score >= 60 ? 'bg-yellow-100 text-yellow-700' :
          'bg-green-100 text-green-700'
        }`}>
          Urgency: {sig.urgency_score}/100
        </span>
      </div>

      {/* Optional actions row (safe no-ops / links) */}
      <div className="pt-2 flex items-center gap-2">
        <Link href="/pro/signals/rules/new" className="btn btn-outline">Create rule</Link>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => {
            if (typeof window !== 'undefined') alert('Signal details would open here')
          }}
        >
          View details
        </button>
      </div>
    </article>
  )
}
