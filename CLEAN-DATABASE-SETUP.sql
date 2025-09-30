-- ============================================================================
-- CLEAN RUSHR DATABASE SETUP - EVERYTHING IN ONE FILE
-- ============================================================================
-- This is the ONLY file you need to run
-- Includes both homeowner and Pro contractor systems
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- HOMEOWNER SYSTEM
-- ============================================================================

-- Create the user_profiles table for homeowners and contractors
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT CHECK (role IN ('homeowner', 'contractor')) NOT NULL DEFAULT 'homeowner',
  subscription_type TEXT CHECK (subscription_type IN ('free', 'pro', 'signals')) NOT NULL DEFAULT 'free',
  -- Contact information
  phone TEXT,
  -- Address information
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  -- Emergency contact
  emergency_contact TEXT,
  emergency_phone TEXT,
  -- Profile and verification
  avatar_url TEXT,
  kyc_verified BOOLEAN DEFAULT FALSE,
  notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "push": true}'::jsonb,
  first_job_completed BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can create their own profile" ON user_profiles;
CREATE POLICY "Users can create their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================================
-- PRO CONTRACTOR SYSTEM (COMPLETELY SEPARATE)
-- ============================================================================

-- Pro-only enums
DO $$ BEGIN
    CREATE TYPE pro_contractor_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE pro_kyc_status AS ENUM ('not_started', 'in_progress', 'completed', 'failed', 'expired', 'under_review');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE pro_document_type AS ENUM ('identity', 'proof_of_address', 'license', 'insurance', 'portfolio', 'business_license', 'tax_document', 'bank_verification');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE pro_document_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Main Pro contractors table
CREATE TABLE IF NOT EXISTS pro_contractors (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    business_name TEXT,
    phone TEXT,
    website TEXT,
    about TEXT,
    years_in_business INTEGER,
    team_size INTEGER,

    -- Location and service area
    base_zip TEXT,
    radius_miles INTEGER DEFAULT 25,
    service_area_zips TEXT[] DEFAULT '{}',

    -- Categories and specialties
    categories TEXT[] DEFAULT '{}',
    specialties TEXT[] DEFAULT '{}',

    -- Licensing and insurance
    license_number TEXT,
    license_type TEXT,
    license_state TEXT,
    license_expires DATE,
    insurance_carrier TEXT,
    insurance_policy TEXT,
    insurance_expires DATE,

    -- Status and approval
    status pro_contractor_status DEFAULT 'pending',
    kyc_status pro_kyc_status DEFAULT 'not_started',
    subscription_type TEXT DEFAULT 'pro',

    -- Pricing and availability
    rate_type TEXT CHECK (rate_type IN ('Hourly', 'Flat', 'Visit fee')),
    hourly_rate TEXT,
    flat_min TEXT,
    visit_fee TEXT,
    free_estimates BOOLEAN DEFAULT true,
    emergency_service BOOLEAN DEFAULT false,

    -- Social links
    instagram TEXT,
    facebook TEXT,
    yelp TEXT,
    google_profile TEXT,

    -- Profile completion and scoring
    profile_completion_score INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    profile_approved_at TIMESTAMPTZ,
    kyc_completed_at TIMESTAMPTZ
);

-- Enable RLS for pro_contractors
ALTER TABLE pro_contractors ENABLE ROW LEVEL SECURITY;

-- Pro contractor policies
DROP POLICY IF EXISTS "Contractors can view their own profile" ON pro_contractors;
CREATE POLICY "Contractors can view their own profile" ON pro_contractors
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Contractors can update their own profile" ON pro_contractors;
CREATE POLICY "Contractors can update their own profile" ON pro_contractors
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Contractors can create their own profile" ON pro_contractors;
CREATE POLICY "Contractors can create their own profile" ON pro_contractors
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Anyone can view approved contractors" ON pro_contractors;
CREATE POLICY "Anyone can view approved contractors" ON pro_contractors
    FOR SELECT USING (status = 'approved');

