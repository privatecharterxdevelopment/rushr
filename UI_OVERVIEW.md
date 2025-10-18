# Left Sidebar Contractor Workflow - UI/UX Overview

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         MAIN MAP VIEW                           │
│  ┌──────────────────┐                                          │
│  │  LEFT SIDEBAR    │         Map with contractor pins         │
│  │                  │                                           │
│  │  [Changes based  │         🗺️ Interactive Mapbox           │
│  │   on page state] │                                          │
│  │                  │                                           │
│  │                  │                                           │
│  │                  │                                           │
│  │                  │                                           │
│  │                  │                                           │
│  └──────────────────┘                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Page 1: Search View (EXISTING)
**Current State**: Already implemented in `/app/find-pro/page.tsx`

```
┌────────────────────────────┐
│ ← Back to Home             │
├────────────────────────────┤
│ 🔍 Search by service...    │
│ 📍 ZIP Code: [_____] [Go]  │
├────────────────────────────┤
│ Filters:                   │
│ ○ Plumbing                 │
│ ○ Electrical               │
│ ○ HVAC                     │
│ ○ Roofing                  │
│ [More Filters...]          │
├────────────────────────────┤
│ Radius: [15 mi] ━━━━○━━   │
│ Rating: [4.0+] ⭐         │
├────────────────────────────┤
│  [Search for Pros]         │
│  [Pending Requests (3)] ← NEW
└────────────────────────────┘
```

---

## Page 2: Results View (EXISTING + UPDATES)
**Current State**: List of contractors
**Updates Needed**: Add "Pending" badges + "Contact" button click handler

```
┌────────────────────────────┐
│ ← Back to Search           │
│ Found 12 contractors       │
├────────────────────────────┤
│ ┌────────────────────────┐ │
│ │ 👤 Mike Rodriguez      │ │
│ │ Rodriguez Plumbing     │ │
│ │ ⭐ 4.9 (128 reviews)   │ │
│ │ 📍 1.2 mi • Plumbing   │ │
│ │ ⏳ Pending  ← NEW      │ │
│ │                        │ │
│ │ [Contact] ← EXISTING   │ │
│ └────────────────────────┘ │
│                            │
│ ┌────────────────────────┐ │
│ │ 👤 Sarah Chen          │ │
│ │ Elite Electrical       │ │
│ │ ⭐ 4.8 (203 reviews)   │ │
│ │ 📍 2.1 mi • Electrical │ │
│ │                        │ │
│ │ [Contact]              │ │
│ └────────────────────────┘ │
└────────────────────────────┘
```

---

## Page 3: Contractor Profile View (NEW)
**Component**: `ContractorProfileSidebar.tsx`
**Trigger**: Click "Contact" on contractor card
**Color Theme**: 🔵 BLUE (Contractor/Pro theme)

```
┌────────────────────────────┐
│ ← Back to Results          │
├────────────────────────────┤
│  👤 Mike Rodriguez         │
│  Rodriguez Plumbing & HVAC │
│  ⭐⭐⭐⭐⭐ 4.9 (128)        │
├────────────────────────────┤
│ Tabs: 🔵 BLUE THEME        │
│ [Overview] [Reviews] [Request]
│  (Active tab: blue border) │
├────────────────────────────┤
│ OVERVIEW TAB:              │
│                            │
│ 💼 Services:               │
│ • Plumbing  • HVAC         │
│ • Emergency Services       │
│                            │
│ 💵 Pricing:                │
│ $85-120/hour               │
│                            │
│ 📅 Experience:             │
│ 12 years                   │
│                            │
│ 📍 Service Area:           │
│ ZIP: 10001, 10002, 10003   │
│                            │
│ 📞 Contact:                │
│ (555) 123-4567             │
│ 🌐 website.com             │
│                            │
│ 📸 Portfolio:              │
│ [Photo] [Photo] [Photo]    │
├────────────────────────────┤
│  [Send Job Request] 🔵     │
│  (Blue button - Pro theme) │
└────────────────────────────┘
```

