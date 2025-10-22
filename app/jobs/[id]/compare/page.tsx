'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuth } from '../../../../contexts/AuthContext'
import { supabase } from '../../../../lib/supabaseClient'

interface JobWithBids {
  job_id: string
  job_title: string
  homeowner_id: string
  job_status: string
  bid_count: number
  bid_id: string
  contractor_id: string
  contractor_name: string
  bid_amount: number
  estimated_duration_hours: number | null
  description: string
  available_date: string | null
  materials_included: boolean
  warranty_months: number
  bid_status: string
  bid_submitted_at: string
  contractor_rating: number
  contractor_jobs_completed: number
}

export default function CompareBids(){
  const { user } = useAuth()
  const { id } = useParams<{id:string}>()
  const [bids, setBids] = useState<JobWithBids[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBids = async () => {
      if (!user || !id) return

      try {
        const { data, error } = await supabase
          .from('job_bids')
          .select('*')
          .eq('job_id', id)
          .eq('homeowner_id', user.id)
          .order('bid_amount', { ascending: true })

        if (error) {
          setError(error.message)
          return
        }

        setBids(data || [])
      } catch (err: any) {
        setError(err.message || 'Failed to load bids')
      } finally {
        setLoading(false)
      }
    }

    fetchBids()
  }, [user, id])

  if (loading) {
    return (
      <section className="section">
        <div className="card p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
            <span className="ml-2">Loading bids...</span>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="section">
        <div className="card p-6 bg-red-50 border-red-200">
          <p className="text-red-700">Error: {error}</p>
        </div>
      </section>
    )
  }

  if (bids.length === 0) {
    return (
      <section className="section">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-semibold text-ink">Compare Bids</h1>
          <Link href={`/jobs/${id}`} className="btn btn-outline">Back to job</Link>
        </div>
        <div className="card p-6">No bids available for comparison.</div>
      </section>
    )
  }

  const jobTitle = bids[0]?.job_title || 'Job'

  return (
    <section className="section">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-semibold text-ink">Compare Bids — {jobTitle}</h1>
        <Link href={`/jobs/${id}`} className="btn btn-outline">Back to job</Link>
      </div>

      <div className="overflow-auto">
        <table className="min-w-[720px] w-full text-sm bg-white rounded-lg border border-gray-200">
          <thead>
            <tr className="text-left text-slate-600 border-b">
              <th className="py-3 px-4 font-medium">Contractor</th>
              {bids.map(bid => (
                <th key={bid.bid_id} className="py-3 px-4 font-medium">
                  {bid.contractor_name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-3 px-4 font-medium text-gray-900">Bid Amount</td>
              {bids.map(bid => (
                <td key={bid.bid_id} className="py-3 px-4 font-semibold text-green-600">
                  ${bid.bid_amount}
                </td>
              ))}
            </tr>
            <tr className="border-b">
              <td className="py-3 px-4 font-medium text-gray-900">Rating</td>
              {bids.map(bid => (
                <td key={bid.bid_id} className="py-3 px-4">
                  ⭐ {bid.contractor_rating.toFixed(1)}
                </td>
              ))}
            </tr>
            <tr className="border-b">
              <td className="py-3 px-4 font-medium text-gray-900">Jobs Completed</td>
              {bids.map(bid => (
                <td key={bid.bid_id} className="py-3 px-4">
                  {bid.contractor_jobs_completed} jobs
                </td>
              ))}
            </tr>
            <tr className="border-b">
              <td className="py-3 px-4 font-medium text-gray-900">Estimated Duration</td>
              {bids.map(bid => (
                <td key={bid.bid_id} className="py-3 px-4">
                  {bid.estimated_duration_hours ? `${bid.estimated_duration_hours} hours` : '—'}
                </td>
              ))}
            </tr>
            <tr className="border-b">
              <td className="py-3 px-4 font-medium text-gray-900">Available Date</td>
              {bids.map(bid => (
                <td key={bid.bid_id} className="py-3 px-4">
                  {bid.available_date ? new Date(bid.available_date).toLocaleDateString() : 'Not specified'}
                </td>
              ))}
            </tr>
            <tr className="border-b">
              <td className="py-3 px-4 font-medium text-gray-900">Materials Included</td>
              {bids.map(bid => (
                <td key={bid.bid_id} className="py-3 px-4">
                  {bid.materials_included ? '✅ Yes' : '❌ No'}
                </td>
              ))}
            </tr>
            <tr className="border-b">
              <td className="py-3 px-4 font-medium text-gray-900">Warranty</td>
              {bids.map(bid => (
                <td key={bid.bid_id} className="py-3 px-4">
                  {bid.warranty_months} months
                </td>
              ))}
            </tr>
            <tr className="border-b">
              <td className="py-3 px-4 font-medium text-gray-900">Bid Status</td>
              {bids.map(bid => (
                <td key={bid.bid_id} className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    bid.bid_status === 'accepted' ? 'bg-green-100 text-green-800' :
                    bid.bid_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {bid.bid_status.toUpperCase()}
                  </span>
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-3 px-4 font-medium text-gray-900">Proposal</td>
              {bids.map(bid => (
                <td key={bid.bid_id} className="py-3 px-4 text-sm text-gray-600 max-w-xs">
                  <div className="truncate" title={bid.description}>
                    {bid.description || '—'}
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-6 text-center">
        <Link
          href={`/dashboard/homeowner/bids?job=${id}`}
          className="btn-primary"
        >
          Manage All Bids
        </Link>
      </div>
    </section>
  )
}
