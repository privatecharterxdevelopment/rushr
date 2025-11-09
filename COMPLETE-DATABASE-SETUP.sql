-- ============================================================================
-- RUSHR ADMIN DASHBOARD - COMPLETE DATABASE SETUP
-- ============================================================================
-- Run these SQL commands in your Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 1: FIX CONTRACTOR/HOMEOWNER TABLE SEPARATION
-- ============================================================================

-- Update the trigger to skip creating user_profiles for contractors
-- Contractors should ONLY exist in pro_contractors table
-- Homeowners should ONLY exist in user_profiles table

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY definer SET search_path = public
AS $$
BEGIN
    -- Skip contractors - they use pro_contractors table only
    IF COALESCE(NEW.raw_user_meta_data->>'role', 'homeowner') = 'contractor' THEN
        RETURN NEW;
    END IF;

    -- Only create user_profiles for homeowners
    INSERT INTO public.user_profiles (id, email, name, role, subscription_type)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', ''),
        'homeowner',  -- Always homeowner if we got here
        'free'  -- Default to free tier
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = COALESCE(EXCLUDED.name, user_profiles.name),
        role = COALESCE(EXCLUDED.role, user_profiles.role),
        subscription_type = COALESCE(EXCLUDED.subscription_type, user_profiles.subscription_type),
        updated_at = NOW();
    RETURN NEW;
END;
$$;

-- ============================================================================
-- STEP 2: CLEAN UP EXISTING CONTRACTOR DATA
-- ============================================================================

-- Remove user_profiles entries for users who are contractors
-- This fixes the logout bug and routing issues

DELETE FROM user_profiles
WHERE id IN (
  SELECT id FROM pro_contractors
);

-- ============================================================================
-- STEP 3: CREATE SUPPORT MESSAGES TABLE (IF MISSING)
-- ============================================================================

-- Create support_messages table for admin support ticket system
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'responded', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  admin_reply TEXT,
  admin_reply_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_support_messages_status ON support_messages(status);
CREATE INDEX IF NOT EXISTS idx_support_messages_user_id ON support_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_created_at ON support_messages(created_at DESC);

-- Enable RLS
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can create their own support messages
CREATE POLICY IF NOT EXISTS "Users can create support messages"
  ON support_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own support messages
CREATE POLICY IF NOT EXISTS "Users can view own support messages"
  ON support_messages FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Admins can view all support messages
CREATE POLICY IF NOT EXISTS "Admins can view all support messages"
  ON support_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admins can update support messages
CREATE POLICY IF NOT EXISTS "Admins can update support messages"
  ON support_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- STEP 4: VERIFY THE SETUP
-- ============================================================================

-- Run this query to verify everything is correct
SELECT
  'Contractors in pro_contractors' as description,
  COUNT(*) as count
FROM pro_contractors

UNION ALL

SELECT
  'Contractors accidentally in user_profiles (should be 0)' as description,
  COUNT(*) as count
FROM user_profiles
WHERE id IN (SELECT id FROM pro_contractors)

UNION ALL

SELECT
  'Homeowners in user_profiles' as description,
  COUNT(*) as count
FROM user_profiles
WHERE id NOT IN (SELECT id FROM pro_contractors)

UNION ALL

SELECT
  'Support messages table exists' as description,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'support_messages'
  ) THEN 1 ELSE 0 END as count;

-- ============================================================================
-- EXPECTED RESULTS:
-- ============================================================================
-- Contractors in pro_contractors: [your number of contractors]
-- Contractors accidentally in user_profiles: 0  ← MUST BE ZERO!
-- Homeowners in user_profiles: [your number of homeowners]
-- Support messages table exists: 1
-- ============================================================================

-- ============================================================================
-- OPTIONAL: GRANT ADMIN ACCESS TO YOUR EMAIL
-- ============================================================================

-- Uncomment and update with your email to grant yourself admin access
-- UPDATE user_profiles
-- SET role = 'admin'
-- WHERE email = 'your-email@example.com';

-- ============================================================================
-- OPTIONAL: CREATE TEST SUPPORT MESSAGE
-- ============================================================================

-- Uncomment to create a test support message (replace user_id with actual user)
-- INSERT INTO support_messages (user_id, user_email, user_name, message, priority)
-- VALUES (
--   'your-user-uuid-here',
--   'test@example.com',
--   'Test User',
--   'This is a test support message to verify the admin support system is working.',
--   'medium'
-- );

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
-- Next steps:
-- 1. Verify the results of the verification query above
-- 2. Login to your admin account
-- 3. Access /dashboard/admin to see the admin dashboard
-- 4. Test contractor approval workflow
-- 5. Check payment/escrow monitoring
-- ============================================================================
