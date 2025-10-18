'use client'
export const dynamic = 'force-dynamic'

import React, { useState } from 'react'
import { useApp } from '../../../lib/state'

export default function IntegrationsSettings() {
  // Work with loose types locally so we don't need to change your context types
  const app = useApp() as any
  const state = (app?.state ?? {}) as any
  const addToast: (msg: string, t?: string) => void =
    typeof app?.addToast === 'function' ? app.addToast : () => {}

  // Safe defaults if settings are missing
  const integrations = (state?.signalsSettings?.integrations ?? {}) as any

  const [url, setUrl] = useState<string>(integrations.webhookUrl ?? '')
  const [zap, setZap] = useState<boolean>(Boolean(integrations.zapierEnabled))

  return (
    <section className="section">
      <h1 className="text-xl font-semibold text-ink mb-3">Integrations</h1>

      <div className="card p-4 space-y-3">
        <div>
          <label className="label">Webhook URL</label>
          <input
            className="input"
            placeholder="https://hooks.your-app.com/housecall"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            className="btn btn-outline mt-2"
            onClick={() => addToast('Test sent (demo)', 'info')}
          >
            Send test
          </button>
        </div>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={zap} onChange={(e) => setZap(e.target.checked)} />
          <span>Enable Zapier</span>
        </label>

        <div className="flex justify-end">
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
