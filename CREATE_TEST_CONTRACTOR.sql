-- CREATE TEST CONTRACTOR PROFILE
-- Run this in Supabase SQL Editor to create a test contractor without filling out the wizard

-- Replace 'YOUR_USER_EMAIL' with your actual test user email
-- This will find the user by email and create a contractor profile for them

WITH user_lookup AS (
  SELECT id, email FROM auth.users WHERE email = 'YOUR_USER_EMAIL_HERE' LIMIT 1
)
INSERT INTO pro_contractors (
  id,
  name,
  business_name,
  email,
  phone,
  address,
  base_zip,
  latitude,
  longitude,
  radius_miles,
  categories,
  license_number,
  license_state,
  license_expires,
  insurance_carrier,
  insurance_policy,
  insurance_expires,
  rate_type,
  hourly_rate,
  verified,
  active,
  created_at
)
SELECT
  id,
  'Test Contractor',
  'Test Contracting LLC',
  email,
  '+1234567890',
  '123 Test Street, Brooklyn, NY 11215',
  '11215',
  40.6782,
  -73.9442,
  25,
  ARRAY['Plumbing', 'Electrical'],
  'TEST123',
  'NY',
  '2026-12-31',
  'Test Insurance Co',
  'POL-123456',
  '2026-12-31',
  'Hourly',
  '$120/hr',
  false,  -- Not verified yet - this is what you need to test
  true,
  NOW()
FROM user_lookup
ON CONFLICT (id) DO NOTHING;

-- Verify it was created
SELECT
  id,
  name,
  business_name,
  email,
  verified,
  active
FROM pro_contractors
WHERE email = 'YOUR_USER_EMAIL_HERE';
