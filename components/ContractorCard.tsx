'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Heart, Star, MapPin } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabaseClient'

interface ContractorCardProps {
  c: any // Real contractor data from database
  variant?: 'default' | 'bare'
}

export default function ContractorCard({ c, variant = 'default' }: ContractorCardProps) {
  const { user } = useAuth()
  const [isSaved, setIsSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  // Check if contractor is already saved as trusted
  useEffect(() => {
    const checkIfSaved = async () => {
      if (!user || !c?.id) return

      try {
        const { data, error } = await supabase
          .from('trusted_contractors')
          .select('id')
          .eq('homeowner_id', user.id)
          .eq('contractor_id', c.id)
          .single()

        if (!error && data) {
          setIsSaved(true)
        }
      } catch (err) {
        // Not saved, which is fine
      }
    }

    checkIfSaved()
  }, [user, c?.id])

  const handleSaveToggle = async () => {
    if (!user || !c?.id || saving) return

    setSaving(true)
    try {
      if (isSaved) {
        // Remove from trusted contractors
        const { error } = await supabase
          .from('trusted_contractors')
          .delete()
          .eq('homeowner_id', user.id)
          .eq('contractor_id', c.id)

        if (!error) {
          setIsSaved(false)
        }
      } else {
        // Add to trusted contractors
        const { error } = await supabase
          .from('trusted_contractors')
          .insert({
            homeowner_id: user.id,
            contractor_id: c.id,
            trust_level: 1, // Level 1 = Saved
            notes: 'Saved from contractor search'
          })

        if (!error) {
          setIsSaved(true)
        }
      }
    } catch (err) {
      console.error('Error saving contractor:', err)
    } finally {
      setSaving(false)
    }
  }

  const shell = variant === 'bare'
    ? 'rounded-2xl p-4 bg-transparent border-none shadow-none'
    : 'card p-4'

  // Handle both old dummy data format and new database format
  const contractorName = c.name || c.contractor_name || 'Unknown Contractor'
  const businessName = c.business_name
  const categories = c.categories || c.services || []
  const serviceAreas = c.service_area_zips || c.serviceZips || []
  const rating = c.rating || c.housecallScore || 0
  const jobsCompleted = c.jobs_completed || 0
  const bio = c.bio || c.description || 'Professional contractor'

  return (
    <div className={shell}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="font-semibold text-ink dark:text-white">
            {contractorName}
            {businessName && (
              <div className="text-xs text-slate-500 font-normal mt-0.5">
                {businessName}
              </div>
            )}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {categories.slice(0, 2).join(' • ')}
            {serviceAreas.length > 0 && (
              <span className="flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3" />
                {serviceAreas.slice(0, 2).join(', ')}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium flex items-center gap-1">
            <Star className="h-4 w-4 text-amber-400 fill-current" />
            {rating.toFixed(1)}
          </div>
          {user && (
            <button
              onClick={handleSaveToggle}
              disabled={saving}
              className={`p-2 rounded-full transition-colors ${
                isSaved
                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={isSaved ? 'Remove from trusted pros' : 'Save as trusted pro'}
            >
              <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {bio && (
        <p className="text-sm mt-2 line-clamp-3 text-slate-600 dark:text-slate-400">{bio}</p>
      )}

      <div className="mt-2 flex flex-wrap gap-1">
        {jobsCompleted > 0 && (
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
            {jobsCompleted} jobs completed
          </span>
        )}
        {categories.slice(0, 3).map((category: string, i: number) => (
          <span key={i} className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
            {category}
          </span>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <Link href={`/contractors/${c.id}`} className="btn btn-outline flex-1">
          View Profile
        </Link>
        <Link href={`/post-job?contractor=${c.id}`} className="btn-primary flex-1">
          Request Quote
        </Link>
      </div>

      {isSaved && (
        <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          ✓ Saved as trusted pro
        </div>
      )}
    </div>
  )
}
