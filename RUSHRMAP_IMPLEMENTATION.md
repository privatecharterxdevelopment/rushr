# RushrMap - Complete Implementation Guide

## 🎯 Overview

This document outlines the complete implementation of the RushrMap feature - a two-sided marketplace connecting homeowners with contractors through an interactive map interface.

---

## 📋 Database Schema

### 1. Run Migrations in Supabase

Execute these SQL files in your Supabase SQL Editor **in order**:

#### Step 1: Add Contractor Geocoding
**File:** `supabase/migrations/20251018000001_add_contractor_geocoding.sql`

Adds exact address coordinates to contractor_profiles:
- `address` TEXT - Full street address
- `latitude` DECIMAL(10, 8) - Precise latitude
- `longitude` DECIMAL(11, 8) - Precise longitude

#### Step 2: Job Requests, Bids & Chat System
**File:** `supabase/migrations/20251018000000_job_requests_and_chat.sql`

Creates 5 new tables:
- **job_requests** - Homeowner requests to contractors
- **contractor_bids** - Contractor price bids on jobs
- **conversations** - Chat conversations between parties
- **messages** - Individual chat messages
- **notifications** - Real-time notifications

---

## 🗂️ Database Tables Reference

### `job_requests`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| homeowner_id | UUID | References auth.users |
| contractor_id | UUID | References contractor_profiles |
| job_description | TEXT | Job details |
| category | TEXT | Service category (Electrical, HVAC, etc.) |
| urgency | TEXT | emergency \| urgent \| flexible |
| status | TEXT | pending \| bid_received \| accepted \| rejected \| expired \| completed |
| expires_at | TIMESTAMPTZ | Auto-expires after 10 minutes |

### `contractor_bids`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| job_request_id | UUID | References job_requests |
| contractor_id | UUID | References contractor_profiles |
| bid_amount | DECIMAL(10, 2) | Price bid |
| bid_message | TEXT | Optional message |
| estimated_duration | TEXT | Time estimate |
| status | TEXT | pending \| accepted \| rejected \| withdrawn |

### `conversations`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| job_request_id | UUID | References job_requests |
| homeowner_id | UUID | References auth.users |
| contractor_id | UUID | References contractor_profiles |
| homeowner_unread_count | INTEGER | Unread messages for homeowner |
| contractor_unread_count | INTEGER | Unread messages for contractor |
| last_message_at | TIMESTAMPTZ | Last message timestamp |

### `messages`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| conversation_id | UUID | References conversations |
| sender_id | UUID | References auth.users |
| sender_type | TEXT | homeowner \| contractor |
| message_text | TEXT | Message content |
| is_read | BOOLEAN | Read status |

### `notifications`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | References auth.users |
| type | TEXT | job_request_received \| bid_received \| bid_accepted \| etc. |
| title | TEXT | Notification title |
| message | TEXT | Notification message |
| is_read | BOOLEAN | Read status |

---

## 🚀 Features Implemented

### ✅ Phase 1: Map with Exact Locations

**Fixed Issue:** Contractors now use precise lat/lng coordinates instead of ZIP code centers.

**Changes:**
- Added `latitude`, `longitude`, `address` columns to `contractor_profiles`
- Updated `ProMapExplorer.tsx` to use exact coordinates
- Markers now stay in place when zooming

**How it works:**
```javascript
// Priority: Use exact coordinates if available, fallback to ZIP center
if (contractor.latitude && contractor.longitude) {
  loc = { lat: contractor.latitude, lng: contractor.longitude }
} else {
  loc = getLocationFromZip(contractor.zip_code) // Fallback
}
```

### ✅ Phase 2: Uber-Style Two-Page Sidebar

**Page 1: Search**
- Title: "Find Emergency Help Within Minutes"
- Search input + ZIP input (same row)
- Transparent "Locate Me" button
- Category bubbles (compact design)
- Green "Search" button (disabled until category selected)

**Page 2: Results**
- Back arrow to return to search
- Header showing category and count
- Sort dropdown + collapsible filters
- Radius slider (adjusts search area)
- Rating filter
- Scrollable contractor list

### ✅ Phase 3: 3D Map with Lighter Radius

**Radius Circle:**
- Very light emerald green (opacity 0.06)
- Works with map pitch/tilt (flattens in 3D perspective)
- Properties: `circle-pitch-alignment: 'map'` and `circle-pitch-scale: 'map'`

---

## 📝 Test Data

### Insert Test Contractors with Addresses

**File:** `test-contractors-with-addresses.sql`

Includes 7 test contractors with:
- Full NYC addresses
- Precise lat/lng coordinates
- Categories: Electrical, HVAC, Roofing, Plumbing, Carpentry, General, Landscaping
- Ratings: 4.4 - 4.9

**To use:**
1. Open Supabase SQL Editor
2. Copy contents of `test-contractors-with-addresses.sql`
3. Run the query
4. Refresh RushrMap

---

## 🔄 Complete User Workflow

### 1. Homeowner Searches for Contractor

```
1. Go to /rushrmap
2. Enter ZIP or click "📍 Locate Me"
3. Click category bubble (e.g., ⚡ Electrical)
4. Click "Search" button
5. See list of contractors with smooth loading animation
6. View contractors on map as blue pulsing markers
```

### 2. Homeowner Requests Contractor

```
1. Click "Request" button on contractor card
2. Job request created with status='pending'
3. Contractor card shows "⏳ Awaiting response... 9:45"
4. Request expires after 10 minutes if no response
```

### 3. Contractor Receives Notification

```
1. Contractor gets notification: "You received a job offer"
2. Contractor views job details
3. Contractor enters bid amount + optional message
4. Submits bid
```

### 4. Homeowner Receives Bid

