-- ============================================================================
-- REAL-TIME CONTRACTOR LOCATION TRACKING
-- ============================================================================
-- Allows homeowners to track contractor location in real-time when job is active
-- Allows contractors to navigate to job address with turn-by-turn directions
-- ============================================================================

-- =====================================================
-- 1. CONTRACTOR LOCATION TRACKING TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS contractor_locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contractor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES homeowner_jobs(id) ON DELETE CASCADE,

    -- Current Location
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(10, 2), -- meters
    heading DECIMAL(5, 2), -- degrees (0-360)
    speed DECIMAL(6, 2), -- meters per second

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_en_route BOOLEAN DEFAULT false,
    has_arrived BOOLEAN DEFAULT false,

    -- ETA Calculation
    estimated_arrival_time TIMESTAMPTZ,
    distance_to_destination DECIMAL(10, 2), -- meters

    -- Timestamps
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure only one active tracking per job
    UNIQUE(contractor_id, job_id)
);

-- =====================================================
-- 2. LOCATION HISTORY (for route playback/analytics)
-- =====================================================

CREATE TABLE IF NOT EXISTS location_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contractor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES homeowner_jobs(id) ON DELETE CASCADE,

    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(10, 2),
    heading DECIMAL(5, 2),
    speed DECIMAL(6, 2),

    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. ADD TRACKING COLUMNS TO HOMEOWNER_JOBS
-- =====================================================

ALTER TABLE homeowner_jobs
ADD COLUMN IF NOT EXISTS tracking_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS contractor_en_route_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS contractor_arrived_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS work_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS work_completed_at TIMESTAMPTZ;

-- =====================================================
-- 4. INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_contractor_locations_contractor ON contractor_locations(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_locations_job ON contractor_locations(job_id);
CREATE INDEX IF NOT EXISTS idx_contractor_locations_active ON contractor_locations(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_contractor_locations_updated ON contractor_locations(last_updated DESC);

CREATE INDEX IF NOT EXISTS idx_location_history_contractor ON location_history(contractor_id);
CREATE INDEX IF NOT EXISTS idx_location_history_job ON location_history(job_id);
CREATE INDEX IF NOT EXISTS idx_location_history_recorded ON location_history(recorded_at DESC);

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE contractor_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_history ENABLE ROW LEVEL SECURITY;

-- Contractors can update their own location
DROP POLICY IF EXISTS "Contractors can update own location" ON contractor_locations;
CREATE POLICY "Contractors can update own location" ON contractor_locations
    FOR ALL USING (auth.uid() = contractor_id);

-- Homeowners can view location of contractor working on their job
DROP POLICY IF EXISTS "Homeowners can view contractor location" ON contractor_locations;
CREATE POLICY "Homeowners can view contractor location" ON contractor_locations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM homeowner_jobs j
            WHERE j.id = contractor_locations.job_id
            AND j.homeowner_id = auth.uid()
            AND j.status IN ('in_progress', 'bid_accepted')
        )
    );

-- Contractors can insert their location history
DROP POLICY IF EXISTS "Contractors can insert location history" ON location_history;
CREATE POLICY "Contractors can insert location history" ON location_history
    FOR INSERT WITH CHECK (auth.uid() = contractor_id);

-- Homeowners can view location history of their jobs
DROP POLICY IF EXISTS "Homeowners can view location history" ON location_history;
CREATE POLICY "Homeowners can view location history" ON location_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM homeowner_jobs j
            WHERE j.id = location_history.job_id
            AND j.homeowner_id = auth.uid()
        )
    );

-- =====================================================
-- 6. FUNCTION TO UPDATE CONTRACTOR LOCATION
-- =====================================================