**Tab Styling (Blue Theme)**:
```css
/* Active Tab */
.tab-active {
  border-bottom: 2px solid #2563eb; /* blue-600 */
  color: #2563eb;
  font-weight: 600;
}

/* Inactive Tab */
.tab-inactive {
  border-bottom: 2px solid transparent;
  color: #6b7280; /* gray-500 */
}
.tab-inactive:hover {
  color: #2563eb;
}
```

**REVIEWS TAB**:
```
┌────────────────────────────┐
│ ⭐ 4.9 Average (128 reviews)│
├────────────────────────────┤
│ ┌────────────────────────┐ │
│ │ ⭐⭐⭐⭐⭐              │ │
│ │ "Great service!"       │ │
│ │ - John D. • 2 days ago │ │
│ └────────────────────────┘ │
│                            │
│ ┌────────────────────────┐ │
│ │ ⭐⭐⭐⭐⭐              │ │
│ │ "Fixed leak quickly"   │ │
│ │ - Mary S. • 1 week ago │ │
│ └────────────────────────┘ │
└────────────────────────────┘
```

---

## Page 4: Send Request Form (NEW)
**Component**: `SendRequestForm.tsx` ✅ CREATED
**Trigger**: Click "Send Job Request" or "Request" tab

```
┌────────────────────────────┐
│ ✕ Send Job Request         │
│ to Rodriguez Plumbing      │
├────────────────────────────┤
│                            │
│ Job Title *                │
│ ┌────────────────────────┐ │
│ │ Fix leaking faucet     │ │
│ └────────────────────────┘ │
│                            │
│ Description *              │
│ ┌────────────────────────┐ │
│ │ Kitchen faucet is      │ │
│ │ leaking under sink...  │ │
│ │                        │ │
│ └────────────────────────┘ │
│                            │
│ Category                   │
│ [Plumbing ▼]               │
│                            │
│ Price Offer (Optional)     │
│ ┌────────────────────────┐ │
│ │ $ 150.00               │ │
│ └────────────────────────┘ │
│ Suggest a price or leave   │
│ blank for quote            │
│                            │
│ Urgency                    │
│ [Standard] [Urgent] [🚨Emergency]
│                            │
│                            │
├────────────────────────────┤
│ [Cancel]  [Send Request]   │
└────────────────────────────┘
```

**After sending**:
```
┌────────────────────────────┐
│    ✅ Request Sent!        │
│                            │
│ Mike Rodriguez will review │
│ your request and respond   │
│ within 2 hours.            │
│                            │
│ [View Pending Requests]    │
│ [Back to Search]           │
└────────────────────────────┘
```

---

## Page 5: Pending Requests List (NEW)
**Component**: `PendingRequestsList.tsx`
**Trigger**: Click "Pending Requests" button from search view

```
┌────────────────────────────┐
│ ← Back to Search           │
│ My Job Requests (3)        │
├────────────────────────────┤
│ PENDING (1)                │
│ ┌────────────────────────┐ │
│ │ 👤 Mike Rodriguez      │ │
│ │ Fix leaking faucet     │ │
│ │ ⏳ Pending response... │ │
│ │ Sent 15 mins ago       │ │
│ │                        │ │
│ │ [View Details]         │ │
│ └────────────────────────┘ │
│                            │
│ RESPONDED (1)              │
│ ┌────────────────────────┐ │
│ │ 👤 Sarah Chen          │ │
│ │ Install ceiling fan    │ │
│ │ ✅ Bid: $250           │ │
│ │ Responded 1 hour ago   │ │
│ │                        │ │
│ │ [View Bid]             │ │
│ └────────────────────────┘ │
│                            │
│ ACCEPTED (1)               │
│ ┌────────────────────────┐ │
│ │ 👤 David Park          │ │
│ │ Fix fence gate         │ │
│ │ ✅ Accepted • $120     │ │
│ │ Job starts tomorrow    │ │
│ │                        │ │
│ │ [Open Chat]            │ │
│ └────────────────────────┘ │
└────────────────────────────┘
```

