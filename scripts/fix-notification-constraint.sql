-- =============================================================================
-- FIX NOTIFICATION TYPE CONSTRAINT
-- Run this in Supabase SQL Editor to allow profile_approved notification type
-- =============================================================================

-- 1. Drop the existing check constraint
-- -----------------------------------------------------------------------------
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- 2. Add the updated constraint with all notification types
-- -----------------------------------------------------------------------------
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (
  type IN (
    -- Job-related notifications
    'new_bid',
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

-- 3. Verify the constraint was updated
-- -----------------------------------------------------------------------------
SELECT 'Notification type constraint updated successfully!' as status;

-- Show the constraint details
SELECT
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'notifications'::regclass
  AND conname = 'notifications_type_check';
