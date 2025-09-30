-- ============================================================================
-- TRUSTED CONTRACTORS MIGRATION - SAFE VERSION
-- ============================================================================
-- This safely migrates existing table or creates new one
-- ============================================================================

-- Step 1: Create table if it doesn't exist (basic version)
CREATE TABLE IF NOT EXISTS trusted_contractors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    homeowner_id UUID,
    contractor_id UUID,
    trust_level INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Add missing columns safely
ALTER TABLE trusted_contractors ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE trusted_contractors ADD COLUMN IF NOT EXISTS jobs_completed INTEGER DEFAULT 0;
ALTER TABLE trusted_contractors ADD COLUMN IF NOT EXISTS total_spent DECIMAL(10,2) DEFAULT 0;
ALTER TABLE trusted_contractors ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE trusted_contractors ADD COLUMN IF NOT EXISTS last_job_date TIMESTAMPTZ;
ALTER TABLE trusted_contractors ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT DEFAULT 'message';
ALTER TABLE trusted_contractors ADD COLUMN IF NOT EXISTS preferred_time_slots TEXT[];
ALTER TABLE trusted_contractors ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Step 2b: Fix trust_level column type if needed
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'trusted_contractors'
        AND column_name = 'trust_level'
        AND data_type = 'text'
    ) THEN
        ALTER TABLE trusted_contractors ALTER COLUMN trust_level TYPE INTEGER USING trust_level::integer;
    END IF;
END $$;

-- Step 3: Add foreign key constraints if they don't exist
DO $$
BEGIN
    -- Add homeowner_id foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'trusted_contractors_homeowner_id_fkey'
    ) THEN
        ALTER TABLE trusted_contractors
        ADD CONSTRAINT trusted_contractors_homeowner_id_fkey
        FOREIGN KEY (homeowner_id) REFERENCES user_profiles(id) ON DELETE CASCADE;
    END IF;

    -- Add contractor_id foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'trusted_contractors_contractor_id_fkey'
    ) THEN
        ALTER TABLE trusted_contractors
        ADD CONSTRAINT trusted_contractors_contractor_id_fkey
        FOREIGN KEY (contractor_id) REFERENCES contractor_profiles(id) ON DELETE CASCADE;
    END IF;

    -- Add unique constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'trusted_contractors_homeowner_id_contractor_id_key'
    ) THEN
        ALTER TABLE trusted_contractors
        ADD CONSTRAINT trusted_contractors_homeowner_id_contractor_id_key
        UNIQUE(homeowner_id, contractor_id);
    END IF;
END $$;

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS idx_trusted_contractors_homeowner ON trusted_contractors(homeowner_id);
CREATE INDEX IF NOT EXISTS idx_trusted_contractors_contractor ON trusted_contractors(contractor_id);
CREATE INDEX IF NOT EXISTS idx_trusted_contractors_trust_level ON trusted_contractors(trust_level);
CREATE INDEX IF NOT EXISTS idx_trusted_contractors_last_job ON trusted_contractors(last_job_date DESC NULLS LAST);

-- Step 5: Enable RLS
ALTER TABLE trusted_contractors ENABLE ROW LEVEL SECURITY;

-- Step 6: Create policies
DROP POLICY IF EXISTS "Homeowners can view their trusted contractors" ON trusted_contractors;
CREATE POLICY "Homeowners can view their trusted contractors" ON trusted_contractors
    FOR SELECT USING (auth.uid() = homeowner_id);

DROP POLICY IF EXISTS "Homeowners can add trusted contractors" ON trusted_contractors;
CREATE POLICY "Homeowners can add trusted contractors" ON trusted_contractors
    FOR INSERT WITH CHECK (auth.uid() = homeowner_id);

DROP POLICY IF EXISTS "Homeowners can update trusted contractors" ON trusted_contractors;
CREATE POLICY "Homeowners can update trusted contractors" ON trusted_contractors
    FOR UPDATE USING (auth.uid() = homeowner_id);

DROP POLICY IF EXISTS "Homeowners can remove trusted contractors" ON trusted_contractors;
CREATE POLICY "Homeowners can remove trusted contractors" ON trusted_contractors
    FOR DELETE USING (auth.uid() = homeowner_id);

DROP POLICY IF EXISTS "Contractors can see who trusts them" ON trusted_contractors;
CREATE POLICY "Contractors can see who trusts them" ON trusted_contractors
    FOR SELECT USING (auth.uid() = contractor_id);

-- Step 7: Create view
CREATE OR REPLACE VIEW homeowner_trusted_contractors AS
SELECT
    tc.id,
    tc.homeowner_id,
    tc.contractor_id,
    tc.trust_level,
    tc.notes,
    tc.jobs_completed,
    tc.total_spent,
    tc.average_rating,
    tc.last_job_date,
    tc.preferred_contact_method,
    tc.preferred_time_slots,
    tc.created_at,
    tc.updated_at,
    cp.name as contractor_name,
    cp.business_name,
    cp.rating as contractor_overall_rating,
    cp.jobs_completed as contractor_total_jobs,
    cp.categories,
    cp.service_area_zips,
    cp.phone as contractor_phone,
    cp.email as contractor_email,
    cp.avatar_url as contractor_avatar,
    '2.5 mi' as distance,
    CASE
        WHEN tc.trust_level = 1 THEN 'Saved'
        WHEN tc.trust_level = 2 THEN 'Preferred'
        WHEN tc.trust_level = 3 THEN 'Trusted'
        ELSE 'Unknown'
    END as trust_level_label
FROM trusted_contractors tc
JOIN contractor_profiles cp ON cp.id = tc.contractor_id
WHERE cp.status = 'approved';

SELECT 'Trusted contractors migration completed successfully!' as status;