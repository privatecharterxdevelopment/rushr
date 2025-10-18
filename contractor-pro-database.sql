-- ============================================================================
-- RUSHR PRO CONTRACTOR DATABASE SCHEMA
-- ============================================================================
-- This creates the essential database tables for Pro contractor functionality
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUMS
-- ============================================================================

-- User roles
CREATE TYPE user_role AS ENUM (
    'homeowner',
    'contractor',
    'admin'
);

-- Subscription types
CREATE TYPE subscription_type AS ENUM (
    'free',     -- Homeowners (always free)
    'pro',      -- Contractors (free + success fee)
    'signals'   -- Optional add-on for contractors ($99/mo)
);

-- Contractor profile status
CREATE TYPE contractor_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'suspended'
);

-- KYC verification status
CREATE TYPE kyc_status AS ENUM (
    'not_started',
    'in_progress',
    'completed',
    'failed',
    'expired',
    'under_review'
);

-- Document types
CREATE TYPE document_type AS ENUM (
    'identity',
    'proof_of_address',
    'license',
    'insurance',
    'portfolio',
    'business_license',
    'tax_document',
    'bank_verification'
);

-- Document status
CREATE TYPE document_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Base user profiles (updated to support both homeowners and contractors)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'homeowner',
    subscription_type subscription_type NOT NULL DEFAULT 'free',
    avatar_url TEXT,
    timezone TEXT DEFAULT 'UTC',
    language TEXT DEFAULT 'en',
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contractor profiles with complete business information
CREATE TABLE contractor_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    business_name TEXT,
    business_type TEXT, -- LLC, Corp, Sole Proprietor, etc.
    phone TEXT,
    website TEXT,
    business_description TEXT,

    -- Business details
    years_in_business INTEGER,
    team_size INTEGER,
    ein TEXT, -- Employer Identification Number

    -- Service information
    categories TEXT[] DEFAULT '{}', -- Array of service categories
    specialties TEXT[] DEFAULT '{}', -- Specific specialties
    service_area_zips TEXT[] DEFAULT '{}', -- ZIP codes they serve
    base_zip TEXT, -- Primary business location ZIP
    service_radius_miles INTEGER DEFAULT 25,
    emergency_services BOOLEAN DEFAULT FALSE,

    -- Licensing and insurance
    license_number TEXT,
    license_type TEXT,
    license_state TEXT,
    license_expires DATE,
    insurance_carrier TEXT,
    insurance_policy TEXT,
    insurance_expires DATE,
    bonded BOOLEAN DEFAULT FALSE,
    bond_amount DECIMAL(10,2),

    -- Business hours (JSON format)
    business_hours JSONB DEFAULT '{
        "monday": {"open": "09:00", "close": "17:00", "enabled": true},
        "tuesday": {"open": "09:00", "close": "17:00", "enabled": true},
        "wednesday": {"open": "09:00", "close": "17:00", "enabled": true},
        "thursday": {"open": "09:00", "close": "17:00", "enabled": true},
        "friday": {"open": "09:00", "close": "17:00", "enabled": true},
        "saturday": {"open": "09:00", "close": "17:00", "enabled": false},
        "sunday": {"open": "09:00", "close": "17:00", "enabled": false}
    }',

    -- Pricing information
    rate_type TEXT CHECK (rate_type IN ('hourly', 'flat', 'visit_fee', 'project_based')),
    hourly_rate DECIMAL(8,2),
    flat_rate_min DECIMAL(10,2),
    visit_fee DECIMAL(8,2),
    free_estimates BOOLEAN DEFAULT TRUE,
    payment_methods TEXT[] DEFAULT '{}',

    -- Social and marketing
    instagram_url TEXT,
    facebook_url TEXT,
    yelp_url TEXT,
    google_business_url TEXT,
    linkedin_url TEXT,

    -- Profile status and verification
    status contractor_status NOT NULL DEFAULT 'pending',
    kyc_status kyc_status NOT NULL DEFAULT 'not_started',
    subscription_type subscription_type NOT NULL DEFAULT 'pro',
    profile_completion_score INTEGER DEFAULT 0, -- 0-100

    -- Important dates
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    profile_approved_at TIMESTAMPTZ,
    kyc_completed_at TIMESTAMPTZ,
    subscription_started_at TIMESTAMPTZ,

    -- Admin notes
    admin_notes TEXT,
    rejection_reason TEXT
);

