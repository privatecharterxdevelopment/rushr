-- Migration to fix subscription types to match business model
-- Run this to update existing database

-- First, drop the old constraint
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_subscription_type_check;

-- Add the new constraint with correct subscription types
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_subscription_type_check
  CHECK (subscription_type IN ('free', 'pro', 'signals'));

-- Update existing invalid subscription types
UPDATE user_profiles
SET subscription_type = CASE
  WHEN role = 'contractor' THEN 'pro'
  ELSE 'free'
END
WHERE subscription_type IN ('basic', 'premium');

-- Update the enum type if it exists (for schema with ENUMs)
-- Note: This requires recreating the enum
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_type') THEN
    -- Drop enum if it exists and recreate
    ALTER TYPE subscription_type RENAME TO subscription_type_old;
    CREATE TYPE subscription_type AS ENUM ('free', 'pro', 'signals');

    -- Update columns to use new enum (if needed)
    -- This step depends on your specific schema
  END IF;
END$$;

-- Verify the changes
SELECT
  role,
  subscription_type,
  COUNT(*) as count
FROM user_profiles
GROUP BY role, subscription_type
ORDER BY role, subscription_type;