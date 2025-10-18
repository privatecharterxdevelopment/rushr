'use client'
export const dynamic = 'force-dynamic'

import React from 'react'
import { useApp } from '../../../lib/state'

const STAGES = ['New', 'Quoted', 'Won', 'Lost'] as const

export default function LeadsKanban() {
  // Use `any` locally so we don't have to change your global types
  const app = useApp() as any
  const state = (app?.state ?? {}) as any
  const moveLead: (id: string, next: (typeof STAGES)[number]) => void =
    typeof app?.moveLead === 'function' ? app.moveLead : () => {}

  // Safe array for leads
  const leads: Array<{
    id: string
    title: string
    zip?: string
    budget?: number
    stage?: (typeof STAGES)[number] | string
  }> = Array.isArray(state?.leads) ? state.leads : []

  return (
    <section className="section">
      <h1 className="text-xl font-semibold text-ink mb-3">Lead inbox</h1>

      <div className="grid md:grid-cols-4 gap-4">
        {STAGES.map((stage) => {
          const items = leads.filter((l) => l.stage === stage)
          return (
            <div key={stage} className="card p-3">
              <div className="font-medium mb-2">
                {stage} <span className="text-xs text-slate-500">({items.length})</span>
              </div>

              <div className="space-y-2 min-h-[160px]">
                {items.length === 0 ? (
                  <div className="text-xs text-slate-500 italic">No leads</div>
                ) : (
                  items.map((l) => (
                    <div key={l.id} className="rounded-xl border border-slate-200 p-3 bg-white">
                      <div className="font-medium">{l.title}</div>
                      <div className="text-xs text-slate-600">
                        ZIP {l.zip || '—'} • ${l.budget ?? '—'}
                      </div>
                      <div className="mt-2 flex gap-2 flex-wrap">
                        {STAGES.filter((s) => s !== stage).map((s) => (
                          <button
                            key={s}
                            className="btn btn-outline"
                            onClick={() => moveLead(l.id, s)}
                          >
                            → {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
