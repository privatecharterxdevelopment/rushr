'use client'
export const dynamic = 'force-dynamic'

import React, { useState } from 'react'
import { useApp } from '../../../lib/state'

export default function ServiceAreaSettings() {
  // Use loose local typing so we don't have to touch your global types
  const app = useApp() as any
  const state = (app?.state ?? {}) as any
  const addToast: (msg: string, t?: string) => void =
    typeof app?.addToast === 'function' ? app.addToast : () => {}

  // Safe defaults if contractorProfile is missing or partial
  const profile = (state?.contractorProfile ?? {}) as any
  const initialZips = Array.isArray(profile.serviceZips) ? profile.serviceZips.join(', ') : ''
  const initialFee =
    typeof profile.travelFee === 'number' && Number.isFinite(profile.travelFee)
      ? profile.travelFee
      : ''

  const [zips, setZips] = useState<string>(initialZips)
  const [fee, setFee] = useState<number | ''>(initialFee)

  return (
    <section className="section">
      <h1 className="text-xl font-semibold text-ink mb-3">Service area & travel</h1>

      <div className="card p-4">
        <label className="label">ZIP codes (comma separated)</label>
        <input
          className="input"
          value={zips}
          onChange={(e) => setZips(e.target.value)}
          placeholder="11215, 11217, 11201"
        />

        <label className="label mt-3">Travel fee (optional)</label>
        <input
          className="input"
          inputMode="numeric"
          value={fee}
          onChange={(e) => setFee(e.target.value ? Number(e.target.value) : '')}
          placeholder="e.g., 25"
        />

        <div className="mt-3 flex justify-end">
          <button
            className="btn-primary"
            onClick={() => addToast('Saved (demo)', 'success')}
          >
            Save
          </button>
        </div>
      </div>
    </section>
  )
}
