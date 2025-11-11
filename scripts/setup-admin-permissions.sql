-- =============================================================================
-- ADMIN PERMISSIONS SETUP
-- Run this script in Supabase SQL Editor to enable admin functionality
-- =============================================================================

-- 1. DROP EXISTING ADMIN POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can update all contractors" ON pro_contractors;
DROP POLICY IF EXISTS "Admins can view all contractors" ON pro_contractors;

-- 2. CREATE ADMIN VIEW POLICY
-- -----------------------------------------------------------------------------
-- Allow admins to view all contractors
CREATE POLICY "Admins can view all contractors" ON pro_contractors
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      -- Check if user email is in admin list
      (SELECT email FROM auth.users WHERE id = auth.uid()) IN (
        'admin@userushr.com',
        'lorenzo.vanza@hotmail.com',
        'zac@spgrp.com',
        'jake@spgrp.com',
        'zac.schwartz212@gmail.com',
        'jakezpodolsky@gmail.com'
      )
      OR
      -- Or if user has admin role
      (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
    )
  );

-- 3. CREATE ADMIN UPDATE POLICY
-- -----------------------------------------------------------------------------
-- Allow admins to update all contractors
CREATE POLICY "Admins can update all contractors" ON pro_contractors
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND (
      -- Check if user email is in admin list
      (SELECT email FROM auth.users WHERE id = auth.uid()) IN (
        'admin@userushr.com',
        'lorenzo.vanza@hotmail.com',
        'zac@spgrp.com',
        'jake@spgrp.com',
        'zac.schwartz212@gmail.com',
        'jakezpodolsky@gmail.com'
      )
      OR
      -- Or if user has admin role
      (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
    )
  );

-- 4. ENSURE ADMIN USER PROFILE EXISTS
-- -----------------------------------------------------------------------------
-- Create or update admin user profile for lorenzo.vanza@hotmail.com
INSERT INTO user_profiles (id, email, name, role, created_at, updated_at)
SELECT
  id,
  email,
  'Lorenzo Vanza',
  'admin',
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'lorenzo.vanza@hotmail.com'
ON CONFLICT (id)
DO UPDATE SET
  role = 'admin',
  updated_at = NOW();

-- 5. VERIFY SETUP
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
