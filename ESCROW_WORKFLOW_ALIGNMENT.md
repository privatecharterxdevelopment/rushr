# Escrow Payment Workflow - Dashboard Alignment

## ✅ Your Workflow is 100% Accurate

### Complete Flow:

```
1. Homeowner accepts bid on RushrMap
   ↓
2. Payment authorized & captured → Funds in escrow
   ↓
3. Contractor gets notification: "💰 Payment done - let's get to work!"
   ↓
4. Both parties confirm job complete in "Ongoing Jobs" section
   ↓
5. Funds auto-released to contractor's IBAN (Stripe Connect Transfer)
   ↓
6. Shows in Contractor dashboard: "Earnings"
7. Shows in Homeowner dashboard: "Payments"
```

---

## Current Dashboard Structure

### Homeowner Dashboard
**Location:** `/app/dashboard/homeowner/page.tsx`

**Current Sections:**
- Profile Completeness
- Active Jobs (Pending, Confirmed, In Progress, Completed)
- Saved Professionals
- Recent Messages
- Contractor Tracking

**Missing:**
- ❌ Payments Section (transaction history)
- ❌ Escrow status on job cards

---

### Contractor Dashboard
**Location:** `/app/dashboard/contractor/page.tsx`

**Current Sections:**
- Earnings Stats (weekEarnings, todayJobs, rating)
- Emergency Job Feed
- Today's Appointments
- Recent Messages

**Current Earnings Display:**
```typescript
weekEarnings: 0  // Currently shows just a number
```

**Missing:**
- ❌ Full Earnings Section with transaction history
- ❌ Payment holds pending confirmation
- ❌ Escrow status on job cards

---

### Contractor Jobs Page
**Location:** `/app/dashboard/contractor/jobs/page.tsx`

**Current Features:**
- Lists all jobs with filters: all, pending, accepted, in_progress, completed
- Shows bid details (amount, status, materials, warranty)
- Has "Start Job" and "Complete Job" buttons

**Missing:**
- ❌ Escrow status indicator
- ❌ "Confirm Job Complete" button (for escrow release)

---

## Integration Plan

### 1. Add `<EscrowStatus />` to Job Cards

**Where:** In both dashboards when showing active/in-progress jobs

**Homeowner Dashboard Job Card:**
```tsx
{job.status === 'In Progress' && job.payment_hold_id && (
  <EscrowStatus
    jobId={job.id}
    bidId={job.accepted_bid_id}
    userType="homeowner"
    onConfirmComplete={() => refreshJobs()}
  />
)}
```

**Contractor Jobs Page:**
```tsx
{job.job_status === 'in_progress' && job.payment_hold_id && (
  <EscrowStatus
    jobId={job.job_id}
    bidId={job.bid_id}
    userType="contractor"
    onConfirmComplete={() => fetchContractorJobs()}
  />
)}
```

**What it shows:**
- 💰 "Payment done - let's get to work!" banner (green)
- Amount in escrow: "$150.00"
- Contractor payout: "$135.00" (after 10% platform fee)
- Confirmation checkboxes:
  - ✅ Homeowner confirmed
  - ⏳ Contractor confirmed (waiting)
- **"Confirm Job Complete"** button

---

### 2. Add Payments Section to Homeowner Dashboard

**Location:** Add after "Active Jobs" section in `/app/dashboard/homeowner/page.tsx`

```tsx
{/* Payments Section */}
<section className="mb-8">
  <SectionTitle>Payments</SectionTitle>
  <PaymentHistory userType="homeowner" />
</section>
```

**What it shows:**
- **Total Spent:** $450.00
- **In Escrow:** $150.00 (payment currently held)
- **Pending Release:** $150.00 (you confirmed, waiting for contractor)
- **Transactions:** 12

**Transaction List:**
| Date | Description | Job | Amount | Status |
|------|-------------|-----|--------|--------|
| Oct 18 | Payment held in escrow | Fix outlet | -$150.00 | Completed ✅ |
| Oct 17 | Payment released | HVAC repair | -$300.00 | Released ✅ |

**Filters:** All, Escrow, Released, Refunds

---

### 3. Add Earnings Section to Contractor Dashboard

**Location:** Add after "Emergency Job Feed" in `/app/dashboard/contractor/page.tsx`

```tsx
{/* Earnings Section */}
<section className="mb-8">
  <SectionTitle>Earnings</SectionTitle>
  <PaymentHistory userType="contractor" />
</section>
```

