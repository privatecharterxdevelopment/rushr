-- ============================================================================
-- RUSHR PRO CONTRACTOR EXTENSION
-- ============================================================================
-- This extends the existing homeowner database with Pro contractor functionality
-- Run this AFTER the main supabase-setup.sql
-- ============================================================================

-- Enable necessary extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUMS (only create if they don't exist)
-- ============================================================================

-- Document types for contractor documents
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_type') THEN
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
    END IF;
END $$;

-- Document status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_status') THEN
        CREATE TYPE document_status AS ENUM (
            'pending',
            'approved',
            'rejected'
        );
    END IF;
END $$;

-- ============================================================================
-- EXTEND EXISTING CONTRACTOR_PROFILES TABLE
-- ============================================================================

-- Add missing columns to contractor_profiles (only if they don't exist)
DO $$
BEGIN
    -- Business information
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'business_type') THEN
        ALTER TABLE contractor_profiles ADD COLUMN business_type TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'website') THEN
        ALTER TABLE contractor_profiles ADD COLUMN website TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'business_description') THEN
        ALTER TABLE contractor_profiles ADD COLUMN business_description TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'years_in_business') THEN
        ALTER TABLE contractor_profiles ADD COLUMN years_in_business INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'team_size') THEN
        ALTER TABLE contractor_profiles ADD COLUMN team_size INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'ein') THEN
        ALTER TABLE contractor_profiles ADD COLUMN ein TEXT;
    END IF;

    -- Service information
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'specialties') THEN
        ALTER TABLE contractor_profiles ADD COLUMN specialties TEXT[] DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'service_area_zips') THEN
        ALTER TABLE contractor_profiles ADD COLUMN service_area_zips TEXT[] DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'service_radius_miles') THEN
        ALTER TABLE contractor_profiles ADD COLUMN service_radius_miles INTEGER DEFAULT 25;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'emergency_services') THEN
        ALTER TABLE contractor_profiles ADD COLUMN emergency_services BOOLEAN DEFAULT FALSE;
    END IF;

    -- Extended licensing and insurance
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'license_type') THEN
        ALTER TABLE contractor_profiles ADD COLUMN license_type TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'license_expires') THEN
        ALTER TABLE contractor_profiles ADD COLUMN license_expires DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'insurance_policy') THEN
        ALTER TABLE contractor_profiles ADD COLUMN insurance_policy TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'insurance_expires') THEN
        ALTER TABLE contractor_profiles ADD COLUMN insurance_expires DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'bonded') THEN
        ALTER TABLE contractor_profiles ADD COLUMN bonded BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'bond_amount') THEN
        ALTER TABLE contractor_profiles ADD COLUMN bond_amount DECIMAL(10,2);
    END IF;

    -- Business hours
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'business_hours') THEN
        ALTER TABLE contractor_profiles ADD COLUMN business_hours JSONB DEFAULT '{
            "monday": {"open": "09:00", "close": "17:00", "enabled": true},
            "tuesday": {"open": "09:00", "close": "17:00", "enabled": true},
            "wednesday": {"open": "09:00", "close": "17:00", "enabled": true},
            "thursday": {"open": "09:00", "close": "17:00", "enabled": true},
            "friday": {"open": "09:00", "close": "17:00", "enabled": true},
            "saturday": {"open": "09:00", "close": "17:00", "enabled": false},
            "sunday": {"open": "09:00", "close": "17:00", "enabled": false}
        }';
    END IF;

    -- Pricing information
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'rate_type') THEN
        ALTER TABLE contractor_profiles ADD COLUMN rate_type TEXT CHECK (rate_type IN ('hourly', 'flat', 'visit_fee', 'project_based'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'hourly_rate') THEN
        ALTER TABLE contractor_profiles ADD COLUMN hourly_rate DECIMAL(8,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'flat_rate_min') THEN
        ALTER TABLE contractor_profiles ADD COLUMN flat_rate_min DECIMAL(10,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'visit_fee') THEN
        ALTER TABLE contractor_profiles ADD COLUMN visit_fee DECIMAL(8,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'free_estimates') THEN
        ALTER TABLE contractor_profiles ADD COLUMN free_estimates BOOLEAN DEFAULT TRUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'payment_methods') THEN
        ALTER TABLE contractor_profiles ADD COLUMN payment_methods TEXT[] DEFAULT '{}';
    END IF;

    -- Social and marketing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'instagram_url') THEN
        ALTER TABLE contractor_profiles ADD COLUMN instagram_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'facebook_url') THEN
        ALTER TABLE contractor_profiles ADD COLUMN facebook_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'yelp_url') THEN
        ALTER TABLE contractor_profiles ADD COLUMN yelp_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'google_business_url') THEN
        ALTER TABLE contractor_profiles ADD COLUMN google_business_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'linkedin_url') THEN
        ALTER TABLE contractor_profiles ADD COLUMN linkedin_url TEXT;
    END IF;

    -- Profile completion and admin
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'profile_completion_score') THEN
        ALTER TABLE contractor_profiles ADD COLUMN profile_completion_score INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'admin_notes') THEN
        ALTER TABLE contractor_profiles ADD COLUMN admin_notes TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'rejection_reason') THEN
        ALTER TABLE contractor_profiles ADD COLUMN rejection_reason TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contractor_profiles' AND column_name = 'subscription_started_at') THEN
        ALTER TABLE contractor_profiles ADD COLUMN subscription_started_at TIMESTAMPTZ;
    END IF;

