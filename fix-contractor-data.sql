-- Cleanup script for contractor data issues
-- Run this ONCE after deploying the fixed handle_new_user() trigger

-- 1. Delete user_profiles entries for users who are contractors
-- Contractors should ONLY exist in pro_contractors table, not user_profiles
DELETE FROM user_profiles
WHERE id IN (
  SELECT id FROM pro_contractors
);

-- 2. Verify the cleanup
SELECT
  'Contractors in pro_contractors' as description,
  COUNT(*) as count
FROM pro_contractors

UNION ALL

SELECT
  'Contractors accidentally in user_profiles (should be 0)' as description,
  COUNT(*) as count
FROM user_profiles
WHERE id IN (SELECT id FROM pro_contractors);

-- 3. Verify homeowners are still intact
SELECT
  'Homeowners in user_profiles' as description,
  COUNT(*) as count
FROM user_profiles
WHERE id NOT IN (SELECT id FROM pro_contractors);
