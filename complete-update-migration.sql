-- =============================================================================
-- COMPLETE UPDATE MIGRATION (IDEMPOTENT + FIXED FOR PostgreSQL 15+)
-- Safe to re-run multiple times in Supabase
-- =============================================================================

-- 1. Fix subscription types
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_subscription_type_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_subscription_type_check
  CHECK (subscription_type IN ('free', 'pro', 'signals'));

UPDATE user_profiles
SET subscription_type = CASE
  WHEN role = 'contractor' THEN 'pro'
  ELSE 'free'
END
WHERE subscription_type IN ('basic', 'premium');

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_type') THEN
    ALTER TYPE subscription_type RENAME TO subscription_type_old;
    CREATE TYPE subscription_type AS ENUM ('free', 'pro', 'signals');
  END IF;
END$$;

-- 2. Add homeowner profile fields
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact TEXT,
ADD COLUMN IF NOT EXISTS emergency_phone TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS kyc_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "push": true}'::jsonb,
ADD COLUMN IF NOT EXISTS first_job_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- 3. Performance indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON user_profiles(phone);
CREATE INDEX IF NOT EXISTS idx_user_profiles_city ON user_profiles(city);
CREATE INDEX IF NOT EXISTS idx_user_profiles_state ON user_profiles(state);
CREATE INDEX IF NOT EXISTS idx_user_profiles_zip_code ON user_profiles(zip_code);
CREATE INDEX IF NOT EXISTS idx_user_profiles_kyc_verified ON user_profiles(kyc_verified);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_type ON user_profiles(subscription_type);

-- 4. Update existing users
UPDATE user_profiles
SET notification_preferences = '{"email": true, "sms": false, "push": true}'::jsonb
WHERE notification_preferences IS NULL;

UPDATE user_profiles
SET
  kyc_verified = COALESCE(kyc_verified, FALSE),
  first_job_completed = COALESCE(first_job_completed, FALSE),
  email_verified = COALESCE(email_verified, FALSE),
  phone_verified = COALESCE(phone_verified, FALSE),
  onboarding_completed = COALESCE(onboarding_completed, FALSE)
WHERE
  kyc_verified IS NULL OR
  first_job_completed IS NULL OR
  email_verified IS NULL OR
  phone_verified IS NULL OR
  onboarding_completed IS NULL;

-- 5. Trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY definer SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id, email, name, role, subscription_type,
    phone, address, city, state, zip_code,
    emergency_contact, emergency_phone, avatar_url,
    kyc_verified, notification_preferences,
    first_job_completed, email_verified, phone_verified, onboarding_completed
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'homeowner'),
    CASE WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'homeowner') = 'contractor' THEN 'pro' ELSE 'free' END,
    NULL, NULL, NULL, NULL, NULL,
    NULL, NULL, NULL,
    FALSE,
    '{"email": true, "sms": false, "push": true}'::jsonb,
    FALSE, FALSE, FALSE, FALSE
  );
  RETURN NEW;
END;
$$;

-- 6. Profile completeness view
CREATE OR REPLACE VIEW profile_completeness AS
SELECT
  id, email, name, role, subscription_type,
  phone, address, avatar_url, kyc_verified, first_job_completed,
  (
    CASE WHEN email IS NOT NULL AND email != '' THEN 15 ELSE 0 END +
    CASE WHEN phone IS NOT NULL AND phone != '' THEN 15 ELSE 0 END +
    CASE WHEN address IS NOT NULL AND address != '' THEN 20 ELSE 0 END +
    CASE WHEN avatar_url IS NOT NULL AND avatar_url != '' THEN 10 ELSE 0 END +
    CASE WHEN kyc_verified = TRUE THEN 25 ELSE 0 END +
    CASE WHEN first_job_completed = TRUE THEN 15 ELSE 0 END
  ) AS completeness_percentage
FROM user_profiles;

GRANT SELECT ON profile_completeness TO authenticated;

-- 8. Tracking tables
CREATE TABLE IF NOT EXISTS homeowner_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  homeowner_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'emergency')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  contractor_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  estimated_cost DECIMAL(10,2),
  final_cost DECIMAL(10,2),
  scheduled_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS homeowner_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  homeowner_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  contractor_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  job_id UUID REFERENCES homeowner_jobs(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  message_type TEXT CHECK (message_type IN ('text', 'image', 'document', 'system')) DEFAULT 'text',
  sender_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL NOT NULL,
  sender_type TEXT CHECK (sender_type IN ('homeowner', 'contractor', 'system')) NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS homeowner_trusted_contractors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  homeowner_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  contractor_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  trust_level TEXT CHECK (trust_level IN ('trusted', 'preferred', 'blocked')) DEFAULT 'trusted',
  notes TEXT,
  jobs_completed INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  first_job_date TIMESTAMPTZ,
  last_job_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(homeowner_id, contractor_id)
);

