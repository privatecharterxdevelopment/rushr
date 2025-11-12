-- =============================================================================
-- Drop ONLY the notification triggers on job_bids, keep the useful ones
-- =============================================================================

-- Drop the notification-creating triggers
DROP TRIGGER IF EXISTS on_bid_created ON job_bids;
DROP TRIGGER IF EXISTS on_bid_created_notify ON job_bids;
DROP TRIGGER IF EXISTS on_bid_accepted_notify ON job_bids;
DROP TRIGGER IF EXISTS on_bid_accepted_notify_homeowner ON job_bids;
DROP TRIGGER IF EXISTS on_bid_status_change ON job_bids;

-- Keep these useful triggers:
-- - trigger_create_calendar_events (creates calendar events)
-- - update_job_bids_updated_at (updates timestamp)

-- Verify what remains on job_bids
SELECT
  '=== REMAINING TRIGGERS ON JOB_BIDS ===' as info,
  trigger_name
FROM information_schema.triggers
WHERE event_object_table = 'job_bids'
ORDER BY trigger_name;

SELECT '✅ Notification triggers removed. Calendar and timestamp triggers kept.' as status;
