'use client'

import React, { useState } from 'react'
import { X, DollarSign, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface SendRequestFormProps {
  contractor: {
    id: string
    name: string
    business_name?: string
  }
  onClose: () => void
  onSuccess: (jobId: string, bidId: string) => void
}

export default function SendRequestForm({ contractor, onClose, onSuccess }: SendRequestFormProps) {
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priceOffer, setPriceOffer] = useState('')
  const [urgency, setUrgency] = useState<'standard' | 'urgent' | 'emergency'>('standard')
  const [category, setCategory] = useState('General')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const categories = [
    'Plumbing', 'Electrical', 'HVAC', 'Roofing', 'General',
    'Carpentry', 'Landscaping', 'Locksmith', 'Appliance Repair'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      setError('You must be logged in to send a request')
      return
    }

    if (!title.trim() || !description.trim()) {
      setError('Title and description are required')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/bids/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeownerId: user.id,
          contractorId: contractor.id,
          title: title.trim(),
          description: description.trim(),
          priceOffer: priceOffer ? parseFloat(priceOffer) : null,
          urgency,
          category
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send request')
      }

      // Success! Call the callback
      onSuccess(data.jobId, data.bidId)

    } catch (err: any) {
      console.error('Error sending request:', err)
      setError(err.message || 'Failed to send request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Send Job Request</h2>
          <p className="text-sm text-gray-600">
            to {contractor.business_name || contractor.name}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Job Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Job Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Fix leaking kitchen faucet"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the job in detail..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Price Offer (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price Offer (Optional)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="number"
              value={priceOffer}
              onChange={(e) => setPriceOffer(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Suggest a price or leave blank for contractor to quote
          </p>
        </div>

        {/* Urgency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Urgency
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setUrgency('standard')}
              className={`px-3 py-2 rounded-lg border-2 transition-all ${
                urgency === 'standard'
                  ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              Standard
            </button>
            <button
              type="button"
              onClick={() => setUrgency('urgent')}
              className={`px-3 py-2 rounded-lg border-2 transition-all ${
                urgency === 'urgent'
                  ? 'border-amber-500 bg-amber-50 text-amber-700 font-medium'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              Urgent
            </button>
            <button
              type="button"
              onClick={() => setUrgency('emergency')}
              className={`px-3 py-2 rounded-lg border-2 transition-all ${
                urgency === 'emergency'
                  ? 'border-red-500 bg-red-50 text-red-700 font-medium'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              Emergency
            </button>
          </div>
        </div>
      </form>

      {/* Footer */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Sending...' : 'Send Request'}
          </button>
        </div>
      </div>
    </div>
  )
}
