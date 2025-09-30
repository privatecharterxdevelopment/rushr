# Real-time Messaging System

A complete real-time messaging system for communication between homeowners and pros built with Supabase and Next.js.

## Features

✅ **Real-time messaging** - Messages appear instantly using Supabase real-time subscriptions
✅ **File attachments** - Support for images and files with secure storage
✅ **Quote system** - Pros can send structured quotes with accept/decline/counter functionality
✅ **Typing indicators** - See when the other person is typing
✅ **Read receipts** - Track message delivery and read status
✅ **Conversation management** - Organized conversation threads
✅ **Role-based features** - Different features for homeowners vs pros
✅ **Search & filters** - Find conversations and messages quickly
✅ **Responsive design** - Works on desktop and mobile

1. Create test users (homeowner and pro roles)
2. Visit `/messages/real-time` to see the messaging interface
3. Use the conversation starter components in your app

## Database Schema

### Core Tables

- conversations - Chat threads between homeowners and pros
- messages - Individual messages with support for different types
- message_attachments - File attachments linked to messages
- message_offers - Structured quotes/offers from pros
- conversation_participants - User participation and read status

### Storage

- message-attachments bucket - Secure file storage for attachments (@zac, ive added a 5MB file upload max)

### Starting a Conversation

```tsx
import { StartConversationButton, MessageProButton } from '@/components/StartConversationButton'

// Basic conversation starter
<StartConversationButton
  otherUserId="pro-user-id"
  otherUserName="John's Plumbing"
  otherUserRole="pro"
  title="Kitchen Sink Repair"
/>

// Quick message for getting a quote
<MessageProButton
  proId="pro-user-id"
  proName="John's Plumbing"
  jobId="job-123"
  jobTitle="Kitchen Sink Repair"
/>
```

### Using the Messaging Hooks

```tsx
import { useConversations, useConversation } from '@/lib/hooks/useMessaging'

function MessagingComponent() {
  // Get all conversations
  const { conversations, loading, createConversation } = useConversations()

  // Get specific conversation with real-time updates
  const {
    conversation,
    messages,
    sendMessage,
    sendOffer,
    markAsRead,
    setTyping
  } = useConversation('conversation-id')

  return (
    // Your messaging UI
  )
}
```

### Direct API Usage

```tsx
import { MessagingAPI } from '@/lib/messaging'

// Send a message
await MessagingAPI.sendMessage(conversationId, userId, 'Hello!')

// Send a quote/offer
await MessagingAPI.sendOffer(conversationId, userId, {
  title: 'Kitchen Repair',
  price: 150,
  delivery_days: 2,
  notes: 'Materials included'
})

// Upload file and send with message
const fileUrl = await MessagingAPI.uploadFile(file, conversationId)
await MessagingAPI.sendMessageWithAttachments(conversationId, userId, 'Check this out', [
  { file_name: file.name, file_url: fileUrl, file_type: file.type }
])
```

## Real-time Features

The system uses Supabase real-time subscriptions for:

- New messages appearing instantly
- Typing indicators
- Read status updates
- Conversation list updates

All subscriptions are automatically managed by the React hooks.

## File Structure

```
lib/
├── messaging.ts              # Core messaging API functions
├── hooks/useMessaging.ts     # React hooks for messaging
├── database.types.ts         # TypeScript types for database
└── supabaseClient.ts         # Supabase client configuration

app/messages/
├── page.tsx                  # Original mock messaging page
└── real-time/page.tsx        # New real-time messaging page

components/
└── StartConversationButton.tsx # Components for starting conversations

SQL files:
├── messaging-system-setup.sql    # Core database tables
└── messaging-setup-complete.sql  # Storage, functions, sample data
```

## Security

- **Row Level Security (RLS)** enabled on all tables
- Users can only access conversations they participate in
- File uploads are scoped to conversation participants
- All database operations require authentication

### Debug Tools

Check the browser console for real-time subscription status:
```javascript
// Should show active subscriptions
console.log(supabase.getChannels())
```

## Next Steps

1. Integrate with job postings - Connect conversations to specific jobs
2. Push notifications** - Notify users of new messages
3. Message encryption** - Add end-to-end encryption for sensitive data
4. Admin tools - Moderation and support features
5. Mobile app - React Native implementation using the same backend

## Support

- Check the Supabase logs for database errors
- Use the browser network tab to debug API calls
- Refer to the Supabase real-time documentation for subscription issues