**What it shows:**
- **Total Earned:** $1,350.00
- **In Escrow:** $135.00 (payment being held, job in progress)
- **Pending Release:** $135.00 (homeowner confirmed, you need to confirm)
- **Transactions:** 24

**Transaction List:**
| Date | Description | Job | Amount | Status |
|------|-------------|-----|--------|--------|
| Oct 18 | Payment released from escrow | Fix outlet | +$135.00 | Completed ✅ |
| Oct 17 | Payment released | HVAC repair | +$270.00 | Released ✅ |

**Filters:** All, Escrow, Released, Refunds

---

## Workflow Example (Step by Step)

### Step 1: Homeowner Accepts Bid
**Location:** RushrMap → Contractor card → "Accept Bid" button

**Action:**
```typescript
// Frontend calls
const response = await fetch('/api/payments/create-hold', {
  method: 'POST',
  body: JSON.stringify({ bidId, homeownerId })
})

const { clientSecret } = await response.json()

// Stripe Elements UI appears for payment authorization
```

**Result:**
- `payment_holds` record created
- Status: `authorized`
- Job status: `pending` → `bid_accepted`

---

### Step 2: Payment Captured
**Action:**
```typescript
await fetch('/api/payments/capture', {
  method: 'POST',
  body: JSON.stringify({ paymentHoldId, homeownerId })
})
```

**Result:**
- `payment_holds.status` = `captured`
- `homeowner_jobs.payment_status` = `paid`
- Contractor notification: **"Payment secured - $150 in escrow. Let's get to work!"**
- Job status: `bid_accepted` → `in_progress`

---

### Step 3: Work Completed - Both Confirm

#### Homeowner Dashboard (`/dashboard/homeowner`)

**Job Card Shows:**
```
┌─────────────────────────────────────────────────┐
│ Fix Electrical Outlet - In Progress            │
│ Contractor: Elite Electric NYC                  │
│                                                 │
│ 💰 Payment Secured - Let's Get to Work!        │
│ $150.00 is being held in escrow.               │
│                                                 │
│ Job Completion Status:                         │
│ ✅ Homeowner confirmed                         │
│ ⏳ Contractor confirmed (waiting...)           │
│                                                 │
│ [ Confirm Job Complete ] ← Already clicked     │
└─────────────────────────────────────────────────┘
```

**Homeowner clicks "Confirm Job Complete":**
```typescript
await fetch('/api/payments/confirm-complete', {
  method: 'POST',
  body: JSON.stringify({
    paymentHoldId,
    userId: homeowner.id,
    userType: 'homeowner'
  })
})
```

**Result:**
- `payment_holds.homeowner_confirmed_complete` = `true`
- Notification sent to contractor: "Homeowner confirmed job completion. Please confirm to release payment."

---

#### Contractor Dashboard (`/dashboard/contractor/jobs`)

**Job Card Shows:**
```
┌─────────────────────────────────────────────────┐
│ Fix Electrical Outlet - In Progress            │
│ Homeowner: John Doe                             │
│                                                 │
│ 💰 Payment Secured - Let's Get to Work!        │
│ You'll receive $135.00 after job completion.   │
│                                                 │
│ Job Completion Status:                         │
│ ✅ Homeowner confirmed                         │
│ ⏳ Contractor confirmed (YOU)                  │
│                                                 │
│ [ Confirm Job Complete ] ← Click here          │
└─────────────────────────────────────────────────┘
```

**Contractor clicks "Confirm Job Complete":**
```typescript
await fetch('/api/payments/confirm-complete', {
  method: 'POST',
  body: JSON.stringify({
    paymentHoldId,
    userId: contractor.id,
    userType: 'contractor'
  })
})
```

**Result:**
- `payment_holds.contractor_confirmed_complete` = `true`
- **Database trigger fires:** `check_auto_release_payment()`
- `payment_holds.status` = `released`
- Calls `/api/payments/release` internally

---

### Step 4: Auto-Release to IBAN

**API Action:**
```typescript
// /api/payments/release
const transfer = await stripe.transfers.create({
  amount: 13500, // $135.00 in cents
  currency: 'usd',
  destination: contractor.stripe_account_id, // Connected to contractor's IBAN
  description: 'Payment for job completion'
})
```

