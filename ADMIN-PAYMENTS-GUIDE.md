# Admin Payments & Escrow - Complete Guide

## Overview

Complete financial oversight system for monitoring payments, escrow, platform revenue, and contractor payouts.

## Features Added

### ✅ Payments Dashboard
- Real-time financial statistics
- Platform revenue tracking (10% fees)
- Active escrow monitoring
- Stuck payment detection
- Quick access to all payment tools

### ✅ Escrow Management
- View all active escrow holds
- Monitor payments > 7 days stuck
- Force release stuck payments
- Issue refunds
- Both-party confirmation tracking

### ✅ Contractor Payouts
- Stripe Connect account status
- Pending payouts per contractor
- Total lifetime earnings
- KYC/onboarding completion tracking
- Requirements monitoring

### ✅ Revenue Analytics
- Monthly revenue breakdown
- Platform fee collection trends
- Contractor payout totals
- Transaction volume tracking
- Average revenue per transaction

### ✅ Transaction Search
- Search all payments
- Filter by status
- Export to CSV
- Full transaction history
- Stripe ID tracking

## Navigation

```
/dashboard/admin/payments
├── Overview (Main dashboard)
├── /escrow (Manage escrow holds)
├── /payouts (Contractor payouts)
├── /analytics (Revenue reports)
└── /transactions (Search & export)
```

## Payment Flow Understanding

### Complete Lifecycle

```
1. Homeowner accepts bid
   ↓
2. Payment authorized (NOT captured yet)
   status: 'authorized'
   ↓
3. Payment captured → Funds in escrow
   status: 'captured'
   amount: $150 (example)
   platform_fee: $15 (10%)
   contractor_payout: $135
   ↓
4. Both parties confirm completion
   homeowner_confirmed_complete: true
   contractor_confirmed_complete: true
   ↓
5. Auto-releases (database trigger)
   status: 'released'
   ↓
6. Stripe Transfer to contractor
   contractor receives: $135
   platform keeps: $15
   ↓
7. Job complete
   payment_status: 'released'
```

### Fee Structure

**Platform Fee: 10%**
- Deducted from contractor payout
- Platform revenue

**Stripe Processing Fee: 2.9% + $0.30**
- Charged on total transaction
- Absorbed by platform (not passed to contractor)

**Example Transaction:**
```
Bid Amount:              $150.00
Homeowner Pays:          $150.00
Stripe Fee (absorbed):    -$4.65
Platform Gross:           $15.00
Platform Net:             $10.35  ($15 - $4.65)
Contractor Receives:     $135.00
```

## Key Admin Pages

### 1. Payments Overview

**URL:** `/dashboard/admin/payments`

**Shows:**
- Today's revenue
- Monthly revenue
- Total revenue (all time)
- Total escrow balance
- Stuck payments alert
- Recent transactions table

**Real-time:** ✅ Updates automatically

**Actions:**
- Navigate to escrow management
- Navigate to payout monitoring
- View analytics

### 2. Escrow Management

**URL:** `/dashboard/admin/payments/escrow`

**Shows:**
- All active escrow holds
- Stuck payments (>7 days)
- Confirmation status (both parties)
- Payment breakdowns

**Filters:**
- Active (captured status)
- Stuck (>7 days)
- All history

**Actions:**
- **Force Release** - Manually release stuck payment
  - Sets both confirmations to true
  - Triggers auto-release
  - Calls Stripe Transfer API
  - Cannot be undone
- **Issue Refund** - Mark payment as refunded
  - Updates status to 'refunded'
  - Note: Actual Stripe refund must be done separately

**When to Force Release:**
- Both parties verbally confirmed but didn't click button
- Payment stuck > 14 days with valid reason
- Customer service intervention needed

**Warning:** Force release bypasses normal confirmation flow. Use carefully!

### 3. Contractor Payouts

**URL:** `/dashboard/admin/payments/payouts`

**Shows:**
- All approved contractors
- Stripe Connect account status
- Payouts enabled/disabled
- Pending payouts per contractor
- Total earnings
- Last payout date
- Requirements currently due

**Stats:**
- Total pending payouts
- Lifetime payouts
- Setup completion rate
- Contractors needing setup

**Stripe Status Indicators:**
- ✅ Payouts enabled - Can receive money
- ❌ Payouts disabled - Setup incomplete
- ⚠️ Requirements due - Action needed

**What to Monitor:**
- Contractors with pending payouts but no Stripe account
- Requirements currently due (blocking payouts)
- High-value contractors with setup issues

### 4. Revenue Analytics

**URL:** `/dashboard/admin/payments/analytics`