-- KYC verification data (sensitive information with encryption)
CREATE TABLE contractor_kyc_data (
    id UUID REFERENCES contractor_profiles(id) ON DELETE CASCADE PRIMARY KEY,

    -- Personal information
    first_name TEXT,
    last_name TEXT,
    date_of_birth DATE,
    ssn_encrypted TEXT, -- Encrypted SSN

    -- Address information
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    address_verified BOOLEAN DEFAULT FALSE,

    -- Government IDs
    driver_license_number TEXT,
    driver_license_state TEXT,
    driver_license_expires DATE,
    passport_number TEXT,

    -- Financial information
    bank_account_number_encrypted TEXT, -- Encrypted bank account
    bank_routing_number TEXT,
    bank_name TEXT,
    account_type TEXT, -- checking, savings, business
    account_verified BOOLEAN DEFAULT FALSE,

    -- Tax information
    tax_id TEXT,
    tax_classification TEXT, -- individual, llc, corporation, etc.

    -- Verification status
    identity_verified BOOLEAN DEFAULT FALSE,
    address_verified_date TIMESTAMPTZ,
    financial_verified BOOLEAN DEFAULT FALSE,
    background_check_status TEXT,
    background_check_date TIMESTAMPTZ,

    -- Risk assessment
    risk_score INTEGER, -- 0-100 (lower is better)
    risk_factors TEXT[], -- Array of risk factors

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    verified_at TIMESTAMPTZ,

    -- Compliance and audit
    verified_by UUID REFERENCES auth.users(id),
    compliance_notes TEXT
);

