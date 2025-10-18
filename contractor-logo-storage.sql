-- ============================================================================
-- CONTRACTOR LOGO STORAGE BUCKET
-- ============================================================================
-- Creates Supabase storage bucket for contractor business logos
-- ============================================================================

-- Create the contractor-logos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contractor-logos',
  'contractor-logos',
  true, -- Public bucket so logos can be displayed
  5242880, -- 5MB file size limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE POLICIES FOR CONTRACTOR LOGOS
-- ============================================================================

-- Allow contractors to upload their own logos
CREATE POLICY "Contractors can upload their own logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'contractor-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow contractors to update their own logos
CREATE POLICY "Contractors can update their own logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'contractor-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow contractors to delete their own logos
CREATE POLICY "Contractors can delete their own logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'contractor-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow everyone to view logos (public bucket)
CREATE POLICY "Anyone can view contractor logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'contractor-logos');

SELECT 'Contractor logo storage bucket created successfully!' as status;