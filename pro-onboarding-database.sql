-- ============================================================================
-- RUSHR PRO ONBOARDING COMPLETE DATABASE SCHEMA
-- ============================================================================
-- This creates a complete database for Pro contractor onboarding with:
-- - User profiles for both homeowners and contractors
-- - Contractor-specific profiles with business information
-- - KYC verification system with secure data storage
-- - Document management system
-- - Subscription and billing support
-- - Messaging and job management
-- - Review and rating system
-- ============================================================================

-- ============================================================================
-- EXTENSION AND SETUP
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUMS FOR TYPE SAFETY
-- ============================================================================

-- User roles
CREATE TYPE user_role AS ENUM (
    'homeowner',
    'contractor',
    'admin'
);

-- Subscription types
CREATE TYPE subscription_type AS ENUM (
    'free',
    'basic',
    'premium',
    'pro'
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

-- Job status
CREATE TYPE job_status AS ENUM (
    'new',
    'in_discussion',
    'quoted',
    'accepted',
    'in_progress',
    'completed',
    'cancelled',
    'disputed'
);

-- Message types
CREATE TYPE message_type AS ENUM (
    'text',
    'image',
    'document',
    'quote',
    'system'
);

-- ============================================================================
-- CORE USER TABLES
-- ============================================================================

-- Base user profiles table (for all users)
CREATE TABLE user_profiles (
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

-- ============================================================================
-- CONTRACTOR-SPECIFIC TABLES
-- ============================================================================

-- Contractor profiles with business information
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

-- ============================================================================
-- KYC AND VERIFICATION TABLES
-- ============================================================================

-- KYC verification data (sensitive information)
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

-- ============================================================================
-- DOCUMENT MANAGEMENT
-- ============================================================================

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

-- ============================================================================
-- BUSINESS AND PORTFOLIO
-- ============================================================================

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

-- Billing and payments
CREATE TABLE billing_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id),

    -- Transaction details
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    transaction_type TEXT CHECK (transaction_type IN ('charge', 'refund', 'credit', 'adjustment')),
    status TEXT CHECK (status IN ('pending', 'succeeded', 'failed', 'cancelled')),

    -- External payment processor data
    stripe_payment_intent_id TEXT,
    stripe_charge_id TEXT,
    payment_method_id TEXT,

    -- Invoice details
    invoice_number TEXT,
    description TEXT,
    metadata JSONB,

    -- Timestamps
    processed_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- JOB AND PROJECT MANAGEMENT
-- ============================================================================

-- Jobs posted by homeowners
CREATE TABLE jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    homeowner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Job details
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    urgency TEXT CHECK (urgency IN ('low', 'medium', 'high', 'emergency')),

    -- Location
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT NOT NULL,
    latitude DECIMAL(10, 6),
    longitude DECIMAL(11, 6),

    -- Budget and timeline
    budget_min DECIMAL(10,2),
    budget_max DECIMAL(10,2),
    timeline TEXT, -- "ASAP", "Within 1 week", etc.
    preferred_start_date DATE,
    flexible_timing BOOLEAN DEFAULT FALSE,

    -- Job requirements
    license_required BOOLEAN DEFAULT FALSE,
    insurance_required BOOLEAN DEFAULT TRUE,
    bond_required BOOLEAN DEFAULT FALSE,
    background_check_required BOOLEAN DEFAULT FALSE,

    -- Images and attachments
    images TEXT[] DEFAULT '{}',
    documents TEXT[] DEFAULT '{}',

    -- Status and visibility
    status job_status DEFAULT 'new',
    is_public BOOLEAN DEFAULT TRUE,
    featured BOOLEAN DEFAULT FALSE,

    -- Matching and notifications
    auto_match BOOLEAN DEFAULT TRUE,
    notification_radius INTEGER DEFAULT 25,
    max_contractors INTEGER DEFAULT 5,

    -- Timestamps
    posted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contractor responses to jobs
CREATE TABLE job_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    contractor_id UUID REFERENCES contractor_profiles(id) ON DELETE CASCADE,

    -- Application details
    message TEXT,
    quote_amount DECIMAL(10,2),
    quote_details TEXT,
    estimated_duration TEXT,
    can_start_date DATE,

    -- Status
    status TEXT CHECK (status IN ('applied', 'viewed', 'shortlisted', 'rejected', 'withdrawn', 'hired')),

    -- Response tracking
    homeowner_viewed BOOLEAN DEFAULT FALSE,
    homeowner_viewed_at TIMESTAMPTZ,

    -- Timestamps
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    hired_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(job_id, contractor_id)
);

-- ============================================================================
-- MESSAGING SYSTEM
-- ============================================================================

