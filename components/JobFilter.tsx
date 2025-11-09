'use client'

import React, { useState, KeyboardEvent } from 'react'
import { Filter, MapPin, Clock, DollarSign, AlertTriangle, X, Search } from 'lucide-react'

interface Job {
  id: string
  title: string
  description: string
  category: string
  priority: 'emergency' | 'high' | 'normal'
  budget?: number
  zip_code: string
  posted_date: string
  homeowner_name: string
  status: 'open' | 'assigned' | 'completed'
}

interface JobFilterProps {
  className?: string
}

export default function JobFilter({ className = '' }: JobFilterProps) {
  const [filterZip, setFilterZip] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedPriority, setSelectedPriority] = useState('')
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasSearched, setHasSearched] = useState(false)

  // Service categories
  const categories = [
    'Plumbing', 'Electrical', 'HVAC', 'Roofing', 'Carpentry',
    'Landscaping', 'Appliance Repair', 'Locksmith', 'Handyman'
  ]

  // Priority levels
  const priorities = [
    { value: 'emergency', label: 'Emergency', color: 'text-red-600' },
    { value: 'high', label: 'Urgent', color: 'text-orange-600' },
    { value: 'normal', label: 'Standard', color: 'text-blue-600' }
  ]

  // Validate ZIP code format (5 digits)
  const isValidZip = (zip: string): boolean => {
    return /^\d{5}$/.test(zip.trim())
  }

  // Filter jobs
  const filterJobs = async () => {
    const cleanZip = filterZip.trim()

    if (cleanZip && !isValidZip(cleanZip)) {
      setError('Please enter a valid 5-digit ZIP code')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Mock job results - in a real app, this would call your API
      const allJobs: Job[] = [
        {
          id: '1',
          title: 'Emergency Plumbing - Burst Pipe',
          description: 'Main water line burst in basement, need immediate help!',
          category: 'Plumbing',
          priority: 'emergency',
          budget: 500,
          zip_code: cleanZip || '12345',
          posted_date: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
          homeowner_name: 'Sarah Johnson',
          status: 'open'
        },
        {
          id: '2',
          title: 'Kitchen Electrical Outlet Not Working',
          description: 'GFCI outlet in kitchen stopped working, possibly after power surge.',
          category: 'Electrical',
          priority: 'high',
          budget: 200,
          zip_code: cleanZip || '12345',
          posted_date: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
          homeowner_name: 'Mike Chen',
          status: 'open'
        },
        {
          id: '3',
          title: 'HVAC System Annual Maintenance',
          description: 'Need annual maintenance check for HVAC system before winter.',
          category: 'HVAC',
          priority: 'normal',
          budget: 150,
          zip_code: cleanZip || '12346',
          posted_date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          homeowner_name: 'Lisa Rodriguez',
          status: 'open'
        },
        {
          id: '4',
          title: 'Roof Leak Repair',
          description: 'Small leak in roof, water dripping into attic during rain.',
          category: 'Roofing',
          priority: 'high',
          budget: 750,
          zip_code: cleanZip || '12345',
          posted_date: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
          homeowner_name: 'David Park',
          status: 'open'
        }
      ]

      // Apply filters
      let filteredJobs = allJobs

      // Filter by ZIP code
      if (cleanZip) {
        filteredJobs = filteredJobs.filter(job => job.zip_code === cleanZip)
      }

      // Filter by category
      if (selectedCategory) {
        filteredJobs = filteredJobs.filter(job => job.category === selectedCategory)
      }

      // Filter by priority
      if (selectedPriority) {
        filteredJobs = filteredJobs.filter(job => job.priority === selectedPriority)
      }

      setJobs(filteredJobs)
      setHasSearched(true)
    } catch (err) {
      setError('Failed to load jobs. Please try again.')
      console.error('Job filter error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Clear all filters
  const clearFilters = () => {
    setFilterZip('')
    setSelectedCategory('')
    setSelectedPriority('')
    setJobs([])
    setHasSearched(false)
    setError('')
  }

  // Handle Enter key press
  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      filterJobs()
    }
  }

  // Format time ago
  const timeAgo = (isoString: string) => {
    const diff = Date.now() - new Date(isoString).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  // Get priority badge
  const getPriorityBadge = (priority: Job['priority']) => {
    const config = priorities.find(p => p.value === priority)
    if (!config) return null

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
        priority === 'emergency' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200' :
        priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200' :
        'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
      }`}>
        {priority === 'emergency' && <AlertTriangle className="h-3 w-3" />}
        {config.label}
      </span>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Filter Header */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
          <Filter className="h-5 w-5 text-blue-600" />
          Available Jobs
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Filter jobs by location, category, and priority to find work in your service areas
        </p>
      </div>

      {/* Filter Controls */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          {/* ZIP Code Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              ZIP Code
            </label>
            <input
              type="text"
              value={filterZip}
              onChange={(e) => {
                setFilterZip(e.target.value)
                setError('')
              }}
              onKeyPress={handleKeyPress}
              placeholder="Filter by ZIP (optional)"
              maxLength={5}
              className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 dark:border-slate-600'
              }`}
            />
          </div>

          {/* Category Filter */}
          <div className="min-w-[150px]">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="min-w-[130px]">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Priority
            </label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Priorities</option>
              {priorities.map(priority => (
                <option key={priority.value} value={priority.value}>{priority.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={filterJobs}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
          >
            {loading ? (
              <>
                <img
                  src="https://jtrxdcccswdwlritgstp.supabase.co/storage/v1/object/public/contractor-logos/RushrLogoAnimation.gif"
                  alt="Loading..."
                  className="w-4 h-4 object-contain"
                />
                Loading...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Find Jobs
              </>
            )}
          </button>
          <button
            onClick={clearFilters}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Clear Filters
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>

      {/* Active Filters Display */}
      {(filterZip || selectedCategory || selectedPriority) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-600 dark:text-slate-400">Active filters:</span>
          {filterZip && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 rounded-full text-xs">
              <MapPin className="h-3 w-3" />
              ZIP: {filterZip}
            </span>
          )}
          {selectedCategory && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 rounded-full text-xs">
              {selectedCategory}
            </span>
          )}
          {selectedPriority && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200 rounded-full text-xs">
              {priorities.find(p => p.value === selectedPriority)?.label}
            </span>
          )}
        </div>
      )}

      {/* Results */}
      {hasSearched && (
        <div className="space-y-4">
          {jobs.length > 0 ? (
            <>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Found {jobs.length} job{jobs.length > 1 ? 's' : ''}
                {filterZip && ` in ZIP ${filterZip}`}
                {selectedCategory && ` in ${selectedCategory}`}
                {selectedPriority && ` with ${priorities.find(p => p.value === selectedPriority)?.label} priority`}
              </p>

              <div className="grid gap-4">
                {jobs.map(job => (
                  <div
                    key={job.id}
                    className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-800 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-2">
                          <div className="flex flex-col gap-1">
                            {getPriorityBadge(job.priority)}
                            <span className="text-xs text-slate-500">#{job.id}</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                              {job.title}
                            </h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 line-clamp-2">
                              {job.description}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                <span>ZIP {job.zip_code}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{timeAgo(job.posted_date)}</span>
                              </div>
                              {job.budget && (
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-4 w-4" />
                                  <span>Budget: ${job.budget}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="px-2 py-1 bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 text-xs rounded">
                                {job.category}
                              </span>
                              <span className="text-xs text-slate-500">
                                by {job.homeowner_name}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">
                          View Details
                        </button>
                        <button className="px-4 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 text-sm rounded-lg transition-colors">
                          Submit Bid
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
              <Filter className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No jobs found with current filters</p>
              <p className="text-xs text-slate-400 mt-1">
                Try adjusting your filters or search in different areas
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}