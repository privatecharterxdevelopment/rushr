-- ============================================================================
-- RUSHR PRO STORAGE BUCKETS SETUP
-- ============================================================================
-- Creates dedicated storage buckets for the Pro contractor system
-- Completely separate from homeowner file storage
-- ============================================================================

-- ============================================================================
-- PRO STORAGE BUCKETS
-- ============================================================================

-- 1. Pro Documents Storage (KYC, licenses, insurance, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'pro-documents',
    'pro-documents',
    false, -- Private bucket - documents are sensitive
    10485760, -- 10MB limit per file
    ARRAY[
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf',
        'image/heic',
        'image/heif'
    ]
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Pro Portfolio Storage (project photos, videos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'pro-portfolio',
    'pro-portfolio',
    true, -- Public bucket - portfolio items are meant to be seen
    52428800, -- 50MB limit per file (for high-quality project photos)
    ARRAY[
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/heic',
        'image/heif',
        'video/mp4',
        'video/webm',
        'video/quicktime'
    ]
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. Pro Avatars Storage (contractor profile photos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'pro-avatars',
    'pro-avatars',
    true, -- Public bucket - profile photos are public
    5242880, -- 5MB limit per file
    ARRAY[
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/heic',
        'image/heif'
    ]
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 4. Pro Business Assets Storage (logos, business photos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'pro-business',
    'pro-business',
    true, -- Public bucket - business assets are public
    10485760, -- 10MB limit per file
    ARRAY[
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/svg+xml',
        'image/heic',
        'image/heif'
    ]
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- STORAGE POLICIES FOR PRO BUCKETS
-- ============================================================================

-- PRO DOCUMENTS POLICIES (PRIVATE - highly restricted)
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Contractors can upload own documents" ON storage.objects;
DROP POLICY IF EXISTS "Contractors can view own documents" ON storage.objects;
DROP POLICY IF EXISTS "Contractors can update own documents" ON storage.objects;
DROP POLICY IF EXISTS "Contractors can delete own documents" ON storage.objects;

-- Only contractors can upload their own documents
CREATE POLICY "Contractors can upload own documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'pro-documents' AND
        auth.uid()::text = (storage.foldername(name))[1] AND
        auth.uid() IN (SELECT id FROM pro_contractors)
    );

-- Only contractors can view their own documents
CREATE POLICY "Contractors can view own documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'pro-documents' AND
        auth.uid()::text = (storage.foldername(name))[1] AND
        auth.uid() IN (SELECT id FROM pro_contractors)
    );

-- Only contractors can update their own documents
CREATE POLICY "Contractors can update own documents" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'pro-documents' AND
        auth.uid()::text = (storage.foldername(name))[1] AND
        auth.uid() IN (SELECT id FROM pro_contractors)
    );

-- Only contractors can delete their own documents
CREATE POLICY "Contractors can delete own documents" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'pro-documents' AND
        auth.uid()::text = (storage.foldername(name))[1] AND
        auth.uid() IN (SELECT id FROM pro_contractors)
    );

-- PRO PORTFOLIO POLICIES (PUBLIC - but controlled uploads)
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Contractors can upload own portfolio" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view portfolio" ON storage.objects;
DROP POLICY IF EXISTS "Contractors can update own portfolio" ON storage.objects;
DROP POLICY IF EXISTS "Contractors can delete own portfolio" ON storage.objects;

-- Only contractors can upload to their own portfolio folder
CREATE POLICY "Contractors can upload own portfolio" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'pro-portfolio' AND
        auth.uid()::text = (storage.foldername(name))[1] AND
        auth.uid() IN (SELECT id FROM pro_contractors)
    );

-- Anyone can view portfolio items (public bucket)
CREATE POLICY "Anyone can view portfolio" ON storage.objects
    FOR SELECT USING (bucket_id = 'pro-portfolio');

-- Only contractors can update their own portfolio
CREATE POLICY "Contractors can update own portfolio" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'pro-portfolio' AND
        auth.uid()::text = (storage.foldername(name))[1] AND
        auth.uid() IN (SELECT id FROM pro_contractors)
    );

-- Only contractors can delete their own portfolio
CREATE POLICY "Contractors can delete own portfolio" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'pro-portfolio' AND
        auth.uid()::text = (storage.foldername(name))[1] AND
        auth.uid() IN (SELECT id FROM pro_contractors)
    );

-- PRO AVATARS POLICIES (PUBLIC)
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Contractors can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Contractors can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Contractors can delete own avatar" ON storage.objects;

