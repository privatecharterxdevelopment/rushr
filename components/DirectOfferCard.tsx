// components/DirectOfferCard.tsx
'use client'

import React, { useState } from 'react'
import { DollarSign, Clock, Calendar, MapPin, User, MessageSquare, CheckCircle, XCircle, Send } from 'lucide-react'

interface DirectOffer {
  id: string
  title: string
  description: string
  category: string
  priority: string
  offered_amount: number
  estimated_duration_hours?: number
  preferred_start_date?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  homeowner_notes?: string
  status: string
  contractor_response: string
  created_at: string
  expires_at: string
  counter_bid_amount?: number
  counter_bid_message?: string
  homeowner_id: string
  homeowner_name?: string
}

interface DirectOfferCardProps {
  offer: DirectOffer
  onRespond?: () => void
}

export default function DirectOfferCard({ offer, onRespond }: DirectOfferCardProps) {
  const [showCounterForm, setShowCounterForm] = useState(false)
  const [counterAmount, setCounterAmount] = useState('')
  const [counterDuration, setCounterDuration] = useState('')
  const [counterMessage, setCounterMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isExpired = new Date(offer.expires_at) < new Date()
  const isPending = offer.status === 'pending' && !isExpired

  const handleAccept = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/direct-offers/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offer_id: offer.id,
          action: 'accept',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept offer')
      }

      alert('Offer accepted! The homeowner will be notified.')
      onRespond?.()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!confirm('Are you sure you want to reject this offer?')) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/direct-offers/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offer_id: offer.id,
          action: 'reject',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject offer')
      }

      alert('Offer rejected.')
      onRespond?.()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCounterBid = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/direct-offers/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offer_id: offer.id,
          action: 'counter_bid',
          counter_amount: parseFloat(counterAmount),
          counter_duration_hours: counterDuration ? parseInt(counterDuration) : null,
          counter_message: counterMessage || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send counter-bid')
      }

      alert('Counter-bid sent! The homeowner will be notified.')
      setShowCounterForm(false)
      onRespond?.()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = () => {
    if (isExpired) {
      return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">Expired</span>
    }

    switch (offer.status) {
      case 'accepted':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">Accepted</span>
      case 'rejected':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">Rejected</span>
      case 'counter_bid':
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">Counter-Bid Sent</span>
      case 'agreement_reached':
        return <span className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">Agreement Reached</span>
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">Pending</span>
      default:
        return null
    }
  }

  const getPriorityBadge = () => {
    const colors = {
      emergency: 'bg-red-100 text-red-700',
      high: 'bg-orange-100 text-orange-700',
      normal: 'bg-blue-100 text-blue-700',
      low: 'bg-gray-100 text-gray-700',
    }

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[offer.priority as keyof typeof colors]}`}>
        {offer.priority.charAt(0).toUpperCase() + offer.priority.slice(1)}
      </span>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-bold text-slate-900">{offer.title}</h3>
            {getStatusBadge()}
            {getPriorityBadge()}
          </div>
          <p className="text-sm text-slate-600">
            <User className="inline h-4 w-4 mr-1" />
            From: {offer.homeowner_name || 'Homeowner'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {new Date(offer.created_at).toLocaleDateString()} • Expires: {new Date(offer.expires_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Description */}
      <div className="mb-4">
        <p className="text-sm text-slate-700">{offer.description}</p>
      </div>

      {/* Offer Details */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="h-4 w-4 text-emerald-600" />
          <span className="font-semibold text-emerald-600">${offer.offered_amount.toFixed(2)}</span>
        </div>
        {offer.estimated_duration_hours && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Clock className="h-4 w-4" />
            <span>{offer.estimated_duration_hours} hours</span>
          </div>
        )}
        {offer.preferred_start_date && (
          <div className="flex items-center gap-2 text-sm text-slate-600 col-span-2">
            <Calendar className="h-4 w-4" />
            <span>Preferred: {new Date(offer.preferred_start_date).toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Location */}
      {(offer.address || offer.city) && (
        <div className="mb-4 p-3 bg-slate-50 rounded-lg">
          <div className="flex items-start gap-2 text-sm text-slate-700">
            <MapPin className="h-4 w-4 mt-0.5" />
            <div>
              {offer.address && <div>{offer.address}</div>}
              {offer.city && (
                <div>
                  {offer.city}, {offer.state} {offer.zip}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Homeowner Notes */}
      {offer.homeowner_notes && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-blue-900 mb-1">Homeowner Notes:</p>
              <p className="text-sm text-blue-800">{offer.homeowner_notes}</p>
            </div>
          </div>
        </div>
      )}

      {/* Counter-Bid Info */}
      {offer.status === 'counter_bid' && offer.counter_bid_amount && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <p className="text-sm font-semibold text-emerald-900 mb-2">Your Counter-Bid:</p>
          <div className="flex items-center gap-2 text-emerald-700">
            <DollarSign className="h-4 w-4" />
            <span className="font-semibold">${offer.counter_bid_amount.toFixed(2)}</span>
          </div>
          {offer.counter_bid_message && (
            <p className="text-sm text-emerald-800 mt-2">{offer.counter_bid_message}</p>
          )}
        </div>
      )}

      {/* Actions */}
      {isPending && !showCounterForm && (
        <div className="flex gap-2 pt-4 border-t border-slate-200">
          <button
            onClick={handleAccept}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Accept ${offer.offered_amount.toFixed(2)}
          </button>
          <button
            onClick={() => setShowCounterForm(true)}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Send className="h-4 w-4" />
            Counter-Bid
          </button>
          <button
            onClick={handleReject}
            disabled={loading}
            className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <XCircle className="h-4 w-4" />
            Reject
          </button>
        </div>
      )}

      {/* Counter-Bid Form */}
      {showCounterForm && (
        <form onSubmit={handleCounterBid} className="pt-4 border-t border-slate-200 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Counter Amount *</label>
              <input
                type="number"
                value={counterAmount}
                onChange={(e) => setCounterAmount(e.target.value)}
                placeholder="Enter amount"
                step="0.01"
                min="0"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Duration (hours)</label>
              <input
                type="number"
                value={counterDuration}
                onChange={(e) => setCounterDuration(e.target.value)}
                placeholder="Hours"
                min="0"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Message (optional)</label>
            <textarea
              value={counterMessage}
              onChange={(e) => setCounterMessage(e.target.value)}
              placeholder="Explain your counter-bid..."
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowCounterForm(false)}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !counterAmount}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors disabled:opacity-50"
            >
              Send Counter-Bid
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
