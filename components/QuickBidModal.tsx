'use client'
import React, { useState } from 'react'
import { useProAuth } from '../contexts/ProAuthContext'
import { supabase } from '../lib/supabaseClient'

export default function QuickBidModal({
  open, onClose, jobId, category
}:{ open:boolean; onClose:()=>void; jobId:string; category:string }){
  const { user, contractorProfile } = useProAuth()
  const [price, setPrice] = useState<number | ''>('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = async () => {
    if (!price || !user || !contractorProfile || submitting) return

    setSubmitting(true)
    setError(null)

    try {
      const { error } = await supabase.rpc('submit_job_bid', {
        p_job_id: jobId,
        p_contractor_id: user.id,
        p_bid_amount: Number(price),
        p_description: message || `Fixed bid for $${price}`,
        p_estimated_duration_hours: null,
        p_available_date: null,
        p_materials_included: false,
        p_warranty_months: 12
      })

      if (error) {
        setError(error.message)
        return
      }

      // Success - close modal and reset form
      setPrice('')
      setMessage('')
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to submit bid')
    } finally {
      setSubmitting(false)
    }
  }

  if(!open) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="card p-6 w-full max-w-lg">
        <div className="text-xl font-semibold text-ink">Quick bid</div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <label className="label mt-3">Price (USD)</label>
        <input className="input" inputMode="numeric" value={price} onChange={e=>setPrice(e.target.value ? Number(e.target.value) : '')}/>

        <label className="label mt-3">Message</label>
        <textarea className="input min-h-[120px]" value={message} onChange={e=>setMessage(e.target.value)} placeholder="Short scope & timeline" />

        <div className="mt-4 flex justify-end gap-2">
          <button className="btn btn-outline" onClick={onClose} disabled={submitting}>Cancel</button>
          <button
            className="btn-primary"
            onClick={send}
            disabled={!price || submitting}
          >
            {submitting ? 'Submitting...' : 'Send bid'}
          </button>
        </div>
      </div>
    </div>
  )
}