CREATE OR REPLACE FUNCTION update_contractor_location(
    p_job_id UUID,
    p_latitude DECIMAL,
    p_longitude DECIMAL,
    p_accuracy DECIMAL DEFAULT NULL,
    p_heading DECIMAL DEFAULT NULL,
    p_speed DECIMAL DEFAULT NULL,
    p_is_en_route BOOLEAN DEFAULT false,
    p_has_arrived BOOLEAN DEFAULT false,
    p_eta TIMESTAMPTZ DEFAULT NULL,
    p_distance DECIMAL DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_contractor_id UUID;
    v_result JSON;
BEGIN
    v_contractor_id := auth.uid();

    -- Update or insert current location
    INSERT INTO contractor_locations (
        contractor_id,
        job_id,
        latitude,
        longitude,
        accuracy,
        heading,
        speed,
        is_active,
        is_en_route,
        has_arrived,
        estimated_arrival_time,
        distance_to_destination,
        last_updated
    ) VALUES (
        v_contractor_id,
        p_job_id,
        p_latitude,
        p_longitude,
        p_accuracy,
        p_heading,
        p_speed,
        true,
        p_is_en_route,
        p_has_arrived,
        p_eta,
        p_distance,
        NOW()
    )
    ON CONFLICT (contractor_id, job_id)
    DO UPDATE SET
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        accuracy = EXCLUDED.accuracy,
        heading = EXCLUDED.heading,
        speed = EXCLUDED.speed,
        is_en_route = EXCLUDED.is_en_route,
        has_arrived = EXCLUDED.has_arrived,
        estimated_arrival_time = EXCLUDED.estimated_arrival_time,
        distance_to_destination = EXCLUDED.distance_to_destination,
        last_updated = NOW();

    -- Insert into history (for route playback)
    INSERT INTO location_history (
        contractor_id,
        job_id,
        latitude,
        longitude,
        accuracy,
        heading,
        speed
    ) VALUES (
        v_contractor_id,
        p_job_id,
        p_latitude,
        p_longitude,
        p_accuracy,
        p_heading,
        p_speed
    );

    -- Update job timestamps
    IF p_is_en_route AND NOT p_has_arrived THEN
        UPDATE homeowner_jobs
        SET contractor_en_route_at = COALESCE(contractor_en_route_at, NOW())
        WHERE id = p_job_id;
    END IF;

    IF p_has_arrived THEN
        UPDATE homeowner_jobs
        SET contractor_arrived_at = COALESCE(contractor_arrived_at, NOW())
        WHERE id = p_job_id;
    END IF;

    v_result := json_build_object(
        'success', true,
        'message', 'Location updated successfully',
        'is_en_route', p_is_en_route,
        'has_arrived', p_has_arrived
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. FUNCTION TO START TRACKING (when bid accepted)
-- =====================================================

CREATE OR REPLACE FUNCTION start_job_tracking()
RETURNS TRIGGER AS $$
BEGIN
    -- Enable tracking when bid is accepted
    IF NEW.status = 'bid_accepted' AND (OLD.status IS NULL OR OLD.status != 'bid_accepted') THEN
        UPDATE homeowner_jobs
        SET tracking_enabled = true
        WHERE id = NEW.id;
    END IF;

    -- Mark work started timestamp
    IF NEW.status = 'in_progress' AND (OLD.status IS NULL OR OLD.status != 'in_progress') THEN
        UPDATE homeowner_jobs
        SET work_started_at = COALESCE(work_started_at, NOW())
        WHERE id = NEW.id;
    END IF;

    -- Mark work completed timestamp
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        UPDATE homeowner_jobs
        SET work_completed_at = COALESCE(work_completed_at, NOW())
        WHERE id = NEW.id;

        -- Deactivate location tracking
        UPDATE contractor_locations
        SET is_active = false
        WHERE job_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_job_tracking_status_change ON homeowner_jobs;
CREATE TRIGGER on_job_tracking_status_change
    AFTER UPDATE ON homeowner_jobs
    FOR EACH ROW
    EXECUTE FUNCTION start_job_tracking();

-- =====================================================
-- 8. VIEW FOR ACTIVE TRACKING
-- =====================================================

CREATE OR REPLACE VIEW active_job_tracking AS
SELECT
    j.id as job_id,
    j.title as job_title,
    j.homeowner_id,
    j.address as job_address,
    j.latitude as job_latitude,
    j.longitude as job_longitude,
    j.status as job_status,
    j.tracking_enabled,

    cl.contractor_id,
    COALESCE(pc.business_name, pc.name) as contractor_name,
    pc.phone as contractor_phone,

    cl.latitude as contractor_latitude,
    cl.longitude as contractor_longitude,
    cl.accuracy,
    cl.heading,
    cl.speed,
    cl.is_en_route,
    cl.has_arrived,
    cl.estimated_arrival_time,
    cl.distance_to_destination,
    cl.last_updated,

    j.contractor_en_route_at,
    j.contractor_arrived_at,
    j.work_started_at

FROM homeowner_jobs j
LEFT JOIN contractor_locations cl ON j.id = cl.job_id AND cl.is_active = true
LEFT JOIN pro_contractors pc ON cl.contractor_id = pc.id
WHERE j.tracking_enabled = true
AND j.status IN ('bid_accepted', 'in_progress');

GRANT SELECT ON active_job_tracking TO authenticated;

-- =====================================================
-- 9. REALTIME SUBSCRIPTION
-- =====================================================

-- Enable realtime for contractor_locations table
ALTER PUBLICATION supabase_realtime ADD TABLE contractor_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE homeowner_jobs;

-- =====================================================
-- 10. COMMENTS
-- =====================================================

COMMENT ON TABLE contractor_locations IS 'Real-time location tracking of contractors during active jobs';
COMMENT ON TABLE location_history IS 'Historical location data for route playback and analytics';
COMMENT ON FUNCTION update_contractor_location IS 'Updates contractor location with GPS data from mobile device';
COMMENT ON FUNCTION start_job_tracking IS 'Enables tracking when job is accepted and manages timestamps';
COMMENT ON VIEW active_job_tracking IS 'Combined view of active jobs with real-time contractor locations';

SELECT 'Real-time tracking system created successfully! 📍' as status;