-- Conversations between users
CREATE TABLE conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    homeowner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    contractor_id UUID REFERENCES contractor_profiles(id) ON DELETE CASCADE,

    -- Conversation metadata
    subject TEXT,
    status TEXT DEFAULT 'active', -- active, archived, blocked

    -- Last message info for quick display
    last_message_at TIMESTAMPTZ,
    last_message_preview TEXT,
    last_message_sender UUID REFERENCES auth.users(id),

    -- Unread counts
    homeowner_unread_count INTEGER DEFAULT 0,
    contractor_unread_count INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(job_id, homeowner_id, contractor_id)
);

-- Individual messages within conversations
CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Message content
    message_type message_type DEFAULT 'text',
    content TEXT,
    attachments TEXT[] DEFAULT '{}',

    -- Quote-specific data (when message_type = 'quote')
    quote_data JSONB,

    -- Message status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMPTZ,

    -- System message data
    system_data JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- REVIEWS AND RATINGS
-- ============================================================================

-- Reviews (from homeowners about contractors)
CREATE TABLE reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    homeowner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    contractor_id UUID REFERENCES contractor_profiles(id) ON DELETE CASCADE,

    -- Review content
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    review_text TEXT,

    -- Detailed ratings
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    timeliness_rating INTEGER CHECK (timeliness_rating >= 1 AND timeliness_rating <= 5),
    value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),

    -- Review metadata
    would_recommend BOOLEAN,
    would_hire_again BOOLEAN,
    project_value DECIMAL(10,2),

    -- Images
    images TEXT[] DEFAULT '{}',

    -- Status and moderation
    is_published BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    moderation_status TEXT DEFAULT 'pending',
    moderation_notes TEXT,

    -- Response from contractor
    contractor_response TEXT,
    contractor_responded_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(job_id, homeowner_id, contractor_id)
);

-- ============================================================================
-- SIGNALS AND NOTIFICATIONS
-- ============================================================================

-- Signal types and sources
CREATE TABLE signal_sources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL, -- 'permit', 'violation', 'inspection', 'listing', etc.
    url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Signals (opportunities for contractors)
CREATE TABLE signals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source_id UUID REFERENCES signal_sources(id),

    -- Signal content
    title TEXT NOT NULL,
    description TEXT,
    signal_type TEXT NOT NULL,
    category TEXT,

    -- Location
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    latitude DECIMAL(10, 6),
    longitude DECIMAL(11, 6),

    -- Signal metadata
    external_id TEXT, -- ID from external source
    estimated_value DECIMAL(10,2),
    urgency_score INTEGER DEFAULT 50, -- 0-100

    -- Raw data
    raw_data JSONB,
    source_url TEXT,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ,

    -- Timestamps
    signal_date TIMESTAMPTZ, -- When the signal occurred
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contractor signal subscriptions
CREATE TABLE contractor_signal_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contractor_id UUID REFERENCES contractor_profiles(id) ON DELETE CASCADE,

    -- Subscription parameters
    categories TEXT[] DEFAULT '{}',
    zip_codes TEXT[] DEFAULT '{}',
    radius_miles INTEGER DEFAULT 25,
    center_zip TEXT,

    -- Filters
    min_estimated_value DECIMAL(10,2),
    max_estimated_value DECIMAL(10,2),
    urgency_threshold INTEGER DEFAULT 30,
    signal_types TEXT[] DEFAULT '{}',

    -- Notification preferences
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    push_notifications BOOLEAN DEFAULT TRUE,
    notification_frequency TEXT DEFAULT 'immediate', -- immediate, daily, weekly

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ANALYTICS AND TRACKING
-- ============================================================================

-- User activity tracking
CREATE TABLE user_activity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Activity details
    activity_type TEXT NOT NULL,
    activity_data JSONB,

    -- Context
    page_url TEXT,
    referrer TEXT,
    user_agent TEXT,
    ip_address INET,

    -- Session tracking
    session_id TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Business metrics and KPIs
CREATE TABLE business_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contractor_id UUID REFERENCES contractor_profiles(id) ON DELETE CASCADE,

    -- Time period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    period_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'

    -- Job metrics
    jobs_applied INTEGER DEFAULT 0,
    jobs_viewed INTEGER DEFAULT 0,
    jobs_shortlisted INTEGER DEFAULT 0,
    jobs_won INTEGER DEFAULT 0,
    jobs_completed INTEGER DEFAULT 0,

    -- Response metrics
    avg_response_time_minutes DECIMAL(8,2),
    response_rate DECIMAL(5,2), -- Percentage

    -- Financial metrics
    total_quoted DECIMAL(12,2) DEFAULT 0,
    total_earned DECIMAL(12,2) DEFAULT 0,
    avg_job_value DECIMAL(10,2),

    -- Rating metrics
    avg_rating DECIMAL(3,2),
    total_reviews INTEGER DEFAULT 0,

    -- Signal metrics
    signals_received INTEGER DEFAULT 0,
    signals_acted_on INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(contractor_id, period_start, period_end, period_type)
);

