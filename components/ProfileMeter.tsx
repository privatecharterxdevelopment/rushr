'use client'
import React from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function ProfileMeter(){
  const { user, userProfile } = useAuth()

  // Calculate profile completeness based on available data
  const computeProfileScore = () => {
    if (!user || !userProfile) return 0

    let score = 0

    // Email verification (15 points)
    if (user.email_confirmed_at) score += 15

    // Phone number (15 points)
    if ((userProfile as any).phone) score += 15

    // Property address (20 points)
    if ((userProfile as any).address) score += 20

    // Profile photo (10 points)
    if ((userProfile as any).avatar_url) score += 10

    // KYC verification - required for contractors (25 points), optional for homeowners (15 points)
    if ((userProfile as any).kyc_verified) {
      score += userProfile.role === 'contractor' ? 25 : 15
    }

    // First job completed (15 points for homeowners, 10 points for contractors since KYC is more important)
    if ((userProfile as any).first_job_completed) {
      score += userProfile.role === 'contractor' ? 10 : 15
    }

    return Math.min(score, 100)
  }

  const score = computeProfileScore()
  return (
    <div className="rounded-2xl border border-slate-100 p-4">
      <div className="flex items-center justify-between">
        <div className="font-medium text-ink">Profile completeness</div>
        <div className="text-sm">{score}%</div>
      </div>
      <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full" style={{width:`${score}%`, background:'linear-gradient(90deg,#34d399,#10b981)'}} />
      </div>
      <div className="mt-2 text-xs text-slate-600">
        {userProfile.role === 'contractor'
          ? 'Add photos, license/insurance, KYC verification, and service area to reach 100%.'
          : 'Add photos, address, and other profile details to reach 100%. KYC verification is optional.'
        }
      </div>
    </div>
  )
}
