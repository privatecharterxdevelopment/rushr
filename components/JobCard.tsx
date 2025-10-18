'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useProAuth } from '../contexts/ProAuthContext'
import QuickBidModal from './QuickBidModal'

interface Job {
  id: string
  title: string
  description: string | null
  category: string | null
  priority: string
  status: string
  created_at: string
  homeowner_id: string
  zip_code: string | null
  budgetMin?: number
  budgetMax?: number
  budgetType?: string
  urgencyScore?: number
}

export default function JobCard({
  job,
  variant = 'default',
}: {
  job: Job
  variant?: 'default' | 'bare'
}) {
  const { user, contractorProfile } = useProAuth()
  const [openQB, setOpenQB] = useState(false)

  const isContractor = user && contractorProfile

  const shell =
    variant === 'bare'
      ? 'rounded-2xl p-4 bg-white border border-slate-100 shadow-soft' // still boxed to match site
      : 'card p-4'

  return (
    <div className={shell}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-ink font-semibold">{job.title}</div>
          <div className="text-xs text-slate-600">
            {job.category || 'General'} • ZIP {job.zip_code || 'N/A'}
          </div>
        </div>
        <div className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
          {job.priority || 'Normal'} Priority
        </div>
      </div>

      <p className="text-sm mt-2 line-clamp-3">{job.description}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Link href={`/jobs/${job.id}`} className="btn btn-outline">
          View
        </Link>

        {/* Only show quick-bid to signed-in contractors */}
        {isContractor && (
          <button
            className="btn-primary"
            onClick={() => setOpenQB(true)}
            aria-label="Quick bid on this job"
          >
            Quick bid
          </button>
        )}

        {/* Optional: a generic CTA for homeowners or logged-out users */}
        {!isContractor && (
          <Link href="/post-job" className="btn">
            Bid similar
          </Link>
        )}
      </div>

      {/* Quick Bid modal (contractors only) */}
      {isContractor && (
        <QuickBidModal
          open={openQB}
          onClose={() => setOpenQB(false)}
          jobId={job.id}
          category={job.category || 'General'}
        />
      )}
    </div>
  )
}