**Shows:**
- Monthly revenue breakdown
- Platform fees collected
- Contractor payouts distributed
- Transaction counts
- Average fee per transaction

**Metrics:**
- Total platform revenue (all time)
- Total contractor payouts
- Total completed transactions
- Monthly trends

**Use Cases:**
- Financial reporting
- Revenue forecasting
- Performance tracking
- Monthly summaries

### 5. Transaction Search

**URL:** `/dashboard/admin/payments/transactions`

**Features:**
- Search by:
  - Homeowner name
  - Contractor name
  - Job title
  - Stripe PaymentIntent ID
- Filter by status:
  - All
  - Captured (in escrow)
  - Released
  - Refunded
  - Disputed
- Export to CSV

**CSV Export Includes:**
- Date
- Job
- Homeowner
- Contractor
- Amount
- Platform Fee
- Contractor Payout
- Status

**Use Cases:**
- Accounting reports
- Dispute research
- Customer support
- Financial audits

## Database Tables

### `payment_holds`

Main escrow tracking table.

**Key Fields:**
```sql
id UUID
job_id UUID                           -- Optional (bid-based)
offer_id UUID                         -- Optional (direct offer)
homeowner_id UUID                     -- Payer
contractor_id UUID                    -- Payee

stripe_payment_intent_id TEXT         -- Stripe reference
stripe_charge_id TEXT
stripe_customer_id TEXT

amount DECIMAL(10,2)                  -- Total
platform_fee DECIMAL(10,2)            -- 10% fee
contractor_payout DECIMAL(10,2)       -- Amount to contractor
stripe_fee DECIMAL(10,2)              -- Stripe fee (estimated)

status TEXT                           -- Lifecycle status
homeowner_confirmed_complete BOOLEAN
contractor_confirmed_complete BOOLEAN
homeowner_confirmed_at TIMESTAMPTZ
contractor_confirmed_at TIMESTAMPTZ

released_at TIMESTAMPTZ
stripe_transfer_id TEXT               -- Payout reference
```

**Status Values:**
- `pending` - PaymentIntent created
- `authorized` - Payment authorized
- `captured` - Funds in escrow
- `released` - Transferred to contractor
- `refunded` - Refunded to homeowner
- `disputed` - Chargeback filed
- `failed` - Payment failed
- `cancelled` - Cancelled before capture

### `stripe_connect_accounts`

Contractor Stripe accounts.

**Key Fields:**
```sql
contractor_id UUID                    -- UNIQUE
stripe_account_id TEXT                -- Stripe acct_xxx
onboarding_complete BOOLEAN
charges_enabled BOOLEAN
payouts_enabled BOOLEAN
account_type TEXT                     -- 'express'
requirements_currently_due TEXT[]    -- Blocking requirements
requirements_eventually_due TEXT[]
```

## Common Admin Tasks

### How to Handle Stuck Payment

**Problem:** Payment in escrow > 7 days, parties haven't confirmed.

**Solution:**
1. Go to Escrow Management
2. Filter: "Stuck (>7 days)"
3. Review payment details
4. Contact both parties to verify completion
5. If confirmed complete:
   - Click "Details" on payment
   - Click "Force Release Payment"
   - Confirm action
6. Payment released to contractor

### How to Issue Refund

**Problem:** Homeowner wants refund, job cancelled.

**Solution:**
1. Go to Escrow Management
2. Find the payment
3. Click "Details"
4. Click "Issue Refund"
5. Enter refund reason
6. **IMPORTANT:** Go to Stripe Dashboard
7. Find PaymentIntent ID
8. Process actual refund in Stripe
9. Money returns to homeowner

**Note:** Admin panel only updates status. Actual Stripe refund must be done separately.

### How to Help Contractor with Payout Issues

**Problem:** Contractor says they can't receive payouts.

**Solution:**
1. Go to Contractor Payouts
2. Find the contractor
3. Check status:
   - No Stripe account → Send them to wizard again
   - Payouts disabled → Check requirements
   - Requirements due → Contact contractor with list
4. If requirements due:
   - Copy requirement list
   - Email contractor
   - They must complete Stripe onboarding
5. Once requirements cleared, payouts auto-enable

### How to Generate Monthly Report

**Solution:**
1. Go to Revenue Analytics
2. Note monthly breakdown table
3. Copy statistics for desired month
4. OR go to Transactions
5. Filter by date range (modify code if needed)
6. Click "Export CSV"
7. Open in Excel/Google Sheets
8. Create pivot tables for reporting

## Security & Permissions

### Who Can Access

Only admin users:
- `admin@userushr.com`
- OR `userProfile.role === 'admin'`

