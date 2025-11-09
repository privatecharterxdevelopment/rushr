-- Ensure latitude/longitude columns exist in pro_contractors table
-- Created: 2025-11-09
-- Purpose: Verify and add location columns if missing

-- Check if columns exist and add them if needed
DO $$
BEGIN
    -- Add latitude column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'pro_contractors'
          AND column_name = 'latitude'
    ) THEN
        ALTER TABLE pro_contractors ADD COLUMN latitude DECIMAL(10, 8);
        RAISE NOTICE 'Added latitude column to pro_contractors';
    ELSE
        RAISE NOTICE 'latitude column already exists in pro_contractors';
    END IF;

    -- Add longitude column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'pro_contractors'
          AND column_name = 'longitude'
    ) THEN
        ALTER TABLE pro_contractors ADD COLUMN longitude DECIMAL(11, 8);
        RAISE NOTICE 'Added longitude column to pro_contractors';
    ELSE
        RAISE NOTICE 'longitude column already exists in pro_contractors';
    END IF;

    -- Add address column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'pro_contractors'
          AND column_name = 'address'
    ) THEN
        ALTER TABLE pro_contractors ADD COLUMN address TEXT;
        RAISE NOTICE 'Added address column to pro_contractors';
    ELSE
        RAISE NOTICE 'address column already exists in pro_contractors';
    END IF;
END $$;

-- Create index for geospatial queries (if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_pro_contractors_lat_lng
ON pro_contractors(latitude, longitude);

-- Verify columns were added
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'pro_contractors'
  AND column_name IN ('latitude', 'longitude', 'address')
ORDER BY column_name;
