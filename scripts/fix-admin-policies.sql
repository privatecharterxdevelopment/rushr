-- Fix RLS policies to allow admin users to update pro_contractors

-- Drop existing restrictive policies if any
DROP POLICY IF EXISTS "Admins can update all contractors" ON pro_contractors;
DROP POLICY IF EXISTS "Admins can view all contractors" ON pro_contractors;

-- Create admin policies
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
