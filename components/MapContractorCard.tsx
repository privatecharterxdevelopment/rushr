'use client'

import React, { useState } from 'react'

interface MapContractorCardProps {
  contractor: any
  distance?: number
  rating: number
}

export default function MapContractorCard({ contractor, distance, rating }: MapContractorCardProps) {
  const [sendingRequest, setSendingRequest] = useState(false)
  const [requestSent, setRequestSent] = useState(false)

  const handleSendRequest = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (sendingRequest || requestSent) return

    setSendingRequest(true)
    // TODO: Replace with actual SendRequestForm modal
    setTimeout(() => {
      setSendingRequest(false)
      setRequestSent(true)
    }, 1500)
  }

  return (
    <div
      className="bg-white border border-blue-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer relative"
      onClick={() => {
        window.location.href = `/contractor/${contractor?.id}`
      }}
    >
      {/* Pending Badge */}
      {requestSent && (
        <div className="absolute top-2 right-2 bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
          <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          Pending
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="font-semibold text-sm text-slate-900">
            {contractor?.business_name || contractor?.name || 'Contractor'}
          </h4>
          <p className="text-xs text-blue-600 mt-0.5">
            {contractor?.name || 'Contact'}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {contractor?.city || 'Location not specified'}
          </p>
        </div>
        {typeof distance === 'number' && (
          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full whitespace-nowrap ml-2">
            {distance.toFixed(1)} mi
          </span>
        )}
      </div>

      {/* Rating */}
      {rating > 0 && (
        <div className="flex items-center gap-1 mb-2">
          <span className="text-yellow-500 text-sm">★</span>
          <span className="text-xs font-medium text-slate-700">{rating.toFixed(1)}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 mt-2">
        <button
          onClick={(e) => {
            e.stopPropagation()
            window.location.href = `/contractor/${contractor?.id}`
          }}
          className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
        >
          View Profile
        </button>
        <button
          onClick={handleSendRequest}
          disabled={sendingRequest || requestSent}
          className="flex-1 px-3 py-1.5 border border-blue-600 text-blue-600 hover:bg-blue-50 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
        >
          {sendingRequest ? (
            <>
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              Sending...
            </>
          ) : requestSent ? (
            'Sent ✓'
          ) : (
            'Send Request'
          )}
        </button>
      </div>
    </div>
  )
}
