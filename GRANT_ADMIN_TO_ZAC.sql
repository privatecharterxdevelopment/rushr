-- =============================================================================
-- GRANT ADMIN RIGHTS TO zac@spgroup.com AND jacob@spgroup.com
-- Run this in Supabase SQL Editor to grant admin permissions
-- =============================================================================

-- 1. DROP AND RECREATE ADMIN POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can view all contractors" ON pro_contractors;
DROP POLICY IF EXISTS "Admins can update all contractors" ON pro_contractors;

-- 2. CREATE ADMIN VIEW POLICY (INCLUDING zac@spgroup.com)
-- -----------------------------------------------------------------------------
CREATE POLICY "Admins can view all contractors" ON pro_contractors
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      -- Check if user email is in admin list
      (SELECT email FROM auth.users WHERE id = auth.uid()) IN (
        'admin@userushr.com',
        'lorenzo.vanza@hotmail.com',
        'zac@spgrp.com',
        'zac@spgroup.com',
        'jacob@spgroup.com',
        'jake@spgrp.com',
        'zac.schwartz212@gmail.com',
        'jakezpodolsky@gmail.com'
      )
      OR
      -- Or if user has admin role
      (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
    )
  );

-- 3. CREATE ADMIN UPDATE POLICY (INCLUDING zac@spgroup.com)
-- -----------------------------------------------------------------------------
CREATE POLICY "Admins can update all contractors" ON pro_contractors
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND (
      -- Check if user email is in admin list
      (SELECT email FROM auth.users WHERE id = auth.uid()) IN (
        'admin@userushr.com',
        'lorenzo.vanza@hotmail.com',
        'zac@spgrp.com',
        'zac@spgroup.com',
        'jacob@spgroup.com',
        'jake@spgrp.com',
        'zac.schwartz212@gmail.com',
        'jakezpodolsky@gmail.com'
      )
      OR
      -- Or if user has admin role
      (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
    )
  );

-- 4. VERIFY SETUP
-- -----------------------------------------------------------------------------
SELECT 'Admin permissions updated! zac@spgroup.com and jacob@spgroup.com now have admin rights.' as status;

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
