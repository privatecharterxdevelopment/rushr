-- ============================================================================
-- FIX CONTRACTOR LOCATIONS TABLE - ADD MISSING COLUMNS
-- ============================================================================

-- Add all missing columns to contractor_locations table
DO $$
BEGIN
    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'contractor_locations'
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE contractor_locations ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    -- Add is_en_route column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'contractor_locations'
        AND column_name = 'is_en_route'
    ) THEN
        ALTER TABLE contractor_locations ADD COLUMN is_en_route BOOLEAN DEFAULT false;
    END IF;

    -- Add has_arrived column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'contractor_locations'
        AND column_name = 'has_arrived'
    ) THEN
        ALTER TABLE contractor_locations ADD COLUMN has_arrived BOOLEAN DEFAULT false;
    END IF;

    -- Add estimated_arrival_time column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'contractor_locations'
        AND column_name = 'estimated_arrival_time'
    ) THEN
        ALTER TABLE contractor_locations ADD COLUMN estimated_arrival_time TIMESTAMPTZ;
    END IF;

    -- Add distance_to_destination column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'contractor_locations'
        AND column_name = 'distance_to_destination'
    ) THEN
        ALTER TABLE contractor_locations ADD COLUMN distance_to_destination DECIMAL(10, 2);
    END IF;

    -- Add last_updated column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'contractor_locations'
        AND column_name = 'last_updated'
    ) THEN
        ALTER TABLE contractor_locations ADD COLUMN last_updated TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Now create the indexes (this will work whether columns were just created or already exist)
DROP INDEX IF EXISTS idx_contractor_locations_active;
CREATE INDEX idx_contractor_locations_active ON contractor_locations(is_active) WHERE is_active = true;

-- Ensure all other necessary indexes exist
CREATE INDEX IF NOT EXISTS idx_contractor_locations_contractor ON contractor_locations(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_locations_job ON contractor_locations(job_id);
CREATE INDEX IF NOT EXISTS idx_contractor_locations_updated ON contractor_locations(last_updated DESC);

SELECT 'Contractor locations table fixed - all columns added!' as status;
