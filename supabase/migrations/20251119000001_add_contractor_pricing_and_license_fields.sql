-- Add new pricing and license fields to pro_contractors table

-- Add licensed_states field
ALTER TABLE pro_contractors
ADD COLUMN IF NOT EXISTS licensed_states TEXT;

-- Add new pricing fields
ALTER TABLE pro_contractors
ADD COLUMN IF NOT EXISTS peak_rate NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS off_peak_rate NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS surge_rate NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS diagnostic_fee NUMERIC(10, 2);

-- Add comments for documentation
COMMENT ON COLUMN pro_contractors.licensed_states IS 'Comma-separated list of states the contractor is licensed in';
COMMENT ON COLUMN pro_contractors.peak_rate IS 'Peak hourly rate (e.g., weekday business hours)';
COMMENT ON COLUMN pro_contractors.off_peak_rate IS 'Off-peak hourly rate (e.g., evenings, weekends)';
COMMENT ON COLUMN pro_contractors.surge_rate IS 'Surge/emergency hourly rate';
COMMENT ON COLUMN pro_contractors.diagnostic_fee IS 'Diagnostic/assessment fee';