-- KYC data table
CREATE TABLE IF NOT EXISTS pro_kyc_data (
    contractor_id UUID REFERENCES pro_contractors(id) ON DELETE CASCADE PRIMARY KEY,

    -- Personal information
    first_name TEXT,
    last_name TEXT,
    date_of_birth DATE,
    ssn_last_four TEXT, -- Only store last 4 digits

    -- Address information
    street_address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,

    -- Identity verification
    driver_license_number TEXT,
    driver_license_state TEXT,
    identity_verified BOOLEAN DEFAULT false,

    -- Financial information
    bank_account_last_four TEXT, -- Only store last 4 digits
    bank_routing_number TEXT,
    tax_id TEXT,

    -- Document URLs
    identity_document_url TEXT,
    proof_of_address_url TEXT,

    -- Status and timestamps
    kyc_status pro_kyc_status DEFAULT 'not_started',
    submitted_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for KYC data
ALTER TABLE pro_kyc_data ENABLE ROW LEVEL SECURITY;

-- KYC policies (very restrictive)
DROP POLICY IF EXISTS "Contractors can manage their own KYC data" ON pro_kyc_data;
CREATE POLICY "Contractors can manage their own KYC data" ON pro_kyc_data
    FOR ALL USING (auth.uid() = contractor_id);

-- Documents table
CREATE TABLE IF NOT EXISTS pro_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contractor_id UUID REFERENCES pro_contractors(id) ON DELETE CASCADE,
    document_type pro_document_type NOT NULL,
    document_url TEXT NOT NULL,
    file_name TEXT,
    file_size INTEGER,
    mime_type TEXT,
    document_status pro_document_status DEFAULT 'pending',
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    notes TEXT
);

-- Enable RLS for documents
ALTER TABLE pro_documents ENABLE ROW LEVEL SECURITY;

-- Document policies
DROP POLICY IF EXISTS "Contractors can manage their own documents" ON pro_documents;
CREATE POLICY "Contractors can manage their own documents" ON pro_documents
    FOR ALL USING (auth.uid() = contractor_id);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User profiles indexes
CREATE INDEX IF NOT EXISTS user_profiles_role_idx ON user_profiles(role);
CREATE INDEX IF NOT EXISTS user_profiles_email_idx ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON user_profiles(phone);
CREATE INDEX IF NOT EXISTS idx_user_profiles_city ON user_profiles(city);
CREATE INDEX IF NOT EXISTS idx_user_profiles_state ON user_profiles(state);
CREATE INDEX IF NOT EXISTS idx_user_profiles_zip_code ON user_profiles(zip_code);
CREATE INDEX IF NOT EXISTS idx_user_profiles_kyc_verified ON user_profiles(kyc_verified);

-- Pro contractor indexes
CREATE INDEX IF NOT EXISTS idx_pro_contractors_status ON pro_contractors(status);
CREATE INDEX IF NOT EXISTS idx_pro_contractors_kyc_status ON pro_contractors(kyc_status);
CREATE INDEX IF NOT EXISTS idx_pro_contractors_email ON pro_contractors(email);
CREATE INDEX IF NOT EXISTS idx_pro_contractors_base_zip ON pro_contractors(base_zip);
CREATE INDEX IF NOT EXISTS idx_pro_contractors_categories ON pro_contractors USING GIN(categories);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Auto-create user profile function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY definer SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    email,
    name,
    role,
    subscription_type,
    phone,
    address,
    city,
    state,
    zip_code,
    emergency_contact,
    emergency_phone,
    avatar_url,
    kyc_verified,
    notification_preferences,
    first_job_completed,
    email_verified,
    phone_verified,
    onboarding_completed
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'homeowner'),
    CASE
      WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'homeowner') = 'contractor' THEN 'pro'
      ELSE 'free'
    END,
    -- Set default NULL/FALSE values for new users
    NULL, -- phone
    NULL, -- address
    NULL, -- city
    NULL, -- state
    NULL, -- zip_code
    NULL, -- emergency_contact
    NULL, -- emergency_phone
    NULL, -- avatar_url
    FALSE, -- kyc_verified
    '{"email": true, "sms": false, "push": true}'::jsonb, -- notification_preferences
    FALSE, -- first_job_completed
    FALSE, -- email_verified
    FALSE, -- phone_verified
    FALSE  -- onboarding_completed
  );
  RETURN NEW;
END;
$$;

-- Updated at function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-create user profile trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated at triggers
DROP TRIGGER IF EXISTS handle_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER handle_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_pro_contractors_updated_at ON pro_contractors;
CREATE TRIGGER handle_pro_contractors_updated_at
  BEFORE UPDATE ON pro_contractors
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_pro_kyc_data_updated_at ON pro_kyc_data;
CREATE TRIGGER handle_pro_kyc_data_updated_at
  BEFORE UPDATE ON pro_kyc_data
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ RUSHR DATABASE SETUP COMPLETE!';
    RAISE NOTICE '📋 Created homeowner system: user_profiles table';
    RAISE NOTICE '🔧 Created Pro contractor system: pro_contractors, pro_kyc_data, pro_documents';
    RAISE NOTICE '🔒 All RLS policies configured';
    RAISE NOTICE '⚡ Performance indexes created';
    RAISE NOTICE '🎯 Ready to use!';
END $$;