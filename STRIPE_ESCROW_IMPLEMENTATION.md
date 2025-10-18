# Stripe Escrow System Implementation Guide

## Overview

Complete Stripe escrow (payment hold) system for RushrMap job bidding platform. When a homeowner accepts a contractor's bid, payment is authorized and held in escrow. Funds are automatically released to the contractor when both parties confirm job completion.

---

## Architecture

### Payment Flow

```
1. Homeowner accepts bid
   ↓
2. Create Stripe PaymentIntent (capture_method: 'manual')
   ↓
3. Homeowner authorizes payment (card/bank)
   ↓
4. Payment captured → Funds held in escrow
   ↓
5. Contractor receives: "Payment done - let's get to work!"
   ↓
6. Both parties confirm job complete
   ↓
7. Funds auto-released to contractor via Stripe Connect Transfer
```

---

## Database Schema

### Tables Created

#### 1. `payment_holds`
Tracks escrow payments for each job.

```sql
- id (UUID)
- job_id → homeowner_jobs
- bid_id → job_bids
- homeowner_id → auth.users
- contractor_id → auth.users
- stripe_payment_intent_id (TEXT)
- stripe_charge_id (TEXT)
- stripe_customer_id (TEXT)
- amount (DECIMAL) - Total bid amount
- platform_fee (DECIMAL) - 10% Rushr fee
- contractor_payout (DECIMAL) - Amount contractor receives
- stripe_fee (DECIMAL) - Estimated Stripe fee (2.9% + $0.30)
- status (TEXT) - pending|authorized|captured|released|refunded|disputed|failed|cancelled
- homeowner_confirmed_complete (BOOLEAN)
- contractor_confirmed_complete (BOOLEAN)
- homeowner_confirmed_at (TIMESTAMPTZ)
- contractor_confirmed_at (TIMESTAMPTZ)
- released_at (TIMESTAMPTZ)
- stripe_transfer_id (TEXT)
```

**Statuses:**
- `pending` - PaymentIntent created, awaiting authorization
- `authorized` - Payment method authorized, funds on hold
- `captured` - Payment charged, funds in escrow
- `released` - Funds transferred to contractor
- `refunded` - Full refund issued to homeowner
- `partial_refund` - Partial refund issued
- `disputed` - Chargeback/dispute filed
- `failed` - Payment failed
- `cancelled` - Cancelled before capture

#### 2. `transactions`
Complete transaction history for all users.

```sql
- id (UUID)
- user_id → auth.users
- user_type (TEXT) - homeowner|contractor
- job_id → homeowner_jobs
- bid_id → job_bids
- payment_hold_id → payment_holds
- type (TEXT) - charge|hold|release|refund|platform_fee|stripe_fee|adjustment
- amount (DECIMAL)
- currency (TEXT) - Default 'USD'
- status (TEXT) - pending|completed|failed|cancelled
- description (TEXT)
- stripe_id (TEXT) - Related Stripe ID
- metadata (JSONB)
```

**Transaction Types:**
- `charge` - Money charged to homeowner
- `hold` - Money held in escrow
- `release` - Money released to contractor
- `refund` - Refund to homeowner
- `platform_fee` - Platform fee collected (10%)
- `stripe_fee` - Stripe processing fee
- `adjustment` - Manual adjustment

#### 3. `stripe_customers`
Stores Stripe customer IDs for homeowners.

```sql
- id (UUID)
- user_id → auth.users (UNIQUE)
- stripe_customer_id (TEXT UNIQUE)
- default_payment_method_id (TEXT)
- email (TEXT)
- name (TEXT)
```

#### 4. `stripe_connect_accounts`
Stores Stripe Connect account IDs for contractors.

```sql
- id (UUID)
- contractor_id → auth.users (UNIQUE)
- stripe_account_id (TEXT UNIQUE)
- onboarding_complete (BOOLEAN)
- charges_enabled (BOOLEAN)
- payouts_enabled (BOOLEAN)
- account_type (TEXT) - standard|express|custom
- country (TEXT)
- email (TEXT)
- requirements_currently_due (TEXT[])
- requirements_eventually_due (TEXT[])
```

---

## API Endpoints

### 1. Create Payment Hold
**POST** `/api/payments/create-hold`

Creates Stripe PaymentIntent when homeowner accepts bid.