**Stripe Action:**
- Creates transfer to contractor's Stripe Connect account
- Funds sent to contractor's bank (IBAN)
- Transfer typically takes 2-7 business days

**Database Updates:**
- `payment_holds.stripe_transfer_id` = `tr_xxx`
- `payment_holds.released_at` = NOW()
- `homeowner_jobs.payment_status` = `released`
- `homeowner_jobs.status` = `completed`

**Transactions Created:**
```sql
-- Contractor transaction
INSERT INTO transactions (
  user_id: contractor.id,
  type: 'release',
  amount: +135.00,  -- Positive (incoming)
  description: 'Payment released from escrow'
)

-- Homeowner transaction (already created on hold)
-- Shows: -$150.00 'Payment held in escrow for job'
```

---

### Step 5: Shows in Dashboards

#### Homeowner Dashboard → "Payments" Section

**Stats:**
- Total Spent: **$150.00** ⬆️
- In Escrow: **$0.00** (was $150, now released)
- Pending Release: **$0.00**
- Transactions: **1** ⬆️

**Transaction Entry:**
```
Oct 18, 2025 2:30 PM
Payment held in escrow for job
Job: Fix Electrical Outlet • Electrical
Contractor: Elite Electric NYC
Status: Released ✅
Amount: -$150.00
Confirmations:
  ✅ Homeowner confirmed
  ✅ Contractor confirmed
```

---

#### Contractor Dashboard → "Earnings" Section

**Stats:**
- Total Earned: **$135.00** ⬆️
- In Escrow: **$0.00** (was $135, now released)
- Pending Release: **$0.00**
- Transactions: **1** ⬆️

**Transaction Entry:**
```
Oct 18, 2025 2:30 PM
Payment released from escrow
Job: Fix Electrical Outlet • Electrical
Homeowner: John Doe
Status: Completed ✅
Amount: +$135.00
Confirmations:
  ✅ Homeowner confirmed
  ✅ Contractor confirmed
```

**Notification:**
"💸 Payment released! $135.00 has been transferred to your bank account."

---

## Database Tables Used

### payment_holds
```sql
id: uuid
job_id: uuid
bid_id: uuid
stripe_payment_intent_id: text
amount: 150.00
platform_fee: 15.00
contractor_payout: 135.00
status: 'released'
homeowner_confirmed_complete: true
contractor_confirmed_complete: true
released_at: '2025-10-18T14:30:00Z'
stripe_transfer_id: 'tr_xxx'
```

### transactions
```sql
-- Homeowner transaction
user_id: homeowner.id
type: 'hold'
amount: -150.00
description: 'Payment held in escrow for job'

-- Contractor transaction
user_id: contractor.id
type: 'release'
amount: +135.00
description: 'Payment released from escrow'
```

### homeowner_jobs
```sql
id: uuid
status: 'completed'
payment_status: 'released'
payment_hold_id: uuid
accepted_bid_id: uuid
```

### job_bids
```sql
id: uuid
status: 'accepted'
bid_amount: 150.00
```

---

## Fee Breakdown

```
Homeowner pays:           $150.00
  ↓
Platform fee (10%):       -$15.00
  ↓
Contractor receives:      $135.00
  ↓
Stripe fee (absorbed):    -$4.65 (Rushr pays this)
  ↓
Net to contractor:        $135.00 (in IBAN bank account)
```

---

## Summary

✅ **Yes, your workflow is 100% accurate:**

1. Payment captured → Held in escrow
2. Both confirm in "Ongoing Jobs" section
3. Auto-release to contractor's IBAN (Stripe Connect Transfer)
4. Shows in Contractor → "Earnings" tab
5. Shows in Homeowner → "Payments" tab

**Alignment with existing dashboards:**
- ✅ Dashboards have job sections (perfect for adding `<EscrowStatus />`)
- ✅ Contractor dashboard has earnings stats (perfect for adding `<PaymentHistory />`)
- ✅ Homeowner dashboard has job tracking (perfect for adding `<PaymentHistory />`)
- ✅ Job status flow matches: pending → in_progress → completed

**What's needed:**
1. Add `<EscrowStatus />` component to job cards
2. Add `<PaymentHistory userType="homeowner" />` to homeowner dashboard
3. Add `<PaymentHistory userType="contractor" />` to contractor dashboard
4. Contractor must complete Stripe Connect onboarding (links IBAN to Stripe account)

Everything is perfectly aligned! 🎉
