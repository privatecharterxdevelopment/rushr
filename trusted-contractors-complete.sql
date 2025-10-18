-- ============================================================================
-- TRUSTED CONTRACTORS SYSTEM - COMPLETE IMPLEMENTATION
-- ============================================================================
-- Run this to add complete trusted pros functionality to your app
-- ============================================================================

-- ============================================================================
-- 1. TRUSTED CONTRACTORS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS trusted_contractors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    homeowner_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    contractor_id UUID REFERENCES contractor_profiles(id) ON DELETE CASCADE,

    -- Trust metadata
    trust_level INTEGER DEFAULT 1, -- 1=saved, 2=preferred, 3=trusted
    notes TEXT, -- Private notes from homeowner

    -- Performance tracking
    jobs_completed INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    last_job_date TIMESTAMPTZ,

    -- Quick booking preferences
    preferred_contact_method TEXT DEFAULT 'message', -- message, phone, email
    preferred_time_slots TEXT[], -- ['morning', 'afternoon', 'evening', 'weekend']

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure one record per homeowner-contractor pair
    UNIQUE(homeowner_id, contractor_id)
);

-- ============================================================================
-- 2. INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_trusted_contractors_homeowner ON trusted_contractors(homeowner_id);
CREATE INDEX IF NOT EXISTS idx_trusted_contractors_contractor ON trusted_contractors(contractor_id);
CREATE INDEX IF NOT EXISTS idx_trusted_contractors_trust_level ON trusted_contractors(trust_level);
CREATE INDEX IF NOT EXISTS idx_trusted_contractors_last_job ON trusted_contractors(last_job_date DESC NULLS LAST);

-- ============================================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE trusted_contractors ENABLE ROW LEVEL SECURITY;

-- Homeowners can manage their own trusted contractors
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

-- Contractors can see who trusts them (read-only)
DROP POLICY IF EXISTS "Contractors can see who trusts them" ON trusted_contractors;
CREATE POLICY "Contractors can see who trusts them" ON trusted_contractors
    FOR SELECT USING (auth.uid() = contractor_id);

-- ============================================================================
-- 4. FUNCTIONS FOR TRUSTED CONTRACTORS
-- ============================================================================

-- Function to add/save a contractor as trusted
CREATE OR REPLACE FUNCTION save_trusted_contractor(
    p_homeowner_id UUID,
    p_contractor_id UUID,
    p_trust_level INTEGER DEFAULT 1,
    p_notes TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    -- Insert or update trusted contractor
    INSERT INTO trusted_contractors (
        homeowner_id,
        contractor_id,
        trust_level,
        notes,
        created_at,
        updated_at
    ) VALUES (
        p_homeowner_id,
        p_contractor_id,
        p_trust_level,
        p_notes,
        NOW(),
        NOW()
    )
    ON CONFLICT (homeowner_id, contractor_id)
    DO UPDATE SET
        trust_level = p_trust_level,
        notes = p_notes,
        updated_at = NOW();
END;
$$;

-- Function to remove trusted contractor
CREATE OR REPLACE FUNCTION remove_trusted_contractor(
    p_homeowner_id UUID,
    p_contractor_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM trusted_contractors
    WHERE homeowner_id = p_homeowner_id
      AND contractor_id = p_contractor_id;
END;
$$;

-- Function to update trusted contractor stats after job completion
CREATE OR REPLACE FUNCTION update_trusted_contractor_stats(
    p_homeowner_id UUID,
    p_contractor_id UUID,
    p_job_cost DECIMAL(10,2),
    p_job_rating DECIMAL(3,2)
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE trusted_contractors SET
        jobs_completed = jobs_completed + 1,
        total_spent = total_spent + p_job_cost,
        average_rating = (
            CASE
                WHEN jobs_completed = 0 THEN p_job_rating
                ELSE (average_rating * jobs_completed + p_job_rating) / (jobs_completed + 1)
            END
        ),
        last_job_date = NOW(),
        updated_at = NOW()
    WHERE homeowner_id = p_homeowner_id
      AND contractor_id = p_contractor_id;
END;
$$;

-- ============================================================================
-- 5. VIEW FOR EASY QUERYING
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

    -- Contractor details
    cp.name as contractor_name,
    cp.business_name,
    cp.rating as contractor_overall_rating,
    cp.jobs_completed as contractor_total_jobs,
    cp.categories,
    cp.service_area_zips,
    cp.phone as contractor_phone,
    cp.email as contractor_email,
    cp.avatar_url as contractor_avatar,

    -- Distance calculation (placeholder - would need homeowner location)
    '2.5 mi' as distance,

    -- Trust level labels
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
-- 6. SAMPLE DATA FOR TESTING
-- ============================================================================

-- Note: This will only work if you have existing homeowner and contractor profiles
-- Uncomment and modify IDs as needed for testing:

/*
-- Example: Add sample trusted contractors (replace with real IDs)
INSERT INTO trusted_contractors (homeowner_id, contractor_id, trust_level, notes, jobs_completed, total_spent, average_rating, last_job_date) VALUES
('your-homeowner-id-here', 'your-contractor-id-here', 2, 'Great electrician, very reliable', 3, 2400.00, 4.8, NOW() - INTERVAL '2 weeks'),
('your-homeowner-id-here', 'another-contractor-id-here', 1, 'Good plumber, fair prices', 1, 850.00, 4.5, NOW() - INTERVAL '1 month');
*/

-- ============================================================================
-- 7. TRIGGER TO AUTO-ADD CONTRACTORS AFTER SUCCESSFUL JOBS
-- ============================================================================

-- Function to auto-add contractor as trusted after successful job
CREATE OR REPLACE FUNCTION auto_add_trusted_contractor()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only trigger when job is completed with good rating
    IF NEW.status = 'completed' AND NEW.rating >= 4.0 AND OLD.status != 'completed' THEN
        -- Add contractor as trusted (level 1 = saved)
        INSERT INTO trusted_contractors (
            homeowner_id,
            contractor_id,
            trust_level,
            notes,
            jobs_completed,
            total_spent,
            average_rating,
            last_job_date
        ) VALUES (
            NEW.homeowner_id,
            NEW.contractor_id,
            1, -- Default trust level
            'Auto-added after successful job completion',
            1,
            COALESCE(NEW.final_cost, NEW.estimated_cost, 0),
            NEW.rating,
            NOW()
        )
        ON CONFLICT (homeowner_id, contractor_id)
        DO UPDATE SET
            jobs_completed = trusted_contractors.jobs_completed + 1,
            total_spent = trusted_contractors.total_spent + COALESCE(NEW.final_cost, NEW.estimated_cost, 0),
            average_rating = (trusted_contractors.average_rating * trusted_contractors.jobs_completed + NEW.rating) / (trusted_contractors.jobs_completed + 1),
            last_job_date = NOW(),
            updated_at = NOW();
    END IF;

    RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_auto_add_trusted_contractor ON homeowner_jobs;
CREATE TRIGGER trigger_auto_add_trusted_contractor
    AFTER UPDATE ON homeowner_jobs
    FOR EACH ROW
    EXECUTE FUNCTION auto_add_trusted_contractor();

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================
SELECT 'Trusted contractors system created successfully!' as status;