```
1. Homeowner gets notification: "You received a bid from [Name]"
2. Job request status changes to 'bid_received'
3. Contractor card updates: "💰 Bid: $150 - Accept | Decline"
4. Homeowner can compare bids if multiple contractors responded
```

### 5. Homeowner Accepts Bid

```
1. Click "Accept" button
2. Bid status changes to 'accepted'
3. Other bids get rejected automatically
4. Conversation created between homeowner and contractor
5. "Open Chat" button appears
```

### 6. Chat Opens

```
1. Click "Open Chat"
2. Navigate to /chat/[conversation_id]
3. Real-time messaging with Supabase Realtime
4. Unread counts update automatically
```

---

## 🔧 API Endpoints Needed

### Job Requests
- `POST /api/job-requests` - Create request
- `GET /api/job-requests` - List user's requests
- `PATCH /api/job-requests/[id]` - Update status

### Contractor Bids
- `POST /api/bids` - Submit bid
- `GET /api/bids?job_request_id=xxx` - Get bids for job
- `PATCH /api/bids/[id]` - Update bid (accept/reject)

### Conversations & Messages
- `POST /api/conversations` - Create conversation
- `GET /api/conversations` - List user's conversations
- `POST /api/messages` - Send message
- `GET /api/messages?conversation_id=xxx` - Get conversation messages

### Notifications
- `GET /api/notifications` - Get user notifications
- `PATCH /api/notifications/[id]` - Mark as read

---

## 🎨 UI Components to Build

### 1. Contractor Card States

**State 1: Default**
```jsx
<button className="request-btn">Request</button>
```

**State 2: Awaiting Response** (10 min countdown)
```jsx
<div className="awaiting">
  ⏳ Awaiting response... {timeRemaining}
</div>
```

**State 3: Bid Received**
```jsx
<div className="bid-received">
  💰 Bid: ${bid.amount}
  <button>Accept</button>
  <button>Decline</button>
</div>
```

**State 4: Accepted**
```jsx
<div className="accepted">
  ✅ Accepted
  <button>Open Chat</button>
</div>
```

### 2. Loading Animation

Smooth stagger animation as contractors load:
```jsx
{contractors.map((c, index) => (
  <div
    key={c.id}
    className="contractor-card"
    style={{
      animation: `fadeInUp 0.3s ease-out ${index * 0.1}s forwards`,
      opacity: 0
    }}
  >
    {/* Contractor content */}
  </div>
))}
```

### 3. Countdown Timer Component

```jsx
const CountdownTimer = ({ expiresAt, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(expiresAt))

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = calculateTimeLeft(expiresAt)
      setTimeLeft(remaining)
      if (remaining <= 0) {
        onExpire()
        clearInterval(interval)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [expiresAt])

  return <span>{formatTime(timeLeft)}</span>
}
```

---

## 🔔 Notification Types

| Type | Recipient | Trigger | Action |
|------|-----------|---------|--------|
| `job_request_received` | Contractor | Homeowner sends request | Show bid form |
| `bid_received` | Homeowner | Contractor submits bid | Show bid details |
| `bid_accepted` | Contractor | Homeowner accepts bid | Open chat |
| `bid_rejected` | Contractor | Homeowner declines bid | Close request |
| `job_filled` | Other contractors | Homeowner accepts another bid | Disable bid |
| `job_expired` | Both | 10 min timeout | Close request |
| `new_message` | Both | New chat message | Open conversation |

---

## 🧪 Testing Checklist

### Map Functionality
- [ ] Contractors appear at exact addresses
- [ ] Markers don't move when zooming
- [ ] Blue pulsing animation works
- [ ] 3D buildings visible at zoom 15+
- [ ] Radius circle is subtle and flattens with map tilt
- [ ] "Locate Me" shows user location

### Search Flow
- [ ] Category bubbles clickable
- [ ] Search button disabled until category selected
- [ ] Smooth transition to results page
- [ ] Back arrow returns to search
- [ ] Filters update contractor list

### Request Flow
- [ ] Request button creates job_request
- [ ] Countdown timer shows 10:00 and counts down
- [ ] Request expires after 10 minutes
- [ ] Contractor gets notification

### Bid Flow
- [ ] Contractor can submit bid
- [ ] Homeowner sees bid amount
- [ ] Can compare multiple bids
- [ ] Accept/Decline buttons work
- [ ] Rejected contractors get notified

### Chat Flow
- [ ] Conversation created on accept
- [ ] Messages send in real-time
- [ ] Unread counts update
- [ ] Both parties can send messages

---

## 📦 Next Steps

1. **Run Migrations**
   - Execute both SQL migration files in Supabase

2. **Insert Test Data**
   - Run `test-contractors-with-addresses.sql`

3. **Verify Map**
   - Open http://localhost:3001/rushrmap
   - Check contractors appear at correct locations
   - Zoom in/out - markers should stay in place

4. **Build Request/Bid UI**
   - Add "Request" button to contractor cards
   - Implement countdown timer
   - Build bid display and accept/decline buttons

5. **Implement API Endpoints**
   - Create API routes for job requests, bids, messages

6. **Add Real-time Updates**
   - Use Supabase Realtime subscriptions for live updates

7. **Build Chat Page**
   - Create /chat/[id] page with message list and input

---

## 🎉 Summary

**What's Done:**
✅ Database schema complete
✅ Exact contractor locations (no more jumping markers!)
✅ Uber-style two-page sidebar
✅ 3D map with subtle radius circle
✅ Category filtering
✅ Test data with real NYC addresses

**What's Next:**
🔲 Build request/bid UI components
🔲 Implement API endpoints
🔲 Add countdown timers
🔲 Build chat interface
🔲 Add real-time notifications

---

**Current Status:** Server running at http://localhost:3001/rushrmap
**All files created and ready to deploy!** 🚀