---

## Page 6: Contractor Bid Response (NEW)
**Component**: Enhanced `ContractorProfileSidebar.tsx`
**Trigger**: Click "View Bid" from pending requests

```
┌────────────────────────────┐
│ ← Back to Requests         │
├────────────────────────────┤
│  👤 Sarah Chen             │
│  Elite Electrical          │
│  ⭐ 4.8 (203 reviews)      │
├────────────────────────────┤
│ 💼 YOUR REQUEST:           │
│ "Install ceiling fan"      │
│                            │
│ 💰 CONTRACTOR'S BID:       │
│ ┌────────────────────────┐ │
│ │ Amount: $250           │ │
│ │ Timeline: 2-3 hours    │ │
│ │ Available: Tomorrow    │ │
│ │                        │ │
│ │ "I can install your    │ │
│ │ ceiling fan and ensure │ │
│ │ all wiring is up to    │ │
│ │ code. Price includes   │ │
│ │ labor and materials."  │ │
│ │                        │ │
│ │ ✓ Materials included   │ │
│ │ ✓ 6 month warranty     │ │
│ └────────────────────────┘ │
│                            │
│ [Counter Offer]            │
│ [Decline]  [Accept Bid] ←  │
└────────────────────────────┘
```

---

## Page 7: Chat View (NEW)
**Component**: `SidebarChat.tsx`
**Trigger**: After bid accepted, click "Open Chat" or auto-opens

```
┌────────────────────────────┐
│ ← Back  Sarah Chen         │
│         Elite Electrical   │
├────────────────────────────┤
│                            │
│  Sarah Chen                │
│  "Hi! When would you like  │
│   me to start?"            │
│  10:15 AM                  │
│                            │
│         You                │
│         "Tomorrow at 2pm?" │
│         10:16 AM           │
│                            │
│  Sarah Chen                │
│  "Perfect! See you then."  │
│  10:17 AM                  │
│                            │
│                            │
│ ─────────────────────────  │
│                            │
│ 💰 Price negotiation:      │
│ ┌────────────────────────┐ │
│ │ Current: $250          │ │
│ │ Your counter: $230     │ │
│ │ [Send Counter Offer]   │ │
│ └────────────────────────┘ │
│                            │
├────────────────────────────┤
│ ┌────────────────────────┐ │
│ │ Type message...        │ │
│ └────────────────────────┘ │
│             [Send] →       │
└────────────────────────────┘
```

---

## Page 8: Payment Modal (NEW - OVERLAY)
**Component**: `PaymentModal.tsx`
**Trigger**: Click "Accept Bid" button

```
╔════════════════════════════╗
║  ✕  Secure Payment         ║
╠════════════════════════════╣
║                            ║
║ 🔒 Escrow Payment          ║
║ Your payment is held       ║
║ securely until job is done ║
║                            ║
║ ──────────────────────     ║
║ JOB SUMMARY:               ║
║                            ║
║ Install ceiling fan        ║
║ Contractor: Sarah Chen     ║
║                            ║
║ Job cost:        $250.00   ║
║ Platform fee:     $25.00   ║
║ Stripe fee:        $7.98   ║
║ ────────────────────────   ║
║ TOTAL ESCROW:    $250.00   ║
║                            ║
║ ──────────────────────     ║
║ PAYMENT METHOD:            ║
║                            ║
║ ┌────────────────────────┐ ║
║ │ 💳 Card Number         │ ║
║ │ [____-____-____-____]  │ ║
║ │                        │ ║
║ │ Expiry    CVV          │ ║
║ │ [MM/YY]  [___]         │ ║
║ └────────────────────────┘ ║
║                            ║
║ 🛡️ Secured by Stripe      ║
║                            ║
║ ──────────────────────     ║
║ [Cancel]  [Pay & Secure]   ║
╚════════════════════════════╝
```

