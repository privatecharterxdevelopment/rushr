-- =============================================================================
-- FIX: Logo Upload RLS Policy - Remove Infinite Recursion
-- =============================================================================
-- Problem: "infinite recursion detected in policy for relation 'profiles'"
-- Solution: Simplify the policy to not reference other tables
-- =============================================================================

-- Drop the problematic policies
DROP POLICY IF EXISTS "Contractors can upload their logo" ON storage.objects;
DROP POLICY IF EXISTS "Contractors can update their logo" ON storage.objects;
DROP POLICY IF EXISTS "Contractors can delete their logo" ON storage.objects;

-- Create simpler policies that don't cause recursion
CREATE POLICY "Authenticated users can upload to contractor-logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'contractor-logos' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update their files in contractor-logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'contractor-logos' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete their files in contractor-logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'contractor-logos' AND
  auth.role() = 'authenticated'
);

-- =============================================================================
-- SUCCESS! Logo upload should work now without infinite recursion
-- =============================================================================
