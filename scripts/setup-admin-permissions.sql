-- =============================================================================
-- ADMIN PERMISSIONS SETUP (EMAIL-BASED ONLY)
-- Run this script in Supabase SQL Editor to enable admin functionality
-- Note: user_profiles.role can only be 'homeowner' or 'contractor', so we use email-based auth only
-- =============================================================================

-- 1. DROP EXISTING ADMIN POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can update all contractors" ON pro_contractors;
DROP POLICY IF EXISTS "Admins can view all contractors" ON pro_contractors;

-- 2. CREATE ADMIN VIEW POLICY (EMAIL-BASED ONLY)
-- -----------------------------------------------------------------------------
-- Allow admins to view all contractors
CREATE POLICY "Admins can view all contractors" ON pro_contractors
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN (
      'admin@userushr.com',
      'lorenzo.vanza@hotmail.com',
      'zac@spgrp.com',
      'jake@spgrp.com',
      'zac.schwartz212@gmail.com',
      'jakezpodolsky@gmail.com'
    )
  );

-- 3. CREATE ADMIN UPDATE POLICY (EMAIL-BASED ONLY)
-- -----------------------------------------------------------------------------
-- Allow admins to update all contractors
CREATE POLICY "Admins can update all contractors" ON pro_contractors
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    (SELECT email FROM auth.users WHERE id = auth.uid()) IN (
      'admin@userushr.com',
      'lorenzo.vanza@hotmail.com',
      'zac@spgrp.com',
      'jake@spgrp.com',
      'zac.schwartz212@gmail.com',
      'jakezpodolsky@gmail.com'
    )
  );

-- 4. VERIFY SETUP
-- -----------------------------------------------------------------------------
SELECT 'Admin permissions setup complete!' as status;

-- Show all admin policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'pro_contractors'
  AND policyname LIKE '%Admin%';
