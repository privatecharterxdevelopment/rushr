-- Just create the basic contractor_profiles table
CREATE TABLE IF NOT EXISTS contractor_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    business_name TEXT,
    phone TEXT,
    email TEXT,
    avatar_url TEXT,
    categories TEXT[] DEFAULT '{}',
    service_area_zips TEXT[] DEFAULT '{}',
    description TEXT,
    rating DECIMAL(3,2) DEFAULT 0,
    jobs_completed INTEGER DEFAULT 0,
    status TEXT DEFAULT 'approved',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create basic index
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_status ON contractor_profiles(status);

-- Enable RLS
ALTER TABLE contractor_profiles ENABLE ROW LEVEL SECURITY;

-- Allow public to view approved contractors
DROP POLICY IF EXISTS "Public can view approved contractors" ON contractor_profiles;
CREATE POLICY "Public can view approved contractors" ON contractor_profiles
    FOR SELECT USING (status = 'approved');

SELECT 'Basic contractor profiles table created!' as status;