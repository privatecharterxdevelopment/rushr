-- =============================================================================
-- CONTACT FORM SUBMISSIONS TABLE
-- Stores contact form submissions from users for support
-- =============================================================================

-- 1. CREATE TABLE
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('Homeowner', 'Contractor', 'Other')),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
  admin_notes TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ADD INDEXES
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_contact_submissions_email ON contact_submissions(email);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_submitted_at ON contact_submissions(submitted_at DESC);

-- 3. ENABLE ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------

ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Public can insert (submit contact forms)
CREATE POLICY "Anyone can submit contact form" ON contact_submissions
  FOR INSERT WITH CHECK (true);

-- Only admins can view
CREATE POLICY "Admins can view all submissions" ON contact_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can update
CREATE POLICY "Admins can update submissions" ON contact_submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4. CREATE TRIGGER FOR UPDATED_AT
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_contact_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contact_submissions_updated_at
  BEFORE UPDATE ON contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_submissions_updated_at();

-- 5. GRANT PERMISSIONS
-- -----------------------------------------------------------------------------

GRANT SELECT, INSERT ON contact_submissions TO anon;
GRANT SELECT, INSERT, UPDATE ON contact_submissions TO authenticated;

-- 6. ADD COMMENTS
-- -----------------------------------------------------------------------------

COMMENT ON TABLE contact_submissions IS 'Contact form submissions from users requesting support';
COMMENT ON COLUMN contact_submissions.role IS 'User role: Homeowner, Contractor, or Other';
COMMENT ON COLUMN contact_submissions.status IS 'Status: new, in_progress, resolved, closed';
COMMENT ON COLUMN contact_submissions.admin_notes IS 'Internal notes from admin handling the request';

SELECT 'Contact submissions table created successfully!' as status;
