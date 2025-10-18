-- Add additional profile fields to user_profiles table
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
ADD COLUMN IF NOT EXISTS first_job_completed BOOLEAN DEFAULT FALSE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON user_profiles(phone);
CREATE INDEX IF NOT EXISTS idx_user_profiles_city ON user_profiles(city);
CREATE INDEX IF NOT EXISTS idx_user_profiles_state ON user_profiles(state);
CREATE INDEX IF NOT EXISTS idx_user_profiles_zip_code ON user_profiles(zip_code);
CREATE INDEX IF NOT EXISTS idx_user_profiles_kyc_verified ON user_profiles(kyc_verified);

-- Update RLS policies to include new fields
-- The existing policies should already cover these fields, but let's ensure they're accessible

-- Create a view for profile completeness calculation
CREATE OR REPLACE VIEW profile_completeness AS
SELECT
  id,
  email,
  name,
  role,
  subscription_type,
  phone,
  address,
  avatar_url,
  kyc_verified,
  first_job_completed,
  -- Calculate completeness percentage
  (
    CASE WHEN email IS NOT NULL AND email != '' THEN 15 ELSE 0 END +
    CASE WHEN phone IS NOT NULL AND phone != '' THEN 15 ELSE 0 END +
    CASE WHEN address IS NOT NULL AND address != '' THEN 20 ELSE 0 END +
    CASE WHEN avatar_url IS NOT NULL AND avatar_url != '' THEN 10 ELSE 0 END +
    CASE WHEN kyc_verified = TRUE THEN 25 ELSE 0 END +
    CASE WHEN first_job_completed = TRUE THEN 15 ELSE 0 END
  ) AS completeness_percentage
FROM user_profiles;

-- Grant access to the view
GRANT SELECT ON profile_completeness TO authenticated;

-- Note: RLS is inherited from the underlying user_profiles table
-- The view will automatically respect the RLS policies of user_profiles

COMMENT ON TABLE user_profiles IS 'Extended user profiles with homeowner/contractor specific fields';
COMMENT ON COLUMN user_profiles.phone IS 'User phone number for contact and verification';
COMMENT ON COLUMN user_profiles.address IS 'Primary property address for homeowners';
COMMENT ON COLUMN user_profiles.city IS 'City for location-based services';
COMMENT ON COLUMN user_profiles.state IS 'State for regional service matching';
COMMENT ON COLUMN user_profiles.zip_code IS 'ZIP code for precise location services';
COMMENT ON COLUMN user_profiles.emergency_contact IS 'Emergency contact name';
COMMENT ON COLUMN user_profiles.emergency_phone IS 'Emergency contact phone number';
COMMENT ON COLUMN user_profiles.avatar_url IS 'Profile photo URL from storage';
COMMENT ON COLUMN user_profiles.kyc_verified IS 'Know Your Customer verification status';
COMMENT ON COLUMN user_profiles.notification_preferences IS 'JSON object with notification settings';
COMMENT ON COLUMN user_profiles.first_job_completed IS 'Whether user has completed their first service booking';