-- =============================================================================
-- COMPLETE BID SYSTEM FIX
-- This file fixes ALL issues preventing contractors from submitting bids
-- Run this ENTIRE file in Supabase SQL Editor
-- =============================================================================

-- =============================================================================
-- PART 1: Fix job_bids table structure
-- =============================================================================

-- Remove NOT NULL constraint from description column if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'job_bids'
        AND column_name = 'description'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE job_bids ALTER COLUMN description DROP NOT NULL;
    END IF;
END $$;

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Add message column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'job_bids' AND column_name = 'message'
    ) THEN
        ALTER TABLE job_bids ADD COLUMN message TEXT;
    END IF;

    -- Add estimated_duration column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'job_bids' AND column_name = 'estimated_duration'
    ) THEN
        ALTER TABLE job_bids ADD COLUMN estimated_duration INTEGER;
    END IF;

    -- Add accepted_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'job_bids' AND column_name = 'accepted_at'
    ) THEN
        ALTER TABLE job_bids ADD COLUMN accepted_at TIMESTAMPTZ;
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'job_bids' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE job_bids ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- =============================================================================
-- PART 2: Fix notifications constraint to allow bid notifications
-- =============================================================================

-- Drop the existing check constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add the updated constraint with ALL notification types including bid-related ones
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (
  type IN (
    -- Job-related notifications
    'new_bid',              -- For when contractors submit bids
    'bid_received',         -- Alternative name for new bid
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

-- =============================================================================
-- PART 3: Fix bid notification trigger
-- =============================================================================

-- Update the function to use correct notification type
CREATE OR REPLACE FUNCTION notify_homeowner_on_new_bid()
RETURNS TRIGGER AS $$
DECLARE
  v_job_title TEXT;
  v_contractor_name TEXT;
BEGIN
  -- Get job title
  SELECT title INTO v_job_title
  FROM homeowner_jobs
  WHERE id = NEW.job_id;

  -- Get contractor name
  SELECT name INTO v_contractor_name
  FROM pro_contractors
  WHERE id = NEW.contractor_id;

  -- Insert notification for homeowner
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    link,
    is_read,
    created_at
  ) VALUES (
    NEW.homeowner_id,
    'new_bid',  -- Using 'new_bid' which is now allowed in constraint
    'New Bid Received',
    format('"%s" has bid $%s on your job "%s"',
      COALESCE(v_contractor_name, 'A contractor'),
      NEW.bid_amount::TEXT,
      COALESCE(v_job_title, 'your job')
    ),
    format('/jobs/%s/compare', NEW.job_id),
    false,
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger (if it doesn't exist)
DROP TRIGGER IF EXISTS trigger_notify_homeowner_on_bid ON job_bids;
CREATE TRIGGER trigger_notify_homeowner_on_bid
  AFTER INSERT ON job_bids
  FOR EACH ROW
  EXECUTE FUNCTION notify_homeowner_on_new_bid();

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Verify job_bids table structure
SELECT
  '=== JOB_BIDS TABLE STRUCTURE ===' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'job_bids'
ORDER BY ordinal_position;

-- Verify notifications constraint
SELECT
  '=== NOTIFICATIONS CONSTRAINT ===' as info,
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'notifications'::regclass
  AND conname = 'notifications_type_check';

-- Final success message
SELECT '✅ ALL BID SYSTEM FIXES APPLIED SUCCESSFULLY! Contractors can now submit bids.' as status;
