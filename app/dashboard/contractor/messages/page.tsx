'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useProAuth } from '../../../../contexts/ProAuthContext'
import { useConversations, useConversation, useTypingIndicator } from '../../../../lib/hooks/useMessaging'
import type { Conversation, Message as DBMessage, MessageOffer } from '../../../../lib/messaging'
import { MessagingAPI } from '../../../../lib/messaging'
import LoadingSpinner, { PageLoading, ButtonSpinner } from '../../../../components/LoadingSpinner'

/* ======================== Types ======================== */
type Role = 'homeowner' | 'pro'
type OfferStatus = 'pending' | 'accepted' | 'declined' | 'countered'
type Attachment = {
  id: string
  kind: 'image' | 'file'
  name: string
  url: string
  mime?: string
  size?: number
}
type MessageKind = 'text' | 'offer' | 'system' | 'file'
type Message = {
  id: string
  kind: MessageKind
  fromMe: boolean
  time: string
  status?: 'sent' | 'delivered' | 'seen'
  text?: string
  attachments?: Attachment[]
  offerTitle?: string
  offerPrice?: number
  offerDays?: number
  offerNotes?: string
  offerStatus?: OfferStatus
  counterPrice?: number
  counterDays?: number
  counterNotes?: string
  isDeleted?: boolean
  canDelete?: boolean
}

// Transform database message to UI message
function transformMessage(dbMessage: DBMessage, currentUserId: string): Message {
  const isFromMe = dbMessage.sender_id === currentUserId
  const isDeleted = dbMessage.metadata?.deleted || false
  const canDelete = MessagingAPI.canDeleteMessage(dbMessage, currentUserId, 24 * 60 * 60 * 1000) // 24 hours
  const attachments: Attachment[] = (dbMessage.attachments || []).map(att => ({
    id: att.id,
    kind: att.type === 'image' ? 'image' : 'file',
    name: att.filename,
    url: att.url,
    mime: att.content_type,
    size: att.size
  }))

  return {
    id: dbMessage.id,
    kind: dbMessage.message_type as MessageKind,
    fromMe: isFromMe,
    time: dbMessage.created_at,
    status: isFromMe ? 'sent' : undefined,
    text: dbMessage.content,
    attachments,
    isDeleted,
    canDelete
  }
}

// Transform database conversation to UI conversation
function transformConversation(dbConv: any, currentUserId: string): any {
  const isContractor = dbConv.pro_id === currentUserId
  return {
    id: dbConv.id,
    name: isContractor ? dbConv.homeowner_name : dbConv.pro_name,
    role: isContractor ? 'homeowner' : 'pro' as Role,
    avatar: isContractor ? dbConv.homeowner_avatar : dbConv.pro_avatar,
    lastMessage: dbConv.last_message_content || 'No messages yet',
    lastSeen: dbConv.last_message_at || dbConv.created_at,
    unread: dbConv.unread_count || 0,
    status: dbConv.status
  }
}

