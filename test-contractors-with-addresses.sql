-- Insert test contractors with full addresses for geocoding
-- Run this in Supabase SQL Editor

INSERT INTO contractor_profiles (
  name,
  business_name,
  service_area_zips,
  categories,
  rating,
  status,
  address,
  latitude,
  longitude
) VALUES
(
  'Elite Electric NYC',
  'Elite Electric NYC',
  ARRAY['10001'],
  ARRAY['Electrical'],
  4.8,
  'approved',
  '350 Fifth Avenue, New York, NY 10001',
  40.7484,
  -73.9857
),
(
  'Manhattan HVAC Pros',
  'Manhattan HVAC Pros',
  ARRAY['10011'],
  ARRAY['HVAC'],
  4.6,
  'approved',
  '75 9th Avenue, New York, NY 10011',
  40.7425,
  -74.0056
),
(
  'Downtown Roofing',
  'Downtown Roofing',
  ARRAY['10013'],
  ARRAY['Roofing'],
  4.9,
  'approved',
  '100 Lafayette Street, New York, NY 10013',
  40.7177,
  -74.0014
),
(
  'SoHo Plumbing Services',
  'SoHo Plumbing Services',
  ARRAY['10014'],
  ARRAY['Plumbing'],
  4.7,
  'approved',
  '85 Washington Place, New York, NY 10014',
  40.7310,
  -74.0007
),
(
  'Brooklyn Heights Carpentry',
  'Brooklyn Heights Carpentry',
  ARRAY['11201'],
  ARRAY['Carpentry', 'General'],
  4.5,
  'approved',
  '100 Montague Street, Brooklyn, NY 11201',
  40.6943,
  -73.9927
),
(
  'Fort Greene Landscaping',
  'Fort Greene Landscaping',
  ARRAY['11205'],
  ARRAY['Landscaping'],
  4.4,
  'approved',
  '30 Lafayette Avenue, Brooklyn, NY 11205',
  40.6863,
  -73.9733
),
(
  'Park Slope General Contractors',
  'Park Slope General Contractors',
  ARRAY['11215'],
  ARRAY['General', 'Roofing', 'Electrical'],
  4.8,
  'approved',
  '200 7th Avenue, Brooklyn, NY 11215',
  40.6699,
  -73.9774
)
ON CONFLICT (id) DO NOTHING;

SELECT 'Test contractors with addresses added!' as status;
