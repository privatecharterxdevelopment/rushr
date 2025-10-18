'use client'
export const dynamic = 'force-dynamic'

import React, { useMemo, useState } from 'react'
import { useApp } from '../../../lib/state'

const PRICES = (n: number) => (n === 0 ? 0 : n === 1 ? 79 : n === 2 ? 129 : 179)

export default function SignalsUpgrade() {
  const app = useApp() as any
  const state = (app?.state ?? {}) as any
  const addToast: ((m: string, t?: string) => void) | undefined = app?.addToast

  // Safely read settings -> bundles -> jurisdictions
  const settings = (state?.signalsSettings ?? {}) as any
  const bundles = (settings?.bundles ?? {}) as any
  const initialSel: string[] = Array.isArray(bundles.jurisdictions) ? bundles.jurisdictions : []

  const ALL = ['NYC', 'Westchester', 'Nassau', 'Suffolk', 'NJ-North', 'NJ-Central']
  const [sel, setSel] = useState<string[]>(initialSel)
  const price = useMemo(() => PRICES(sel.length), [sel])

  const toggle = (j: string) => {
    setSel(s => (s.includes(j) ? s.filter(x => x !== j) : [...s, j]))
  }

  return (
    <section className="section">
      <h1 className="text-xl font-semibold text-ink mb-3">Signals bundles</h1>
      <div className="card p-4">
        <div className="text-sm mb-2">Choose jurisdictions to monitor:</div>
        <div className="flex flex-wrap gap-2">
          {ALL.map(j => (
            <button
              key={j}
              onClick={() => toggle(j)}
              className={`px-3 py-1 rounded-full border ${
                sel.includes(j)
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'border-slate-300 hover:bg-slate-50'
              }`}
            >
              {j}
            </button>
          ))}
        </div>
        <div className="mt-4 text-lg">
          Price: <span className="font-semibold">${price}/mo</span>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            className="btn-primary"
            onClick={() => addToast?.('Updated (demo)')}
          >
            Update plan
          </button>
        </div>
      </div>
    </section>
  )
}
