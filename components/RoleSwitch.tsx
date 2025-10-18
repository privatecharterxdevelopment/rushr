'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function RoleSwitch(){
  const p = usePathname()
  const homeActive = p === '/how-it-works'
  const proActive  = p.startsWith('/find-work/how-it-works')

  const Btn = ({href, active, children}:{href:string; active:boolean; children:React.ReactNode}) => (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-full text-sm transition
        ${active
          ? 'bg-emerald-600 text-white shadow-soft'
          : 'bg-white/80 text-slate-700 ring-1 ring-slate-200 hover:bg-emerald-50'
        } dark:${active ? 'bg-emerald-700 text-white' : 'bg-slate-900/60 text-slate-200 ring-slate-700 hover:bg-slate-800'}`}
    >
      {children}
    </Link>
  )

  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-white/60 ring-1 ring-slate-200 p-1
                    dark:bg-slate-900/40 dark:ring-slate-800">
      <Btn href="/how-it-works" active={homeActive}>For Homeowners</Btn>
      <Btn href="/find-work/how-it-works" active={proActive}>For Contractors</Btn>
    </div>
  )
}
