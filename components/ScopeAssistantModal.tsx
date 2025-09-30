'use client'
import React, { useMemo, useState } from 'react'
import { useApp } from '../lib/state'

export default function ScopeAssistantModal({
  open, onClose, onInsert, category, description
}:{ open:boolean; onClose:()=>void; onInsert:(scope:string)=>void; category:string; description:string }){
  const { addToast } = useApp()
  const [photos, setPhotos] = useState<File[]>([])
  const [notes, setNotes] = useState('')

  const suggestions = useMemo(()=>{
    const c = category || 'General'
    const base = [
      `Confirm problem and affected areas`,
      `List materials & parts required`,
      `Include cleanup and haul-away`,
      `Warranty terms and follow-up`
    ]
    if(/HVAC/i.test(c)) base.unshift('Diagnose no-cool / low airflow; check capacitor & refrigerant')
    if(/Plumb/i.test(c)) base.unshift('Check supply/Drain lines; replace P-trap/washer if needed')
    if(/Electric/i.test(c)) base.unshift('Test circuits; inspect panel; replace breaker if faulty')
    return base
  },[category])

  const generate = ()=>{
    const bullets = [
      `Scope for ${category || 'project'}:`,
      ...(description ? [`Context: ${description}`] : []),
      ...suggestions.map(s => `• ${s}`),
      ...(notes ? [`Notes: ${notes}`] : []),
      ...(photos.length>0 ? [`Attachments: ${photos.length} photo(s) included`] : [])
    ].join('\n')
    onInsert(bullets)
    addToast('Scope inserted')
    onClose()
  }

  if(!open) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="card p-6 w-full max-w-lg">
        <div className="text-xl font-semibold text-ink">AI Scope Assistant</div>
        <p className="text-sm text-slate-600 mt-1">Answer a couple prompts and we’ll draft a clean, contractor-ready scope.</p>

        <label className="label mt-4">Add photos (optional)</label>
        <input type="file" multiple accept="image/*" onChange={e=>setPhotos(Array.from(e.target.files||[]))} className="input"/>

        <label className="label mt-3">Extra details (optional)</label>
        <textarea className="input min-h-[100px]" placeholder="Any constraints, preferences, brand/models…" value={notes} onChange={e=>setNotes(e.target.value)} />

        <div className="mt-4 flex justify-end gap-2">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={generate}>Insert scope</button>
        </div>
      </div>
    </div>
  )
}
