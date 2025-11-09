'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../../lib/supabaseClient'
import {
  MapPin,
  Star,
  BadgeCheck,
  Clock,
  DollarSign,
  Phone,
  Mail,
  ArrowLeft,
  Briefcase,
  Award,
  Shield,
  Calendar,
  MessageSquare
} from 'lucide-react'

interface ContractorProfile {
  id: string
  name: string
  email: string
  phone?: string
  business_name?: string
  description?: string
  specialties?: string[]
  rating?: number
  total_reviews?: number
  completed_jobs?: number
  years_experience?: number
  hourly_rate?: number
  base_zip?: string
  city?: string
  state?: string
  service_area_zips?: string[]
  license_number?: string
  insurance_carrier?: string
  verified?: boolean
  kyc_status?: string
  avatar_url?: string
}

export default function ContractorProfilePage() {
  const params = useParams()
  const router = useRouter()
  const contractorId = params.id as string

  const [contractor, setContractor] = useState<ContractorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadContractorProfile = async () => {
      try {
        setLoading(true)

        // Try loading from pro_contractors table first
        const { data: proContractor, error: proError } = await supabase
          .from('pro_contractors')
          .select('*')
          .eq('id', contractorId)
          .single()

        if (proError && proError.code !== 'PGRST116') {
          throw proError
        }

        if (proContractor) {
          setContractor({
            id: proContractor.id,
            name: proContractor.name || 'Professional Contractor',
            email: proContractor.email,
            phone: proContractor.phone,
            business_name: proContractor.business_name,
            description: proContractor.bio || proContractor.description,
            specialties: proContractor.specialties || [],
            rating: proContractor.rating || 0,
            total_reviews: proContractor.total_reviews || 0,
            completed_jobs: proContractor.completed_jobs || 0,
            years_experience: proContractor.years_experience || 0,
            hourly_rate: proContractor.hourly_rate,
            base_zip: proContractor.base_zip,
            city: proContractor.city,
            state: proContractor.state,
            service_area_zips: proContractor.service_area_zips || [],
            license_number: proContractor.license_number,
            insurance_carrier: proContractor.insurance_carrier,
            verified: proContractor.kyc_status === 'completed',
            kyc_status: proContractor.kyc_status,
            avatar_url: proContractor.avatar_url
          })
        } else {
          setError('Contractor not found')
        }
      } catch (err: any) {
        console.error('Error loading contractor:', err)
        setError(err.message || 'Failed to load contractor profile')
      } finally {
        setLoading(false)
      }
    }

    if (contractorId) {
      loadContractorProfile()
    }
  }, [contractorId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <img
            src="https://jtrxdcccswdwlritgstp.supabase.co/storage/v1/object/public/contractor-logos/RushrLogoAnimation.gif"
            alt="Loading..."
            className="w-12 h-12 object-contain mx-auto mb-4"
          />
          <div className="text-lg font-medium text-slate-700">Loading contractor profile...</div>
        </div>
      </div>
    )
  }

  if (error || !contractor) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Contractor Not Found</h2>
            <p className="text-slate-600 mb-6">{error || 'The contractor profile you are looking for does not exist.'}</p>
          </div>
          <div className="space-y-3">
            <Link href="/find-pro" className="block w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium">
              Find Other Contractors
            </Link>
            <button onClick={() => router.back()} className="block w-full bg-slate-100 text-slate-700 px-6 py-3 rounded-lg hover:bg-slate-200 transition-colors font-medium">
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  const displayRating = contractor.rating || 0
  const displayReviews = contractor.total_reviews || 0

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Back Button */}
        <Link
          href="/find-pro"
          className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Search
        </Link>

        {/* Header Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 border border-slate-200 dark:border-slate-700 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-3xl font-bold text-blue-600 dark:text-blue-400">
                {contractor.avatar_url ? (
                  <img src={contractor.avatar_url} alt={contractor.name} className="w-24 h-24 rounded-full object-cover" />
                ) : (
                  contractor.name.charAt(0).toUpperCase()
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    {contractor.business_name || contractor.name}
                    {contractor.verified && (
                      <BadgeCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    )}
                  </h1>
                  {contractor.business_name && (
                    <p className="text-slate-600 dark:text-slate-400">{contractor.name}</p>
                  )}
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {displayRating.toFixed(1)}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-sm">
                    ({displayReviews} {displayReviews === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
                {contractor.completed_jobs ? (
                  <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400 text-sm">
                    <Briefcase className="h-4 w-4" />
                    {contractor.completed_jobs} jobs completed
                  </div>
                ) : null}
              </div>

              {/* Location */}
              {(contractor.city || contractor.state) && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-4">
                  <MapPin className="h-4 w-4" />
                  <span>{contractor.city}, {contractor.state}</span>
                </div>
              )}

              {/* Specialties */}
              {contractor.specialties && contractor.specialties.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {contractor.specialties.map((specialty, idx) => (
                    <span key={idx} className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900 px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-300">
                      {specialty}
                    </span>
                  ))}
                </div>
              )}

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-4 text-sm">
                {contractor.years_experience ? (
                  <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                    <Award className="h-4 w-4" />
                    {contractor.years_experience} years experience
                  </div>
                ) : null}
                {contractor.hourly_rate ? (
                  <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                    <DollarSign className="h-4 w-4" />
                    ${contractor.hourly_rate}/hr
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <Link
              href={`/post-job?contractor=${contractor.id}`}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Request Quote
            </Link>
            {contractor.phone && (
              <a
                href={`tel:${contractor.phone}`}
                className="border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 px-6 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium flex items-center gap-2"
              >
                <Phone className="h-4 w-4" />
                Call
              </a>
            )}
          </div>
        </div>

        {/* About Section */}
        {contractor.description && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 mb-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">About</h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
              {contractor.description}
            </p>
          </div>
        )}

        {/* Credentials Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Credentials & Verification
          </h2>
          <div className="space-y-3">
            {contractor.license_number && contractor.license_number !== 'pending' && (
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">License Number</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{contractor.license_number}</span>
              </div>
            )}
            {contractor.insurance_carrier && contractor.insurance_carrier !== 'pending' && (
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Insurance Carrier</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{contractor.insurance_carrier}</span>
              </div>
            )}
            {contractor.verified && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <BadgeCheck className="h-5 w-5" />
                <span className="font-medium">Verified Professional</span>
              </div>
            )}
          </div>
        </div>

        {/* Service Area */}
        {contractor.service_area_zips && contractor.service_area_zips.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Service Area
            </h2>
            <div className="flex flex-wrap gap-2">
              {contractor.service_area_zips.map((zip, idx) => (
                <span key={idx} className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-700 px-3 py-1 text-sm text-slate-700 dark:text-slate-300">
                  {zip}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
