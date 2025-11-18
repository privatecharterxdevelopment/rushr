-- =============================================================================
-- WICHTIG: DIESE SQL-BEFEHLE IM SUPABASE SQL EDITOR AUSFÜHREN
-- =============================================================================
-- Gehe zu: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
-- Kopiere den gesamten Inhalt dieser Datei und führe ihn aus
-- =============================================================================

-- Add license and insurance expiry dates
ALTER TABLE pro_contractors
ADD COLUMN IF NOT EXISTS license_type TEXT,
ADD COLUMN IF NOT EXISTS license_expires DATE,
ADD COLUMN IF NOT EXISTS insurance_expires DATE;

-- Add specialties array (different from categories - more granular skills)
ALTER TABLE pro_contractors
ADD COLUMN IF NOT EXISTS specialties TEXT[];

-- Add pricing fields for flat rate and visit fee
ALTER TABLE pro_contractors
ADD COLUMN IF NOT EXISTS flat_rate_min DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS visit_fee DECIMAL(10, 2);

-- Add social media links
ALTER TABLE pro_contractors
ADD COLUMN IF NOT EXISTS instagram TEXT,
ADD COLUMN IF NOT EXISTS facebook TEXT,
ADD COLUMN IF NOT EXISTS yelp TEXT,
ADD COLUMN IF NOT EXISTS google_business TEXT;

-- Add business hours (JSONB to store complex schedule object)
ALTER TABLE pro_contractors
ADD COLUMN IF NOT EXISTS business_hours JSONB;

-- Add logo URL (will be uploaded to Supabase Storage)
ALTER TABLE pro_contractors
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add portfolio images array (URLs to Supabase Storage)
ALTER TABLE pro_contractors
ADD COLUMN IF NOT EXISTS portfolio_urls TEXT[];

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pro_contractors_specialties ON pro_contractors USING GIN (specialties);
CREATE INDEX IF NOT EXISTS idx_pro_contractors_license_expires ON pro_contractors(license_expires);
CREATE INDEX IF NOT EXISTS idx_pro_contractors_insurance_expires ON pro_contractors(insurance_expires);

-- =============================================================================
-- ÜBERPRÜFUNG: Zeige alle neu hinzugefügten Spalten
-- =============================================================================
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'pro_contractors'
  AND column_name IN (
    'license_type', 'license_expires', 'insurance_expires', 'specialties',
    'flat_rate_min', 'visit_fee', 'instagram', 'facebook', 'yelp',
    'google_business', 'business_hours', 'logo_url', 'portfolio_urls'
  )
ORDER BY column_name;

-- =============================================================================
-- ERFOLG! Alle Spalten wurden hinzugefügt.
-- Du kannst jetzt den Contractor Signup Wizard testen!
-- =============================================================================
