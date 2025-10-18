'use client'
import React from 'react'
import { useApp } from '../../../lib/state'

export default function CalendarSettings(){
  const { state, addToast } = useApp()
  const url = state.contractorProfile.calendarICS || 'https://example.com/housecall.ics'
  return (
    <section className="section">
      <h1 className="text-xl font-semibold text-ink mb-3">Calendar</h1>
      <div className="card p-4 space-y-3">
        <div className="text-sm">Subscribe to your Rushr availability feed (read-only):</div>
        <code className="block p-2 rounded bg-slate-100 text-xs break-all">{url}</code>
        <button className="btn-primary" onClick={()=>addToast('Copied (demo)')}>Copy link</button>
      </div>
    </section>
  )
}
