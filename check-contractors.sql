-- Query to check all contractors in the database

SELECT
  id,
  name,
  business_name,
  service_area_zips,
  categories,
  rating,
  status,
  created_at
FROM contractor_profiles
ORDER BY created_at DESC;

-- Count by category
SELECT
  unnest(categories) as category,
  COUNT(*) as count
FROM contractor_profiles
WHERE status = 'approved'
GROUP BY category
ORDER BY count DESC;

-- Count by ZIP
SELECT
  unnest(service_area_zips) as zip_code,
  COUNT(*) as contractors_count
FROM contractor_profiles
WHERE status = 'approved'
GROUP BY zip_code
ORDER BY contractors_count DESC;