-- Document storage and management
CREATE TABLE contractor_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contractor_id UUID REFERENCES contractor_profiles(id) ON DELETE CASCADE,
    document_type document_type NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    document_status document_status DEFAULT 'pending',

    -- Verification details
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES auth.users(id),
    verification_notes TEXT,
    rejection_reason TEXT,

    -- Document metadata
    title TEXT,
    description TEXT,
    expiry_date DATE, -- For licenses, insurance, etc.

    -- OCR and extracted data
    extracted_text TEXT,
    extracted_data JSONB, -- Structured data from document

    -- Security and audit
    access_log JSONB DEFAULT '[]', -- Who accessed when
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolio items and past work
CREATE TABLE contractor_portfolio (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contractor_id UUID REFERENCES contractor_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,

    -- Project details
    project_date DATE,
    location TEXT, -- City, State (no specific address for privacy)
    project_value DECIMAL(10,2),
    duration_days INTEGER,

    -- Media
    images TEXT[], -- Array of image URLs
    videos TEXT[], -- Array of video URLs
    before_images TEXT[],
    after_images TEXT[],

    -- Visibility
    is_public BOOLEAN DEFAULT TRUE,
    featured BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer references and testimonials
CREATE TABLE contractor_references (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contractor_id UUID REFERENCES contractor_profiles(id) ON DELETE CASCADE,

    -- Reference details
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT,
    project_description TEXT,
    project_date DATE,
    project_value DECIMAL(10,2),

    -- Verification
    verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMPTZ,
    verification_method TEXT, -- email, phone, etc.

    -- Reference response
    testimonial TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    would_recommend BOOLEAN,
    responded_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SUBSCRIPTION AND BILLING
-- ============================================================================

-- Subscription plans
CREATE TABLE subscription_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type subscription_type NOT NULL,
    price_monthly DECIMAL(8,2),
    price_yearly DECIMAL(10,2),
    features JSONB, -- Array of features
    limits JSONB, -- Usage limits
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User subscriptions
CREATE TABLE user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES subscription_plans(id),

    -- Subscription details
    status TEXT CHECK (status IN ('active', 'inactive', 'cancelled', 'past_due', 'unpaid', 'trialing')),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,

    -- Billing
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,

    -- Usage tracking
    usage_data JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to automatically create user profile when user signs up
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
        COALESCE(NEW.raw_user_meta_data->>'role', 'homeowner')::user_role,
        CASE
            WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'homeowner') = 'contractor' THEN 'pro'::subscription_type
            ELSE 'free'::subscription_type
        END,
        -- Set default empty values for homeowners
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

-- Function to calculate contractor profile completion score
CREATE OR REPLACE FUNCTION calculate_profile_completion_score(contractor_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    score INTEGER := 0;
    profile_record RECORD;
BEGIN
    SELECT * INTO profile_record FROM contractor_profiles WHERE id = contractor_id;

    IF profile_record IS NULL THEN
        RETURN 0;
    END IF;

    -- Basic info (30 points)
    IF profile_record.name IS NOT NULL AND profile_record.name != '' THEN score := score + 5; END IF;
    IF profile_record.email IS NOT NULL AND profile_record.email != '' THEN score := score + 5; END IF;
    IF profile_record.phone IS NOT NULL AND profile_record.phone != '' THEN score := score + 5; END IF;
    IF profile_record.business_name IS NOT NULL AND profile_record.business_name != '' THEN score := score + 5; END IF;
    IF profile_record.business_description IS NOT NULL AND profile_record.business_description != '' THEN score := score + 5; END IF;
    IF profile_record.base_zip IS NOT NULL AND profile_record.base_zip != '' THEN score := score + 5; END IF;

    -- Categories and services (20 points)
    IF array_length(profile_record.categories, 1) > 0 THEN score := score + 10; END IF;
    IF array_length(profile_record.specialties, 1) > 0 THEN score := score + 5; END IF;
    IF array_length(profile_record.service_area_zips, 1) > 0 THEN score := score + 5; END IF;

    -- Licensing and insurance (25 points)
    IF profile_record.license_number IS NOT NULL AND profile_record.license_number != '' THEN score := score + 10; END IF;
    IF profile_record.license_state IS NOT NULL AND profile_record.license_state != '' THEN score := score + 5; END IF;
    IF profile_record.insurance_carrier IS NOT NULL AND profile_record.insurance_carrier != '' THEN score := score + 10; END IF;

    -- Pricing (15 points)
    IF profile_record.rate_type IS NOT NULL THEN score := score + 5; END IF;
    IF profile_record.hourly_rate IS NOT NULL OR profile_record.flat_rate_min IS NOT NULL THEN score := score + 5; END IF;
    IF array_length(profile_record.payment_methods, 1) > 0 THEN score := score + 5; END IF;

    -- Portfolio and documents (10 points)
    IF EXISTS(SELECT 1 FROM contractor_portfolio WHERE contractor_id = profile_record.id) THEN score := score + 5; END IF;
    IF EXISTS(SELECT 1 FROM contractor_documents WHERE contractor_id = profile_record.id) THEN score := score + 5; END IF;

    RETURN LEAST(score, 100); -- Cap at 100
END;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Create updated_at triggers
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contractor_profiles_updated_at BEFORE UPDATE ON contractor_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contractor_kyc_data_updated_at BEFORE UPDATE ON contractor_kyc_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contractor_documents_updated_at BEFORE UPDATE ON contractor_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contractor_portfolio_updated_at BEFORE UPDATE ON contractor_portfolio FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to call the function when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update profile completion score when contractor profile changes
CREATE OR REPLACE FUNCTION update_profile_completion_score()
RETURNS TRIGGER AS $$
BEGIN
    NEW.profile_completion_score := calculate_profile_completion_score(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contractor_profile_score
    BEFORE INSERT OR UPDATE ON contractor_profiles
    FOR EACH ROW EXECUTE FUNCTION update_profile_completion_score();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_kyc_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can create their own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Contractor profiles policies
CREATE POLICY "Contractors can manage their own profile" ON contractor_profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Public can view approved contractors" ON contractor_profiles FOR SELECT USING (status = 'approved');

-- KYC data policies (very restrictive)
CREATE POLICY "Contractors can manage their own KYC data" ON contractor_kyc_data FOR ALL USING (auth.uid() = id);

-- Document policies
CREATE POLICY "Contractors can manage their own documents" ON contractor_documents FOR ALL USING (contractor_id = auth.uid());

-- Portfolio policies
CREATE POLICY "Contractors can manage their own portfolio" ON contractor_portfolio FOR ALL USING (contractor_id = auth.uid());
CREATE POLICY "Public can view public portfolio items" ON contractor_portfolio FOR SELECT USING (is_public = true);

-- Reference policies
CREATE POLICY "Contractors can manage their own references" ON contractor_references FOR ALL USING (contractor_id = auth.uid());
CREATE POLICY "Public can view verified references" ON contractor_references FOR SELECT USING (verified = true);

-- Subscription policies
CREATE POLICY "Users can manage their own subscriptions" ON user_subscriptions FOR ALL USING (user_id = auth.uid());

-- ============================================================================
-- INDEXES
-- ============================================================================

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_type ON user_profiles(subscription_type);

-- Contractor profiles indexes
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_status ON contractor_profiles(status);
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_kyc_status ON contractor_profiles(kyc_status);
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_categories ON contractor_profiles USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_service_area_zips ON contractor_profiles USING GIN(service_area_zips);
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_base_zip ON contractor_profiles(base_zip);
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_license_expires ON contractor_profiles(license_expires);
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_insurance_expires ON contractor_profiles(insurance_expires);
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_subscription_type ON contractor_profiles(subscription_type);

-- Document indexes
CREATE INDEX IF NOT EXISTS idx_contractor_documents_contractor ON contractor_documents(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_documents_type ON contractor_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_contractor_documents_status ON contractor_documents(document_status);

-- Portfolio indexes
CREATE INDEX IF NOT EXISTS idx_contractor_portfolio_contractor ON contractor_portfolio(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_portfolio_category ON contractor_portfolio(category);
CREATE INDEX IF NOT EXISTS idx_contractor_portfolio_public ON contractor_portfolio(is_public) WHERE is_public = true;

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Insert sample subscription plans
INSERT INTO subscription_plans (name, description, type, price_monthly, price_yearly, features, limits) VALUES
('Free Plan', 'Basic features for getting started', 'free', 0.00, 0.00,
 '["Basic profile", "Limited job applications", "Community support"]',
 '{"job_applications_per_month": 5, "signals_per_day": 10}'),
('Pro Plan', 'Full contractor features', 'pro', 49.99, 499.99,
 '["Full profile", "Unlimited job applications", "Real-time signals", "Direct messaging", "Analytics"]',
 '{"job_applications_per_month": -1, "signals_per_day": -1}');

-- ============================================================================
-- USEFUL VIEWS
-- ============================================================================

-- View for contractor profiles with calculated metrics
CREATE VIEW contractor_profiles_with_metrics AS
SELECT
    cp.*,
    COALESCE(portfolio_count, 0) as portfolio_count,
    COALESCE(document_count, 0) as document_count,
    COALESCE(verified_document_count, 0) as verified_document_count
FROM contractor_profiles cp
LEFT JOIN (
    SELECT contractor_id, COUNT(*) as portfolio_count
    FROM contractor_portfolio
    WHERE is_public = true
    GROUP BY contractor_id
) p ON p.contractor_id = cp.id
LEFT JOIN (
    SELECT contractor_id,
           COUNT(*) as document_count,
           COUNT(CASE WHEN document_status = 'approved' THEN 1 END) as verified_document_count
    FROM contractor_documents
    GROUP BY contractor_id
) d ON d.contractor_id = cp.id;

-- ============================================================================
-- COMPLETION
-- ============================================================================

-- Add completion comment
COMMENT ON SCHEMA public IS 'Rushr Pro Contractor Database Schema - Installation completed successfully';

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Rushr Pro Contractor Database Schema installation completed successfully!';
    RAISE NOTICE 'Created contractor profiles, KYC system, document management, and portfolio features.';
END $$;