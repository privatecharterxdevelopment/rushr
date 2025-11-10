'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '../../../../lib/supabaseClient'
import {
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  User,
  MessageSquare,
  AlertCircle,
} from 'lucide-react'

interface ContactSubmission {
  id: string
  name: string
  email: string
  role: string
  subject: string
  message: string
  status: 'new' | 'in_progress' | 'resolved' | 'closed'
  admin_notes: string | null
  submitted_at: string
  resolved_at: string | null
}

export default function ContactSubmissionsPage() {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null)
  const [adminNotes, setAdminNotes] = useState('')

  useEffect(() => {
    fetchSubmissions()
  }, [statusFilter])

  const fetchSubmissions = async () => {
    try {
      setLoading(true)

      let query = supabase
        .from('contact_submissions')
        .select('*')
        .order('submitted_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query

      if (error) throw error

      setSubmissions(data || [])
    } catch (error) {
      console.error('Error fetching contact submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateSubmissionStatus = async (
    submissionId: string,
    status: string,
    notes?: string
  ) => {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      }

      if (status === 'resolved' || status === 'closed') {
        updateData.resolved_at = new Date().toISOString()
      }

      if (notes !== undefined) {
        updateData.admin_notes = notes
      }

      const { error } = await supabase
        .from('contact_submissions')
        .update(updateData)
        .eq('id', submissionId)

      if (error) throw error

      fetchSubmissions()
      setSelectedSubmission(null)
      setAdminNotes('')
    } catch (error) {
      console.error('Error updating submission status:', error)
      alert('Failed to update submission status')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="w-4 h-4" />
      case 'closed':
        return <XCircle className="w-4 h-4" />
      case 'in_progress':
        return <Clock className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const filteredSubmissions = submissions.filter(sub => {
    const matchesSearch =
      sub.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.subject?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  const stats = {
    total: filteredSubmissions.length,
    new: filteredSubmissions.filter(s => s.status === 'new').length,
    inProgress: filteredSubmissions.filter(s => s.status === 'in_progress').length,
    resolved: filteredSubmissions.filter(s => s.status === 'resolved').length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900">
          <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contact Submissions</h1>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            Support requests from contact form
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-slate-400">New</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.new}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-slate-400">In Progress</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.inProgress}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Resolved</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.resolved}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name, email, or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Status</option>
          <option value="new">New</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* Submissions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
            <thead className="bg-gray-50 dark:bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-800">
              {filteredSubmissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {sub.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-slate-400">
                          {sub.email}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-slate-500">
                          {sub.role}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white max-w-xs truncate">
                      {sub.subject}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-slate-400 max-w-xs truncate">
                      {sub.message}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(sub.status)}`}>
                      {getStatusIcon(sub.status)}
                      <span className="ml-1 capitalize">{sub.status.replace('_', ' ')}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                    {new Date(sub.submitted_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedSubmission(sub)
                        setAdminNotes(sub.admin_notes || '')
                      }}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSubmissions.length === 0 && (
          <div className="text-center py-12">
            <Mail className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No submissions found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              {searchTerm || statusFilter !== 'all' ? 'No submissions match your filters.' : 'No contact form submissions yet.'}
            </p>
          </div>
        )}
      </div>

      {/* View/Edit Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Contact Submission</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">From</label>
                <p className="text-sm text-gray-900 dark:text-white">{selectedSubmission.name} ({selectedSubmission.email})</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Role: {selectedSubmission.role}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Subject</label>
                <p className="text-sm text-gray-900 dark:text-white">{selectedSubmission.subject}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Message</label>
                <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{selectedSubmission.message}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Submitted</label>
                <p className="text-sm text-gray-900 dark:text-white">{new Date(selectedSubmission.submitted_at).toLocaleString()}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300 block mb-2">Admin Notes</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={4}
                />
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <button
                  onClick={() => updateSubmissionStatus(selectedSubmission.id, 'in_progress', adminNotes)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                >
                  Mark In Progress
                </button>
                <button
                  onClick={() => updateSubmissionStatus(selectedSubmission.id, 'resolved', adminNotes)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
                >
                  Mark Resolved
                </button>
                <button
                  onClick={() => updateSubmissionStatus(selectedSubmission.id, 'closed', adminNotes)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setSelectedSubmission(null)
                    setAdminNotes('')
                  }}
                  className="ml-auto px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
