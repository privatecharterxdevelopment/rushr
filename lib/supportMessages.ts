// Support messages management for admin panel
export interface SupportMessage {
  id: string
  userId: string
  userName: string
  userEmail: string
  message: string
  timestamp: string
  status: 'new' | 'read' | 'replied'
  adminReply?: string
  adminReplyTimestamp?: string
}

// In-memory store for development (in production, this would be in a database)
let supportMessages: SupportMessage[] = []

export class SupportMessagesAPI {
  // Add a new support message
  static addMessage(
    userId: string,
    userName: string,
    userEmail: string,
    message: string
  ): SupportMessage {
    const supportMessage: SupportMessage = {
      id: `support-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      userName,
      userEmail,
      message,
      timestamp: new Date().toISOString(),
      status: 'new'
    }

    supportMessages.unshift(supportMessage) // Add to beginning for latest first
    console.log('📨 New support message added:', supportMessage)

    return supportMessage
  }

  // Get all support messages (for admin panel)
  static getAllMessages(): SupportMessage[] {
    return supportMessages
  }

  // Mark message as read
  static markAsRead(messageId: string): void {
    const message = supportMessages.find(m => m.id === messageId)
    if (message) {
      message.status = 'read'
    }
  }

  // Add admin reply
  static addReply(messageId: string, reply: string): void {
    const message = supportMessages.find(m => m.id === messageId)
    if (message) {
      message.adminReply = reply
      message.adminReplyTimestamp = new Date().toISOString()
      message.status = 'replied'
    }
  }

  // Get unread count
  static getUnreadCount(): number {
    return supportMessages.filter(m => m.status === 'new').length
  }

  // Get messages for a specific user
  static getUserMessages(userId: string): SupportMessage[] {
    return supportMessages.filter(m => m.userId === userId)
  }
}