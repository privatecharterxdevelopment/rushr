-- ============================================================================
-- FIX RLS POLICIES - Remove infinite recursion
-- ============================================================================

-- Drop and recreate user_profiles policies to prevent infinite recursion
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON user_profiles;

-- Simple, non-recursive policies for user_profiles
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Public profiles are viewable by everyone"
  ON user_profiles
  FOR SELECT
  USING (true);

-- Ensure jobs table has proper RLS policies
DROP POLICY IF EXISTS "Users can view own jobs" ON jobs;
DROP POLICY IF EXISTS "Users can create jobs" ON jobs;
DROP POLICY IF EXISTS "Users can update own jobs" ON jobs;
DROP POLICY IF EXISTS "Contractors can view jobs" ON jobs;

CREATE POLICY "Homeowners can view own jobs"
  ON jobs
  FOR SELECT
  USING (auth.uid() = homeowner_id);

CREATE POLICY "Homeowners can create jobs"
  ON jobs
  FOR INSERT
  WITH CHECK (auth.uid() = homeowner_id);

CREATE POLICY "Homeowners can update own jobs"
  ON jobs
  FOR UPDATE
  USING (auth.uid() = homeowner_id);

CREATE POLICY "Contractors can view all jobs"
  ON jobs
  FOR SELECT
  USING (true);

-- Comments
COMMENT ON POLICY "Homeowners can view own jobs" ON jobs IS
  'Allows homeowners to view their posted jobs';

COMMENT ON POLICY "Contractors can view all jobs" ON jobs IS
  'Allows contractors to browse available jobs';
