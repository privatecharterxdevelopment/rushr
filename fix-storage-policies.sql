-- ============================================================================
-- FIX STORAGE POLICIES - REMOVE INFINITE RECURSION
-- ============================================================================
-- Run this in Supabase SQL Editor to fix the storage bucket policies

-- Drop ALL existing policies on storage.objects to clean slate
DROP POLICY IF EXISTS "Contractors can upload their own logos" ON storage.objects;
DROP POLICY IF EXISTS "Contractors can update their own logos" ON storage.objects;
DROP POLICY IF EXISTS "Contractors can delete their own logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view contractor logos" ON storage.objects;

-- Also drop any other policies that might be causing issues
DROP POLICY IF EXISTS "Users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their files" ON storage.objects;
DROP POLICY IF EXISTS "Public read access" ON storage.objects;

-- Create contractor-logos bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contractor-logos',
  'contractor-logos',
  true, -- Public bucket
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

-- ============================================================================
-- NEW SIMPLE POLICIES (NO RECURSION)
-- ============================================================================

-- Allow any authenticated user to upload to their own folder
CREATE POLICY "Auth users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'contractor-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow any authenticated user to update their own files
CREATE POLICY "Auth users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'contractor-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow any authenticated user to delete their own files
CREATE POLICY "Auth users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'contractor-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow EVERYONE (authenticated AND anonymous) to view all logos
CREATE POLICY "Public can view all logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'contractor-logos');

SELECT 'Storage policies fixed!' as status;
