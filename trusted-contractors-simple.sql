-- ============================================================================
-- TRUSTED CONTRACTORS - SIMPLE VERSION
-- ============================================================================
-- Just creates the table, no complex views or constraints
-- ============================================================================

-- Create the trusted_contractors table
CREATE TABLE IF NOT EXISTS trusted_contractors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    homeowner_id UUID NOT NULL,
    contractor_id UUID NOT NULL,
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

-- Create basic indexes
CREATE INDEX IF NOT EXISTS idx_trusted_contractors_homeowner ON trusted_contractors(homeowner_id);
CREATE INDEX IF NOT EXISTS idx_trusted_contractors_contractor ON trusted_contractors(contractor_id);

-- Enable RLS
ALTER TABLE trusted_contractors ENABLE ROW LEVEL SECURITY;

-- Create basic policies
DROP POLICY IF EXISTS "Homeowners can manage their trusted contractors" ON trusted_contractors;
CREATE POLICY "Homeowners can manage their trusted contractors" ON trusted_contractors
    FOR ALL USING (auth.uid() = homeowner_id);

DROP POLICY IF EXISTS "Contractors can see who trusts them" ON trusted_contractors;
CREATE POLICY "Contractors can see who trusts them" ON trusted_contractors
    FOR SELECT USING (auth.uid() = contractor_id);

SELECT 'Trusted contractors table created successfully!' as status;