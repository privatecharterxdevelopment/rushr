-- ============================================================================
-- EMERGENCY FIX: Restore deleted user_profiles for homeowners
-- ============================================================================
-- Run this in Supabase SQL Editor to restore homeowner profiles
-- that were accidentally deleted by the cleanup script
-- ============================================================================

-- Step 1: Find all auth users who should have homeowner profiles
-- (users who are NOT contractors)
INSERT INTO user_profiles (id, email, name, role, subscription_type, created_at)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', ''),
  'homeowner',
  'free',
  au.created_at
FROM auth.users au
WHERE NOT EXISTS (
  -- Only create if user is NOT a contractor
  SELECT 1 FROM pro_contractors pc WHERE pc.id = au.id
)
AND NOT EXISTS (
  -- Only create if profile doesn't already exist
  SELECT 1 FROM user_profiles up WHERE up.id = au.id
)
AND (
  -- Only for users who signed up as homeowners OR have no role metadata
  COALESCE(au.raw_user_meta_data->>'role', 'homeowner') = 'homeowner'
);

-- Step 2: Verify the fix
SELECT
  'Total auth users' as description,
  COUNT(*) as count
FROM auth.users

UNION ALL

SELECT
  'Homeowner profiles in user_profiles' as description,
  COUNT(*) as count
FROM user_profiles

UNION ALL

SELECT
  'Contractor profiles in pro_contractors' as description,
  COUNT(*) as count
FROM pro_contractors

UNION ALL

SELECT
  'Users with BOTH profiles (should be 0)' as description,
  COUNT(*) as count
FROM user_profiles up
INNER JOIN pro_contractors pc ON up.id = pc.id;

-- ============================================================================
-- After running this, all homeowner accounts should be restored
-- ============================================================================