**After Payment**:
```
╔════════════════════════════╗
║     ✅ Payment Secured!    ║
╠════════════════════════════╣
║                            ║
║  $250 is now in escrow     ║
║                            ║
║  ✓ Contractor notified     ║
║  ✓ Chat is active          ║
║  ✓ Job can begin           ║
║                            ║
║  Payment will be released  ║
║  when both parties confirm ║
║  job completion.           ║
║                            ║
║     [Start Chatting]       ║
╚════════════════════════════╝
```

---

## Page 9: Job Tracking (EXISTING - ENHANCED)
**Component**: Existing `ContractorTracker.tsx`
**Location**: Shows in dashboard or can add to sidebar

```
┌────────────────────────────┐
│ 📍 Track Contractor        │
├────────────────────────────┤
│                            │
│   🗺️ Live Map View        │
│   ┌──────────────────────┐ │
│   │        🚗            │ │
│   │   Contractor         │ │
│   │                      │ │
│   │         •  You       │ │
│   └──────────────────────┘ │
│                            │
│ Sarah Chen is on the way   │
│ ETA: 15 minutes            │
│                            │
│ 📞 (555) 234-5678 [Call]   │
│                            │
│ 💰 Job: $250 (In Escrow)   │
│                            │
│ [Open Chat]                │
└────────────────────────────┘
```

---

## Notification Bell Updates
**Component**: Existing `NotificationBell.tsx` (needs updates)

```
┌────────────────────────────┐
│ 🔔 Notifications (3)       │
├────────────────────────────┤
│ ┌────────────────────────┐ │
│ │ 💰 Sarah Chen sent bid │ │
│ │ $250 for ceiling fan   │ │
│ │ • 5 mins ago           │ │
│ └────────────────────────┘ │
│                            │
│ ┌────────────────────────┐ │
│ │ ✅ Bid accepted        │ │
│ │ Payment secured        │ │
│ │ • 1 hour ago           │ │
│ └────────────────────────┘ │
│                            │
│ ┌────────────────────────┐ │
│ │ 💬 New message         │ │
│ │ from Mike Rodriguez    │ │
│ │ • 2 hours ago          │ │
│ └────────────────────────┘ │
│                            │
│ [Mark all as read]         │
└────────────────────────────┘
```

---

## Toast Notifications (NEW)
**Global toast system** - appears top-right of screen

```
┌──────────────────────────┐
│ ✅ Request sent!         │
│ Mike will respond soon   │
└──────────────────────────┘

┌──────────────────────────┐
│ 💰 New bid received!     │
│ Sarah Chen: $250         │
│ [View Bid]               │
└──────────────────────────┘

┌──────────────────────────┐
│ ✅ Payment secured!      │
│ $250 in escrow           │
└──────────────────────────┘

┌──────────────────────────┐
│ 💬 Payment done!         │
│ Let's get to work!       │
└──────────────────────────┘
```

---

## Color Scheme & Design System

### Status Colors:
- **Pending**: Amber/Yellow (`bg-amber-50`, `text-amber-700`)
- **Accepted**: Green (`bg-emerald-50`, `text-emerald-700`)
- **Rejected**: Red (`bg-red-50`, `text-red-700`)
- **Emergency**: Red (`bg-red-600`, `text-white`)
- **Urgent**: Orange (`bg-orange-500`, `text-white`)

### Theme Colors:
- **Homeowner actions**: Emerald/Green (`bg-emerald-600`)
- **Contractor/Pro elements**: Blue (`bg-blue-600`) - Profiles, buttons, borders
- **Platform/System**: Gray/Neutral

### Button Styles:
```css
Contractor Primary: bg-blue-600 hover:bg-blue-700 text-white
Homeowner Primary: bg-emerald-600 hover:bg-emerald-700 text-white
Secondary: border-gray-300 hover:bg-gray-100 text-gray-700
Danger: bg-red-600 hover:bg-red-700 text-white
Success: bg-green-600 hover:bg-green-700 text-white
```