-- ============================================================================
-- TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create updated_at triggers for all relevant tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contractor_profiles_updated_at BEFORE UPDATE ON contractor_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contractor_kyc_data_updated_at BEFORE UPDATE ON contractor_kyc_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contractor_documents_updated_at BEFORE UPDATE ON contractor_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contractor_portfolio_updated_at BEFORE UPDATE ON contractor_portfolio FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create user profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY definer SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, name, role, subscription_type)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'homeowner')::user_role,
        CASE
            WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'homeowner') = 'contractor' THEN 'pro'::subscription_type
            ELSE 'free'::subscription_type
        END
    );
    RETURN NEW;
END;
$$;

-- Trigger to call the function when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update conversation last message info
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE conversations SET
        last_message_at = NEW.created_at,
        last_message_preview = LEFT(NEW.content, 100),
        last_message_sender = NEW.sender_id,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;

    -- Update unread counts
    UPDATE conversations SET
        homeowner_unread_count = CASE
            WHEN NEW.sender_id != homeowner_id THEN homeowner_unread_count + 1
            ELSE homeowner_unread_count
        END,
        contractor_unread_count = CASE
            WHEN NEW.sender_id != contractor_id THEN contractor_unread_count + 1
            ELSE contractor_unread_count
        END
    WHERE id = NEW.conversation_id;

    RETURN NEW;
END;
$$;

-- Trigger for updating conversation info on new message
CREATE TRIGGER update_conversation_on_message
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_kyc_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_signal_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_metrics ENABLE ROW LEVEL SECURITY;

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
CREATE POLICY "Contractors can manage their own documents" ON contractor_documents FOR ALL USING (
    contractor_id = auth.uid()
);

-- Portfolio policies
CREATE POLICY "Contractors can manage their own portfolio" ON contractor_portfolio FOR ALL USING (
    contractor_id = auth.uid()
);
CREATE POLICY "Public can view public portfolio items" ON contractor_portfolio FOR SELECT USING (is_public = true);

-- Job policies
CREATE POLICY "Homeowners can manage their own jobs" ON jobs FOR ALL USING (homeowner_id = auth.uid());
CREATE POLICY "Public can view active jobs" ON jobs FOR SELECT USING (is_public = true AND status NOT IN ('cancelled', 'completed'));

-- Job application policies
CREATE POLICY "Contractors can manage their own applications" ON job_applications
    FOR ALL USING (contractor_id = auth.uid());
CREATE POLICY "Homeowners can view applications for their jobs" ON job_applications
    FOR SELECT USING (
        job_id IN (SELECT id FROM jobs WHERE homeowner_id = auth.uid())
    );

-- Conversation policies
CREATE POLICY "Users can access their own conversations" ON conversations FOR ALL USING (
    homeowner_id = auth.uid() OR contractor_id = auth.uid()
);

-- Message policies
CREATE POLICY "Users can access messages in their conversations" ON messages FOR ALL USING (
    conversation_id IN (
        SELECT id FROM conversations
        WHERE homeowner_id = auth.uid() OR contractor_id = auth.uid()
    )
);

-- Review policies
CREATE POLICY "Users can manage reviews they wrote" ON reviews FOR ALL USING (homeowner_id = auth.uid());
CREATE POLICY "Contractors can view reviews about them" ON reviews FOR SELECT USING (contractor_id = auth.uid());
CREATE POLICY "Public can view published reviews" ON reviews FOR SELECT USING (is_published = true);

-- Subscription and billing policies
CREATE POLICY "Users can manage their own subscriptions" ON user_subscriptions FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can view their own billing transactions" ON billing_transactions FOR SELECT USING (user_id = auth.uid());

-- Activity and analytics policies
CREATE POLICY "Users can view their own activity" ON user_activity FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Contractors can view their own metrics" ON business_metrics FOR SELECT USING (contractor_id = auth.uid());

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User profiles indexes
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_subscription_type ON user_profiles(subscription_type);

