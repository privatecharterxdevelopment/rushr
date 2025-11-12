-- =============================================================================
-- SIMPLE FIX: Disable the bid notification trigger that's causing the error
-- Run this in Supabase SQL Editor
-- =============================================================================

-- Just disable the trigger that's causing the constraint violation
DROP TRIGGER IF EXISTS trigger_notify_homeowner_on_bid ON job_bids;

-- Success message
SELECT '✅ Bid notification trigger disabled. Contractors can now submit bids!' as status;
SELECT 'Note: You can set up simple bell notifications later.' as note;