### Typography:
```css
Headings: font-semibold text-gray-900
Body: text-gray-700
Labels: text-sm font-medium text-gray-700
Help text: text-xs text-gray-500
```

### Spacing:
- Card padding: `p-4`
- Section spacing: `space-y-4`
- Form field spacing: `mb-3`
- Border radius: `rounded-lg` (8px) or `rounded-2xl` (16px for cards)

---

## Component Hierarchy

```
/app/find-pro/page.tsx
├── ProMapInner (Map)
└── Left Sidebar (Conditional Rendering)
    ├── Search View (existing)
    ├── Results View (existing)
    ├── ContractorProfileSidebar (NEW)
    │   ├── Overview Tab
    │   ├── Reviews Tab
    │   └── Send Request Tab
    │       └── SendRequestForm (✅ created)
    ├── PendingRequestsList (NEW)
    │   └── RequestCard (status badges)
    └── SidebarChat (NEW)
        ├── MessageList
        ├── MessageInput
        └── PriceNegotiation

Overlays:
└── PaymentModal (NEW)
    └── Stripe CardElement

Global:
├── NotificationBell (update needed)
└── Toast System (can use existing or add new)
```

---

## Responsive Breakpoints

- **Mobile** (`< 768px`): Sidebar takes full screen
- **Tablet** (`768px - 1024px`): Sidebar 40% width, map 60%
- **Desktop** (`> 1024px`): Sidebar 380px fixed, map fills rest

```
Mobile:                 Tablet:                Desktop:
┌─────────────┐        ┌────┬────────┐        ┌────┬──────────┐
│  Sidebar    │        │Side│  Map   │        │Side│   Map    │
│  (full)     │        │bar │        │        │bar │          │
│             │        │    │        │        │    │          │
│  [Map btn]  │        │    │        │        │    │          │
└─────────────┘        └────┴────────┘        └────┴──────────┘
```

---

## Animation & Transitions

### Sidebar Page Transitions:
```css
transition: transform 0.3s ease-in-out
/* Slide from right when going forward */
/* Slide to right when going back */
```

### Modal Overlays:
```css
backdrop: bg-black/50
modal: scale-95 → scale-100 (150ms)
fade in: opacity-0 → opacity-100
```

### Loading States:
- Spinner: `animate-spin` (Tailwind)
- Skeleton loaders for cards
- Pulse animation for pending badges

### Notification Badges:
```css
⏳ Pending: animate-pulse
✅ Accepted: scale bounce
🔔 Bell: wiggle animation when new notification
```

---

## Key User Interactions

1. **Click "Contact"** → Slide to contractor profile
2. **Click "Send Request"** → Show form in same sidebar
3. **Submit form** → Toast appears, return to results with badge
4. **Notification arrives** → Bell wiggles, +1 count
5. **Click notification** → Navigate to contractor with bid view
6. **Click "Accept Bid"** → Payment modal overlays entire screen
7. **Complete payment** → Success toast, auto-open chat
8. **Send message** → Real-time delivery, typing indicator
9. **Both confirm complete** → Auto-release payment, show receipt

---

## Summary of NEW Components Needed

| Component | File | Lines (Est.) | Complexity |
|-----------|------|--------------|------------|
| ContractorProfileSidebar | `/components/ContractorProfileSidebar.tsx` | ~300 | Medium |
| PendingRequestsList | `/components/PendingRequestsList.tsx` | ~200 | Low-Medium |
| SidebarChat | `/components/SidebarChat.tsx` | ~400 | High |
| PaymentModal | `/components/PaymentModal.tsx` | ~350 | High |
| **SendRequestForm** | ✅ `/components/SendRequestForm.tsx` | 250 | **DONE** |

**Total New Code**: ~1,250 lines across 4 components

---

This provides the complete visual and interactive specification for the entire left sidebar contractor workflow!
