-- ============================================================================
-- SIGNALS SYSTEM SETUP - STANDALONE VERSION
-- ============================================================================
-- This version works without requiring contractor_profiles table
-- Run this file to set up just the signals functionality for testing
-- ============================================================================

-- ============================================================================
-- SIGNAL SOURCES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS signal_sources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL, -- 'government', 'private', 'api', etc.
    source_url TEXT,
    api_endpoint TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SIGNALS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS signals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source_id UUID REFERENCES signal_sources(id),

    -- Signal content
    title TEXT NOT NULL,
    description TEXT,
    signal_type TEXT NOT NULL,
    category TEXT,

    -- Location
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    latitude DECIMAL(10, 6),
    longitude DECIMAL(11, 6),

    -- Signal metadata
    external_id TEXT, -- ID from external source
    estimated_value DECIMAL(10,2),
    urgency_score INTEGER DEFAULT 50, -- 0-100

    -- Raw data
    raw_data JSONB,
    source_url TEXT,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ,

    -- Timestamps
    signal_date TIMESTAMPTZ, -- When the signal occurred
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_signals_zip_code ON signals(zip_code);
CREATE INDEX IF NOT EXISTS idx_signals_category ON signals(category);
CREATE INDEX IF NOT EXISTS idx_signals_signal_date ON signals(signal_date DESC);
CREATE INDEX IF NOT EXISTS idx_signals_location ON signals(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_signals_active ON signals(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_signals_type ON signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_signals_estimated_value ON signals(estimated_value);
CREATE INDEX IF NOT EXISTS idx_signals_urgency ON signals(urgency_score);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - SIMPLIFIED
-- ============================================================================
ALTER TABLE signal_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (safe to run multiple times)
DROP POLICY IF EXISTS "Signal sources are viewable by authenticated users" ON signal_sources;
DROP POLICY IF EXISTS "Signals are viewable by authenticated contractors" ON signals;

-- Create new policies - allow all authenticated users to read signals
CREATE POLICY "Signal sources are viewable by authenticated users" ON signal_sources
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Signals are viewable by authenticated contractors" ON signals
    FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Insert sample signal sources
INSERT INTO signal_sources (id, name, description, type, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'NYC DOB', 'New York City Department of Buildings', 'government', true),
('550e8400-e29b-41d4-a716-446655440002', 'NYC DEP', 'New York City Department of Environmental Protection', 'government', true),
('550e8400-e29b-41d4-a716-446655440003', 'FDNY', 'Fire Department of New York', 'government', true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample signals
INSERT INTO signals (
    source_id,
    title,
    description,
    signal_type,
    category,
    address,
    city,
    state,
    zip_code,
    latitude,
    longitude,
    estimated_value,
    urgency_score,
    signal_date,
    is_active,
    created_at
) VALUES
-- Recent high-priority signals
(
    '550e8400-e29b-41d4-a716-446655440001',
    'Electrical Panel Upgrade Required',
    'Building permit filed for 100A to 200A electrical panel upgrade. Code violation cited for outdated electrical system.',
    'PERMIT',
    'Electrical',
    '245 East 78th Street',
    'New York',
    'NY',
    '10075',
    40.7736,
    -73.9566,
    2500.00,
    85,
    NOW() - INTERVAL '15 minutes',
    true,
    NOW() - INTERVAL '15 minutes'
),
(
    '550e8400-e29b-41d4-a716-446655440002',
    'HVAC System Inspection Failed',
    'Annual HVAC inspection failed due to gas leak detected in boiler room. Immediate repair required.',
    'INSPECTION',
    'HVAC',
    '1247 Broadway',
    'Brooklyn',
    'NY',
    '11221',
    40.6892,
    -73.9442,
    4200.00,
    95,
    NOW() - INTERVAL '32 minutes',
    true,
    NOW() - INTERVAL '32 minutes'
),
(
    '550e8400-e29b-41d4-a716-446655440001',
    'Plumbing Rough-in Inspection',
    'New construction plumbing rough-in inspection scheduled. 3-bathroom layout with modern fixtures.',
    'INSPECTION',
    'Plumbing',
    '89-15 Northern Boulevard',
    'Queens',
    'NY',
    '11372',
    40.7536,
    -73.8803,
    3800.00,
    70,
    NOW() - INTERVAL '1 hour 15 minutes',
    true,
    NOW() - INTERVAL '1 hour 15 minutes'
),
(
    '550e8400-e29b-41d4-a716-446655440003',
    'Fire Safety Violation Posted',
    'Fire safety violation for non-compliant exit signage and emergency lighting system.',
    'VIOLATION',
    'Fire Safety',
    '456 West 125th Street',
    'New York',
    'NY',
    '10027',
    40.8075,
    -73.9533,
    1800.00,
    75,
    NOW() - INTERVAL '2 hours',
    true,
    NOW() - INTERVAL '2 hours'
),
(
    '550e8400-e29b-41d4-a716-446655440001',
    'Roofing Permit Application',
    'Commercial roofing permit filed for 5,000 sq ft membrane replacement due to water damage.',
    'PERMIT',
    'Roofing',
    '125 Court Street',
    'Brooklyn',
    'NY',
    '11201',
    40.6892,
    -73.9903,
    15000.00,
    60,
    NOW() - INTERVAL '3 hours',
    true,
    NOW() - INTERVAL '3 hours'
),
(
    '550e8400-e29b-41d4-a716-446655440002',
    'Gas Line Pressure Test Required',
    'Routine gas line pressure test required for restaurant kitchen equipment installation.',
    'INSPECTION',
    'Gas/Plumbing',
    '2847 Richmond Avenue',
    'Staten Island',
    'NY',
    '10314',
    40.5795,
    -74.1502,
    850.00,
    45,
    NOW() - INTERVAL '6 hours',
    true,
    NOW() - INTERVAL '6 hours'
),
(
    '550e8400-e29b-41d4-a716-446655440001',
    'Elevator Inspection Overdue',
    'Annual elevator inspection overdue by 30 days. Building management cited.',
    'VIOLATION',
    'Elevator',
    '300 East 85th Street',
    'New York',
    'NY',
    '10028',
    40.7794,
    -73.9441,
    2200.00,
    80,
    NOW() - INTERVAL '8 hours',
    true,
    NOW() - INTERVAL '8 hours'
),
(
    '550e8400-e29b-41d4-a716-446655440001',
    'Sidewalk Repair Notice',
    'DOT notice issued for sidewalk repair. Cracked concrete poses safety hazard.',
    'VIOLATION',
    'Concrete/Masonry',
    '5678 5th Avenue',
    'Brooklyn',
    'NY',
    '11220',
    40.6415,
    -74.0166,
    3200.00,
    65,
    NOW() - INTERVAL '1 day 2 hours',
    true,
    NOW() - INTERVAL '1 day 2 hours'
),
(
    '550e8400-e29b-41d4-a716-446655440002',
    'Water Main Permit Filed',
    'Permit filed for water main connection to new commercial development.',
    'PERMIT',
    'Plumbing',
    '1500 Ocean Parkway',
    'Brooklyn',
    'NY',
    '11230',
    40.6092,
    -73.9692,
    8500.00,
    55,
    NOW() - INTERVAL '1 day 5 hours',
    true,
    NOW() - INTERVAL '1 day 5 hours'
),
(
    '550e8400-e29b-41d4-a716-446655440003',
    'Sprinkler System Malfunction',
    'Fire sprinkler system malfunction reported. Immediate repair required to maintain fire certificate.',
    'VIOLATION',
    'Fire Safety',
    '789 Grand Concourse',
    'Bronx',
    'NY',
    '10451',
    40.8176,
    -73.9482,
    1500.00,
    90,
    NOW() - INTERVAL '1 day 8 hours',
    true,
    NOW() - INTERVAL '1 day 8 hours'
);

-- ============================================================================
-- SETUP COMPLETE - SIGNALS SYSTEM READY
-- ============================================================================
-- You can now test the signals dashboard at /signals/dashboard
-- Sample data includes 10 signals with various types and priorities
-- ============================================================================