### Sensitive Operations

**Force Release:**
- Bypasses normal confirmation
- Immediately transfers funds
- Cannot be undone
- Audit logging recommended

**Refund:**
- Updates database status
- Does NOT process Stripe refund
- Manual Stripe action required

## Alerts & Monitoring

### Automatic Alerts

**Stuck Payments:**
- Red banner on overview
- Shows count > 7 days
- Links to escrow management

**Setup Required:**
- Amber banner on payouts page
- Shows contractors without Stripe accounts
- Blocks their ability to receive money

### What to Monitor Daily

- [ ] Stuck payments count
- [ ] New escrow holds
- [ ] Contractors needing setup
- [ ] Today's revenue vs. average

### What to Monitor Weekly

- [ ] Total escrow balance
- [ ] Pending payouts total
- [ ] Contractor setup completion rate
- [ ] Disputed payments

### What to Monitor Monthly

- [ ] Platform revenue trends
- [ ] Average fee per transaction
- [ ] Top earning contractors
- [ ] Refund rate

## Troubleshooting

### Payment Won't Release

**Symptoms:** Force release fails, error in console

**Possible Causes:**
1. Contractor has no Stripe account
2. Contractor Stripe account not verified
3. Network/API error

**Solution:**
1. Check contractor in Payouts page
2. Verify Stripe account exists
3. Verify payouts_enabled = true
4. Check Stripe Dashboard for account issues
5. Check browser console for exact error
6. May need to release manually via Stripe

### Wrong Platform Fee Calculated

**Symptoms:** Platform fee doesn't match 10%

**Possible Causes:**
1. Old payment with different fee structure
2. Manual adjustment made
3. Database corruption

**Solution:**
1. Check payment_holds.platform_fee
2. Verify: `platform_fee = amount * 0.10`
3. If incorrect, note in audit log
4. Don't modify - affects reconciliation

### Contractor Says They Didn't Receive Payout

**Symptoms:** Payment shows "released" but contractor didn't get money

**Solution:**
1. Go to Escrow Management
2. Find the payment
3. Check `stripe_transfer_id`
4. Copy Transfer ID (starts with `tr_`)
5. Go to Stripe Dashboard
6. Search for Transfer ID
7. Check transfer status:
   - Succeeded → Money sent (bank may be slow)
   - Failed → Re-issue transfer
   - Pending → Wait for completion
8. Check contractor's Stripe account settings
9. Verify correct bank account connected

## Real-time Updates

All payment pages use Supabase Realtime:

```typescript
const subscription = supabase
  .channel('admin-payments')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'payment_holds'
  }, () => {
    fetchData()  // Refresh
  })
  .subscribe()
```

**What Updates Live:**
- New escrow holds
- Status changes
- Confirmation updates
- Releases
- Refunds

**Visual Indicator:**
- "Live updates active" badge
- Real-time badge counters
- No page refresh needed

## Future Enhancements

### Planned Features

- [ ] Webhook event logging
- [ ] Automated refund processing
- [ ] Dispute management workflow
- [ ] Advanced analytics charts
- [ ] Email notifications
- [ ] Audit trail logging
- [ ] Bulk operations
- [ ] Custom date range reports
- [ ] Contractor performance metrics
- [ ] Automated stuck payment reminders

### Nice to Have

- [ ] Revenue forecasting
- [ ] Chargeback handling
- [ ] Tax reporting exports
- [ ] Integration with accounting software
- [ ] Mobile app for monitoring
- [ ] Push notifications for critical events

## Quick Reference

### URLs
- Overview: `/dashboard/admin/payments`
- Escrow: `/dashboard/admin/payments/escrow`
- Payouts: `/dashboard/admin/payments/payouts`
- Analytics: `/dashboard/admin/payments/analytics`
- Transactions: `/dashboard/admin/payments/transactions`

### Key Tables
- `payment_holds` - All escrow data
- `stripe_connect_accounts` - Contractor Stripe accounts
- `transactions` - Payment history
- `homeowner_jobs` - Job details
- `job_bids` - Bid amounts

### Fee Structure
- Platform: **10%** (from contractor)
- Stripe: **2.9% + $0.30** (absorbed by platform)
- Net: Platform fee - Stripe fee

### Payment Statuses
- `captured` - In escrow
- `released` - Paid out
- `refunded` - Returned
- `disputed` - Chargeback

### Critical Actions
- Force Release - Irreversible
- Issue Refund - Needs Stripe action
- Export CSV - For accounting

---

**Last Updated:** 2025-01-09
**Version:** 1.0.0
**Status:** Production Ready ✅
