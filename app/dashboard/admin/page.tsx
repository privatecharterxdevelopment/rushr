'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { SupportMessagesAPI, type SupportMessage } from '../../../lib/supportMessages'
import LoadingSpinner, { PageLoading } from '../../../components/LoadingSpinner'

export default function AdminDashboard() {
  const { userProfile } = useAuth()
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null)
  const [replyText, setReplyText] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Check if user is admin (you can modify this logic as needed)
  const isAdmin = userProfile?.email === 'admin@userushr.com' || userProfile?.role === 'admin'

  useEffect(() => {
    // Load messages every 5 seconds to simulate real-time updates
    const loadMessages = () => {
      setMessages(SupportMessagesAPI.getAllMessages())
      setIsLoading(false) // Stop loading after first load
    }

    // Initial load with delay
    const timer = setTimeout(() => {
      loadMessages()
    }, 1000)

    const interval = setInterval(loadMessages, 5000)

    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [])

  const handleReply = (messageId: string) => {
    if (replyText.trim()) {
      SupportMessagesAPI.addReply(messageId, replyText.trim())
      setMessages(SupportMessagesAPI.getAllMessages())
      setReplyText('')
      setSelectedMessage(null)
    }
  }

  const markAsRead = (messageId: string) => {
    SupportMessagesAPI.markAsRead(messageId)
    setMessages(SupportMessagesAPI.getAllMessages())
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access the admin panel.</p>
          <p className="text-sm text-gray-500 mt-2">
            Admin access required. Contact support if you need access.
          </p>
        </div>
      </div>
    )
  }

  const unreadCount = messages.filter(m => m.status === 'new').length

  return (
    <PageLoading isLoading={isLoading} loadingText="Loading support messages...">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              Support Messages
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {unreadCount} new
                </span>
              )}
            </h1>
            <p className="text-gray-600">Messages from users sent to the welcome chat</p>
          </div>

          <div className="divide-y divide-gray-200">
            {messages.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No support messages yet
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-medium text-gray-900">
                          {message.userName}
                        </h3>
                        <span className="text-xs text-gray-500">
                          ({message.userEmail})
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          message.status === 'new' ? 'bg-red-100 text-red-800' :
                          message.status === 'read' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {message.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-700">{message.message}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {new Date(message.timestamp).toLocaleString()}
                      </p>

                      {message.adminReply && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-md">
                          <p className="text-sm text-blue-900">
                            <span className="font-medium">Admin Reply:</span> {message.adminReply}
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            {new Date(message.adminReplyTimestamp!).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2 ml-4">
                      {message.status === 'new' && (
                        <button
                          onClick={() => markAsRead(message.id)}
                          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded"
                        >
                          Mark Read
                        </button>
                      )}

                      {!message.adminReply && (
                        <button
                          onClick={() => setSelectedMessage(message)}
                          className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded"
                        >
                          Reply
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Reply Modal */}
        {selectedMessage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Reply to {selectedMessage.userName}
              </h3>

              <div className="mb-4 p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-700">{selectedMessage.message}</p>
              </div>

              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply..."
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
              />

              <div className="flex space-x-3 mt-4">
                <button
                  onClick={() => handleReply(selectedMessage.id)}
                  disabled={!replyText.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Send Reply
                </button>
                <button
                  onClick={() => {
                    setSelectedMessage(null)
                    setReplyText('')
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </PageLoading>
  )
}