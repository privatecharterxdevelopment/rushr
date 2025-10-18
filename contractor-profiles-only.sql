-- ============================================================================
-- CONTRACTOR PROFILES - MINIMAL VERSION
-- ============================================================================
-- Just creates contractor_profiles table without complex enums
-- ============================================================================

-- Create contractor_profiles table with simple TEXT fields instead of enums
CREATE TABLE IF NOT EXISTS contractor_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Basic info
    name TEXT NOT NULL,
    business_name TEXT,
    phone TEXT,
    email TEXT,
    avatar_url TEXT,

    -- Professional info
    categories TEXT[] DEFAULT '{}',
    service_area_zips TEXT[] DEFAULT '{}',
    description TEXT,

    -- Ratings and stats
    rating DECIMAL(3,2) DEFAULT 0,
    jobs_completed INTEGER DEFAULT 0,

    -- Status (using TEXT instead of enum to avoid conflicts)
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique constraint
    UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_user_id ON contractor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_status ON contractor_profiles(status);
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_categories ON contractor_profiles USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_service_areas ON contractor_profiles USING GIN(service_area_zips);

-- Enable RLS
ALTER TABLE contractor_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Contractors can view their own profile" ON contractor_profiles;
CREATE POLICY "Contractors can view their own profile" ON contractor_profiles
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public can view approved contractors" ON contractor_profiles;
CREATE POLICY "Public can view approved contractors" ON contractor_profiles
    FOR SELECT USING (status = 'approved');

SELECT 'Contractor profiles table created successfully!' as status;