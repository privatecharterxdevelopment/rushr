-- =============================================================================
-- KYC DOCUMENTS SYSTEM
-- Allows homeowners and contractors to upload identity verification documents
-- Admin can review and approve/reject documents
-- =============================================================================

-- 1. CREATE ENUM TYPES (with IF NOT EXISTS equivalent using DO blocks)
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kyc_status') THEN
    CREATE TYPE kyc_status AS ENUM ('pending', 'under_review', 'verified', 'rejected');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_type') THEN
    CREATE TYPE document_type AS ENUM (
      'drivers_license',
      'passport',
      'utility_bill',
      'bank_statement',
      'id_card',
      'business_license'
    );
  END IF;
END $$;

-- 2. CREATE KYC_DOCUMENTS TABLE
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  document_url TEXT NOT NULL,
  status kyc_status DEFAULT 'pending',
  rejection_reason TEXT,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ADD INDEXES
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_kyc_documents_user_id ON kyc_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_status ON kyc_documents(status);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_created_at ON kyc_documents(created_at DESC);

-- 4. ENABLE ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------

ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;

-- Users can view their own documents
CREATE POLICY "Users can view their own KYC documents" ON kyc_documents
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own documents
CREATE POLICY "Users can upload their own KYC documents" ON kyc_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending documents (to re-upload if rejected)
CREATE POLICY "Users can update their pending documents" ON kyc_documents
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- Admins can view all documents (simplified - can be restricted later)
CREATE POLICY "Admins can view all KYC documents" ON kyc_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update all documents (for verification)
CREATE POLICY "Admins can update all KYC documents" ON kyc_documents
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 5. CREATE STORAGE BUCKET
-- -----------------------------------------------------------------------------

-- Create kyc-documents bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

-- 6. STORAGE POLICIES
-- -----------------------------------------------------------------------------

-- Allow authenticated users to upload their own documents
CREATE POLICY "Users can upload their own KYC documents to storage" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'kyc-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to view their own documents
CREATE POLICY "Users can view their own KYC documents in storage" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'kyc-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow admins to view all documents
CREATE POLICY "Admins can view all KYC documents in storage" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'kyc-documents' AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 7. CREATE TRIGGER FOR UPDATED_AT
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_kyc_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER kyc_documents_updated_at
  BEFORE UPDATE ON kyc_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_kyc_documents_updated_at();

-- 8. GRANT PERMISSIONS
-- -----------------------------------------------------------------------------

GRANT SELECT, INSERT, UPDATE ON kyc_documents TO authenticated;

-- 9. ADD COMMENTS
-- -----------------------------------------------------------------------------

COMMENT ON TABLE kyc_documents IS 'KYC identity verification documents uploaded by users';
COMMENT ON COLUMN kyc_documents.document_type IS 'Type of document: drivers_license, passport, utility_bill, bank_statement, id_card, business_license';
COMMENT ON COLUMN kyc_documents.status IS 'Verification status: pending, under_review, verified, rejected';
COMMENT ON COLUMN kyc_documents.document_url IS 'Storage URL of the uploaded document';
COMMENT ON COLUMN kyc_documents.verified_by IS 'Admin user who verified the document';

SELECT 'KYC documents system created successfully!' as status;