-- Contractor profiles indexes
CREATE INDEX idx_contractor_profiles_status ON contractor_profiles(status);
CREATE INDEX idx_contractor_profiles_kyc_status ON contractor_profiles(kyc_status);
CREATE INDEX idx_contractor_profiles_categories ON contractor_profiles USING GIN(categories);
CREATE INDEX idx_contractor_profiles_service_area_zips ON contractor_profiles USING GIN(service_area_zips);
CREATE INDEX idx_contractor_profiles_base_zip ON contractor_profiles(base_zip);
CREATE INDEX idx_contractor_profiles_license_expires ON contractor_profiles(license_expires);
CREATE INDEX idx_contractor_profiles_insurance_expires ON contractor_profiles(insurance_expires);

-- Jobs indexes
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_category ON jobs(category);
CREATE INDEX idx_jobs_zip_code ON jobs(zip_code);
CREATE INDEX idx_jobs_posted_at ON jobs(posted_at DESC);
CREATE INDEX idx_jobs_location ON jobs(latitude, longitude);
CREATE INDEX idx_jobs_budget ON jobs(budget_min, budget_max);

-- Signal indexes
CREATE INDEX idx_signals_zip_code ON signals(zip_code);
CREATE INDEX idx_signals_category ON signals(category);
CREATE INDEX idx_signals_signal_date ON signals(signal_date DESC);
CREATE INDEX idx_signals_location ON signals(latitude, longitude);
CREATE INDEX idx_signals_active ON signals(is_active) WHERE is_active = true;

-- Message and conversation indexes
CREATE INDEX idx_conversations_homeowner ON conversations(homeowner_id);
CREATE INDEX idx_conversations_contractor ON conversations(contractor_id);
CREATE INDEX idx_conversations_job ON conversations(job_id);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Document indexes
CREATE INDEX idx_contractor_documents_contractor ON contractor_documents(contractor_id);
CREATE INDEX idx_contractor_documents_type ON contractor_documents(document_type);
CREATE INDEX idx_contractor_documents_status ON contractor_documents(document_status);

-- Review indexes
CREATE INDEX idx_reviews_contractor ON reviews(contractor_id);
CREATE INDEX idx_reviews_homeowner ON reviews(homeowner_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);

-- Activity indexes
CREATE INDEX idx_user_activity_user ON user_activity(user_id);
CREATE INDEX idx_user_activity_type ON user_activity(activity_type);
CREATE INDEX idx_user_activity_created_at ON user_activity(created_at DESC);

-- ============================================================================
-- SAMPLE DATA (OPTIONAL - FOR DEVELOPMENT)
-- ============================================================================

-- Insert sample subscription plans
INSERT INTO subscription_plans (name, description, type, price_monthly, price_yearly, features, limits) VALUES
('Free Plan', 'Basic features for getting started', 'free', 0.00, 0.00,
 '["Basic profile", "Limited job applications", "Community support"]',
 '{"job_applications_per_month": 5, "signals_per_day": 10}'),
('Pro Plan', 'Full contractor features', 'pro', 49.99, 499.99,
 '["Full profile", "Unlimited job applications", "Real-time signals", "Direct messaging", "Analytics"]',
 '{"job_applications_per_month": -1, "signals_per_day": -1}');

-- Insert sample signal sources
INSERT INTO signal_sources (name, description, type, is_active) VALUES
('NYC DOB', 'New York City Department of Buildings', 'permit', true),
('Property Records', 'Real estate transaction data', 'listing', true),
('Violation Database', 'Building violation reports', 'violation', true);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for contractor profile with metrics
CREATE VIEW contractor_profiles_with_metrics AS
SELECT
    cp.*,
    COALESCE(AVG(r.rating), 0) as avg_rating,
    COUNT(r.id) as total_reviews,
    COUNT(CASE WHEN r.would_recommend = true THEN 1 END) as recommendations,
    COUNT(p.id) as portfolio_count
FROM contractor_profiles cp
LEFT JOIN reviews r ON r.contractor_id = cp.id AND r.is_published = true
LEFT JOIN contractor_portfolio p ON p.contractor_id = cp.id AND p.is_public = true
GROUP BY cp.id;

-- View for active jobs with application counts
CREATE VIEW jobs_with_stats AS
SELECT
    j.*,
    COUNT(ja.id) as application_count,
    AVG(ja.quote_amount) as avg_quote
FROM jobs j
LEFT JOIN job_applications ja ON ja.job_id = j.id
WHERE j.status IN ('new', 'in_discussion')
GROUP BY j.id;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

-- Add a comment to mark completion
COMMENT ON SCHEMA public IS 'Rushr Pro Onboarding Database Schema - Complete installation completed successfully';

-- Log the completion
DO $$
BEGIN
    RAISE NOTICE 'Rushr Pro Onboarding Database Schema installation completed successfully!';
    RAISE NOTICE 'Created % tables with full RLS policies and indexes',
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name NOT LIKE 'pg_%');
END $$;