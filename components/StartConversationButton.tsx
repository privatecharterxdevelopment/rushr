'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../lib/guards'
import { MessagingAPI } from '../lib/messaging'

interface StartConversationButtonProps {
  otherUserId: string
  otherUserName: string
  otherUserRole: 'homeowner' | 'pro'
  title?: string
  jobId?: string
  className?: string
  children?: React.ReactNode
}

export function StartConversationButton({
  otherUserId,
  otherUserName,
  otherUserRole,
  title,
  jobId,
  className = "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500",
  children = "Send Message"
}: StartConversationButtonProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleStartConversation = async () => {
    if (!user?.id) {
      alert('Please sign in to start a conversation')
      return
    }

    if (user.id === otherUserId) {
      alert('You cannot start a conversation with yourself')
      return
    }

    setLoading(true)
    try {
      // Determine conversation participants
      let homeownerId: string
      let proId: string

      // Get current user role from user profiles or assume based on other user
      if (otherUserRole === 'pro') {
        // Other user is pro, so current user is homeowner
        homeownerId = user.id
        proId = otherUserId
      } else {
        // Other user is homeowner, so current user is pro
        homeownerId = otherUserId
        proId = user.id
      }

      const conversationTitle = title || `Conversation with ${otherUserName}`

      // Create or get existing conversation
      const conversation = await MessagingAPI.createOrGetConversation(
        homeownerId,
        proId,
        conversationTitle,
        jobId
      )

      // Redirect to the real-time messages page with the conversation active
      router.push(`/messages/real-time?conversation=${conversation.id}`)
    } catch (error) {
      console.error('Failed to start conversation:', error)
      alert('Failed to start conversation. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleStartConversation}
      disabled={loading}
      className={className}
    >
      {loading ? (
        <>
          <img
            src="https://jtrxdcccswdwlritgstp.supabase.co/storage/v1/object/public/contractor-logos/RushrLogoAnimation.gif"
            alt="Loading..."
            className="w-4 h-4 object-contain -ml-1 mr-2"
          />
          Starting...
        </>
      ) : (
        children
      )}
    </button>
  )
}

// Quick message button for specific contexts
export function QuickMessageButton({
  otherUserId,
  otherUserName,
  otherUserRole,
  message,
  title,
  jobId,
  className,
  children
}: StartConversationButtonProps & { message?: string }) {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleQuickMessage = async () => {
    if (!user?.id) {
      alert('Please sign in to send a message')
      return
    }

    if (user.id === otherUserId) {
      alert('You cannot send a message to yourself')
      return
    }

    setLoading(true)
    try {
      // Determine conversation participants
      let homeownerId: string
      let proId: string

      if (otherUserRole === 'pro') {
        homeownerId = user.id
        proId = otherUserId
      } else {
        homeownerId = otherUserId
        proId = user.id
      }

      const conversationTitle = title || `Conversation with ${otherUserName}`

      // Create conversation
      const conversation = await MessagingAPI.createOrGetConversation(
        homeownerId,
        proId,
        conversationTitle,
        jobId
      )

      // Send initial message if provided
      if (message && message.trim()) {
        await MessagingAPI.sendMessage(conversation.id, user.id, message.trim())
      }

      // Redirect to messages
      router.push(`/messages/real-time?conversation=${conversation.id}`)
    } catch (error) {
      console.error('Failed to send message:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleQuickMessage}
      disabled={loading}
      className={className}
    >
      {loading ? (
        <>
          <img
            src="https://jtrxdcccswdwlritgstp.supabase.co/storage/v1/object/public/contractor-logos/RushrLogoAnimation.gif"
            alt="Loading..."
            className="w-4 h-4 object-contain -ml-1 mr-2"
          />
          Sending...
        </>
      ) : (
        children
      )}
    </button>
  )
}

// Component for messaging a pro about a specific job
export function MessageProButton({
  proId,
  proName,
  jobId,
  jobTitle
}: {
  proId: string
  proName: string
  jobId?: string
  jobTitle?: string
}) {
  return (
    <QuickMessageButton
      otherUserId={proId}
      otherUserName={proName}
      otherUserRole="pro"
      title={jobTitle ? `Job: ${jobTitle}` : undefined}
      jobId={jobId}
      message={jobTitle ? `Hi! I'm interested in getting a quote for: ${jobTitle}` : "Hi! I'm interested in getting a quote."}
      className="w-full justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
    >
      Get Quote
    </QuickMessageButton>
  )
}

// Component for a pro to message a homeowner about their job posting
export function MessageHomeownerButton({
  homeownerId,
  homeownerName,
  jobId,
  jobTitle
}: {
  homeownerId: string
  homeownerName: string
  jobId?: string
  jobTitle?: string
}) {
  return (
    <QuickMessageButton
      otherUserId={homeownerId}
      otherUserName={homeownerName}
      otherUserRole="homeowner"
      title={jobTitle ? `Job: ${jobTitle}` : undefined}
      jobId={jobId}
      message={jobTitle ? `Hi! I'm interested in your job posting: ${jobTitle}. I'd like to provide you with a quote.` : "Hi! I'm interested in your job posting and would like to provide you with a quote."}
      className="w-full justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
    >
      Send Quote
    </QuickMessageButton>
  )
}