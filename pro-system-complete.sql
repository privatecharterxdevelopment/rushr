-- ============================================================================
-- RUSHR PRO SYSTEM - COMPLETELY SEPARATE FROM HOMEOWNER
-- ============================================================================
-- This creates a 100% separate Pro contractor system
-- NO conflicts with homeowner system - completely independent
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- PRO-ONLY ENUMS (with pro_ prefix to avoid conflicts)
-- ============================================================================

-- Pro document types
DO $$ BEGIN
    CREATE TYPE pro_document_type AS ENUM (
        'identity',
        'proof_of_address',
        'license',
        'insurance',
        'portfolio',
        'business_license',
        'tax_document',
        'bank_verification'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Pro document status
DO $$ BEGIN
    CREATE TYPE pro_document_status AS ENUM (
        'pending',
        'approved',
        'rejected'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Pro contractor status
DO $$ BEGIN
    CREATE TYPE pro_contractor_status AS ENUM (
        'pending',
        'approved',
        'rejected',
        'suspended'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Pro KYC status
DO $$ BEGIN
    CREATE TYPE pro_kyc_status AS ENUM (
        'not_started',
        'in_progress',
        'completed',
        'failed',
        'expired',
        'under_review'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Pro subscription status
DO $$ BEGIN
    CREATE TYPE pro_subscription_status AS ENUM (
        'active',
        'inactive',
        'cancelled',
        'past_due',
        'unpaid',
        'trialing'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- PRO CONTRACTOR PROFILES (completely separate)
-- ============================================================================

CREATE TABLE IF NOT EXISTS pro_contractors (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,

    -- Business Information
    business_name TEXT,
    business_type TEXT, -- LLC, Corp, Sole Proprietor, etc.
    phone TEXT,
    website TEXT,
    business_description TEXT,
    years_in_business INTEGER,
    team_size INTEGER,
    ein TEXT, -- Employer Identification Number

    -- Service Information
    categories TEXT[] DEFAULT '{}',
    specialties TEXT[] DEFAULT '{}',
    service_area_zips TEXT[] DEFAULT '{}',
    base_zip TEXT,
    service_radius_miles INTEGER DEFAULT 25,
    emergency_services BOOLEAN DEFAULT FALSE,

    -- Licensing & Insurance
    license_number TEXT,
    license_type TEXT,
    license_state TEXT,
    license_expires DATE,
    insurance_carrier TEXT,
    insurance_policy TEXT,
    insurance_expires DATE,
    bonded BOOLEAN DEFAULT FALSE,
    bond_amount DECIMAL(10,2),

    -- Business Operations
    business_hours JSONB DEFAULT '{
        "monday": {"open": "09:00", "close": "17:00", "enabled": true},
        "tuesday": {"open": "09:00", "close": "17:00", "enabled": true},
        "wednesday": {"open": "09:00", "close": "17:00", "enabled": true},
        "thursday": {"open": "09:00", "close": "17:00", "enabled": true},
        "friday": {"open": "09:00", "close": "17:00", "enabled": true},
        "saturday": {"open": "09:00", "close": "17:00", "enabled": false},
        "sunday": {"open": "09:00", "close": "17:00", "enabled": false}
    }',

    -- Pricing
    rate_type TEXT CHECK (rate_type IN ('hourly', 'flat', 'visit_fee', 'project_based')),
    hourly_rate DECIMAL(8,2),
    flat_rate_min DECIMAL(10,2),
    visit_fee DECIMAL(8,2),
    free_estimates BOOLEAN DEFAULT TRUE,
    payment_methods TEXT[] DEFAULT '{}',

    -- Social Media
    instagram_url TEXT,
    facebook_url TEXT,
    yelp_url TEXT,
    google_business_url TEXT,
    linkedin_url TEXT,

    -- Status & Verification
    status pro_contractor_status NOT NULL DEFAULT 'pending',
    kyc_status pro_kyc_status NOT NULL DEFAULT 'not_started',
    profile_completion_score INTEGER DEFAULT 0, -- 0-100

    -- Important Dates
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    profile_approved_at TIMESTAMPTZ,
    kyc_completed_at TIMESTAMPTZ,

    -- Admin
    admin_notes TEXT,
    rejection_reason TEXT
);

-- ============================================================================
-- PRO KYC DATA (completely separate, encrypted)
-- ============================================================================

CREATE TABLE IF NOT EXISTS pro_kyc_data (
    contractor_id UUID REFERENCES pro_contractors(id) ON DELETE CASCADE PRIMARY KEY,

    -- Personal Identity
    first_name TEXT,
    last_name TEXT,
    date_of_birth DATE,
    ssn_encrypted TEXT, -- PGP encrypted

    -- Address
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

    -- Financial Info
    bank_account_encrypted TEXT, -- PGP encrypted
    bank_routing_number TEXT,
    bank_name TEXT,
    account_type TEXT,
    account_verified BOOLEAN DEFAULT FALSE,

    -- Tax Information
    tax_id TEXT,
    tax_classification TEXT,

    -- Verification Status
    identity_verified BOOLEAN DEFAULT FALSE,
    address_verified_date TIMESTAMPTZ,
    financial_verified BOOLEAN DEFAULT FALSE,
    background_check_status TEXT,
    background_check_date TIMESTAMPTZ,

    -- Risk Assessment
    risk_score INTEGER DEFAULT 50, -- 0-100
    risk_factors TEXT[] DEFAULT '{}',

    -- Audit Trail
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES auth.users(id),
    compliance_notes TEXT
);

-- ============================================================================
-- PRO DOCUMENTS (file management)
-- ============================================================================

CREATE TABLE IF NOT EXISTS pro_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contractor_id UUID REFERENCES pro_contractors(id) ON DELETE CASCADE,
    document_type pro_document_type NOT NULL,

    -- File Information
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL, -- Points to Supabase storage
    file_size INTEGER,
    mime_type TEXT,
    storage_bucket TEXT DEFAULT 'pro-documents',
    storage_path TEXT,

    -- Verification
    document_status pro_document_status DEFAULT 'pending',
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES auth.users(id),
    verification_notes TEXT,
    rejection_reason TEXT,

    -- Metadata
    title TEXT,
    description TEXT,
    expiry_date DATE,

    -- OCR & Processing
    extracted_text TEXT,
    extracted_data JSONB DEFAULT '{}',

    -- Security
    access_log JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PRO PORTFOLIO (showcase work)
-- ============================================================================

CREATE TABLE IF NOT EXISTS pro_portfolio (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contractor_id UUID REFERENCES pro_contractors(id) ON DELETE CASCADE,

    -- Project Information
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    project_date DATE,
    location TEXT, -- City, State only
    project_value DECIMAL(10,2),
    duration_days INTEGER,

    -- Media Files
    images TEXT[] DEFAULT '{}', -- URLs to storage
    videos TEXT[] DEFAULT '{}', -- URLs to storage
    before_images TEXT[] DEFAULT '{}',
    after_images TEXT[] DEFAULT '{}',
    storage_bucket TEXT DEFAULT 'pro-portfolio',

    -- Visibility
    is_public BOOLEAN DEFAULT TRUE,
    featured BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PRO SUBSCRIPTIONS (billing management)
-- ============================================================================

CREATE TABLE IF NOT EXISTS pro_subscription_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price_monthly DECIMAL(8,2) NOT NULL,
    price_yearly DECIMAL(8,2),
    features JSONB DEFAULT '{}',
    limits JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pro_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contractor_id UUID REFERENCES pro_contractors(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES pro_subscription_plans(id),

    -- Subscription Status
    status pro_subscription_status DEFAULT 'trialing',
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,

    -- Billing Integration
    stripe_subscription_id TEXT UNIQUE,
    stripe_customer_id TEXT,
    stripe_payment_method_id TEXT,

    -- Usage Tracking
    usage_data JSONB DEFAULT '{}',
    last_billing_date TIMESTAMPTZ,
    next_billing_date TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PRO BILLING (transaction history)
-- ============================================================================

CREATE TABLE IF NOT EXISTS pro_billing_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contractor_id UUID REFERENCES pro_contractors(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES pro_subscriptions(id),

    -- Transaction Details
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    transaction_type TEXT CHECK (transaction_type IN ('charge', 'refund', 'credit')),
    status TEXT CHECK (status IN ('pending', 'succeeded', 'failed', 'cancelled')),

    -- Stripe Integration
    stripe_payment_intent_id TEXT,
    stripe_charge_id TEXT,

    -- Invoice
    invoice_number TEXT,
    description TEXT,
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    processed_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PRO REFERENCES (customer testimonials)
-- ============================================================================

CREATE TABLE IF NOT EXISTS pro_references (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contractor_id UUID REFERENCES pro_contractors(id) ON DELETE CASCADE,

    -- Customer Information
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT,
    project_description TEXT,
    project_date DATE,
    project_value DECIMAL(10,2),

    -- Verification
    verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMPTZ,
    verification_method TEXT,
    verification_token TEXT,

    -- Customer Response
    testimonial TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    would_recommend BOOLEAN,
    responded_at TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- FUNCTIONS FOR PRO SYSTEM
-- ============================================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION pro_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Calculate profile completion score
CREATE OR REPLACE FUNCTION pro_calculate_completion_score(v_contractor_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    score INTEGER := 0;
    contractor RECORD;
BEGIN
    SELECT * INTO contractor FROM pro_contractors WHERE id = v_contractor_id;

    IF contractor IS NULL THEN
        RETURN 0;
    END IF;

    -- Basic Information (30 points)
    IF contractor.name IS NOT NULL AND contractor.name != '' THEN score := score + 5; END IF;
    IF contractor.email IS NOT NULL AND contractor.email != '' THEN score := score + 5; END IF;
    IF contractor.phone IS NOT NULL AND contractor.phone != '' THEN score := score + 5; END IF;
    IF contractor.business_name IS NOT NULL AND contractor.business_name != '' THEN score := score + 5; END IF;
    IF contractor.business_description IS NOT NULL AND contractor.business_description != '' THEN score := score + 5; END IF;
    IF contractor.base_zip IS NOT NULL AND contractor.base_zip != '' THEN score := score + 5; END IF;

    -- Service Information (20 points)
    IF array_length(contractor.categories, 1) > 0 THEN score := score + 10; END IF;
    IF array_length(contractor.specialties, 1) > 0 THEN score := score + 5; END IF;
    IF array_length(contractor.service_area_zips, 1) > 0 THEN score := score + 5; END IF;

    -- Licensing & Insurance (25 points)
    IF contractor.license_number IS NOT NULL AND contractor.license_number != '' THEN score := score + 10; END IF;
    IF contractor.license_state IS NOT NULL AND contractor.license_state != '' THEN score := score + 5; END IF;
    IF contractor.insurance_carrier IS NOT NULL AND contractor.insurance_carrier != '' THEN score := score + 10; END IF;

    -- Pricing (15 points)
    IF contractor.rate_type IS NOT NULL THEN score := score + 5; END IF;
    IF contractor.hourly_rate IS NOT NULL OR contractor.flat_rate_min IS NOT NULL THEN score := score + 5; END IF;
    IF array_length(contractor.payment_methods, 1) > 0 THEN score := score + 5; END IF;

    -- Portfolio & Documents (10 points)
    IF EXISTS(SELECT 1 FROM pro_portfolio WHERE contractor_id = contractor.id) THEN score := score + 5; END IF;
    IF EXISTS(SELECT 1 FROM pro_documents WHERE contractor_id = contractor.id) THEN score := score + 5; END IF;

    RETURN LEAST(score, 100);
END;
$$;

-- Update profile completion score
CREATE OR REPLACE FUNCTION pro_update_completion_score()
RETURNS TRIGGER AS $$
BEGIN
    NEW.profile_completion_score := pro_calculate_completion_score(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS FOR PRO SYSTEM
-- ============================================================================

-- Updated_at triggers
CREATE TRIGGER pro_contractors_updated_at
    BEFORE UPDATE ON pro_contractors
    FOR EACH ROW EXECUTE FUNCTION pro_update_updated_at();

CREATE TRIGGER pro_kyc_data_updated_at
    BEFORE UPDATE ON pro_kyc_data
    FOR EACH ROW EXECUTE FUNCTION pro_update_updated_at();

CREATE TRIGGER pro_documents_updated_at
    BEFORE UPDATE ON pro_documents
    FOR EACH ROW EXECUTE FUNCTION pro_update_updated_at();

CREATE TRIGGER pro_portfolio_updated_at
    BEFORE UPDATE ON pro_portfolio
    FOR EACH ROW EXECUTE FUNCTION pro_update_updated_at();

CREATE TRIGGER pro_subscriptions_updated_at
    BEFORE UPDATE ON pro_subscriptions
    FOR EACH ROW EXECUTE FUNCTION pro_update_updated_at();

CREATE TRIGGER pro_references_updated_at
    BEFORE UPDATE ON pro_references
    FOR EACH ROW EXECUTE FUNCTION pro_update_updated_at();

-- Profile completion score trigger
CREATE TRIGGER pro_contractors_completion_score
    BEFORE INSERT OR UPDATE ON pro_contractors
    FOR EACH ROW EXECUTE FUNCTION pro_update_completion_score();

-- ============================================================================
-- ROW LEVEL SECURITY FOR PRO SYSTEM
-- ============================================================================

-- Enable RLS
ALTER TABLE pro_contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE pro_kyc_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE pro_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE pro_portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE pro_subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE pro_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pro_billing_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pro_references ENABLE ROW LEVEL SECURITY;

-- Pro contractors policies
CREATE POLICY "Contractors manage own profile" ON pro_contractors
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "Public can view approved contractors" ON pro_contractors
    FOR SELECT USING (status = 'approved');

-- KYC data policies (highly restricted)
CREATE POLICY "Contractors manage own KYC" ON pro_kyc_data
    FOR ALL USING (auth.uid() = contractor_id);

-- Documents policies
CREATE POLICY "Contractors manage own documents" ON pro_documents
    FOR ALL USING (auth.uid() = contractor_id);

-- Portfolio policies
CREATE POLICY "Contractors manage own portfolio" ON pro_portfolio
    FOR ALL USING (auth.uid() = contractor_id);

CREATE POLICY "Public view public portfolio" ON pro_portfolio
    FOR SELECT USING (is_public = true);

-- Subscription plans (public read)
CREATE POLICY "Anyone can view subscription plans" ON pro_subscription_plans
    FOR SELECT USING (is_active = true);

-- Subscriptions policies
CREATE POLICY "Contractors manage own subscriptions" ON pro_subscriptions
    FOR ALL USING (auth.uid() = contractor_id);

-- Billing policies
CREATE POLICY "Contractors view own billing" ON pro_billing_transactions
    FOR SELECT USING (auth.uid() = contractor_id);

-- References policies
CREATE POLICY "Contractors manage own references" ON pro_references
    FOR ALL USING (auth.uid() = contractor_id);

CREATE POLICY "Public view verified references" ON pro_references
    FOR SELECT USING (verified = true);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Pro contractors indexes
CREATE INDEX IF NOT EXISTS idx_pro_contractors_status ON pro_contractors(status);
CREATE INDEX IF NOT EXISTS idx_pro_contractors_kyc_status ON pro_contractors(kyc_status);
CREATE INDEX IF NOT EXISTS idx_pro_contractors_email ON pro_contractors(email);
CREATE INDEX IF NOT EXISTS idx_pro_contractors_categories ON pro_contractors USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_pro_contractors_service_zips ON pro_contractors USING GIN(service_area_zips);
CREATE INDEX IF NOT EXISTS idx_pro_contractors_base_zip ON pro_contractors(base_zip);
CREATE INDEX IF NOT EXISTS idx_pro_contractors_completion ON pro_contractors(profile_completion_score);

-- Documents indexes
CREATE INDEX IF NOT EXISTS idx_pro_documents_contractor ON pro_documents(contractor_id);
CREATE INDEX IF NOT EXISTS idx_pro_documents_type ON pro_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_pro_documents_status ON pro_documents(document_status);

-- Portfolio indexes
CREATE INDEX IF NOT EXISTS idx_pro_portfolio_contractor ON pro_portfolio(contractor_id);
CREATE INDEX IF NOT EXISTS idx_pro_portfolio_category ON pro_portfolio(category);
CREATE INDEX IF NOT EXISTS idx_pro_portfolio_public ON pro_portfolio(is_public) WHERE is_public = true;

-- Subscription indexes
CREATE INDEX IF NOT EXISTS idx_pro_subscriptions_contractor ON pro_subscriptions(contractor_id);
CREATE INDEX IF NOT EXISTS idx_pro_subscriptions_status ON pro_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_pro_subscriptions_stripe_sub ON pro_subscriptions(stripe_subscription_id);

-- Billing indexes
CREATE INDEX IF NOT EXISTS idx_pro_billing_contractor ON pro_billing_transactions(contractor_id);
CREATE INDEX IF NOT EXISTS idx_pro_billing_status ON pro_billing_transactions(status);
CREATE INDEX IF NOT EXISTS idx_pro_billing_date ON pro_billing_transactions(created_at);

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Insert Pro subscription plans
INSERT INTO pro_subscription_plans (name, description, price_monthly, price_yearly, features, limits)
VALUES
('Pro Monthly', 'Full Pro features - monthly billing', 49.99, NULL,
 '["Unlimited job applications", "Real-time signals", "Direct messaging", "Analytics dashboard", "Portfolio showcase", "KYC verification", "Priority support"]',
 '{"job_applications": -1, "signals_per_day": -1, "portfolio_items": 50, "document_storage_mb": 1000}'),
('Pro Yearly', 'Full Pro features - yearly billing (2 months free)', 39.99, 479.88,
 '["Unlimited job applications", "Real-time signals", "Direct messaging", "Analytics dashboard", "Portfolio showcase", "KYC verification", "Priority support", "2 months free"]',
 '{"job_applications": -1, "signals_per_day": -1, "portfolio_items": 100, "document_storage_mb": 2000}');

-- ============================================================================
-- VIEWS FOR EASY QUERYING
-- ============================================================================

-- Pro contractor profile with metrics
CREATE OR REPLACE VIEW pro_contractors_with_metrics AS
SELECT
    c.*,
    COALESCE(p.portfolio_count, 0) as portfolio_count,
    COALESCE(d.document_count, 0) as document_count,
    COALESCE(d.verified_documents, 0) as verified_documents,
    COALESCE(r.reference_count, 0) as reference_count,
    COALESCE(r.avg_rating, 0) as avg_rating
FROM pro_contractors c
LEFT JOIN (
    SELECT contractor_id, COUNT(*) as portfolio_count
    FROM pro_portfolio WHERE is_public = true
    GROUP BY contractor_id
) p ON p.contractor_id = c.id
LEFT JOIN (
    SELECT contractor_id,
           COUNT(*) as document_count,
           COUNT(CASE WHEN document_status = 'approved' THEN 1 END) as verified_documents
    FROM pro_documents
    GROUP BY contractor_id
) d ON d.contractor_id = c.id
LEFT JOIN (
    SELECT contractor_id,
           COUNT(*) as reference_count,
           AVG(rating) as avg_rating
    FROM pro_references WHERE verified = true AND rating IS NOT NULL
    GROUP BY contractor_id
) r ON r.contractor_id = c.id;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '🎉 RUSHR PRO SYSTEM INSTALLATION COMPLETE! 🎉';
    RAISE NOTICE '✅ Created completely separate Pro contractor system';
    RAISE NOTICE '✅ Zero conflicts with homeowner system';
    RAISE NOTICE '✅ Ready for Pro contractor onboarding workflow';
    RAISE NOTICE '📋 Next: Set up Supabase storage buckets';
END $$;