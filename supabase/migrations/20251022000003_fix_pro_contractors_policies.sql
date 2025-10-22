-- Fix pro_contractors RLS policies - remove duplicates and conflicts
-- This fixes the "contractor_id is ambiguous" error

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Allow all for authenticated users" ON pro_contractors;
DROP POLICY IF EXISTS "Contractors can view their own profile" ON pro_contractors;
DROP POLICY IF EXISTS "Contractors can update their own profile" ON pro_contractors;
DROP POLICY IF EXISTS "Contractors can create their own profile" ON pro_contractors;
DROP POLICY IF EXISTS "Anyone can view approved contractors" ON pro_contractors;
DROP POLICY IF EXISTS "Contractors manage own profile" ON pro_contractors;
DROP POLICY IF EXISTS "pro_auth_update" ON pro_contractors;
DROP POLICY IF EXISTS "pro_public_view_approved" ON pro_contractors;
DROP POLICY IF EXISTS "pro_auth_view_all" ON pro_contractors;
DROP POLICY IF EXISTS "pro_auth_insert" ON pro_contractors;

-- Create CLEAN, non-conflicting policies

-- 1. INSERT: Authenticated users can create their own contractor profile
CREATE POLICY "contractors_insert_own"
ON pro_contractors
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 2. SELECT: Contractors can view their own profile
CREATE POLICY "contractors_select_own"
ON pro_contractors
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 3. SELECT: Public can view approved contractors (will add 'online' after enum is updated)
CREATE POLICY "public_select_approved"
ON pro_contractors
FOR SELECT
TO public
USING (status = 'approved');

-- 4. UPDATE: Contractors can update their own profile
CREATE POLICY "contractors_update_own"
ON pro_contractors
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 5. DELETE: Contractors can delete their own profile (optional)
CREATE POLICY "contractors_delete_own"
ON pro_contractors
FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- Make sure RLS is enabled
ALTER TABLE pro_contractors ENABLE ROW LEVEL SECURITY;
