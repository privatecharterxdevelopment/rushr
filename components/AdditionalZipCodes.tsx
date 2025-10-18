'use client'

import React, { useState, KeyboardEvent } from 'react'
import { X, MapPin, Plus } from 'lucide-react'

interface AdditionalZipCodesProps {
  additionalZips: string[]
  onUpdateZips: (zips: string[]) => void
  className?: string
}

export default function AdditionalZipCodes({
  additionalZips,
  onUpdateZips,
  className = ''
}: AdditionalZipCodesProps) {
  const [zipInput, setZipInput] = useState('')
  const [error, setError] = useState('')

  // Validate ZIP code format (5 digits)
  const isValidZip = (zip: string): boolean => {
    return /^\d{5}$/.test(zip.trim())
  }

  // Add a ZIP code
  const addZipCode = () => {
    const cleanZip = zipInput.trim()

    if (!cleanZip) {
      setError('Please enter a ZIP code')
      return
    }

    if (!isValidZip(cleanZip)) {
      setError('Invalid ZIP: Please enter a 5-digit ZIP code (e.g., 12345)')
      return
    }

    if (additionalZips.includes(cleanZip)) {
      setError('This ZIP code is already added')
      return
    }

    // Add the ZIP code to the list
    onUpdateZips([...additionalZips, cleanZip])
    setZipInput('')
    setError('')
  }

  // Handle Enter key press
  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addZipCode()
    }
  }

  // Remove a ZIP code
  const removeZipCode = (zipToRemove: string) => {
    onUpdateZips(additionalZips.filter(zip => zip !== zipToRemove))
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-slate-500" />
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Additional ZIP Codes
        </label>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-400">
        Add additional ZIP codes where you need emergency services. This helps contractors find you faster.
      </p>

      {/* Input Field */}
      <div className="flex gap-2">
        <div className="flex-1">
          <input
            type="text"
            value={zipInput}
            onChange={(e) => {
              setZipInput(e.target.value)
              setError('')
            }}
            onKeyPress={handleKeyPress}
            placeholder="Enter ZIP code (e.g., 12345)"
            maxLength={5}
            className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
              error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 dark:border-slate-600'
            }`}
          />
          {error && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>
        <button
          onClick={addZipCode}
          disabled={!zipInput.trim()}
          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>

      {/* ZIP Code Bubbles */}
      {additionalZips.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {additionalZips.length} additional ZIP code{additionalZips.length > 1 ? 's' : ''} added:
          </p>
          <div className="flex flex-wrap gap-2">
            {additionalZips.map((zip, index) => (
              <div
                key={`${zip}-${index}`}
                className="flex items-center gap-2 bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 px-3 py-1.5 rounded-full text-sm font-medium border border-emerald-200 dark:border-emerald-800"
              >
                <MapPin className="h-3 w-3" />
                <span>{zip}</span>
                <button
                  onClick={() => removeZipCode(zip)}
                  className="ml-1 hover:bg-emerald-200 dark:hover:bg-emerald-800 rounded-full p-0.5 transition-colors"
                  aria-label={`Remove ZIP code ${zip}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {additionalZips.length === 0 && (
        <div className="text-center py-6 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
          <MapPin className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No additional ZIP codes added yet</p>
          <p className="text-xs text-slate-400 mt-1">Add ZIP codes where you might need emergency services</p>
        </div>
      )}
    </div>
  )
}