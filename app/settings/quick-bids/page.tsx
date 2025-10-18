'use client'
import React, { useState } from 'react'
import { useApp } from '../../../lib/state'

export default function QuickBidsSettings(){
  const { state, addTemplate } = useApp()
  const [name, setName] = useState('')
  const [category, setCategory] = useState('HVAC')
  const [body, setBody] = useState('')
  const [price, setPrice] = useState<number|''>('')

  return (
    <section className="section">
      <h1 className="text-xl font-semibold text-ink mb-3">Quick-bid templates</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-4">
          <div className="font-medium mb-2">New template</div>
          <label className="label">Name</label>
          <input className="input" value={name} onChange={e=>setName(e.target.value)} />
          <label className="label mt-2">Category</label>
          <select className="input" value={category} onChange={e=>setCategory(e.target.value)}>
            {state.categories.map(c => <option key={c}>{c}</option>)}
          </select>
          <label className="label mt-2">Body</label>
          <textarea className="input min-h-[120px]" value={body} onChange={e=>setBody(e.target.value)} />
          <label className="label mt-2">Default price</label>
          <input className="input" inputMode="numeric" value={price} onChange={e=>setPrice(e.target.value?Number(e.target.value):'')} />
          <div className="mt-3 flex justify-end">
            <button className="btn-primary" onClick={()=>{
              if(!name||!body) return
              addTemplate({ name, category, body, defaultPrice: price ? Number(price) : undefined })
              setName(''); setBody(''); setPrice('')
            }}>Save template</button>
          </div>
        </div>

        <div className="card p-4">
          <div className="font-medium mb-2">Your templates</div>
          <ul className="space-y-2">
            {state.contractorProfile.templates.map(t=>(
              <li key={t.id} className="rounded-xl border border-slate-100 p-3">
                <div className="font-medium">{t.name} <span className="text-xs text-slate-500">({t.category})</span></div>
                <div className="text-sm text-slate-700 mt-1">{t.body}</div>
                {t.defaultPrice && <div className="text-sm mt-1">Default: ${t.defaultPrice}</div>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
