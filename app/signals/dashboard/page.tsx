'use client'
import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useProAuth } from '../../../contexts/ProAuthContext'
import { supabase } from '../../../lib/supabaseClient'
import SignalsCard from '../../../components/SignalsCard'

type SignalType = 'INSPECTION'|'PERMIT'|'LICENSE'|'VIOLATION'
type TypeFilter = 'ALL'|SignalType

interface Signal {
  id: string
  title: string
  description: string
  signal_type: string
  category: string
  address: string
  city: string
  state: string
  zip_code: string
  estimated_value: number
  urgency_score: number
  is_active: boolean
  signal_date: string
  created_at: string
}

export default function SignalsDashboard(){
  const { user } = useProAuth()
  const [signals, setSignals] = useState<Signal[]>([])
  const [loading, setLoading] = useState(true)
  const [lastSeen, setLastSeen] = useState('')

  const [q, setQ] = useState<string>('')
  const [type, setType] = useState<TypeFilter>('ALL')
  const [juris, setJuris] = useState<'ALL'|string>('ALL')

  // Fetch signals from database
  useEffect(() => {
    const fetchSignals = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from('signals')
          .select('*')
          .eq('is_active', true)
          .order('signal_date', { ascending: false })

        if (error) {
          console.error('Error fetching signals:', error)
          return
        }

        setSignals(data || [])
      } catch (err) {
        console.error('Error fetching signals:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSignals()
  }, [user])

  // build jurisdictions from data (strings only)
  const jurisdictions = useMemo(()=>{
    const set = new Set<string>()
    for (const s of signals) {
      const jurisdiction = s.city && s.state ? `${s.city}, ${s.state}` : s.city || s.state || ''
      if (jurisdiction) set.add(jurisdiction)
    }
    return ['ALL', ...Array.from(set)]
  }, [signals])

  // apply filters (defensively coerce to strings)
  const list = useMemo(()=>{
    let arr = [...signals]

    if (type !== 'ALL') {
      arr = arr.filter(s => s?.signal_type?.toUpperCase() === type)
    }

    if (juris !== 'ALL') {
      arr = arr.filter(s => {
        const jurisdiction = s.city && s.state ? `${s.city}, ${s.state}` : s.city || s.state || ''
        return jurisdiction === juris
      })
    }

    if (q) {
      const qq = String(q).toLowerCase()
      arr = arr.filter(s => {
        const title = String(s?.title ?? '').toLowerCase()
        const address = String(s?.address ?? '').toLowerCase()
        const description = String(s?.description ?? '').toLowerCase()
        const category = String(s?.category ?? '').toLowerCase()
        return title.includes(qq) || address.includes(qq) || description.includes(qq) || category.includes(qq)
      })
    }

    // sort by signal_date
    arr.sort((a,b) => new Date(b?.signal_date ?? '').getTime() - new Date(a?.signal_date ?? '').getTime())
    return arr
  }, [signals, q, type, juris])

  // count new since last visit
  const newSince = useMemo(()=>{
    if (!lastSeen) return signals.length
    return signals.filter(s => String(s?.signal_date ?? '') > String(lastSeen)).length
  }, [signals, lastSeen])

  // export CSV of current view
  const exportCSV = ()=>{
    const rows = [
      ['Type','Title','Description','Category','Jurisdiction','Address','Estimated Value','Urgency Score','Signal Date'],
      ...list.map(s => {
        const jurisdiction = s.city && s.state ? `${s.city}, ${s.state}` : s.city || s.state || ''
        return [
          String(s?.signal_type ?? ''),
          String(s?.title ?? ''),
          String(s?.description ?? ''),
          String(s?.category ?? ''),
          jurisdiction,
          String(s?.address ?? ''),
          String(s?.estimated_value ?? ''),
          String(s?.urgency_score ?? ''),
          String(s?.signal_date ?? '')
        ]
      })
    ]
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'rushr-signals.csv'; a.click(); URL.revokeObjectURL(url)
  }

  const reset = ()=>{ setQ(''); setType('ALL'); setJuris('ALL') }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading signals...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Required</h2>
          <p className="text-gray-600">Please sign in to view signals dashboard.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Sticky subheader */}
      <div className="sticky top-[64px] md:top-[68px] z-20 bg-white/85 backdrop-blur border-b border-slate-100">
        <div className="container-max py-3 flex flex-wrap items-center gap-3">
          <h1 className="text-lg font-semibold text-ink">Signals Feed</h1>
          <span className="badge">New since last visit: {newSince}</span>
          <span className="badge">Showing: {list.length}</span>
          <div className="ml-auto flex gap-2">
            <Link href="/pro/signals/rules/new" className="btn btn-outline">Create rule</Link>
            <button className="btn-primary" onClick={exportCSV}>Export CSV</button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <section className="section">
        <div className="card p-4 grid md:grid-cols-5 gap-2">
          <input
            className="input md:col-span-2"
            placeholder="Search title, address, description, or category"
            value={q}
            onChange={e=>setQ(e.target.value)}
          />
          <select className="input" value={type} onChange={e=>setType(e.target.value as TypeFilter)}>
            <option value="ALL">All events</option>
            <option value="INSPECTION">Inspection</option>
            <option value="PERMIT">Permit</option>
            <option value="LICENSE">License</option>
            <option value="VIOLATION">Violation</option>
          </select>
          <select className="input" value={juris} onChange={e=>setJuris(e.target.value as any)}>
            {jurisdictions.map(j => <option key={j} value={j}>{j}</option>)}
          </select>
          <button className="btn btn-outline" onClick={reset}>Reset</button>
        </div>

        {/* Results */}
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {list.map(s => <SignalsCard key={String(s?.id ?? Math.random())} s={s} />)}
        </div>
        {list.length===0 && (
          <div className="card p-6 text-center text-slate-600 mt-4">No events match your filters.</div>
        )}
      </section>
    </div>
  )
}
