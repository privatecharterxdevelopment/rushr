-- Migration to add homeowner profile fields to existing user_profiles table
-- Run this on existing databases to add the missing fields

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

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON user_profiles(phone);
CREATE INDEX IF NOT EXISTS idx_user_profiles_city ON user_profiles(city);
CREATE INDEX IF NOT EXISTS idx_user_profiles_state ON user_profiles(state);
CREATE INDEX IF NOT EXISTS idx_user_profiles_zip_code ON user_profiles(zip_code);
CREATE INDEX IF NOT EXISTS idx_user_profiles_kyc_verified ON user_profiles(kyc_verified);

-- Update existing users to have default notification preferences if NULL
UPDATE user_profiles
SET notification_preferences = '{"email": true, "sms": false, "push": true}'::jsonb
WHERE notification_preferences IS NULL;

-- Update the trigger function to handle the new fields
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

-- Verify the migration
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;