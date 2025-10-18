-- ============================================================================
-- TRUSTED CONTRACTORS SYSTEM - FIXED VERSION
-- ============================================================================
-- Run this step by step to add trusted pros functionality
-- ============================================================================

-- ============================================================================
-- 1. CREATE TRUSTED CONTRACTORS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS trusted_contractors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    homeowner_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    contractor_id UUID REFERENCES contractor_profiles(id) ON DELETE CASCADE,
    trust_level INTEGER DEFAULT 1,
    notes TEXT,
    jobs_completed INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    last_job_date TIMESTAMPTZ,
    preferred_contact_method TEXT DEFAULT 'message',
    preferred_time_slots TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(homeowner_id, contractor_id)
);

-- ============================================================================
-- 2. CREATE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_trusted_contractors_homeowner ON trusted_contractors(homeowner_id);
CREATE INDEX IF NOT EXISTS idx_trusted_contractors_contractor ON trusted_contractors(contractor_id);
CREATE INDEX IF NOT EXISTS idx_trusted_contractors_trust_level ON trusted_contractors(trust_level);
CREATE INDEX IF NOT EXISTS idx_trusted_contractors_last_job ON trusted_contractors(last_job_date DESC NULLS LAST);

-- ============================================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE trusted_contractors ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. CREATE POLICIES
-- ============================================================================
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

-- ============================================================================
-- 5. CREATE VIEW
-- ============================================================================
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
    CASE tc.trust_level
        WHEN 1 THEN 'Saved'
        WHEN 2 THEN 'Preferred'
        WHEN 3 THEN 'Trusted'
        ELSE 'Unknown'
    END as trust_level_label
FROM trusted_contractors tc
JOIN contractor_profiles cp ON cp.id = tc.contractor_id
WHERE cp.status = 'approved';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT 'Trusted contractors system created successfully!' as status;