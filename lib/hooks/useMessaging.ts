'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { MessagingAPI, type Conversation, type Message, type ConversationParticipant } from '../messaging'
import { useAuth } from '../../contexts/AuthContext'
import { SupportMessagesAPI } from '../supportMessages'

// Hook for managing conversations list
export function useConversations(userId?: string, role?: 'homeowner' | 'pro') {
  const { user: homeownerUser } = useAuth()
  const user = userId ? { id: userId } : homeownerUser
  const userRole = role || 'homeowner'

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const subscriptionRef = useRef<any>(null)

  // Track read status for mock conversations
  const markConversationAsRead = useCallback((conversationId: string) => {
    setConversations(prev =>
      prev.map(conv =>
        conv.id === conversationId
          ? { ...conv, unread_count: 0 }
          : conv
      )
    )
  }, [])

  const loadConversations = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)

      // Mock conversation data with welcome message
      const welcomeConversation: Conversation = userRole === 'pro'
        ? {
            id: 'welcome-conv-pro-001',
            homeowner_id: '00000000-0000-0000-0000-000000000000',
            pro_id: user.id,
            title: 'Welcome to Rushr Pro!',
            status: 'active',
            last_message_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            homeowner_name: 'Rushr Support',
            homeowner_email: 'support@rushr.com',
            pro_name: null,
            pro_email: null,
            message_count: 1,
            unread_count: 1,
            last_message_content: 'Welcome to Rushr Pro! Start accepting jobs from homeowners.'
          }
        : {
            id: 'welcome-conv-001',
            homeowner_id: user.id,
            pro_id: '00000000-0000-0000-0000-000000000000',
            title: 'Welcome to Rushr!',
            status: 'active',
            last_message_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            pro_name: 'Rushr Support',
            pro_email: 'support@rushr.com',
            homeowner_name: null,
            homeowner_email: null,
            message_count: 1,
            unread_count: 1,
            last_message_content: 'Welcome to Rushr! Get help from verified professionals.'
          }

      const mockConversations: Conversation[] = [welcomeConversation]

      setConversations(mockConversations)
      setError(null)
    } catch (err) {
      console.error('Error loading conversations:', err)
      setError(err instanceof Error ? err.message : 'Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadConversations()

    // Subscribe to real-time updates
    if (user?.id) {
      subscriptionRef.current = MessagingAPI.subscribeToConversations(
        user.id,
        setConversations
      )
    }

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [loadConversations, user?.id])

  const createConversation = useCallback(async (
    homeownerId: string,
    proId: string,
    title: string,
    jobId?: string
  ) => {
    try {
      const conversation = await MessagingAPI.createOrGetConversation(
        homeownerId,
        proId,
        title,
        jobId
      )
      await loadConversations() // Refresh the list
      return conversation
    } catch (err) {
      console.error('Error creating conversation:', err)
      throw err
    }
  }, [loadConversations])

  return {
    conversations,
    loading,
    error,
    refresh: loadConversations,
    createConversation,
    markConversationAsRead
  }
}