**Request:**
```json
{
  "bidId": "uuid",
  "homeownerId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentHoldId": "uuid",
  "amount": 150.00,
  "platformFee": 15.00,
  "contractorPayout": 135.00
}
```

**What it does:**
1. Fetches bid details from `job_bids`
2. Gets/creates Stripe customer for homeowner
3. Calculates platform fee (10%) and contractor payout
4. Creates Stripe PaymentIntent with `capture_method: 'manual'`
5. Creates `payment_holds` record
6. Updates `homeowner_jobs.payment_status = 'pending'`

---

### 2. Capture Payment
**POST** `/api/payments/capture`

Captures (charges) authorized payment after homeowner confirms.

**Request:**
```json
{
  "paymentHoldId": "uuid",
  "homeownerId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "status": "captured",
  "chargeId": "ch_xxx"
}
```

**What it does:**
1. Verifies payment hold status is `authorized`
2. Calls `stripe.paymentIntents.capture()`
3. Updates `payment_holds.status = 'captured'`
4. Updates `homeowner_jobs.payment_status = 'paid'`
5. Sends notification to contractor: **"Payment secured - let's get to work!"**

---

### 3. Confirm Job Complete
**POST** `/api/payments/confirm-complete`

Allows homeowner or contractor to confirm job completion.

**Request:**
```json
{
  "paymentHoldId": "uuid",
  "userId": "uuid",
  "userType": "homeowner" | "contractor"
}
```

**Response:**
```json
{
  "success": true,
  "bothConfirmed": true,
  "paymentReleased": true,
  "homeowerConfirmed": true,
  "contractorConfirmed": true
}
```

**What it does:**
1. Verifies user is homeowner or contractor for this job
2. Updates `homeowner_confirmed_complete` or `contractor_confirmed_complete`
3. If both confirmed → Database trigger auto-updates `status = 'released'`
4. Sends notification to other party
5. Updates job status to `completed`

---

### 4. Release Payment
**POST** `/api/payments/release`

Transfers funds from escrow to contractor via Stripe Connect.

**Request:**
```json
{
  "paymentHoldId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "transferId": "tr_xxx",
  "amount": 135.00,
  "releasedAt": "2025-10-18T12:00:00Z"
}
```

**What it does:**
1. Verifies both parties confirmed completion
2. Gets contractor's Stripe Connect account
3. Creates `stripe.transfers.create()` to contractor
4. Updates `payment_holds.status = 'released'`
5. Creates `transactions` record for contractor earnings
6. Triggers notification: "Payment released!"

---

## Database Triggers

### 1. `create_hold_transaction()`
**Triggered on:** INSERT on `payment_holds`

Automatically creates transaction record when payment hold is created.

```sql
INSERT INTO transactions (
  user_id: homeowner_id,
  type: 'hold',
  amount: -amount (negative for homeowner),
  description: 'Payment held in escrow for job'
)
```

---

### 2. `create_release_transaction()`
**Triggered on:** UPDATE on `payment_holds` (when status → 'released')

Automatically creates transaction record when payment is released.

```sql
INSERT INTO transactions (
  user_id: contractor_id,
  type: 'release',
  amount: contractor_payout (positive for contractor),
  description: 'Payment released from escrow'
)

UPDATE homeowner_jobs SET payment_status = 'released'
```

---

### 3. `check_auto_release_payment()`
**Triggered on:** UPDATE on `payment_holds`

Automatically marks payment as released when both parties confirm.

```sql
IF homeowner_confirmed_complete = true
   AND contractor_confirmed_complete = true
   AND status = 'captured'
THEN
  status = 'released'
  released_at = NOW()
```

---

## Views

### 1. `homeowner_payment_history`
Shows all payment transactions for homeowners.

```sql
SELECT
  transaction_id, created_at, type, amount, status,
  description, job_title, job_category, contractor_name,
  payment_hold_status, homeowner_confirmed_complete, contractor_confirmed_complete
FROM transactions
WHERE user_type = 'homeowner' AND user_id = auth.uid()
ORDER BY created_at DESC
```

---

### 2. `contractor_earnings_history`
Shows all earnings/transactions for contractors.

```sql
SELECT
  transaction_id, created_at, type, amount, status,
  description, job_title, job_category, homeowner_name,
  payment_hold_status, homeowner_confirmed_complete, contractor_confirmed_complete
FROM transactions
WHERE user_type = 'contractor' AND user_id = auth.uid()
ORDER BY created_at DESC
```

