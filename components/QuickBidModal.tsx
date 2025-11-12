'use client'
import React, { useState } from 'react'
import { useProAuth } from '../contexts/ProAuthContext'
import { supabase } from '../lib/supabaseClient'
import Link from 'next/link'

export default function QuickBidModal({
  open, onClose, jobId, category
}:{ open:boolean; onClose:()=>void; jobId:string; category:string }){
  const { user, contractorProfile } = useProAuth()
  const [price, setPrice] = useState<number | ''>('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDuplicate, setIsDuplicate] = useState(false)

  const send = async () => {
    if (!price || !user || !contractorProfile || submitting) return

    setSubmitting(true)
    setError(null)
    setIsDuplicate(false)

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
        // Check if it's a duplicate bid error
        if (error.message.includes('duplicate key') || error.message.includes('job_bids_job_id_contractor_id_key')) {
          setIsDuplicate(true)
          setError('You have already submitted a bid for this job')
        } else {
          setError(error.message)
        }
        return
      }

      // Success - close modal and reset form
      setPrice('')
      setMessage('')
      onClose()
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to submit bid'

      // Check if it's a duplicate bid error
      if (errorMsg.includes('duplicate key') || errorMsg.includes('job_bids_job_id_contractor_id_key')) {
        setIsDuplicate(true)
        setError('You have already submitted a bid for this job')
      } else {
        setError(errorMsg)
      }
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
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="text-yellow-600 mt-0.5">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-yellow-900 mb-1">{error}</div>
                {isDuplicate && (
                  <div className="text-sm text-yellow-700 mt-2">
                    <p className="mb-2">Your bid is awaiting approval from the homeowner.</p>
                    <Link
                      href="/dashboard/contractor/messages"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium hover:underline"
                      onClick={onClose}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Open chat to message homeowner
                    </Link>
                  </div>
                )}
              </div>
            </div>
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
            disabled={!price || submitting || isDuplicate}
          >
            {submitting ? 'Submitting...' : 'Send bid'}
          </button>
        </div>
      </div>
    </div>
  )
}
