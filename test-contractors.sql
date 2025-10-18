-- Insert test contractors with NYC ZIP codes to test the map markers
-- Updated to match actual contractor_profiles schema

INSERT INTO contractor_profiles (
  name,
  business_name,
  service_area_zips,
  categories,
  rating,
  status
) VALUES
(
  'Elite Electric NYC',
  'Elite Electric NYC',
  ARRAY['10001'],
  ARRAY['Electrical'],
  4.8,
  'approved'
),
(
  'Manhattan HVAC Pros',
  'Manhattan HVAC Pros',
  ARRAY['10011'],
  ARRAY['HVAC'],
  4.6,
  'approved'
),
(
  'Downtown Roofing',
  'Downtown Roofing',
  ARRAY['10013'],
  ARRAY['Roofing'],
  4.9,
  'approved'
),
(
  'SoHo Plumbing Services',
  'SoHo Plumbing Services',
  ARRAY['10014'],
  ARRAY['Plumbing'],
  4.7,
  'approved'
),
(
  'Brooklyn Heights Carpentry',
  'Brooklyn Heights Carpentry',
  ARRAY['11201'],
  ARRAY['Carpentry', 'General'],
  4.5,
  'approved'
),
(
  'Fort Greene Landscaping',
  'Fort Greene Landscaping',
  ARRAY['11205'],
  ARRAY['Landscaping'],
  4.4,
  'approved'
),
(
  'Park Slope General Contractors',
  'Park Slope General Contractors',
  ARRAY['11215'],
  ARRAY['General', 'Roofing', 'Electrical'],
  4.8,
  'approved'
)
ON CONFLICT DO NOTHING;
