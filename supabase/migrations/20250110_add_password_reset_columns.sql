-- Add password reset token columns to user_profiles table (homeowners)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS reset_token TEXT,
ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP WITH TIME ZONE;

-- Add password reset token columns to pro_contractors table (contractors)
ALTER TABLE pro_contractors
ADD COLUMN IF NOT EXISTS reset_token TEXT,
ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP WITH TIME ZONE;

-- Create indexes for faster token lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_reset_token ON user_profiles(reset_token);
CREATE INDEX IF NOT EXISTS idx_pro_contractors_reset_token ON pro_contractors(reset_token);
