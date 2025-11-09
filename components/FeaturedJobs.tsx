'use client'
import React, { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import JobCard from './JobCard'

interface FeaturedJob {
  id: string
  title: string
  description: string
  category: string
  budget_min: number | null
  budget_max: number | null
  priority: string
  created_at: string
  location: string | null
}

export default function FeaturedJobs(){
  const [list, setList] = useState<FeaturedJob[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFeaturedJobs = async () => {
      try {
        const { data, error } = await supabase
          .from('homeowner_jobs')
          .select('id, title, description, category, budget_min, budget_max, priority, created_at, location')
          .eq('status', 'open')
          .order('created_at', { ascending: false })
          .limit(6)

        if (error) {
          console.error('Error fetching featured jobs:', error)
          return
        }

        setList(data || [])
      } catch (err) {
        console.error('Error fetching featured jobs:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedJobs()
  }, [])
  const viewportRef = useRef<HTMLDivElement>(null)

  const [paused, setPaused] = useState(false)
  const [pageSize, setPageSize] = useState(2)
  const [page, setPage] = useState(0)

  useEffect(()=>{
    const sync = ()=>{
      const twoUp = window.matchMedia('(min-width: 768px)').matches
      setPageSize(twoUp ? 2 : 1)
    }
    sync()
    window.addEventListener('resize', sync)
    return ()=>window.removeEventListener('resize', sync)
  },[])

  const pages = Math.max(1, Math.ceil(list.length / pageSize))

  const goTo = (p:number)=>{
    const el = viewportRef.current
    if(!el) return
    const slides = Array.from(el.querySelectorAll<HTMLElement>('.carousel-slide'))
    const idx = p * pageSize
    const target = slides[idx]
    if(target){
      el.scrollTo({ left: target.offsetLeft, behavior: 'smooth' })
      setPage(p)
    }
  }

  const next = ()=> goTo((page + 1) % pages)
  const prev = ()=> goTo((page - 1 + pages) % pages)

  useEffect(()=>{
    const id = window.setInterval(()=>{ if(!paused) next() }, 4000)
    return ()=> window.clearInterval(id)
  }, [paused, page, pages, pageSize])

  if (loading) {
    return (
      <section className="section">
        <h2 className="text-xl font-semibold text-ink mb-3">Featured jobs</h2>
        <div className="flex items-center justify-center py-8">
          <img
            src="https://jtrxdcccswdwlritgstp.supabase.co/storage/v1/object/public/contractor-logos/RushrLogoAnimation.gif"
            alt="Loading..."
            className="w-6 h-6 object-contain"
          />
          <span className="ml-2 text-gray-600">Loading jobs...</span>
        </div>
      </section>
    )
  }

  if (list.length === 0) {
    return (
      <section className="section">
        <h2 className="text-xl font-semibold text-ink mb-3">Featured jobs</h2>
        <div className="text-center py-8 text-gray-600">
          No featured jobs available at the moment.
        </div>
      </section>
    )
  }

  return (
    <section className="section">
      <h2 className="text-xl font-semibold text-ink mb-3">Featured jobs</h2>

      <div
        className="relative"
        onMouseEnter={()=>setPaused(true)}
        onMouseLeave={()=>setPaused(false)}
      >
        <div ref={viewportRef} className="carousel-viewport">
          <div className="carousel-track">
            {list.map((j, i)=>(
              <div key={j.id + '-' + i} className="carousel-slide">
                <JobCard job={j} />
              </div>
            ))}
          </div>
        </div>

        <button
          aria-label="Previous"
          onClick={prev}
          className="hidden md:flex absolute -left-12 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full bg-white border border-slate-200 shadow-soft hover:bg-slate-50"
        >‹</button>
        <button
          aria-label="Next"
          onClick={next}
          className="hidden md:flex absolute -right-12 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full bg-white border border-slate-200 shadow-soft hover:bg-slate-50"
        >›</button>
      </div>
    </section>
  )
}
