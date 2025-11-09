'use client'
import React, { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import ContractorCard from './ContractorCard'

interface FeaturedContractor {
  id: string
  name: string
  business_name: string | null
  categories: string[]
  service_area_zips: string[]
  rating: number
  jobs_completed: number
  created_at: string
}

export default function FeaturedContractors(){
  const [list, setList] = useState<FeaturedContractor[]>([])
  const [loading, setLoading] = useState(true)
  const viewportRef = useRef<HTMLDivElement>(null)

  const [paused, setPaused] = useState(false)
  const [pageSize, setPageSize] = useState(2) // 2-up desktop, 1-up mobile
  const [page, setPage] = useState(0)

  useEffect(() => {
    const fetchFeaturedContractors = async () => {
      try {
        const { data, error } = await supabase
          .from('contractor_profiles')
          .select('id, name, business_name, categories, service_area_zips, rating, jobs_completed, created_at')
          .eq('status', 'approved')
          .order('rating', { ascending: false })
          .limit(6)

        if (error) {
          console.error('Error fetching featured contractors:', error)
          return
        }

        setList(data || [])
      } catch (err) {
        console.error('Error fetching featured contractors:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedContractors()
  }, [])

  // ----- SAFE DEFAULTS -----
  const safeList = Array.isArray(list) ? list : []
  const safePageSize = Math.max(1, Number(pageSize) || 1)
  const pages = Math.max(1, Math.ceil(safeList.length / safePageSize))

  // keep pageSize in sync with viewport
  useEffect(()=>{
    const sync = ()=>{
      const twoUp = window.matchMedia('(min-width: 768px)').matches
      setPageSize(twoUp ? 2 : 1)
    }
    sync()
    window.addEventListener('resize', sync)
    return ()=>window.removeEventListener('resize', sync)
  },[])

  // clamp page when list/pageSize changes
  useEffect(()=>{
    const clamped = Math.min(page, pages - 1)
    if (clamped !== page) {
      setPage(clamped)
      // snap scroll to new clamped page on next frame
      requestAnimationFrame(()=> goTo(clamped, { smooth:false }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages])

  const goTo = (p:number, opts:{smooth?:boolean} = {smooth:true})=>{
    const el = viewportRef.current
    if(!el) return
    const slides = Array.from(el.querySelectorAll<HTMLElement>('.carousel-slide'))
    const idx = p * safePageSize
    const target = slides[idx]
    if(target){
      el.scrollTo({ left: target.offsetLeft, behavior: opts.smooth ? 'smooth' : 'auto' })
      setPage(p)
    }else{
      // if no target (e.g., empty list), just reset scroll
      el.scrollTo({ left: 0, behavior: 'auto' })
      setPage(0)
    }
  }

  const next = ()=> goTo((page + 1) % pages)
  const prev = ()=> goTo((page - 1 + pages) % pages)

  // auto-advance (disabled when paused or only one page)
  useEffect(()=>{
    if (paused || pages <= 1) return
    const id = window.setInterval(()=> next(), 4000)
    return ()=> window.clearInterval(id)
  }, [paused, pages, page, safePageSize]) // keep interval fresh

  if (loading) {
    return (
      <section className="section">
        <h2 className="text-xl font-semibold text-ink mb-3">Featured contractors</h2>
        <div className="flex items-center justify-center py-8">
          <img
            src="https://jtrxdcccswdwlritgstp.supabase.co/storage/v1/object/public/contractor-logos/RushrLogoAnimation.gif"
            alt="Loading..."
            className="w-6 h-6 object-contain"
          />
          <span className="ml-2 text-gray-600">Loading contractors...</span>
        </div>
      </section>
    )
  }

  // Optional: early return when no contractors
  if (safeList.length === 0) {
    return (
      <section className="section">
        <h2 className="text-xl font-semibold text-ink mb-3">Featured contractors</h2>
        <div className="text-center py-8 text-gray-600">
          No featured contractors available at the moment.
        </div>
      </section>
    )
  }

  return (
    <section className="section">
      <h2 className="text-xl font-semibold text-ink mb-3">Featured contractors</h2>

      <div
        className="relative"
        onMouseEnter={()=>setPaused(true)}
        onMouseLeave={()=>setPaused(false)}
      >
        {/* Viewport (snap container) */}
        <div ref={viewportRef} className="carousel-viewport">
          <div className="carousel-track">
            {safeList.map((c:any, i:number)=>(
              <div key={(c?.id ?? 'c') + '-' + i} className="carousel-slide">
                <ContractorCard c={c} />
              </div>
            ))}
          </div>
        </div>

        {/* Arrows outside */}
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
