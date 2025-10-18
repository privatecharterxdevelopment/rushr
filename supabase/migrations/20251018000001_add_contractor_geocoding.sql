-- Add geocoding columns to contractor_profiles for accurate map markers
-- Created: 2025-10-18

ALTER TABLE contractor_profiles
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Create index for geospatial queries
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_lat_lng
ON contractor_profiles(latitude, longitude);

-- Add comment
COMMENT ON COLUMN contractor_profiles.address IS 'Full street address for contractor business location';
COMMENT ON COLUMN contractor_profiles.latitude IS 'Geocoded latitude from address (fetched via Mapbox Geocoding API)';
COMMENT ON COLUMN contractor_profiles.longitude IS 'Geocoded longitude from address (fetched via Mapbox Geocoding API)';

SELECT 'Contractor geocoding columns added successfully!' as status;
