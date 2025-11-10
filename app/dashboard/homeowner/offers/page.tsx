'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../../../../contexts/AuthContext'
import { supabase } from '../../../../lib/supabaseClient'
import LoadingSpinner from '../../../../components/LoadingSpinner'
import {
  ArrowLeft,
  DollarSign,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  Send,
  Calendar,
  MapPin,
  AlertCircle
} from 'lucide-react'

interface DirectOffer {
  id: string
  contractor_id: string
  title: string
  description: string
  category: string
  priority: string
  offered_amount: number
  estimated_duration_hours: number | null
  preferred_start_date: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  status: string
  contractor_response: string | null
  counter_bid_amount: number | null
  counter_bid_message: string | null
  homeowner_notes: string | null
  contractor_notes: string | null
  created_at: string
  responded_at: string | null
  expires_at: string | null
  contractor_name?: string
  contractor_business?: string
}

export default function HomeownerDirectOffersPage() {
  const { user } = useAuth()
  const [offers, setOffers] = useState<DirectOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [actioningOffer, setActioningOffer] = useState<string | null>(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [offerToCancel, setOfferToCancel] = useState<DirectOffer | null>(null)

  const fetchOffers = async () => {
    if (!user) return
    try {
      // Fetch direct offers sent by homeowner
      const { data: offersData, error } = await supabase
        .from('direct_offers')
        .select('*')
        .eq('homeowner_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching offers:', error)
        setLoading(false)
        return
      }

      // Enrich with contractor details
      const enrichedOffers = await Promise.all(
        (offersData || []).map(async (offer) => {
          const { data: contractorData } = await supabase
            .from('pro_contractors')
            .select('name, business_name')
            .eq('id', offer.contractor_id)
            .single()

          return {
            ...offer,
            contractor_name: contractorData?.name || 'Unknown',
            contractor_business: contractorData?.business_name || null
          }
        })
      )

      setOffers(enrichedOffers)
    } catch (err) {
      console.error('Error fetching offers:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return
    fetchOffers()
  }, [user])

  const handleAcceptCounterBid = async (offer: DirectOffer) => {
    if (!user || actioningOffer || !offer.counter_bid_amount) return

    setActioningOffer(offer.id)

    try {
      // First, accept the counter bid in the database
      const response = await fetch('/api/direct-offers/accept-counter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId: offer.id })
      })

      if (!response.ok) {
        throw new Error('Failed to accept counter bid')
      }

      // Redirect to Stripe escrow payment (same as job bids)
      const jobTitle = offer.title || 'Direct Offer Job'
      window.location.href = `/payments/checkout?job_id=${offer.id}&amount=${offer.counter_bid_amount}&description=${encodeURIComponent(jobTitle)}&type=escrow&source=direct_offer`
    } catch (err) {
      console.error('Error accepting counter bid:', err)
      alert('Failed to accept counter bid')
      setActioningOffer(null)
    }
  }

  const handleCancelOffer = async () => {
    if (!offerToCancel) return

    setActioningOffer(offerToCancel.id)
    setShowCancelModal(false)

    try {
      const { error } = await supabase
        .from('direct_offers')
        .update({ status: 'cancelled' })
        .eq('id', offerToCancel.id)

      if (error) throw error

      await fetchOffers()
    } catch (err) {
      console.error('Error cancelling offer:', err)
      alert('Failed to cancel offer')
    } finally {
      setActioningOffer(null)
      setOfferToCancel(null)
    }
  }

  const getStatusColor = (status: string, contractorResponse: string | null) => {
    if (contractorResponse === 'counter_bid') {
      return 'bg-purple-100 text-purple-700 border-purple-200'
    }

    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'accepted':
      case 'agreement_reached':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'cancelled':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200'
    }
  }

  const getStatusLabel = (status: string, contractorResponse: string | null) => {
    if (contractorResponse === 'counter_bid') return 'Counter Bid Received'
    if (contractorResponse === 'accepted') return 'Accepted'
    if (contractorResponse === 'rejected') return 'Rejected'

    switch (status) {
      case 'pending':
        return 'Awaiting Response'
      case 'accepted':
        return 'Accepted'
      case 'agreement_reached':
        return 'Agreement Reached'
      case 'rejected':
        return 'Rejected'
      case 'cancelled':
        return 'Cancelled'
      default:
        return status.charAt(0).toUpperCase() + status.slice(1)
    }
  }

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/homeowner"
          className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Direct Job Offers</h1>
        <p className="text-slate-600 mt-1">Track custom offers you've sent to contractors</p>
      </div>

      {/* Offers List */}
      {offers.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg">
          <Send className="h-12 w-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600">No offers sent yet</p>
          <p className="text-sm text-slate-500 mt-1">Send custom offers to contractors from their profile pages</p>
        </div>
      ) : (
        <div className="space-y-4">
          {offers.map((offer) => {
            const expired = isExpired(offer.expires_at)
            const showCounterBidActions = offer.contractor_response === 'counter_bid' && offer.status === 'pending'
            const displayName = offer.contractor_business || offer.contractor_name

            return (
              <div key={offer.id} className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                {/* Offer Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-slate-900 mb-1">
                      {offer.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <User className="h-4 w-4" />
                      <span>Sent to: {displayName}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(offer.status, offer.contractor_response)}`}>
                      {getStatusLabel(offer.status, offer.contractor_response)}
                    </span>
                    {expired && offer.status === 'pending' && (
                      <span className="px-2 py-1 bg-red-50 text-red-600 text-xs rounded">
                        Expired
                      </span>
                    )}
                  </div>
                </div>

                {/* Offer Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-sm text-slate-500">Your Offer</p>
                      <p className="text-lg font-semibold text-slate-900">
                        ${offer.offered_amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-slate-500">Sent</p>
                      <p className="text-sm text-slate-700">{new Date(offer.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {offer.estimated_duration_hours && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="text-sm text-slate-500">Est. Duration</p>
                        <p className="text-sm text-slate-700">{offer.estimated_duration_hours}h</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-slate-700 mb-1">Job Description:</p>
                  <p className="text-slate-600 bg-slate-50 p-3 rounded-lg">{offer.description}</p>
                </div>

                {/* Location */}
                {offer.address && (
                  <div className="mb-4 flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-slate-500 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">Location:</p>
                      <p className="text-sm text-slate-600">
                        {offer.address}, {offer.city}, {offer.state} {offer.zip}
                      </p>
                    </div>
                  </div>
                )}

                {/* Counter Bid Details */}
                {offer.counter_bid_amount && (
                  <div className="mb-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-purple-900 mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Counter Bid from Contractor
                    </p>
                    <div className="flex items-center gap-4 mb-2">
                      <div>
                        <p className="text-xs text-purple-700">Counter Amount:</p>
                        <p className="text-lg font-bold text-purple-900">${offer.counter_bid_amount.toFixed(2)}</p>
                      </div>
                    </div>
                    {offer.counter_bid_message && (
                      <p className="text-sm text-purple-800 mt-2 italic">"{offer.counter_bid_message}"</p>
                    )}
                  </div>
                )}

                {/* Contractor Notes */}
                {offer.contractor_notes && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-slate-700 mb-1">Contractor's Response:</p>
                    <p className="text-slate-600 bg-blue-50 p-3 rounded-lg">{offer.contractor_notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {showCounterBidActions && (
                    <>
                      <button
                        onClick={() => handleAcceptCounterBid(offer)}
                        disabled={actioningOffer === offer.id}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {actioningOffer === offer.id ? (
                          <>
                            <img
                              src="https://jtrxdcccswdwlritgstp.supabase.co/storage/v1/object/public/contractor-logos/RushrLogoAnimation.gif"
                              alt="Loading..."
                              className="w-4 h-4 object-contain"
                            />
                            Accepting...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            Accept Counter Bid
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setOfferToCancel(offer)
                          setShowCancelModal(true)
                        }}
                        disabled={actioningOffer === offer.id}
                        className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Decline
                      </button>
                    </>
                  )}
                  {offer.status === 'pending' && !showCounterBidActions && !expired && (
                    <button
                      onClick={() => {
                        setOfferToCancel(offer)
                        setShowCancelModal(true)
                      }}
                      disabled={actioningOffer === offer.id}
                      className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Cancel Offer
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && offerToCancel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-3">Cancel Offer?</h3>
            <p className="text-slate-600 mb-2">
              Are you sure you want to cancel this offer?
            </p>
            <div className="bg-slate-50 rounded-lg p-3 mb-6">
              <p className="font-semibold text-slate-900">{offerToCancel.title}</p>
              <p className="text-sm text-slate-600">
                Sent to: {offerToCancel.contractor_business || offerToCancel.contractor_name}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false)
                  setOfferToCancel(null)
                }}
                className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
              >
                Keep Offer
              </button>
              <button
                onClick={handleCancelOffer}
                disabled={actioningOffer === offerToCancel.id}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {actioningOffer === offerToCancel.id ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
