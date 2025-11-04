-- ============================================================================
-- SAVED ADDRESSES TABLE
-- ============================================================================
-- Purpose: Allow homeowners to save multiple addresses for quick job posting
-- ============================================================================

CREATE TABLE IF NOT EXISTS saved_addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Address details
  address TEXT NOT NULL,
  name TEXT,  -- Label like "Home", "Work", "Mom's House"
  tags TEXT,  -- Comma-separated tags
  instructions TEXT,  -- Special instructions for contractors

  -- Geocoding data
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Metadata
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure user can't have duplicate addresses
  UNIQUE(user_id, address)
);

-- Index for fast lookups
CREATE INDEX idx_saved_addresses_user_id ON saved_addresses(user_id);
CREATE INDEX idx_saved_addresses_is_primary ON saved_addresses(is_primary);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_saved_addresses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_saved_addresses_updated_at
  BEFORE UPDATE ON saved_addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_addresses_updated_at();

-- RLS Policies
ALTER TABLE saved_addresses ENABLE ROW LEVEL SECURITY;

-- Users can only see their own addresses
CREATE POLICY "Users can view own addresses"
  ON saved_addresses
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own addresses
CREATE POLICY "Users can insert own addresses"
  ON saved_addresses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own addresses
CREATE POLICY "Users can update own addresses"
  ON saved_addresses
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own addresses
CREATE POLICY "Users can delete own addresses"
  ON saved_addresses
  FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON saved_addresses TO authenticated;

-- Comments
COMMENT ON TABLE saved_addresses IS 'Stores saved addresses for homeowners for quick job posting';
COMMENT ON COLUMN saved_addresses.is_primary IS 'Primary/default address for the user';
COMMENT ON COLUMN saved_addresses.tags IS 'Comma-separated tags like residential, frequent, side-entrance';
COMMENT ON COLUMN saved_addresses.instructions IS 'Special instructions for contractors like "Use side entrance"';