// Hook for managing a specific conversation
export function useConversation(conversationId: string | null, userId?: string) {
  const { user: homeownerUser } = useAuth()
  const user = userId ? { id: userId } : homeownerUser
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [typingUsers, setTypingUsers] = useState<ConversationParticipant[]>([])
  const subscriptionRef = useRef<any>(null)
  const typingSubscriptionRef = useRef<any>(null)

  const loadConversation = useCallback(async () => {
    if (!conversationId || !user?.id) return

    try {
      setLoading(true)

      // Mock conversation data for homeowner welcome
      if (conversationId === 'welcome-conv-001') {
        const mockConversation: Conversation = {
          id: 'welcome-conv-001',
          homeowner_id: user.id,
          pro_id: '00000000-0000-0000-0000-000000000000',
          title: 'Welcome to Rushr!',
          status: 'active',
          last_message_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          pro_name: 'Rushr Support',
          pro_email: 'support@rushr.com'
        }

        const welcomeMessage: Message = {
          id: 'msg-001',
          conversation_id: conversationId,
          sender_id: '00000000-0000-0000-0000-000000000000',
          message_type: 'system',
          content: `Welcome to Rushr! 🎉

We're excited to help you get your home projects done quickly and reliably. Here's how it works:

1. **Post a job** - Describe what you need help with
2. **Get matched** - We'll connect you with qualified professionals
3. **Get quotes** - Receive competitive quotes from verified pros
4. **Choose & hire** - Select the best pro and get your project started

If you have any questions or need help, just reply to this message and our support team will assist you.

Thanks for choosing Rushr!
The Rushr Team`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        setConversation(mockConversation)
        setMessages([welcomeMessage])
        setError(null)
      } else if (conversationId === 'welcome-conv-pro-001') {
        // Pro welcome conversation
        const mockConversation: Conversation = {
          id: 'welcome-conv-pro-001',
          homeowner_id: '00000000-0000-0000-0000-000000000000',
          pro_id: user.id,
          title: 'Welcome to Rushr Pro!',
          status: 'active',
          last_message_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          homeowner_name: 'Rushr Support',
          homeowner_email: 'support@rushr.com',
          pro_name: null,
          pro_email: null
        }

        const welcomeMessage: Message = {
          id: 'msg-pro-001',
          conversation_id: conversationId,
          sender_id: '00000000-0000-0000-0000-000000000000',
          message_type: 'system',
          content: `Welcome to Rushr Pro! 🚀

Thank you for joining our network of trusted professionals! Here's how to get started:

1. **Complete your profile** - Make sure all your details are up to date
2. **Browse available jobs** - Check the Jobs tab for opportunities in your area
3. **Send quotes** - Respond to job requests with competitive quotes
4. **Get hired** - Build your reputation and grow your business

**Tips for success:**
• Respond quickly to job requests
• Provide detailed, accurate quotes
• Maintain high quality work
• Build great relationships with clients

If you have any questions or need assistance, our support team is here to help!

Best of luck,
The Rushr Team`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        setConversation(mockConversation)
        setMessages([welcomeMessage])
        setError(null)
      } else {
        setError('Conversation not found')
      }
    } catch (err) {
      console.error('Error loading conversation:', err)
      setError(err instanceof Error ? err.message : 'Failed to load conversation')
    } finally {
      setLoading(false)
    }
  }, [conversationId, user?.id])

  useEffect(() => {
    if (conversationId) {
      loadConversation()

      // Subscribe to new messages
      subscriptionRef.current = MessagingAPI.subscribeToMessages(
        conversationId,
        (newMessage) => {
          setMessages(prev => [...prev, newMessage])
        }
      )

      // Subscribe to typing indicators
      typingSubscriptionRef.current = MessagingAPI.subscribeToTyping(
        conversationId,
        setTypingUsers
      )
    } else {
      setConversation(null)
      setMessages([])
      setLoading(false)
    }

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
      if (typingSubscriptionRef.current) {
        typingSubscriptionRef.current.unsubscribe()
      }
    }
  }, [conversationId, loadConversation])

  const sendMessage = useCallback(async (content: string, replyToId?: string) => {
    if (!conversationId || !user?.id || !content.trim()) return

    try {
      // Handle mock conversation differently
      if (conversationId === 'welcome-conv-001') {
        const newMessage: Message = {
          id: `msg-${Date.now()}`,
          conversation_id: conversationId,
          sender_id: user.id,
          message_type: 'text',
          content: content.trim(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          reply_to_id: replyToId
        }

        // Add message to the local state immediately
        setMessages(prev => [...prev, newMessage])

        // Send to support system for admin panel
        SupportMessagesAPI.addMessage(
          user.id,
          user.email || 'Unknown User',
          user.email || '',
          content.trim()
        )

        // Update last message time in conversation
        setConversation(prev =>
          prev ? {
            ...prev,
            last_message_at: new Date().toISOString()
          } : prev
        )
        return
      }

      await MessagingAPI.sendMessage(conversationId, user.id, content.trim(), replyToId)
      // Message will be added via real-time subscription
    } catch (err) {
      console.error('Error sending message:', err)
      throw err
    }
  }, [conversationId, user?.id])

  const sendMessageWithFiles = useCallback(async (
    content: string,
    files: File[]
  ) => {
    if (!conversationId || !user?.id) return

    try {
      // Upload files first
      const attachments = await Promise.all(
        files.map(async (file) => {
          const fileUrl = await MessagingAPI.uploadFile(file, conversationId)
          return {
            file_name: file.name,
            file_url: fileUrl,
            file_type: file.type,
            file_size: file.size
          }
        })
      )

      await MessagingAPI.sendMessageWithAttachments(
        conversationId,
        user.id,
        content.trim(),
        attachments
      )
    } catch (err) {
      console.error('Error sending message with files:', err)
      throw err
    }
  }, [conversationId, user?.id])

  const sendOffer = useCallback(async (offer: {
    title: string
    price: number
    delivery_days: number
    notes?: string
  }) => {
    if (!conversationId || !user?.id) return

    try {
      await MessagingAPI.sendOffer(conversationId, user.id, offer)
    } catch (err) {
      console.error('Error sending offer:', err)
      throw err
    }
  }, [conversationId, user?.id])

  const updateOfferStatus = useCallback(async (
    offerId: string,
    status: 'accepted' | 'declined' | 'countered',
    counterData?: {
      counter_price?: number
      counter_days?: number
      counter_notes?: string
    }
  ) => {
    try {
      await MessagingAPI.updateOfferStatus(offerId, status, counterData)
      // Refresh conversation to get updated offer
      await loadConversation()
    } catch (err) {
      console.error('Error updating offer:', err)
      throw err
    }
  }, [loadConversation])

  const markAsRead = useCallback(async (messageId?: string) => {
    if (!conversationId || !user?.id) return

    try {
      // Handle mock conversation differently
      if (conversationId === 'welcome-conv-001') {
        // No need to call database for mock conversation
        return
      }

      await MessagingAPI.markAsRead(conversationId, user.id, messageId)
    } catch (err) {
      console.error('Error marking as read:', err)
    }
  }, [conversationId, user?.id])

  const setTyping = useCallback(async (isTyping: boolean) => {
    if (!conversationId || !user?.id) return

    try {
      await MessagingAPI.setTyping(conversationId, user.id, isTyping)
    } catch (err) {
      console.error('Error setting typing:', err)
    }
  }, [conversationId, user?.id])

  // Get other users who are typing (exclude current user)
  const otherTypingUsers = typingUsers.filter(participant => participant.user_id !== user?.id)

  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      await MessagingAPI.deleteMessage(messageId)
      await loadConversation() // Refresh to show updated message
    } catch (err) {
      console.error('Error deleting message:', err)
      throw err
    }
  }, [loadConversation])

  const deleteMessagePermanently = useCallback(async (messageId: string) => {
    try {
      await MessagingAPI.deleteMessagePermanently(messageId)
      await loadConversation() // Refresh to remove message
    } catch (err) {
      console.error('Error deleting message permanently:', err)
      throw err
    }
  }, [loadConversation])

  const archiveConversation = useCallback(async () => {
    if (!conversationId) return
    try {
      await MessagingAPI.archiveConversation(conversationId)
    } catch (err) {
      console.error('Error archiving conversation:', err)
      throw err
    }
  }, [conversationId])

  const deleteConversation = useCallback(async () => {
    if (!conversationId) return
    try {
      await MessagingAPI.deleteConversation(conversationId)
    } catch (err) {
      console.error('Error deleting conversation:', err)
      throw err
    }
  }, [conversationId])

  const deleteConversationPermanently = useCallback(async () => {
    if (!conversationId) return
    try {
      await MessagingAPI.deleteConversationPermanently(conversationId)
    } catch (err) {
      console.error('Error deleting conversation permanently:', err)
      throw err
    }
  }, [conversationId])

  return {
    conversation,
    messages,
    loading,
    error,
    typingUsers: otherTypingUsers,
    sendMessage,
    sendMessageWithFiles,
    sendOffer,
    updateOfferStatus,
    markAsRead,
    setTyping,
    deleteMessage,
    deleteMessagePermanently,
    archiveConversation,
    deleteConversation,
    deleteConversationPermanently,
    refresh: loadConversation
  }
}

// Hook for managing typing indicator with debouncing
export function useTypingIndicator(
  conversationId: string | null,
  setTyping: (isTyping: boolean) => Promise<void>
) {
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isTypingRef = useRef(false)

  const handleTyping = useCallback(() => {
    if (!conversationId) return

    // Start typing if not already
    if (!isTypingRef.current) {
      isTypingRef.current = true
      setTyping(true)
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false
      setTyping(false)
    }, 3000) // Stop typing after 3 seconds of inactivity
  }, [conversationId, setTyping])

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    if (isTypingRef.current) {
      isTypingRef.current = false
      setTyping(false)
    }
  }, [setTyping])

  useEffect(() => {
    return () => {
      stopTyping()
    }
  }, [stopTyping])

  return {
    handleTyping,
    stopTyping
  }
}