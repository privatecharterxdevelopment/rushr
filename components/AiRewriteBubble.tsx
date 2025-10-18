// components/AiRewriteBubble.tsx
'use client'
import React, { useMemo, useState } from 'react'

type Props = {
  value: string
  onApply: (next: string) => void
  context?: Record<string, any>
}

/* Lightweight local rewrite stub (swap later for real API) */
function rewriteLocal(src: string, ctx?: Record<string, any>) {
  let s = (src || '').trim()
  if (!s) return s
  s = s.replace(/\s+/g, ' ')
       .replace(/(^\w|\.\s+\w)/g, (m) => m.toUpperCase())
       .replace(/\bA\/C\b/gi, 'AC')
       .replace(/\bETA\b/gi, 'estimated time')
       .replace(/\bASAP\b/gi, 'as soon as possible')
  if (ctx?.businessName && !s.toLowerCase().includes(String(ctx.businessName).toLowerCase())) {
    s = `${ctx.businessName}: ${s}`
  }
  return s
}

/* Exact black spark icon */
function BlackSpark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12 1l3 8 8 3-8 3-3 8-3-8-8-3 8-3 3-8z" />
    </svg>
  )
}

export default function AiRewriteBubble({ value, onApply, context }: Props) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(value || '')
  const initDraft = useMemo(() => (value || ''), [value])
  const canRewrite = (draft || '').trim().length > 0

  const apply = () => { onApply(rewriteLocal(draft, context)); setOpen(false) }

  return (
    /* Sits INSIDE the input frame and is clipped by it */
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute bottom-2 right-2 pointer-events-auto">
        {/* Circle -> pill on hover */}
        <button
          type="button"
          aria-label="Rewrite with AI"
          onClick={() => { setDraft(initDraft); setOpen(v => !v) }}
          className="
            group relative flex items-center
            h-9 w-9 hover:w-44
            rounded-full bg-white/95 border border-slate-200 shadow-soft
            transition-all overflow-hidden outline-none focus:outline-none
            leading-none
          "
        >
          {/* ICON WRAP — perfectly centers the icon */}
          <span className="h-9 w-9 flex items-center justify-center text-black leading-none shrink-0">
            <BlackSpark className="h-4 w-4 block pointer-events-none" />
          </span>

          {/* Slide-in label */}
          <span
  className="
    h-9 flex items-center justify-center
    px-3 text-xs text-slate-700 text-center leading-none
    whitespace-nowrap
    opacity-0 translate-x-2
    group-hover:opacity-100 group-hover:translate-x-0
    transition-all
  "
>
  Rewrite with AI
</span>
        </button>

        {/* Panel */}
        {open && (
          <div
            className="
              absolute bottom-11 right-0
              w-[min(360px,calc(100%-0.5rem))] max-w-[calc(100%-0.5rem)]
              rounded-2xl border border-slate-200 bg-white shadow-xl p-3
            "
          >
            <div className="text-xs font-semibold text-slate-800 mb-1">AI rewrite</div>
            <textarea
              className="input min-h-[90px]"
              value={draft}
              onChange={(e)=>setDraft(e.target.value)}
              placeholder="We’ll tidy up your description for clarity and tone…"
            />
            <div className="mt-2 flex items-center gap-2 justify-end">
              <button type="button" className="btn btn-outline" onClick={()=>setOpen(false)}>Cancel</button>
              <button
                type="button"
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!canRewrite}
                onClick={apply}
              >
                Rewrite & Apply
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