export default function ContractorMessagesPage() {
  const { user } = useProAuth()
  const searchParams = useSearchParams()
  const conversationId = searchParams.get('id')

  // Messaging hooks
  const { conversations, loading: conversationsLoading, error: conversationsError } = useConversations(user?.id, 'pro')
  const { conversation, messages, loading: messagesLoading, error: messagesError, sendMessage, deleteMessage } = useConversation(conversationId, user?.id)
  const { typingUsers, setTyping } = useTypingIndicator(conversationId)

  // UI state
  const [newMessage, setNewMessage] = useState('')
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Redirect if not contractor
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Contractor access required</h2>
          <Link href="/pro" className="btn-primary">Go to Pro Dashboard</Link>
        </div>
      </div>
    )
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversationId) return

    try {
      await sendMessage(newMessage, 'text')
      setNewMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessage(messageId)
      setMessageToDelete(null)
    } catch (error) {
      console.error('Failed to delete message:', error)
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!conversationId) return

    setUploadingFile(true)
    try {
      // Upload file and send message
      const fileUrl = await MessagingAPI.uploadFile(file, user.id)
      await sendMessage(`File shared: ${file.name}`, 'file', [{
        type: file.type.startsWith('image/') ? 'image' : 'file',
        filename: file.name,
        url: fileUrl,
        content_type: file.type,
        size: file.size
      }])
    } catch (error) {
      console.error('Failed to upload file:', error)
      alert('Failed to upload file')
    } finally {
      setUploadingFile(false)
    }
  }

  const formatMessageTime = (timeString: string) => {
    const date = new Date(timeString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))

    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    if (hours < 48) return 'Yesterday'
    return date.toLocaleDateString()
  }

  if (conversationsLoading) {
    return <PageLoading isLoading={true} loadingText="Loading conversations..." />
  }

  if (conversationsError) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Messages</h3>
          <p className="text-red-600">{conversationsError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const transformedConversations = conversations.map(conv => transformConversation(conv, user.id))

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/contractor"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
          </div>
          <div className="text-sm text-gray-500">
            {transformedConversations.length} conversation{transformedConversations.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Conversations List */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Conversations</h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {transformedConversations.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.906-1.476L3 21l2.476-5.094A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                  </svg>
                </div>
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs text-gray-400 mt-1">Messages from clients will appear here</p>
              </div>
            ) : (
              transformedConversations.map((conv) => (
                <Link
                  key={conv.id}
                  href={`/dashboard/contractor/messages?id=${conv.id}`}
                  className={`block p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    conversationId === conv.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                      <span className="text-emerald-600 font-medium text-sm">
                        {conv.name?.charAt(0)?.toUpperCase() || 'H'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900 truncate">{conv.name || 'Homeowner'}</h3>
                        <span className="text-xs text-gray-500">
                          {formatMessageTime(conv.lastSeen)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-gray-600 truncate">{conv.lastMessage}</p>
                        {conv.unread > 0 && (
                          <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[1.25rem] text-center">
                            {conv.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {!conversationId ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.906-1.476L3 21l2.476-5.094A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                <p>Choose a conversation from the sidebar to start messaging with clients</p>
              </div>
            </div>
          ) : messagesLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <LoadingSpinner size="lg" text="Loading messages..." />
            </div>
          ) : (
            <>
              {/* Conversation Header */}
              {conversation && (
                <div className="bg-white border-b border-gray-200 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                      <span className="text-emerald-600 font-medium">
                        {transformConversation(conversation, user.id).name?.charAt(0)?.toUpperCase() || 'H'}
                      </span>
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-900">
                        {transformConversation(conversation, user.id).name || 'Homeowner'}
                      </h2>
                      <p className="text-sm text-gray-500">Client</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((dbMessage) => {
                  const message = transformMessage(dbMessage, user.id)

                  if (message.isDeleted) {
                    return (
                      <div key={message.id} className="text-center">
                        <span className="text-sm text-gray-400 italic">Message deleted</span>
                      </div>
                    )
                  }

                  return (
                    <div
                      key={message.id}
                      className={`flex ${message.fromMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.fromMe
                          ? 'bg-blue-500 text-white'
                          : 'bg-white border border-gray-200 text-gray-900'
                      }`}>
                        {message.text && <p className="text-sm">{message.text}</p>}

                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {message.attachments.map((attachment) => (
                              <div key={attachment.id}>
                                {attachment.kind === 'image' ? (
                                  <img
                                    src={attachment.url}
                                    alt={attachment.name}
                                    className="max-w-full h-auto rounded"
                                  />
                                ) : (
                                  <a
                                    href={attachment.url}
                                    download={attachment.name}
                                    className="flex items-center gap-2 text-sm underline"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    {attachment.name}
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs opacity-70">
                            {formatMessageTime(message.time)}
                          </span>
                          {message.canDelete && (
                            <button
                              onClick={() => setMessageToDelete(message.id)}
                              className="text-xs opacity-70 hover:opacity-100"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Typing indicator */}
                {typingUsers.length > 0 && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg px-4 py-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <textarea
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value)
                        setTyping(true)
                      }}
                      onBlur={() => setTyping(false)}
                      placeholder="Type your message..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      rows={2}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                    />
                  </div>

                  <div className="flex gap-2">
                    <label className="btn btn-outline cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                        accept="image/*,.pdf,.doc,.docx"
                      />
                      {uploadingFile ? (
                        <ButtonSpinner />
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                      )}
                    </label>

                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete Message Modal */}
      {messageToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Message</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this message? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setMessageToDelete(null)}
                className="flex-1 btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteMessage(messageToDelete)}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}