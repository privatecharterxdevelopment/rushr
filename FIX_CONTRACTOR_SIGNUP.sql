-- ============================================================================
-- FIX CONTRACTOR SIGNUP - PREVENT HOMEOWNER PROFILE CREATION
-- ============================================================================
-- This fixes the issue where contractors signing up via the wizard
-- were getting BOTH a homeowner profile AND a contractor profile,
-- causing them to briefly show as homeowners before switching to contractors.
--
-- SOLUTION: Update the handle_new_user() trigger to SKIP creating user_profiles
-- for contractors. Contractors should ONLY exist in pro_contractors table.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY definer SET search_path = public
AS $$
BEGIN
  -- CRITICAL: If user is signing up as a contractor, DO NOT create user_profiles entry
  -- Contractors should ONLY exist in pro_contractors table
  IF COALESCE(NEW.raw_user_meta_data->>'role', 'homeowner') = 'contractor' THEN
    -- Skip user_profiles creation for contractors
    RETURN NEW;
  END IF;

  -- For homeowners, create user_profiles entry as normal
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
    'homeowner', -- Homeowners only
    'free', -- Default subscription
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

-- Trigger remains the same, but function logic changed
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- CLEANUP: Remove any existing user_profiles for contractors
-- ============================================================================
-- This removes homeowner profiles for users who should ONLY be contractors
DELETE FROM user_profiles
WHERE id IN (SELECT id FROM pro_contractors)
  AND role IN ('homeowner', 'contractor');

-- Verify cleanup
SELECT
  'Contractors with user_profiles entries' as description,
  COUNT(*) as count
FROM user_profiles
WHERE id IN (SELECT id FROM pro_contractors);

-- Should return 0 if cleanup was successful
