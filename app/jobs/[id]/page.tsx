'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuth } from '../../../contexts/AuthContext'
import { supabase } from '../../../lib/supabaseClient'
import QuickBidModal from '../../../components/QuickBidModal'

export default function JobDetail() {
  const { user, userProfile } = useAuth()
  const { id } = useParams<{ id: string }>()
  const [openQB, setOpenQB] = useState(false)
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Fetch job from database
  useEffect(() => {
    async function fetchJob() {
      if (!id) return

      try {
        // Check if ID is a number (job_number) or UUID (backward compatibility)
        const isJobNumber = /^\d+$/.test(id)

        // Try to fetch from contractor_available_jobs first
        let { data, error } = await supabase
          .from('contractor_available_jobs')
          .select('*')
          .eq(isJobNumber ? 'job_number' : 'job_id', id)
          .single()

        // If not found, try homeowner_jobs
        if (error || !data) {
          const { data: homeownerJob, error: homeownerError } = await supabase
            .from('homeowner_jobs')
            .select('*')
            .eq(isJobNumber ? 'job_number' : 'id', id)
            .single()

          if (homeownerError || !homeownerJob) {
            console.error('Job not found:', error, homeownerError)
            setLoading(false)
            return
          }

          // Convert homeowner job to display format
          data = {
            job_id: homeownerJob.id,
            job_number: homeownerJob.job_number,
            title: homeownerJob.title,
            description: homeownerJob.description,
            category: homeownerJob.category,
            priority: homeownerJob.priority,
            status: homeownerJob.status,
            address: homeownerJob.address,
            estimated_cost: homeownerJob.estimated_cost,
            created_at: homeownerJob.created_at
          }
        }

        setJob(data)
      } catch (err) {
        console.error('Error fetching job:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchJob()
  }, [id])

  if (loading) return (
    <section className="section">
      <div className="card p-6">Loading job...</div>
    </section>
  )

  if (!job) return (
    <section className="section">
      <div className="card p-6">Job not found.</div>
    </section>
  )

  const isContractor = user && userProfile?.role === 'contractor'
  const jobId = job.job_id || job.id
  const jobNumber = job.job_number
  const rehireURL = `/post-job?title=${encodeURIComponent(job.title)}&cat=${encodeURIComponent(job.category)}`

  // Convert priority to urgency score
  const urgencyScore = job.priority === 'emergency' ? 10 :
                      job.priority === 'high' ? 8 :
                      job.priority === 'medium' ? 5 : 3

  return (
    <section className="section">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-ink">{job.title}</h1>
          <div className="flex gap-2">
            <Link href="/jobs" className="btn btn-outline">Back to Jobs</Link>
            {isContractor ? (
              <button
                className="btn-primary"
                onClick={() => setOpenQB(true)}
              >
                Submit Bid
              </button>
            ) : (
              <>
                <Link href={`/jobs/${jobNumber || jobId}/compare`} className="btn btn-outline">Compare bids</Link>
                <Link href={rehireURL} className="btn btn-outline">Rehire (prefill)</Link>
              </>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div><span className="font-medium">Category:</span> {job.category}</div>
          <div><span className="font-medium">Address:</span> {job.address}</div>
          <div><span className="font-medium">Priority:</span> {job.priority} (Urgency: {urgencyScore}/10)</div>
          <div><span className="font-medium">Status:</span> {job.status}</div>
          {job.estimated_cost && (
            <div><span className="font-medium">Estimated Cost:</span> ${job.estimated_cost}</div>
          )}
          <div className="mt-4">
            <span className="font-medium">Description:</span>
            <p className="mt-2 text-gray-700">{job.description}</p>
          </div>
          <div className="text-sm text-gray-500">
            <span className="font-medium">Posted:</span> {new Date(job.created_at).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Quick Bid Modal */}
      {isContractor && (
        <QuickBidModal
          open={openQB}
          onClose={() => setOpenQB(false)}
          jobId={jobId}
          category={job.category}
        />
      )}
    </section>
  )
}