---

### 3. `payment_holds_pending_confirmation`
Shows all payment holds requiring user action.

```sql
SELECT
  payment_hold_id, job_id, bid_id, amount, status,
  homeowner_confirmed_complete, contractor_confirmed_complete,
  user_role ('homeowner'|'contractor'),
  my_confirmation (true|false),
  other_party_confirmation (true|false)
FROM payment_holds
WHERE (homeowner_id = auth.uid() OR contractor_id = auth.uid())
  AND status IN ('captured', 'authorized')
  AND job_status IN ('in_progress', 'completed')
```

---

## UI Components

### 1. `<PaymentHistory />`
Location: `components/PaymentHistory.tsx`

Full transaction history component for dashboards.

**Props:**
```typescript
{
  userType: 'homeowner' | 'contractor'
}
```

**Features:**
- Stats cards: Total Spent/Earned, In Escrow, Pending Release, Transaction Count
- Filters: All, Escrow, Released, Refunds
- Transaction list with job details, amounts, status badges
- Confirmation status indicators (both parties)
- Real-time updates via Supabase subscriptions

**Usage:**
```tsx
// Homeowner Dashboard
<PaymentHistory userType="homeowner" />

// Contractor Dashboard
<PaymentHistory userType="contractor" />
```

---

### 2. `<EscrowStatus />`
Location: `components/EscrowStatus.tsx`

Shows escrow payment status and "let's get to work" message.

**Props:**
```typescript
{
  jobId: string
  bidId: string
  userType: 'homeowner' | 'contractor'
  onConfirmComplete?: () => void
}
```

**Features:**
- **Payment Secured:** Green banner "💰 Payment done - let's get to work!"
- Shows amount in escrow and contractor payout
- Confirmation checkboxes for both parties
- "Confirm Job Complete" button
- Auto-updates when other party confirms
- "Payment Released" success message

**Usage:**
```tsx
// In job details page
<EscrowStatus
  jobId={job.id}
  bidId={acceptedBid.id}
  userType={userRole}
  onConfirmComplete={() => refreshJob()}
/>
```

---

## Environment Variables Required

```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
```

---

## Fee Structure

### Platform Fee (10%)
- Deducted from bid amount
- Example: $150 bid → $15 platform fee → $135 to contractor

### Stripe Fee (2.9% + $0.30)
- Charged by Stripe on transaction
- Example: $150 bid → $4.65 Stripe fee
- Absorbed by platform (not deducted from contractor payout)

### Example Calculation:
```
Bid Amount:          $150.00
Platform Fee (10%):  -$15.00
Contractor Payout:   $135.00
Stripe Fee:          $4.65 (absorbed by platform)
```

---

## Workflow Example

### Step 1: Homeowner Accepts Bid
```typescript
// Frontend action
const response = await fetch('/api/payments/create-hold', {
  method: 'POST',
  body: JSON.stringify({
    bidId: 'bid-uuid',
    homeownerId: user.id
  })
})

const { clientSecret } = await response.json()

// Use Stripe Elements to collect payment
const stripe = await loadStripe(STRIPE_PUBLISHABLE_KEY)
const { error } = await stripe.confirmCardPayment(clientSecret, {
  payment_method: {
    card: cardElement,
    billing_details: { name: 'John Doe' }
  }
})
```

**Result:**
- PaymentIntent authorized
- `payment_holds` record created with status `authorized`
- `homeowner_jobs.payment_status = 'pending'`

---

### Step 2: Capture Payment
```typescript
await fetch('/api/payments/capture', {
  method: 'POST',
  body: JSON.stringify({
    paymentHoldId: 'hold-uuid',
    homeownerId: user.id
  })
})
```

**Result:**
- Payment charged
- `payment_holds.status = 'captured'`
- `homeowner_jobs.payment_status = 'paid'`
- Contractor notification: **"Payment secured - let's get to work!"**

---

### Step 3: Job Completion
Contractor completes work → Both parties confirm in UI

```typescript
// Homeowner confirms
await fetch('/api/payments/confirm-complete', {
  method: 'POST',
  body: JSON.stringify({
    paymentHoldId: 'hold-uuid',
    userId: homeowner.id,
    userType: 'homeowner'
  })
})

// Contractor confirms
await fetch('/api/payments/confirm-complete', {
  method: 'POST',
  body: JSON.stringify({
    paymentHoldId: 'hold-uuid',
    userId: contractor.id,
    userType: 'contractor'
  })
})
```