-- Only contractors can upload their own avatar
CREATE POLICY "Contractors can upload own avatar" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'pro-avatars' AND
        auth.uid()::text = (storage.foldername(name))[1] AND
        auth.uid() IN (SELECT id FROM pro_contractors)
    );

-- Anyone can view avatars (public bucket)
CREATE POLICY "Anyone can view avatars" ON storage.objects
    FOR SELECT USING (bucket_id = 'pro-avatars');

-- Only contractors can update their own avatar
CREATE POLICY "Contractors can update own avatar" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'pro-avatars' AND
        auth.uid()::text = (storage.foldername(name))[1] AND
        auth.uid() IN (SELECT id FROM pro_contractors)
    );

-- Only contractors can delete their own avatar
CREATE POLICY "Contractors can delete own avatar" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'pro-avatars' AND
        auth.uid()::text = (storage.foldername(name))[1] AND
        auth.uid() IN (SELECT id FROM pro_contractors)
    );

-- PRO BUSINESS ASSETS POLICIES (PUBLIC)
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Contractors can upload own business assets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view business assets" ON storage.objects;
DROP POLICY IF EXISTS "Contractors can update own business assets" ON storage.objects;
DROP POLICY IF EXISTS "Contractors can delete own business assets" ON storage.objects;

-- Only contractors can upload their own business assets
CREATE POLICY "Contractors can upload own business assets" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'pro-business' AND
        auth.uid()::text = (storage.foldername(name))[1] AND
        auth.uid() IN (SELECT id FROM pro_contractors)
    );

-- Anyone can view business assets (public bucket)
CREATE POLICY "Anyone can view business assets" ON storage.objects
    FOR SELECT USING (bucket_id = 'pro-business');

-- Only contractors can update their own business assets
CREATE POLICY "Contractors can update own business assets" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'pro-business' AND
        auth.uid()::text = (storage.foldername(name))[1] AND
        auth.uid() IN (SELECT id FROM pro_contractors)
    );

-- Only contractors can delete their own business assets
CREATE POLICY "Contractors can delete own business assets" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'pro-business' AND
        auth.uid()::text = (storage.foldername(name))[1] AND
        auth.uid() IN (SELECT id FROM pro_contractors)
    );

-- ============================================================================
-- HELPER FUNCTIONS FOR FILE MANAGEMENT
-- ============================================================================

