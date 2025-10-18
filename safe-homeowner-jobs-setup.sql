-- =============================================================================
-- SAFE HOMEOWNER JOBS SETUP
-- Creates just the homeowner_jobs table and basic structure needed for bidding
-- =============================================================================

-- 1. Fix subscription types to match business model
-- -----------------------------------------------------------------------------

-- Drop old constraint and add new one
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_subscription_type_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_subscription_type_check
  CHECK (subscription_type IN ('free', 'pro', 'signals'));

-- Update invalid subscription types
UPDATE user_profiles
SET subscription_type = CASE
  WHEN role = 'contractor' THEN 'pro'
  ELSE 'free'
END
WHERE subscription_type IN ('basic', 'premium');

-- 2. Add homeowner profile fields
-- -----------------------------------------------------------------------------

-- Add the new columns if they don't exist
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

-- 3. Add performance indexes
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON user_profiles(phone);
CREATE INDEX IF NOT EXISTS idx_user_profiles_city ON user_profiles(city);
CREATE INDEX IF NOT EXISTS idx_user_profiles_state ON user_profiles(state);
CREATE INDEX IF NOT EXISTS idx_user_profiles_zip_code ON user_profiles(zip_code);
CREATE INDEX IF NOT EXISTS idx_user_profiles_kyc_verified ON user_profiles(kyc_verified);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_type ON user_profiles(subscription_type);

-- 4. Update existing users with default values
-- -----------------------------------------------------------------------------

-- Set notification preferences for existing users
UPDATE user_profiles
SET notification_preferences = '{"email": true, "sms": false, "push": true}'::jsonb
WHERE notification_preferences IS NULL;

-- Set default FALSE values for boolean fields
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

-- 5. Update the user creation trigger function
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY definer SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    email,
    name,
    role,
    subscription_type,
    phone,
    address,
    city,
    state,
    zip_code,
    emergency_contact,
    emergency_phone,
    avatar_url,
    kyc_verified,
    notification_preferences,
    first_job_completed,
    email_verified,
    phone_verified,
    onboarding_completed
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'homeowner'),
    CASE
      WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'homeowner') = 'contractor' THEN 'pro'
      ELSE 'free'
    END,
    -- Set default NULL/FALSE values for new users
    NULL, -- phone
    NULL, -- address
    NULL, -- city
    NULL, -- state
    NULL, -- zip_code
    NULL, -- emergency_contact
    NULL, -- emergency_phone
    NULL, -- avatar_url
    FALSE, -- kyc_verified
    '{"email": true, "sms": false, "push": true}'::jsonb, -- notification_preferences
    FALSE, -- first_job_completed
    FALSE, -- email_verified
    FALSE, -- phone_verified
    FALSE  -- onboarding_completed
  );
  RETURN NEW;
END;
$$;

-- 6. Create homeowner jobs table
-- -----------------------------------------------------------------------------

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

-- 7. Add indexes for homeowner_jobs
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_homeowner_jobs_homeowner_id ON homeowner_jobs(homeowner_id);
CREATE INDEX IF NOT EXISTS idx_homeowner_jobs_status ON homeowner_jobs(status);
CREATE INDEX IF NOT EXISTS idx_homeowner_jobs_contractor_id ON homeowner_jobs(contractor_id);
CREATE INDEX IF NOT EXISTS idx_homeowner_jobs_category ON homeowner_jobs(category);
CREATE INDEX IF NOT EXISTS idx_homeowner_jobs_priority ON homeowner_jobs(priority);
CREATE INDEX IF NOT EXISTS idx_homeowner_jobs_created_at ON homeowner_jobs(created_at);

-- 8. Enable RLS for homeowner_jobs
-- -----------------------------------------------------------------------------

ALTER TABLE homeowner_jobs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for homeowner_jobs
CREATE POLICY "Homeowners can manage their own jobs" ON homeowner_jobs
  FOR ALL USING (homeowner_id = auth.uid());

CREATE POLICY "Contractors can view jobs assigned to them" ON homeowner_jobs
  FOR SELECT USING (contractor_id = auth.uid());

-- Grant permissions
GRANT ALL ON homeowner_jobs TO authenticated;

-- 9. Create updated_at trigger for homeowner_jobs
-- -----------------------------------------------------------------------------

-- Create or update the handle_updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add trigger for homeowner_jobs
CREATE TRIGGER update_homeowner_jobs_updated_at
  BEFORE UPDATE ON homeowner_jobs
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

SELECT 'Homeowner jobs table and basic structure created successfully!' as status;