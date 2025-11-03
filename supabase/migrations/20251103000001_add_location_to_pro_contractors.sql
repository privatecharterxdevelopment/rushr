-- Add address and geocoding columns to pro_contractors table
-- Created: 2025-11-03
-- Purpose: Store precise business address and coordinates for accurate map display

-- Add columns
ALTER TABLE pro_contractors
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Create index for geospatial queries
CREATE INDEX IF NOT EXISTS idx_pro_contractors_lat_lng
ON pro_contractors(latitude, longitude);

-- Add comments for documentation
COMMENT ON COLUMN pro_contractors.address IS 'Full street address for contractor business location';
COMMENT ON COLUMN pro_contractors.latitude IS 'Geocoded latitude from address (fetched via Mapbox Geocoding API)';
COMMENT ON COLUMN pro_contractors.longitude IS 'Geocoded longitude from address (fetched via Mapbox Geocoding API)';

SELECT 'Contractor location columns added successfully!' as status;