END $$;

-- ============================================================================
-- NEW CONTRACTOR-SPECIFIC TABLES
-- ============================================================================

-- Document storage and management
CREATE TABLE IF NOT EXISTS contractor_documents (
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
CREATE TABLE IF NOT EXISTS contractor_portfolio (
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
CREATE TABLE IF NOT EXISTS contractor_references (
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

-- Subscription plans
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK (type IN ('free', 'basic', 'premium', 'pro')) NOT NULL,
    price_monthly DECIMAL(8,2),
    price_yearly DECIMAL(10,2),
    features JSONB, -- Array of features
    limits JSONB, -- Usage limits
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
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
    IF profile_record.specialties IS NOT NULL AND array_length(profile_record.specialties, 1) > 0 THEN score := score + 5; END IF;
    IF profile_record.service_area_zips IS NOT NULL AND array_length(profile_record.service_area_zips, 1) > 0 THEN score := score + 5; END IF;

    -- Licensing and insurance (25 points)
    IF profile_record.license_number IS NOT NULL AND profile_record.license_number != '' THEN score := score + 10; END IF;
    IF profile_record.license_state IS NOT NULL AND profile_record.license_state != '' THEN score := score + 5; END IF;
    IF profile_record.insurance_carrier IS NOT NULL AND profile_record.insurance_carrier != '' THEN score := score + 10; END IF;

    -- Pricing (15 points)
    IF profile_record.rate_type IS NOT NULL THEN score := score + 5; END IF;
    IF profile_record.hourly_rate IS NOT NULL OR profile_record.flat_rate_min IS NOT NULL THEN score := score + 5; END IF;
    IF profile_record.payment_methods IS NOT NULL AND array_length(profile_record.payment_methods, 1) > 0 THEN score := score + 5; END IF;

    -- Portfolio and documents (10 points)
    IF EXISTS(SELECT 1 FROM contractor_portfolio WHERE contractor_id = profile_record.id) THEN score := score + 5; END IF;
    IF EXISTS(SELECT 1 FROM contractor_documents WHERE contractor_id = profile_record.id) THEN score := score + 5; END IF;

    RETURN LEAST(score, 100); -- Cap at 100
END;
$$;

-- Trigger to update profile completion score when contractor profile changes
CREATE OR REPLACE FUNCTION update_profile_completion_score()
RETURNS TRIGGER AS $$
BEGIN
    NEW.profile_completion_score := calculate_profile_completion_score(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Create updated_at triggers for new tables
CREATE TRIGGER update_contractor_documents_updated_at
    BEFORE UPDATE ON contractor_documents
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_contractor_portfolio_updated_at
    BEFORE UPDATE ON contractor_portfolio
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_contractor_references_updated_at
    BEFORE UPDATE ON contractor_references
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger to update profile completion score
DROP TRIGGER IF EXISTS update_contractor_profile_score ON contractor_profiles;
CREATE TRIGGER update_contractor_profile_score
    BEFORE INSERT OR UPDATE ON contractor_profiles
    FOR EACH ROW EXECUTE FUNCTION update_profile_completion_score();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE contractor_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Document policies
CREATE POLICY "Contractors can manage their own documents" ON contractor_documents
    FOR ALL USING (contractor_id = auth.uid());

-- Portfolio policies
CREATE POLICY "Contractors can manage their own portfolio" ON contractor_portfolio
    FOR ALL USING (contractor_id = auth.uid());

CREATE POLICY "Public can view public portfolio items" ON contractor_portfolio
    FOR SELECT USING (is_public = true);

-- Reference policies
CREATE POLICY "Contractors can manage their own references" ON contractor_references
    FOR ALL USING (contractor_id = auth.uid());

CREATE POLICY "Public can view verified references" ON contractor_references
    FOR SELECT USING (verified = true);

-- Subscription plan policies (public read)
CREATE POLICY "Anyone can view active subscription plans" ON subscription_plans
    FOR SELECT USING (is_active = true);

-- User subscription policies
CREATE POLICY "Users can manage their own subscriptions" ON user_subscriptions
    FOR ALL USING (user_id = auth.uid());

-- ============================================================================
-- ADDITIONAL INDEXES
-- ============================================================================

-- New indexes for the extended contractor_profiles
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_service_area_zips ON contractor_profiles USING GIN(service_area_zips);
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_specialties ON contractor_profiles USING GIN(specialties);
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_license_expires ON contractor_profiles(license_expires);
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_insurance_expires ON contractor_profiles(insurance_expires);
CREATE INDEX IF NOT EXISTS idx_contractor_profiles_completion_score ON contractor_profiles(profile_completion_score);

-- Document indexes
CREATE INDEX IF NOT EXISTS idx_contractor_documents_contractor ON contractor_documents(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_documents_type ON contractor_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_contractor_documents_status ON contractor_documents(document_status);

-- Portfolio indexes
CREATE INDEX IF NOT EXISTS idx_contractor_portfolio_contractor ON contractor_portfolio(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_portfolio_category ON contractor_portfolio(category);
CREATE INDEX IF NOT EXISTS idx_contractor_portfolio_public ON contractor_portfolio(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_contractor_portfolio_featured ON contractor_portfolio(featured) WHERE featured = true;

-- Reference indexes
CREATE INDEX IF NOT EXISTS idx_contractor_references_contractor ON contractor_references(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_references_verified ON contractor_references(verified) WHERE verified = true;
CREATE INDEX IF NOT EXISTS idx_contractor_references_rating ON contractor_references(rating);

-- Subscription indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Insert sample subscription plans
INSERT INTO subscription_plans (name, description, type, price_monthly, price_yearly, features, limits)
VALUES
('Free Plan', 'Basic features for getting started', 'free', 0.00, 0.00,
 '["Basic profile", "Limited job applications", "Community support"]',
 '{"job_applications_per_month": 5, "signals_per_day": 10}'),
('Pro Plan', 'Full contractor features', 'pro', 49.99, 499.99,
 '["Full profile", "Unlimited job applications", "Real-time signals", "Direct messaging", "Analytics"]',
 '{"job_applications_per_month": -1, "signals_per_day": -1}')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- USEFUL VIEWS
-- ============================================================================

-- View for contractor profiles with calculated metrics
CREATE OR REPLACE VIEW contractor_profiles_with_metrics AS
SELECT
    cp.*,
    COALESCE(portfolio_count, 0) as portfolio_count,
    COALESCE(document_count, 0) as document_count,
    COALESCE(verified_document_count, 0) as verified_document_count,
    COALESCE(reference_count, 0) as reference_count,
    COALESCE(avg_reference_rating, 0) as avg_reference_rating
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
) d ON d.contractor_id = cp.id
LEFT JOIN (
    SELECT contractor_id,
           COUNT(*) as reference_count,
           AVG(rating) as avg_reference_rating
    FROM contractor_references
    WHERE verified = true AND rating IS NOT NULL
    GROUP BY contractor_id
) r ON r.contractor_id = cp.id;

-- ============================================================================
-- COMPLETION
-- ============================================================================

-- Add completion comment
COMMENT ON TABLE contractor_profiles IS 'Extended contractor profiles with complete business information for Rushr Pro';
COMMENT ON TABLE contractor_documents IS 'Document storage and verification for contractor onboarding';
COMMENT ON TABLE contractor_portfolio IS 'Portfolio items showcasing contractor past work';
COMMENT ON TABLE contractor_references IS 'Customer references and testimonials for contractors';

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Rushr Pro Contractor Extension installation completed successfully!';
    RAISE NOTICE 'Extended contractor profiles with business information, documents, portfolio, and references.';
    RAISE NOTICE 'Added subscription management and profile completion scoring.';
END $$;