# Left Sidebar Contractor Workflow - Implementation Status

## Overview
Implementing a full contractor discovery, bidding, chat, and payment workflow into the `/find-pro` map page's left sidebar, similar to Uber's two-panel interface.

## ✅ Completed

### 1. Database Setup
**File**: `/supabase/migrations/20251018000004_bid_notifications.sql`
- ✅ Created `notify_homeowner_bid_response()` trigger function
- ✅ Created `notify_contractor_bid_accepted()` trigger function
- ✅ Triggers create notifications when:
  - Contractor submits a bid → Homeowner gets notification
  - Homeowner accepts bid → Contractor gets notification
- ✅ Added indexes for faster notification queries
- **Status**: Ready to run in Supabase SQL Editor

### 2. API Endpoints
**File**: `/app/api/bids/create/route.ts`
- ✅ POST `/api/bids/create` endpoint
- ✅ Creates `homeowner_jobs` record with status: 'bidding'
- ✅ Creates `job_bids` record linking homeowner and contractor
- ✅ Sends notification to contractor
- **Status**: Complete and functional

### 3. UI Components Created
**File**: `/components/SendRequestForm.tsx`
- ✅ Full form component for sending job requests
- ✅ Fields: title, description, category, price offer (optional), urgency
- ✅ Validation and error handling
- ✅ Calls `/api/bids/create` endpoint
- ✅ Success/error states with loading indicator
- **Status**: Complete and ready to integrate

## 🚧 Remaining Work

### 4. ContractorProfileSidebar Component
**File to create**: `/components/ContractorProfileSidebar.tsx`

**Features needed**:
```typescript
interface ContractorProfileSidebarProps {
  contractor: Contractor
  onClose: () => void
  onSendRequest: () => void
}
```

**Structure**:
- Header with contractor name, avatar, rating
- Tabs: "Overview" | "Reviews" | "Send Request"
- Overview tab shows:
  - Business name
  - Services offered
  - Hourly rate / pricing info
  - Years of experience
  - Service area (ZIP codes)
  - Contact info (phone, website)
- Reviews tab shows customer testimonials
- Send Request tab embeds `<SendRequestForm />`
- Bottom CTA: "Send Request" button

### 5. PendingRequestsList Component
**File to create**: `/components/PendingRequestsList.tsx`

**Features needed**:
```typescript
interface PendingRequestsListProps {
  homeownerId: string
  onViewRequest: (jobId: string, contractorId: string) => void
}
```

**Structure**:
- Fetch all job_bids where homeowner_id = userId
- Group by status: 'pending', 'accepted', 'rejected'
- Each card shows:
  - Contractor name + avatar
  - Job title
  - Status badge (⏳ Pending, ✅ Accepted, ❌ Declined)
  - Bid amount (if contractor responded)
  - "View Details" button
- Real-time updates via Supabase subscription:
  ```typescript
  supabase
    .channel('bids')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'job_bids',
      filter: `homeowner_id=eq.${userId}`
    }, payload => {
      // Update local state
    })
    .subscribe()
  ```

### 6. SidebarChat Component
**File to create**: `/components/SidebarChat.tsx`

**Features needed**:
```typescript
interface SidebarChatProps {
  conversationId: string
  currentUserId: string
  otherUserName: string
  onClose: () => void
}
```

**Structure**:
- Header: Contractor name + "Back" button
- Message list (scrollable):
  - Fetch messages from `messages` table
  - Group by date
  - Show sender name, message, timestamp
  - Support for system messages (different styling)
