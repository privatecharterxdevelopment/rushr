'use client'

import React, { useEffect, useState, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '../../../../contexts/AuthContext'
import { supabase } from '../../../../lib/supabaseClient'
import { ArrowLeft, Send, MessageSquare } from 'lucide-react'

interface Conversation {
  id: string
  contractor_id: string
  contractor_name: string
  job_id: string
  job_title: string
  last_message: string | null
  last_message_at: string | null
  unread_count: number
  status: string
}

interface Message {
  id: string
  content: string
  sender_id: string
  sender_type: 'homeowner' | 'contractor'
  created_at: string
  conversation_id: string
}

interface TypingStatus {
  conversation_id: string
  user_id: string
  is_typing: boolean
  timestamp: string
}

function MessagesContent() {
  const { user, userProfile, loading: authLoading } = useAuth()
  const searchParams = useSearchParams()
  const conversationId = searchParams.get('id')

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [contractorTyping, setContractorTyping] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <img
          src="https://jtrxdcccswdwlritgstp.supabase.co/storage/v1/object/public/contractor-logos/RushrLogoAnimation.gif"
          alt="Loading..."
          className="h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4 object-contain"
        />
          <p>Loading messages...</p>
        </div>
      </div>
    )
  }

  // Redirect if not homeowner
  if (!user || !userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Homeowner access required</h2>
          <Link href="/" className="btn-primary">Go to Home</Link>
        </div>
      </div>
    )
  }

  // Fetch conversations with real data
  useEffect(() => {
    const fetchConversations = async () => {
      if (!user) return

      try {
        const { data: convos, error } = await supabase
          .from('conversations')
          .select('id, homeowner_id, pro_id, job_id, status, last_message_at, homeowner_unread_count')
          .eq('homeowner_id', user.id)
          .order('last_message_at', { ascending: false, nullsFirst: false })

        if (error) {
          console.error('Error fetching conversations:', error)
        } else {
          // Get last message and related data for each conversation
          const conversationsWithMessages = await Promise.all(
            (convos || []).map(async (convo: any) => {
              // Fetch last message
              const { data: lastMsg } = await supabase
                .from('messages')
                .select('content')
                .eq('conversation_id', convo.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single()

              // Fetch contractor details
              const { data: contractor } = await supabase
                .from('pro_contractors')
                .select('id, business_name, name')
                .eq('id', convo.pro_id)
                .single()

              // Fetch job details
              const { data: job } = await supabase
                .from('homeowner_jobs')
                .select('id, title')
                .eq('id', convo.job_id)
                .single()

              return {
                id: convo.id,
                contractor_id: convo.pro_id,
                contractor_name: contractor?.business_name || contractor?.name || 'Contractor',
                job_id: convo.job_id,
                job_title: job?.title || 'Job',
                last_message: lastMsg?.content || 'No messages yet',
                last_message_at: convo.last_message_at,
                unread_count: convo.homeowner_unread_count || 0,
                status: convo.status
              }
            })
          )

          setConversations(conversationsWithMessages)
        }
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()

    // Subscribe to conversation updates
    const conversationSubscription = supabase
      .channel('homeowner_conversations')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `homeowner_id=eq.${user.id}`
      }, () => {
        fetchConversations()
      })
      .subscribe()

    return () => {
      conversationSubscription.unsubscribe()
    }
  }, [user])

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!conversationId) {
      setSelectedConversation(null)
      return
    }

    const selected = conversations.find(c => c.id === conversationId)
    setSelectedConversation(selected || null)

    const fetchMessages = async () => {
      const { data: msgs, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching messages:', error)
      } else {
        setMessages(msgs || [])

        // Mark messages as read
        await markAsRead()
      }
    }

    fetchMessages()

    // Subscribe to new messages in this conversation
    const messageSubscription = supabase
      .channel(`messages_${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message])
        scrollToBottom()
      })
      .subscribe()

    // Subscribe to typing indicators
    const typingChannel = supabase
      .channel(`typing_${conversationId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = typingChannel.presenceState()
        const typing = Object.values(state).some((presences: any) =>
          presences.some((p: any) => p.user_id !== user.id && p.is_typing)
        )
        setContractorTyping(typing)
      })
      .subscribe()

    return () => {
      messageSubscription.unsubscribe()
      typingChannel.unsubscribe()
    }
  }, [conversationId, conversations, user])

  // Mark conversation as read
  const markAsRead = async () => {
    if (!conversationId || !user) return

    await supabase
      .from('conversations')
      .update({ homeowner_unread_count: 0 })
      .eq('id', conversationId)
  }

  // Handle typing indicator
  const handleTyping = () => {
    if (!conversationId || !user) return

    setIsTyping(true)

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Send typing status
    const typingChannel = supabase.channel(`typing_${conversationId}`)
    typingChannel.track({
      user_id: user.id,
      is_typing: true,
      timestamp: new Date().toISOString()
    })

    // Stop typing after 2 seconds of no input
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      typingChannel.track({
        user_id: user.id,
        is_typing: false,
        timestamp: new Date().toISOString()
      })
    }, 2000)
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversationId || !user) return

    setSending(true)
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          sender_type: 'homeowner',
          content: newMessage.trim()
        })

      if (error) {
        console.error('Failed to send message:', error)
        alert('Failed to send message. Please try again.')
      } else {
        setNewMessage('')

        // Stop typing indicator
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current)
        }
        setIsTyping(false)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <img
          src="https://jtrxdcccswdwlritgstp.supabase.co/storage/v1/object/public/contractor-logos/RushrLogoAnimation.gif"
          alt="Loading..."
          className="h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4 object-contain"
        />
          <p>Loading messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/homeowner" className="btn btn-outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            <p className="text-gray-600">Chat with your contractors</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Conversations List */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversations</h2>
            {conversations.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No conversations yet</p>
                <p className="text-sm text-gray-500 mt-2">
                  Messages will appear here when contractors accept your jobs
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <Link
                    key={conv.id}
                    href={`/dashboard/homeowner/messages?id=${conv.id}`}
                    className={`block p-4 rounded-lg border transition-colors ${
                      conversationId === conv.id
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{conv.contractor_name}</h3>
                      {conv.unread_count > 0 && (
                        <span className="bg-emerald-600 text-white text-xs rounded-full px-2 py-1 font-medium">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-1 font-medium">{conv.job_title}</p>
                    <p className="text-sm text-gray-500 truncate">{conv.last_message}</p>
                    {conv.last_message_at && (
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(conv.last_message_at).toLocaleString()}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {conversationId && selectedConversation ? (
            <>
              {/* Conversation Header */}
              <div className="bg-white border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">{selectedConversation.contractor_name}</h2>
                <p className="text-sm text-gray-600">{selectedConversation.job_title}</p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Start a conversation</h3>
                    <p className="text-gray-600">
                      Send a message to discuss job details with your contractor
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_type === 'homeowner' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-md rounded-2xl px-5 py-3 shadow-sm ${
                            msg.sender_type === 'homeowner'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-gray-200 text-gray-900'
                          }`}
                          style={{
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            wordBreak: 'break-word',
                            maxWidth: '70%'
                          }}
                        >
                          <p className="text-[16px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          <p className={`text-xs mt-2 ${msg.sender_type === 'homeowner' ? 'text-emerald-100' : 'text-gray-500'}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Typing Indicator */}
                    {contractorTyping && (
                      <div className="flex justify-start">
                        <div className="bg-gray-200 text-gray-900 rounded-2xl px-5 py-3 shadow-sm">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value)
                      handleTyping()
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-3 text-[16px] border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50"
                    disabled={sending}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No conversation selected</h3>
                <p className="text-gray-600">
                  Select a conversation from the list to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function HomeownerMessagesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <img
          src="https://jtrxdcccswdwlritgstp.supabase.co/storage/v1/object/public/contractor-logos/RushrLogoAnimation.gif"
          alt="Loading..."
          className="h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4 object-contain"
        />
          <p>Loading messages...</p>
        </div>
      </div>
    }>
      <MessagesContent />
    </Suspense>
  )
}
