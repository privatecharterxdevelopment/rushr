-- Create pro_early_access_waitlist table for contractor early access signups
CREATE TABLE IF NOT EXISTS pro_early_access_waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notified BOOLEAN DEFAULT FALSE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_early_access_email ON pro_early_access_waitlist(email);
CREATE INDEX IF NOT EXISTS idx_early_access_created ON pro_early_access_waitlist(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_early_access_notified ON pro_early_access_waitlist(notified);

-- Enable Row Level Security
ALTER TABLE pro_early_access_waitlist ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public inserts (for the early access form)
CREATE POLICY "Allow public inserts" ON pro_early_access_waitlist
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Allow authenticated users to read their own entry
CREATE POLICY "Allow users to read own entry" ON pro_early_access_waitlist
  FOR SELECT
  TO authenticated
  USING (email = auth.jwt()->>'email');

-- Policy: Allow service role full access (for admin)
CREATE POLICY "Service role has full access" ON pro_early_access_waitlist
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add comment to table
COMMENT ON TABLE pro_early_access_waitlist IS 'Stores contractor early access waitlist signups for Rushr Pro';
