-- ============================================================================
-- TRUSTED CONTRACTORS - SAFE VERSION
-- ============================================================================
-- This version handles missing contractor_profiles table gracefully
-- ============================================================================

-- Step 1: Create basic trusted_contractors table
CREATE TABLE IF NOT EXISTS trusted_contractors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    homeowner_id UUID,
    contractor_id UUID,
    trust_level INTEGER DEFAULT 1,
    notes TEXT,
    jobs_completed INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    last_job_date TIMESTAMPTZ,
    preferred_contact_method TEXT DEFAULT 'message',
    preferred_time_slots TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Add columns safely if they don't exist
DO $$
BEGIN
    -- Add missing columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trusted_contractors' AND column_name = 'notes') THEN
        ALTER TABLE trusted_contractors ADD COLUMN notes TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trusted_contractors' AND column_name = 'jobs_completed') THEN
        ALTER TABLE trusted_contractors ADD COLUMN jobs_completed INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trusted_contractors' AND column_name = 'total_spent') THEN
        ALTER TABLE trusted_contractors ADD COLUMN total_spent DECIMAL(10,2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trusted_contractors' AND column_name = 'average_rating') THEN
        ALTER TABLE trusted_contractors ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trusted_contractors' AND column_name = 'last_job_date') THEN
        ALTER TABLE trusted_contractors ADD COLUMN last_job_date TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trusted_contractors' AND column_name = 'preferred_contact_method') THEN
        ALTER TABLE trusted_contractors ADD COLUMN preferred_contact_method TEXT DEFAULT 'message';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trusted_contractors' AND column_name = 'preferred_time_slots') THEN
        ALTER TABLE trusted_contractors ADD COLUMN preferred_time_slots TEXT[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trusted_contractors' AND column_name = 'updated_at') THEN
        ALTER TABLE trusted_contractors ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Step 3: Add constraints only if referenced tables exist
DO $$
BEGIN
    -- Add unique constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'trusted_contractors_homeowner_id_contractor_id_key'
        AND table_name = 'trusted_contractors'
    ) THEN
        ALTER TABLE trusted_contractors
        ADD CONSTRAINT trusted_contractors_homeowner_id_contractor_id_key
        UNIQUE(homeowner_id, contractor_id);
    END IF;

    -- Add foreign key to user_profiles if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'trusted_contractors_homeowner_id_fkey'
            AND table_name = 'trusted_contractors'
        ) THEN
            ALTER TABLE trusted_contractors
            ADD CONSTRAINT trusted_contractors_homeowner_id_fkey
            FOREIGN KEY (homeowner_id) REFERENCES user_profiles(id) ON DELETE CASCADE;
        END IF;
    END IF;

    -- Add foreign key to contractor_profiles if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contractor_profiles') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'trusted_contractors_contractor_id_fkey'
            AND table_name = 'trusted_contractors'
        ) THEN
            ALTER TABLE trusted_contractors
            ADD CONSTRAINT trusted_contractors_contractor_id_fkey
            FOREIGN KEY (contractor_id) REFERENCES contractor_profiles(id) ON DELETE CASCADE;
        END IF;
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

-- Step 7: Create view only if contractor_profiles exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contractor_profiles') THEN
        EXECUTE '
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
            ''2.5 mi'' as distance,
            CASE tc.trust_level
                WHEN 1 THEN ''Saved''
                WHEN 2 THEN ''Preferred''
                WHEN 3 THEN ''Trusted''
                ELSE ''Unknown''
            END as trust_level_label
        FROM trusted_contractors tc
        JOIN contractor_profiles cp ON cp.id = tc.contractor_id
        WHERE cp.status = ''approved''';
    ELSE
        -- Create a simple view without contractor data if table doesn't exist
        EXECUTE '
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
            ''Unknown Contractor'' as contractor_name,
            NULL as business_name,
            0 as contractor_overall_rating,
            0 as contractor_total_jobs,
            ARRAY[]::text[] as categories,
            ARRAY[]::text[] as service_area_zips,
            NULL as contractor_phone,
            NULL as contractor_email,
            NULL as contractor_avatar,
            ''2.5 mi'' as distance,
            CASE tc.trust_level
                WHEN 1 THEN ''Saved''
                WHEN 2 THEN ''Preferred''
                WHEN 3 THEN ''Trusted''
                ELSE ''Unknown''
            END as trust_level_label
        FROM trusted_contractors tc';
    END IF;
END $$;

SELECT 'Trusted contractors system created successfully!' as status;