- Message input at bottom
- Real-time via Supabase:
  ```typescript
  supabase
    .channel(`conversation:${conversationId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`
    }, payload => {
      // Add new message to state
    })
    .subscribe()
  ```
- API calls:
  - POST `/api/messages/send` to send message
  - PUT `/api/messages/mark-read` to mark as read

**Note**: Messaging system already exists in database (`conversations`, `messages` tables)

### 7. PaymentModal Component
**File to create**: `/components/PaymentModal.tsx`

**Features needed**:
```typescript
interface PaymentModalProps {
  bidId: string
  jobTitle: string
  contractorName: string
  amount: number
  platformFee: number
  stripeFee: number
  onSuccess: () => void
  onClose: () => void
}
```

**Structure**:
- Modal overlay (fixed, z-50)
- Job summary card:
  - Title, contractor, amount
  - Fee breakdown
  - Total to escrow
- Stripe Elements integration:
  ```typescript
  import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
  import { loadStripe } from '@stripe/stripe-js'

  const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  ```
- Payment flow:
  1. User clicks "Accept Offer"
  2. Modal opens
  3. Calls `/api/payments/create-hold` → Get clientSecret
  4. Use Stripe Elements to collect card info
  5. Call `stripe.confirmCardPayment(clientSecret)`
  6. If successful → Call `/api/payments/capture`
  7. Show success toast
  8. Close modal

**API endpoints already exist**:
- `/api/payments/create-hold`
- `/api/payments/capture`
- `/api/payments/confirm-complete`
- `/api/payments/release`

### 8. Update find-pro Page
**File to update**: `/app/find-pro/page.tsx`

**Changes needed**:

1. **Update sidebar state**:
```typescript
type SidebarPage = 'search' | 'results' | 'contractor-profile' | 'send-request' | 'pending-requests' | 'chat'

const [sidebarPage, setSidebarPage] = useState<SidebarPage>('search')
const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null)
const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
```

2. **Add state for pending bids**:
```typescript
const [pendingBids, setPendingBids] = useState<Bid[]>([])

useEffect(() => {
  if (user) {
    // Fetch pending bids
    const fetchBids = async () => {
      const { data } = await supabase
        .from('job_bids')
        .select('*, contractor_profiles(*), homeowner_jobs(*)')
        .eq('homeowner_id', user.id)
        .order('created_at', { ascending: false })
      setPendingBids(data || [])
    }
    fetchBids()
  }
}, [user])
```

3. **Update sidebar render logic**:
```typescript
{sidebarPage === 'contractor-profile' && selectedContractor && (
  <ContractorProfileSidebar
    contractor={selectedContractor}
    onClose={() => setSidebarPage('results')}
    onSendRequest={() => setSidebarPage('send-request')}
  />
)}

{sidebarPage === 'send-request' && selectedContractor && (
  <SendRequestForm
    contractor={selectedContractor}
    onClose={() => setSidebarPage('contractor-profile')}
    onSuccess={(jobId, bidId) => {
      // Show success toast
      toast.success('Request sent!')
      // Return to results with pending badge
      setSidebarPage('results')
      // Refresh pending bids
    }}
  />
)}

{sidebarPage === 'pending-requests' && (
  <PendingRequestsList
    homeownerId={user!.id}
    onViewRequest={(jobId, contractorId) => {
      // Load contractor and show profile
      setSidebarPage('contractor-profile')
    }}
  />
)}

{sidebarPage === 'chat' && selectedConversationId && (
  <SidebarChat
    conversationId={selectedConversationId}
    currentUserId={user!.id}
    otherUserName={selectedContractor?.name || ''}
    onClose={() => setSidebarPage('contractor-profile')}
  />
)}
```

4. **Add "Pending Requests" button in search sidebar**:
```typescript
<button
  onClick={() => setSidebarPage('pending-requests')}
  className="btn-secondary w-full"
>
  View Pending Requests {pendingBids.length > 0 && `(${pendingBids.length})`}
</button>
```

5. **Update contractor cards in results**:
```typescript
// Add pending badge if homeowner has pending bid with this contractor
const hasPendingBid = pendingBids.some(bid =>
  bid.contractor_id === contractor.id && bid.status === 'pending'
)

{hasPendingBid && (
  <span className="absolute top-2 right-2 bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
    <Loader className="h-3 w-3 animate-spin" />
    Pending
  </span>
)}
```

6. **Add "Contact" button handler**:
```typescript
<button
  onClick={() => {
    setSelectedContractor(contractor)
    setSidebarPage('contractor-profile')
  }}
  className="btn-primary"
>
  Contact
</button>
```

### 9. Update NotificationBell Component
**File to update**: `/components/NotificationBell.tsx`

**Changes needed**:

1. **Add support for new notification types**:
```typescript
const getTypeIcon = (type: string) => {
  switch (type) {
    case 'bid_response':
      return <DollarSign className="h-5 w-5 text-emerald-600" />
    case 'bid_accepted':
      return <CheckCircle className="h-5 w-5 text-green-600" />
    case 'job_request':
      return <Briefcase className="h-5 w-5 text-blue-600" />
    // ... existing cases
  }
}
```

2. **Handle click on bid notifications**:
```typescript
const handleNotificationClick = (notification: Notification) => {
  markAsRead(notification.id)

  if (notification.type === 'bid_response') {
    // Navigate to /find-pro with contractor profile open
    const { contractor_id } = notification.metadata
    router.push(`/find-pro?contractor=${contractor_id}&action=view-bid`)
  } else if (notification.type === 'bid_accepted') {
    // Navigate to conversation
    const { job_id } = notification.metadata
    router.push(`/messages?job=${job_id}`)
  }
}
```

### 10. Additional API Endpoints Needed
**Files to create**:

1. `/app/api/messages/send/route.ts`:
```typescript
POST /api/messages/send
Body: { conversationId, senderId, content, messageType }
Returns: { messageId, success }
```

2. `/app/api/messages/mark-read/route.ts`:
```typescript
PUT /api/messages/mark-read
Body: { conversationId, userId }
Returns: { success }
```

3. `/app/api/bids/accept/route.ts`:
```typescript
POST /api/bids/accept
Body: { bidId, homeownerId }
Returns: { success, conversationId, paymentRequired: true }
```
This should:
- Update bid status to 'accepted'
- Update job status to 'bid_accepted'
- Create conversation (if not exists)
- Return flag indicating payment modal should open

## User Flow Summary

```
1. Homeowner searches map → Sees contractors
2. Clicks "Contact" on contractor → Sidebar shows ContractorProfileSidebar
3. Clicks "Send Request" tab → Shows SendRequestForm
4. Fills form → Sends request → Returns to results with "Pending ⏳" badge
5. Contractor responds → Homeowner gets notification (+1 on bell)
6. Clicks notification → Opens contractor profile with bid details
7. Clicks "Accept Offer" → PaymentModal opens
8. Enters card → Pays escrow → Success toast
9. Chat automatically activates → Can negotiate in SidebarChat
10. Job starts → Track contractor from dashboard
11. Both confirm complete → Payment auto-releases
```

## Integration Checklist

- [x] Database triggers for notifications
- [x] API endpoint: `/api/bids/create`
- [x] Component: `SendRequestForm`
- [ ] Component: `ContractorProfileSidebar`
- [ ] Component: `PendingRequestsList`
- [ ] Component: `SidebarChat`
- [ ] Component: `PaymentModal`
- [ ] API endpoint: `/api/messages/send`
- [ ] API endpoint: `/api/messages/mark-read`
- [ ] API endpoint: `/api/bids/accept`
- [ ] Update: `/app/find-pro/page.tsx` sidebar logic
- [ ] Update: `/components/NotificationBell.tsx` for bid notifications
- [ ] Run migration: `20251018000004_bid_notifications.sql`

## Testing Checklist

Once all components are created:

1. [ ] Run both migrations in Supabase:
   - `20251018000003_stripe_escrow_CLEAN.sql`
   - `20251018000004_bid_notifications.sql`
2. [ ] Test contractor search and profile view
3. [ ] Test sending job request
4. [ ] Test contractor receiving notification
5. [ ] Test contractor responding with bid
6. [ ] Test homeowner receiving bid notification
7. [ ] Test accepting bid and payment flow
8. [ ] Test chat functionality
9. [ ] Test payment escrow capture
10. [ ] Test job completion and payment release

## Next Steps

To continue implementation:
1. Create `ContractorProfileSidebar` component
2. Create `PendingRequestsList` component
3. Create `SidebarChat` component
4. Create `PaymentModal` with Stripe Elements
5. Create remaining API endpoints
6. Update `/find-pro/page.tsx` with new sidebar logic
7. Update `NotificationBell` component
8. Run database migrations
9. Test entire workflow end-to-end
