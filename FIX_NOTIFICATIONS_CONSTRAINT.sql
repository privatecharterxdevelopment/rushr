-- =============================================================================
-- FIX NOTIFICATION TYPE CONSTRAINT - Add missing 'new_bid' type
-- Run this in Supabase SQL Editor
-- =============================================================================

-- Step 1: Drop the existing check constraint
-- -----------------------------------------------------------------------------
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Step 2: Add the updated constraint with ALL notification types including 'new_bid'
-- -----------------------------------------------------------------------------
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (
  type IN (
    -- Job-related notifications
    'new_bid',              -- ADDED: For when contractors submit bids
    'bid_received',         -- ADDED: Alternative name for new bid
    'bid_accepted',
    'bid_rejected',
    'job_completed',
    'job_cancelled',
    'job_updated',
    'new_job_match',

    -- Payment notifications
    'payment_received',
    'payment_sent',
    'payment_pending',
    'payment_failed',
    'payout_processed',

    -- Message notifications
    'new_message',
    'message_read',

    -- Profile notifications
    'profile_approved',
    'profile_rejected',
    'kyc_required',
    'kyc_approved',
    'kyc_rejected',

    -- System notifications
    'welcome',
    'system_update',
    'account_update',

    -- Direct offer notifications
    'direct_offer_received',
    'direct_offer_accepted',
    'direct_offer_rejected',
    'direct_offer_expired'
  )
);

-- Step 3: Verify the constraint was updated
-- -----------------------------------------------------------------------------
SELECT 'Notification type constraint updated successfully! Contractors can now submit bids.' as status;

-- Show the constraint details
SELECT
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'notifications'::regclass
  AND conname = 'notifications_type_check';
