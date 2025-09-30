'use client'

import React, { useState, KeyboardEvent } from 'react'
import { X, MapPin, Plus, Briefcase } from 'lucide-react'

interface ProServiceAreasProps {
  serviceAreaZips: string[]
  baseZip?: string
  serviceRadiusMiles?: number
  onUpdateZips: (zips: string[]) => void
  className?: string
}

export default function ProServiceAreas({
  serviceAreaZips,
  baseZip,
  serviceRadiusMiles,
  onUpdateZips,
  className = ''
}: ProServiceAreasProps) {
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

    if (serviceAreaZips.includes(cleanZip)) {
      setError('This ZIP code is already in your service area')
      return
    }

    // Add the ZIP code to the service area
    onUpdateZips([...serviceAreaZips, cleanZip])
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
    onUpdateZips(serviceAreaZips.filter(zip => zip !== zipToRemove))
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Briefcase className="h-4 w-4 text-blue-600" />
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Service Area ZIP Codes
        </label>
      </div>

      <div className="text-xs text-slate-600 dark:text-slate-400">
        <p>Add ZIP codes where you provide services to increase your visibility to potential customers.</p>
        {baseZip && (
          <p className="mt-1">
            <span className="font-medium">Base ZIP:</span> {baseZip}
            {serviceRadiusMiles && (
              <span className="ml-2">
                • <span className="font-medium">Service radius:</span> {serviceRadiusMiles} miles
              </span>
            )}
          </p>
        )}
      </div>

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
            placeholder="Enter service ZIP code (e.g., 12345)"
            maxLength={5}
            className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
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
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>

      {/* ZIP Code Bubbles */}
      {serviceAreaZips.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {serviceAreaZips.length} service area ZIP code{serviceAreaZips.length > 1 ? 's' : ''}:
          </p>
          <div className="flex flex-wrap gap-2">
            {serviceAreaZips.map((zip, index) => (
              <div
                key={`${zip}-${index}`}
                className="flex items-center gap-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-3 py-1.5 rounded-full text-sm font-medium border border-blue-200 dark:border-blue-800"
              >
                <MapPin className="h-3 w-3" />
                <span>{zip}</span>
                <button
                  onClick={() => removeZipCode(zip)}
                  className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
                  aria-label={`Remove ZIP code ${zip} from service area`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {serviceAreaZips.length === 0 && (
        <div className="text-center py-6 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
          <Briefcase className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No service area ZIP codes added yet</p>
          <p className="text-xs text-slate-400 mt-1">Add ZIP codes to expand your reach to more customers</p>
        </div>
      )}

      {/* Benefits */}
      {serviceAreaZips.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            💡 <span className="font-medium">Pro Tip:</span> Adding more service area ZIP codes increases your visibility
            when homeowners search for contractors in those areas.
          </p>
        </div>
      )}
    </div>
  )
}