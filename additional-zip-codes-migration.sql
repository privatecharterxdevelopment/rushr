-- Migration: Add additional_zip_codes column to user_profiles table
-- This allows homeowners to store multiple ZIP codes for emergency service areas

-- Add the additional_zip_codes column as a JSON array
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS additional_zip_codes JSONB DEFAULT '[]';

-- Create an index on additional_zip_codes for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_profiles_additional_zip_codes
ON user_profiles USING GIN (additional_zip_codes);

-- Add a comment explaining the column
COMMENT ON COLUMN user_profiles.additional_zip_codes IS 'Array of additional ZIP codes where the homeowner might need emergency services';

-- Example of how to query users who have a specific ZIP code in their additional list:
-- SELECT * FROM user_profiles WHERE additional_zip_codes ? '12345';

-- Example of how to update a user's additional ZIP codes:
-- UPDATE user_profiles SET additional_zip_codes = '["12345", "67890"]' WHERE id = 'user-id';