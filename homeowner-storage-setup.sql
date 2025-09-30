-- ============================================================================
-- HOMEOWNER STORAGE BUCKETS SETUP
-- ============================================================================
-- Creates storage buckets for homeowners (separate from pro contractors)
-- ============================================================================

-- 1. Homeowner Avatars Storage (profile photos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
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

-- 2. Homeowner Job Photos Storage (job posting photos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'job-photos',
    'job-photos',
    true, -- Public bucket - job photos are meant to be seen by contractors
    10485760, -- 10MB limit per file
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

-- ============================================================================
-- STORAGE POLICIES FOR HOMEOWNER BUCKETS
-- ============================================================================

-- AVATARS POLICIES (PUBLIC)
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;

-- Users can upload their own avatar
CREATE POLICY "Users can upload own avatar" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Anyone can view avatars (public bucket)
CREATE POLICY "Anyone can view avatars" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

-- Users can update their own avatar
CREATE POLICY "Users can update own avatar" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can delete their own avatar
CREATE POLICY "Users can delete own avatar" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- JOB PHOTOS POLICIES (PUBLIC)
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Homeowners can upload job photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view job photos" ON storage.objects;
DROP POLICY IF EXISTS "Homeowners can update job photos" ON storage.objects;
DROP POLICY IF EXISTS "Homeowners can delete job photos" ON storage.objects;

-- Homeowners can upload their own job photos
CREATE POLICY "Homeowners can upload job photos" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'job-photos' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Anyone can view job photos (public bucket)
CREATE POLICY "Anyone can view job photos" ON storage.objects
    FOR SELECT USING (bucket_id = 'job-photos');

-- Homeowners can update their own job photos
CREATE POLICY "Homeowners can update job photos" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'job-photos' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Homeowners can delete their own job photos
CREATE POLICY "Homeowners can delete job photos" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'job-photos' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '🏠 HOMEOWNER STORAGE BUCKETS SETUP COMPLETE! 🏠';
    RAISE NOTICE '✅ Created 2 Homeowner storage buckets:';
    RAISE NOTICE '   📁 avatars (public) - user profile photos';
    RAISE NOTICE '   📁 job-photos (public) - job posting photos';
    RAISE NOTICE '✅ Configured security policies for each bucket';
    RAISE NOTICE '🌐 All buckets are public for easy access';
END $$;