-- Function to generate secure file paths for contractors
CREATE OR REPLACE FUNCTION pro_generate_file_path(
    contractor_id UUID,
    bucket_name TEXT,
    file_type TEXT,
    file_extension TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY definer
AS $$
DECLARE
    timestamp_str TEXT;
    random_str TEXT;
    file_path TEXT;
BEGIN
    -- Generate timestamp
    timestamp_str := to_char(NOW(), 'YYYY/MM/DD');

    -- Generate random string for uniqueness
    random_str := encode(gen_random_bytes(8), 'hex');

    -- Construct path: contractor_id/YYYY/MM/DD/file_type_random.ext
    file_path := contractor_id::text || '/' || timestamp_str || '/' || file_type || '_' || random_str || '.' || file_extension;

    RETURN file_path;
END;
$$;

-- Function to get public URL for portfolio items
CREATE OR REPLACE FUNCTION pro_get_public_url(
    bucket_name TEXT,
    file_path TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY definer
AS $$
BEGIN
    -- Return the public URL for the file
    RETURN 'https://your-project.supabase.co/storage/v1/object/public/' || bucket_name || '/' || file_path;
END;
$$;

-- Function to validate file upload permissions
CREATE OR REPLACE FUNCTION pro_can_upload_file(
    contractor_id UUID,
    bucket_name TEXT,
    file_size INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY definer
AS $$
DECLARE
    contractor_exists BOOLEAN;
    current_usage BIGINT;
    storage_limit BIGINT;
BEGIN
    -- Check if contractor exists and is approved
    SELECT EXISTS(
        SELECT 1 FROM pro_contractors
        WHERE id = contractor_id
        AND status IN ('approved', 'pending')
    ) INTO contractor_exists;

    IF NOT contractor_exists THEN
        RETURN FALSE;
    END IF;

    -- Get current storage usage for contractor
    SELECT COALESCE(SUM((metadata->>'size')::bigint), 0)
    FROM storage.objects
    WHERE bucket_id LIKE 'pro-%'
    AND name LIKE contractor_id::text || '/%'
    INTO current_usage;

    -- Set storage limit based on subscription (simplified - 1GB for now)
    storage_limit := 1073741824; -- 1GB in bytes

    -- Check if adding this file would exceed limit
    IF (current_usage + file_size) > storage_limit THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$;

-- ============================================================================
-- STORAGE USAGE TRACKING
-- ============================================================================

-- Table to track storage usage per contractor
CREATE TABLE IF NOT EXISTS pro_storage_usage (
    contractor_id UUID REFERENCES pro_contractors(id) ON DELETE CASCADE PRIMARY KEY,
    documents_size BIGINT DEFAULT 0,
    portfolio_size BIGINT DEFAULT 0,
    avatars_size BIGINT DEFAULT 0,
    business_size BIGINT DEFAULT 0,
    total_size BIGINT DEFAULT 0,
    last_calculated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to recalculate storage usage for a contractor
CREATE OR REPLACE FUNCTION pro_recalculate_storage_usage(contractor_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY definer
AS $$
DECLARE
    docs_size BIGINT := 0;
    portfolio_size BIGINT := 0;
    avatars_size BIGINT := 0;
    business_size BIGINT := 0;
    total_size BIGINT := 0;
BEGIN
    -- Calculate documents storage
    SELECT COALESCE(SUM((metadata->>'size')::bigint), 0)
    FROM storage.objects
    WHERE bucket_id = 'pro-documents' AND name LIKE contractor_id::text || '/%'
    INTO docs_size;

    -- Calculate portfolio storage
    SELECT COALESCE(SUM((metadata->>'size')::bigint), 0)
    FROM storage.objects
    WHERE bucket_id = 'pro-portfolio' AND name LIKE contractor_id::text || '/%'
    INTO portfolio_size;

    -- Calculate avatars storage
    SELECT COALESCE(SUM((metadata->>'size')::bigint), 0)
    FROM storage.objects
    WHERE bucket_id = 'pro-avatars' AND name LIKE contractor_id::text || '/%'
    INTO avatars_size;

    -- Calculate business assets storage
    SELECT COALESCE(SUM((metadata->>'size')::bigint), 0)
    FROM storage.objects
    WHERE bucket_id = 'pro-business' AND name LIKE contractor_id::text || '/%'
    INTO business_size;

    total_size := docs_size + portfolio_size + avatars_size + business_size;

    -- Update or insert usage record
    INSERT INTO pro_storage_usage (
        contractor_id,
        documents_size,
        portfolio_size,
        avatars_size,
        business_size,
        total_size,
        last_calculated,
        updated_at
    )
    VALUES (
        contractor_id,
        docs_size,
        portfolio_size,
        avatars_size,
        business_size,
        total_size,
        NOW(),
        NOW()
    )
    ON CONFLICT (contractor_id) DO UPDATE SET
        documents_size = EXCLUDED.documents_size,
        portfolio_size = EXCLUDED.portfolio_size,
        avatars_size = EXCLUDED.avatars_size,
        business_size = EXCLUDED.business_size,
        total_size = EXCLUDED.total_size,
        last_calculated = NOW(),
        updated_at = NOW();
END;
$$;

-- ============================================================================
-- STORAGE POLICIES ENABLE
-- ============================================================================

-- Enable RLS on storage usage table
ALTER TABLE pro_storage_usage ENABLE ROW LEVEL SECURITY;

-- Storage usage policies
DROP POLICY IF EXISTS "Contractors can view own storage usage" ON pro_storage_usage;
CREATE POLICY "Contractors can view own storage usage" ON pro_storage_usage
    FOR SELECT USING (auth.uid() = contractor_id);

-- ============================================================================
-- INDEXES FOR STORAGE PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_pro_storage_usage_contractor ON pro_storage_usage(contractor_id);
CREATE INDEX IF NOT EXISTS idx_pro_storage_usage_total_size ON pro_storage_usage(total_size);

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '🗂️  PRO STORAGE BUCKETS SETUP COMPLETE! 🗂️';
    RAISE NOTICE '✅ Created 4 Pro storage buckets:';
    RAISE NOTICE '   📁 pro-documents (private) - KYC, licenses, insurance';
    RAISE NOTICE '   📁 pro-portfolio (public) - project photos & videos';
    RAISE NOTICE '   📁 pro-avatars (public) - contractor profile photos';
    RAISE NOTICE '   📁 pro-business (public) - logos, business assets';
    RAISE NOTICE '✅ Configured security policies for each bucket';
    RAISE NOTICE '✅ Added storage usage tracking and limits';
    RAISE NOTICE '🔒 Private documents secured with contractor-only access';
    RAISE NOTICE '🌐 Public assets available for portfolio display';
END $$;