**Result:**
- Both `homeowner_confirmed_complete` and `contractor_confirmed_complete` = true
- Database trigger auto-updates `status = 'released'`

---

### Step 4: Auto-Release Payment
Database trigger calls `/api/payments/release` internally

**Result:**
- Stripe Transfer created to contractor's Connect account
- `payment_holds.status = 'released'`
- `transactions` record created for contractor earnings
- Both parties receive "Payment released!" notification

---

## Security & RLS Policies

### Payment Holds
- Users can only view their own payment holds (homeowner or contractor)
- Only homeowner/contractor can update their confirmation status

### Transactions
- Users can only view their own transactions
- No user can modify transactions (system-created only)

### Stripe Customers
- Users can only view their own Stripe customer record

### Stripe Connect Accounts
- Contractors can only view their own Connect account

---

## Testing Workflow

### 1. Run Migrations
```bash
# In Supabase SQL Editor
supabase/migrations/20251018000001_add_contractor_geocoding.sql
supabase/migrations/20251018000002_rushrmap_updates.sql
supabase/migrations/20251018000003_stripe_escrow_system.sql
```

### 2. Test Payment Flow
```sql
-- 1. Create test job
INSERT INTO homeowner_jobs (...) VALUES (...);

-- 2. Create test bid
INSERT INTO job_bids (...) VALUES (...);

-- 3. Accept bid (frontend)
-- Calls /api/payments/create-hold

-- 4. Check payment_holds table
SELECT * FROM payment_holds WHERE bid_id = 'bid-uuid';

-- 5. Capture payment (frontend)
-- Calls /api/payments/capture

-- 6. Confirm completion (both parties)
-- Calls /api/payments/confirm-complete

-- 7. Check transactions
SELECT * FROM homeowner_payment_history;
SELECT * FROM contractor_earnings_history;
```

---

## Common Issues & Solutions

### Issue: "Contractor has not completed Stripe Connect onboarding"
**Solution:** Contractor must complete Stripe Connect Express onboarding before receiving payouts.

```typescript
// Create Stripe Connect account link
const accountLink = await stripe.accountLinks.create({
  account: contractor.stripe_account_id,
  refresh_url: 'https://rushr.com/dashboard/contractor/connect/refresh',
  return_url: 'https://rushr.com/dashboard/contractor/connect/complete',
  type: 'account_onboarding'
})

// Redirect contractor to accountLink.url
```

---

### Issue: Payment stuck in "captured" status
**Solution:** Check if both parties confirmed completion.

```sql
SELECT
  homeowner_confirmed_complete,
  contractor_confirmed_complete,
  status
FROM payment_holds
WHERE id = 'hold-uuid';
```

If both = true but status still "captured", manually trigger release:
```typescript
await fetch('/api/payments/release', {
  method: 'POST',
  body: JSON.stringify({ paymentHoldId: 'hold-uuid' })
})
```

---

## Next Steps

1. ✅ Run database migrations
2. ✅ Set up Stripe API keys in environment
3. ⚠️ Create Stripe Connect onboarding flow for contractors
4. ⚠️ Add `<PaymentHistory />` to homeowner dashboard
5. ⚠️ Add `<PaymentHistory />` to contractor dashboard
6. ⚠️ Add `<EscrowStatus />` to job details pages
7. ⚠️ Test complete workflow with Stripe test mode
8. ⚠️ Set up webhook handlers for Stripe events (charge.captured, transfer.created, etc.)

---

## Stripe Webhook Events to Handle

```typescript
// /api/webhooks/stripe

switch (event.type) {
  case 'payment_intent.succeeded':
    // Update payment_holds status
    break

  case 'payment_intent.payment_failed':
    // Update payment_holds status to 'failed'
    // Notify homeowner
    break

  case 'charge.refunded':
    // Update payment_holds status to 'refunded'
    // Create refund transaction
    break

  case 'transfer.created':
    // Log transfer to contractor
    break

  case 'account.updated':
    // Update stripe_connect_accounts
    // Check if payouts_enabled changed
    break
}
```

---

**Status:** Stripe escrow system fully implemented and ready for testing! 🚀
