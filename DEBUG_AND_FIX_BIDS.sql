-- =============================================================================
-- DEBUG AND FIX BIDS - Find and fix ALL issues
-- =============================================================================

-- Step 1: Check what triggers exist on job_bids
SELECT
  '=== TRIGGERS ON JOB_BIDS ===' as info,
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'job_bids';

-- Step 2: Drop ALL triggers on job_bids
DROP TRIGGER IF EXISTS trigger_notify_homeowner_on_bid ON job_bids;
DROP TRIGGER IF EXISTS notify_homeowner_on_new_bid ON job_bids;
DROP TRIGGER IF EXISTS on_bid_insert ON job_bids;
DROP TRIGGER IF EXISTS bid_notification_trigger ON job_bids;

-- Step 3: Check current notification constraint
SELECT
  '=== CURRENT NOTIFICATION CONSTRAINT ===' as info,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'notifications'::regclass
  AND conname = 'notifications_type_check';

-- Step 4: Drop and recreate the constraint to include 'new_bid'
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (
  type IN (
    'new_bid',
    'bid_received',
    'bid_accepted',
    'bid_rejected',
    'job_completed',
    'job_cancelled',
    'job_updated',
    'new_job_match',
    'payment_received',
    'payment_sent',
    'payment_pending',
    'payment_failed',
    'payout_processed',
    'new_message',
    'message_read',
    'profile_approved',
    'profile_rejected',
    'kyc_required',
    'kyc_approved',
    'kyc_rejected',
    'welcome',
    'system_update',
    'account_update',
    'direct_offer_received',
    'direct_offer_accepted',
    'direct_offer_rejected',
    'direct_offer_expired'
  )
);

-- Step 5: Verify no triggers remain
SELECT
  '=== REMAINING TRIGGERS (should be empty) ===' as info,
  trigger_name
FROM information_schema.triggers
WHERE event_object_table = 'job_bids';

-- Final message
SELECT '✅ ALL TRIGGERS REMOVED AND CONSTRAINT FIXED! Try submitting a bid now.' as status;
