-- ============================================================================
-- CREATE PRO STORAGE BUCKETS
-- ============================================================================
-- Run this SQL directly in your Supabase SQL editor to create the missing buckets
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

-- 3. Pro Avatar/Profile Photos Storage
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

-- 4. Pro Business Assets Storage (logos, banners, etc.)
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

-- Pro Documents (Private) - Only contractors can access their own documents
CREATE POLICY "Pro contractors can upload their own documents" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'pro-documents' AND
    (auth.uid()::text = (storage.foldername(name))[1])
);

CREATE POLICY "Pro contractors can view their own documents" ON storage.objects FOR SELECT USING (
    bucket_id = 'pro-documents' AND
    (auth.uid()::text = (storage.foldername(name))[1])
);

CREATE POLICY "Pro contractors can update their own documents" ON storage.objects FOR UPDATE USING (
    bucket_id = 'pro-documents' AND
    (auth.uid()::text = (storage.foldername(name))[1])
);

CREATE POLICY "Pro contractors can delete their own documents" ON storage.objects FOR DELETE USING (
    bucket_id = 'pro-documents' AND
    (auth.uid()::text = (storage.foldername(name))[1])
);

-- Pro Portfolio (Public) - Contractors can manage, everyone can view
CREATE POLICY "Pro contractors can upload portfolio items" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'pro-portfolio' AND
    (auth.uid()::text = (storage.foldername(name))[1])
);

CREATE POLICY "Everyone can view portfolio items" ON storage.objects FOR SELECT USING (
    bucket_id = 'pro-portfolio'
);

CREATE POLICY "Pro contractors can update their portfolio items" ON storage.objects FOR UPDATE USING (
    bucket_id = 'pro-portfolio' AND
    (auth.uid()::text = (storage.foldername(name))[1])
);

CREATE POLICY "Pro contractors can delete their portfolio items" ON storage.objects FOR DELETE USING (
    bucket_id = 'pro-portfolio' AND
    (auth.uid()::text = (storage.foldername(name))[1])
);

-- Pro Avatars (Public) - Contractors can manage, everyone can view
CREATE POLICY "Pro contractors can upload avatars" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'pro-avatars' AND
    (auth.uid()::text = (storage.foldername(name))[1])
);

CREATE POLICY "Everyone can view avatars" ON storage.objects FOR SELECT USING (
    bucket_id = 'pro-avatars'
);

CREATE POLICY "Pro contractors can update their avatars" ON storage.objects FOR UPDATE USING (
    bucket_id = 'pro-avatars' AND
    (auth.uid()::text = (storage.foldername(name))[1])
);

CREATE POLICY "Pro contractors can delete their avatars" ON storage.objects FOR DELETE USING (
    bucket_id = 'pro-avatars' AND
    (auth.uid()::text = (storage.foldername(name))[1])
);

-- Pro Business Assets (Public) - Contractors can manage, everyone can view
CREATE POLICY "Pro contractors can upload business assets" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'pro-business' AND
    (auth.uid()::text = (storage.foldername(name))[1])
);

CREATE POLICY "Everyone can view business assets" ON storage.objects FOR SELECT USING (
    bucket_id = 'pro-business'
);

CREATE POLICY "Pro contractors can update their business assets" ON storage.objects FOR UPDATE USING (
    bucket_id = 'pro-business' AND
    (auth.uid()::text = (storage.foldername(name))[1])
);

CREATE POLICY "Pro contractors can delete their business assets" ON storage.objects FOR DELETE USING (
    bucket_id = 'pro-business' AND
    (auth.uid()::text = (storage.foldername(name))[1])
);