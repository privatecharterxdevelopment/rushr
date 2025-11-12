-- =============================================================================
-- NUCLEAR OPTION: Find and destroy ALL notification-creating triggers
-- =============================================================================

-- Show ALL triggers in the entire database
SELECT
  '=== ALL TRIGGERS IN DATABASE ===' as info,
  trigger_schema,
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Show ALL functions that mention 'notification'
SELECT
  '=== ALL FUNCTIONS MENTIONING NOTIFICATIONS ===' as info,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_definition ILIKE '%notification%';

-- Drop ALL possible bid-related triggers
DROP TRIGGER IF EXISTS trigger_notify_homeowner_on_bid ON job_bids CASCADE;
DROP TRIGGER IF EXISTS notify_homeowner_on_new_bid ON job_bids CASCADE;
DROP TRIGGER IF EXISTS on_bid_insert ON job_bids CASCADE;
DROP TRIGGER IF EXISTS bid_notification_trigger ON job_bids CASCADE;
DROP TRIGGER IF EXISTS notify_on_bid ON job_bids CASCADE;
DROP TRIGGER IF EXISTS create_bid_notification ON job_bids CASCADE;
DROP TRIGGER IF EXISTS after_bid_insert ON job_bids CASCADE;

-- Drop ALL possible notification-creating functions
DROP FUNCTION IF EXISTS notify_homeowner_on_new_bid() CASCADE;
DROP FUNCTION IF EXISTS create_bid_notification() CASCADE;
DROP FUNCTION IF EXISTS notify_on_new_bid() CASCADE;

-- Show what remains
SELECT
  '=== REMAINING TRIGGERS ON JOB_BIDS (should be EMPTY) ===' as info,
  trigger_name,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'job_bids';

SELECT '✅ NUCLEAR OPTION COMPLETE. ALL TRIGGERS DESTROYED.' as status;