-- Dashboard view
CREATE OR REPLACE VIEW homeowner_dashboard_stats AS
SELECT
  hp.id as homeowner_id,
  hp.email,
  hp.name,
  COALESCE(active_jobs.count, 0) as active_services,
  COALESCE(completed_jobs.count, 0) as completed_services,
  COALESCE(unread_messages.count, 0) as unread_messages,
  COALESCE(trusted_contractors.count, 0) as trusted_contractors,
  COALESCE(total_spent.amount, 0) as total_spent,
  COALESCE(pending_bids.count, 0) as pending_bids,
  hp.first_job_completed,
  hp.created_at as member_since
FROM user_profiles hp
LEFT JOIN (
  SELECT homeowner_id, COUNT(*) as count FROM homeowner_jobs
  WHERE status IN ('pending', 'bidding', 'bid_accepted', 'in_progress') GROUP BY homeowner_id
) active_jobs ON hp.id = active_jobs.homeowner_id
LEFT JOIN (
  SELECT homeowner_id, COUNT(*) as count FROM homeowner_jobs
  WHERE status = 'completed' GROUP BY homeowner_id
) completed_jobs ON hp.id = completed_jobs.homeowner_id
LEFT JOIN (
  SELECT homeowner_id, COUNT(*) as count FROM homeowner_messages
  WHERE is_read = FALSE AND sender_type != 'homeowner' GROUP BY homeowner_id
) unread_messages ON hp.id = unread_messages.homeowner_id
LEFT JOIN (
  SELECT homeowner_id, COUNT(*) as count FROM homeowner_trusted_contractors
  WHERE trust_level IN ('trusted', 'preferred') GROUP BY homeowner_id
) trusted_contractors ON hp.id = trusted_contractors.homeowner_id
LEFT JOIN (
  SELECT homeowner_id, SUM(final_cost) as amount FROM homeowner_jobs
  WHERE status = 'completed' AND final_cost IS NOT NULL GROUP BY homeowner_id
) total_spent ON hp.id = total_spent.homeowner_id
LEFT JOIN (
  SELECT homeowner_id, COUNT(*) as count FROM job_bids
  WHERE status = 'pending' GROUP BY homeowner_id
) pending_bids ON hp.id = pending_bids.homeowner_id
WHERE hp.role = 'homeowner';

-- Enable RLS
ALTER TABLE homeowner_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE homeowner_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE homeowner_trusted_contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_bids ENABLE ROW LEVEL SECURITY;

-- Idempotent RLS policies (fixed column name)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own jobs' AND tablename = 'homeowner_jobs') THEN
    CREATE POLICY "Users can manage their own jobs" ON homeowner_jobs
      FOR ALL USING (homeowner_id = auth.uid() OR contractor_id = auth.uid());
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can access their own messages' AND tablename = 'homeowner_messages') THEN
    CREATE POLICY "Users can access their own messages" ON homeowner_messages
      FOR ALL USING (homeowner_id = auth.uid() OR contractor_id = auth.uid() OR sender_id = auth.uid());
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Homeowners can manage trusted contractors' AND tablename = 'homeowner_trusted_contractors') THEN
    CREATE POLICY "Homeowners can manage trusted contractors" ON homeowner_trusted_contractors
      FOR ALL USING (homeowner_id = auth.uid());
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Contractors can manage their own bids' AND tablename = 'job_bids') THEN
    CREATE POLICY "Contractors can manage their own bids" ON job_bids
      FOR ALL USING (contractor_id = auth.uid());
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Homeowners can view bids on their jobs' AND tablename = 'job_bids') THEN
    CREATE POLICY "Homeowners can view bids on their jobs" ON job_bids
      FOR SELECT USING (homeowner_id = auth.uid());
  END IF;
END$$;

-- Grants
GRANT SELECT ON homeowner_dashboard_stats TO authenticated;
GRANT ALL ON homeowner_jobs TO authenticated;
GRANT ALL ON homeowner_messages TO authenticated;
GRANT ALL ON homeowner_trusted_contractors TO authenticated;
GRANT ALL ON job_bids TO authenticated;

-- Final confirmation
SELECT '✅ Migration completed successfully (idempotent + compatible with PostgreSQL 15+)!' AS status;