'use client'

import React, { useState, KeyboardEvent } from 'react'
import { Search, MapPin, Star, Phone, Globe, Filter } from 'lucide-react'

interface Contractor {
  id: string
  name: string
  business_name?: string
  rating?: number
  total_reviews?: number
  categories?: string[]
  service_area_zips?: string[]
  base_zip?: string
  phone?: string
  website?: string
  distance?: string
}

interface ContractorSearchProps {
  className?: string
}

export default function ContractorSearch({ className = '' }: ContractorSearchProps) {
  const [searchZip, setSearchZip] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasSearched, setHasSearched] = useState(false)

  // Common service categories
  const categories = [
    'Plumbing', 'Electrical', 'HVAC', 'Roofing', 'General', 'Carpentry',
    'Landscaping', 'Appliance Repair', 'Locksmith', 'Handyman'
  ]

  // Validate ZIP code format (5 digits)
  const isValidZip = (zip: string): boolean => {
    return /^\d{5}$/.test(zip.trim())
  }

  // Search contractors by ZIP code
  const searchContractors = async () => {
    const cleanZip = searchZip.trim()

    if (!cleanZip) {
      setError('Please enter a ZIP code')
      return
    }

    if (!isValidZip(cleanZip)) {
      setError('Please enter a valid 5-digit ZIP code')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Mock search results - in a real app, this would call your API
      const mockResults: Contractor[] = [
        {
          id: '1',
          name: 'Mike Rodriguez',
          business_name: 'Rodriguez Plumbing & HVAC',
          rating: 4.9,
          total_reviews: 128,
          categories: ['Plumbing', 'HVAC'],
          service_area_zips: [cleanZip, '12346', '12347'],
          base_zip: cleanZip,
          phone: '(555) 123-4567',
          website: 'https://rodriguez-plumbing.com',
          distance: '1.2 miles'
        },
        {
          id: '2',
          name: 'Sarah Chen',
          business_name: 'Elite Electrical Services',
          rating: 4.8,
          total_reviews: 203,
          categories: ['Electrical', 'General'],
          service_area_zips: [cleanZip, '12348', '12349'],
          base_zip: '12348',
          phone: '(555) 234-5678',
          distance: '2.1 miles'
        },
        {
          id: '3',
          name: 'David Park',
          business_name: 'Park Home Services',
          rating: 4.7,
          total_reviews: 87,
          categories: ['General', 'Handyman', 'Carpentry'],
          service_area_zips: [cleanZip],
          base_zip: cleanZip,
          phone: '(555) 345-6789',
          distance: '0.8 miles'
        }
      ]

      // Filter by category if selected
      let filteredResults = mockResults
      if (selectedCategory) {
        filteredResults = mockResults.filter(contractor =>
          contractor.categories?.includes(selectedCategory)
        )
      }

      setContractors(filteredResults)
      setHasSearched(true)
    } catch (err) {
      setError('Failed to search contractors. Please try again.')
      console.error('Contractor search error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Handle Enter key press
  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      searchContractors()
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search Header */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
          <Search className="h-5 w-5 text-emerald-600" />
          Find Contractors Near You
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Search for verified contractors in your area by ZIP code
        </p>
      </div>

      {/* Search Form */}
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={searchZip}
              onChange={(e) => {
                setSearchZip(e.target.value)
                setError('')
              }}
              onKeyPress={handleKeyPress}
              placeholder="Enter ZIP code (e.g., 12345)"
              maxLength={5}
              className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 dark:border-slate-600'
              }`}
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <button
            onClick={searchContractors}
            disabled={loading || !searchZip.trim()}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                Searching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Search
              </>
            )}
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>

      {/* Results */}
      {hasSearched && (
        <div className="space-y-4">
          {contractors.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Found {contractors.length} contractor{contractors.length > 1 ? 's' : ''} in ZIP {searchZip}
                  {selectedCategory && ` for ${selectedCategory}`}
                </p>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Filter className="h-3 w-3" />
                  Filtered by: {selectedCategory || 'All Categories'}
                </div>
              </div>

              <div className="grid gap-4">
                {contractors.map(contractor => (
                  <div
                    key={contractor.id}
                    className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-800 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                            {contractor.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900 dark:text-white">
                              {contractor.business_name || contractor.name}
                            </h4>
                            {contractor.business_name && contractor.name && (
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {contractor.name}
                              </p>
                            )}

                            <div className="flex items-center gap-3 mt-2">
                              {contractor.rating && (
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  <span className="text-sm font-medium">{contractor.rating}</span>
                                  {contractor.total_reviews && (
                                    <span className="text-sm text-slate-500">
                                      ({contractor.total_reviews} reviews)
                                    </span>
                                  )}
                                </div>
                              )}
                              {contractor.distance && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4 text-slate-400" />
                                  <span className="text-sm text-slate-600 dark:text-slate-400">
                                    {contractor.distance}
                                  </span>
                                </div>
                              )}
                            </div>

                            {contractor.categories && contractor.categories.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {contractor.categories.slice(0, 3).map(category => (
                                  <span
                                    key={category}
                                    className="px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200 text-xs rounded-full"
                                  >
                                    {category}
                                  </span>
                                ))}
                                {contractor.categories.length > 3 && (
                                  <span className="text-xs text-slate-500">
                                    +{contractor.categories.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {contractor.phone && (
                          <a
                            href={`tel:${contractor.phone}`}
                            className="flex items-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors"
                          >
                            <Phone className="h-4 w-4" />
                            Call
                          </a>
                        )}
                        {contractor.website && (
                          <a
                            href={contractor.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-2 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-lg transition-colors"
                          >
                            <Globe className="h-4 w-4" />
                            Website
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
              <Search className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No contractors found in ZIP {searchZip}</p>
              <p className="text-xs text-slate-400 mt-1">
                Try searching a different ZIP code or removing category filters
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}