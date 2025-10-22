-- ============================================================================
-- CONTRACTOR REAL-TIME LOCATION TRACKING SYSTEM
-- ============================================================================
-- Purpose: Enable homeowners to track contractor location in real-time
-- showing ETA, distance, and live map updates during active jobs
-- ============================================================================

-- Create contractor_location_tracking table
CREATE TABLE IF NOT EXISTS contractor_location_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contractor_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES homeowner_jobs(id) ON DELETE CASCADE,

  -- Real-time GPS location
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(10, 2), -- GPS accuracy in meters
  heading DECIMAL(5, 2), -- Direction in degrees (0-360)
  speed DECIMAL(6, 2), -- Speed in meters/second
  altitude DECIMAL(10, 2), -- Altitude in meters (optional)

  -- ETA calculations
  estimated_arrival_time TIMESTAMPTZ,
  distance_to_job_meters INTEGER,
  eta_minutes INTEGER,

  -- Tracking status
  status TEXT CHECK (status IN ('offline', 'online', 'en_route', 'arrived', 'working', 'completed')) DEFAULT 'offline',

  -- Location update metadata
  battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100),
  is_moving BOOLEAN DEFAULT TRUE,
  last_update_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_contractor_location_contractor ON contractor_location_tracking(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_location_job ON contractor_location_tracking(job_id);
CREATE INDEX IF NOT EXISTS idx_contractor_location_status ON contractor_location_tracking(status);
CREATE INDEX IF NOT EXISTS idx_contractor_location_updated ON contractor_location_tracking(last_update_at DESC);

-- Create a composite index for active tracking queries
CREATE INDEX IF NOT EXISTS idx_contractor_location_active ON contractor_location_tracking(job_id, status, last_update_at DESC) WHERE job_id IS NOT NULL;

-- ============================================================================
-- HAVERSINE DISTANCE CALCULATION FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_haversine_distance(
  lat1 DECIMAL,
  lon1 DECIMAL,
  lat2 DECIMAL,
  lon2 DECIMAL
) RETURNS INTEGER -- returns distance in meters
LANGUAGE plpgsql
AS $$
DECLARE
  R INTEGER := 6371000; -- Earth's radius in meters
  dLat DECIMAL;
  dLon DECIMAL;
  a DECIMAL;
  c DECIMAL;
  distance INTEGER;
BEGIN
  -- Convert degrees to radians
  dLat := radians(lat2 - lat1);
  dLon := radians(lon2 - lon1);

  -- Haversine formula
  a := sin(dLat/2) * sin(dLat/2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(dLon/2) * sin(dLon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  distance := ROUND(R * c);

  RETURN distance;
END;
$$;

-- ============================================================================
-- CALCULATE ETA FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_contractor_eta(
  contractor_lat DECIMAL,
  contractor_lng DECIMAL,
  job_lat DECIMAL,
  job_lng DECIMAL,
  current_speed DECIMAL DEFAULT NULL -- meters/second
) RETURNS INTEGER -- returns ETA in minutes
LANGUAGE plpgsql
AS $$
DECLARE
  distance_meters INTEGER;
  avg_speed_mps DECIMAL := 13.4; -- ~30 mph in meters/second (city driving)
  eta_minutes INTEGER;
BEGIN
  -- Calculate distance using Haversine formula
  distance_meters := calculate_haversine_distance(contractor_lat, contractor_lng, job_lat, job_lng);

  -- Use current speed if available and reasonable, otherwise use average city speed
  IF current_speed IS NOT NULL AND current_speed > 0 AND current_speed < 50 THEN
    avg_speed_mps := current_speed;
  END IF;

  -- Calculate ETA in minutes (add 20% buffer for traffic/stops)
  eta_minutes := ROUND((distance_meters / avg_speed_mps / 60) * 1.2);

  -- Minimum 1 minute if very close
  IF eta_minutes < 1 AND distance_meters > 0 THEN
    eta_minutes := 1;
  END IF;

  RETURN eta_minutes;
END;
$$;

-- ============================================================================
-- UPDATE CONTRACTOR LOCATION FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION update_contractor_location(
  p_contractor_id UUID,
  p_job_id UUID,
  p_latitude DECIMAL,
  p_longitude DECIMAL,
  p_accuracy DECIMAL DEFAULT NULL,
  p_heading DECIMAL DEFAULT NULL,
  p_speed DECIMAL DEFAULT NULL,
  p_altitude DECIMAL DEFAULT NULL,
  p_battery_level INTEGER DEFAULT NULL
) RETURNS TABLE (
  id UUID,
  status TEXT,
  distance_to_job_meters INTEGER,
  eta_minutes INTEGER,
  estimated_arrival_time TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_job_lat DECIMAL;
  v_job_lng DECIMAL;
  v_distance INTEGER;
  v_eta INTEGER;
  v_arrival_time TIMESTAMPTZ;
  v_status TEXT;
  v_is_moving BOOLEAN;
  v_location_id UUID;
BEGIN
  -- Get job location
  SELECT j.latitude, j.longitude
  INTO v_job_lat, v_job_lng
  FROM homeowner_jobs j
  WHERE j.id = p_job_id;

  IF v_job_lat IS NULL OR v_job_lng IS NULL THEN
    RAISE EXCEPTION 'Job location not found';
  END IF;

  -- Calculate distance and ETA
  v_distance := calculate_haversine_distance(p_latitude, p_longitude, v_job_lat, v_job_lng);
  v_eta := calculate_contractor_eta(p_latitude, p_longitude, v_job_lat, v_job_lng, p_speed);
  v_arrival_time := NOW() + (v_eta || ' minutes')::INTERVAL;

  -- Determine status based on distance and speed
  v_is_moving := (p_speed IS NULL OR p_speed > 0.5); -- Moving if speed > 0.5 m/s (~1 mph)

  IF v_distance < 50 THEN
    v_status := 'arrived'; -- Within 50 meters
  ELSIF v_is_moving THEN
    v_status := 'en_route';
  ELSE
    v_status := 'online'; -- Stopped but not arrived
  END IF;

  -- Upsert location record (one record per contractor per job)
  INSERT INTO contractor_location_tracking (
    contractor_id,
    job_id,
    latitude,
    longitude,
    accuracy,
    heading,
    speed,
    altitude,
    distance_to_job_meters,
    eta_minutes,
    estimated_arrival_time,
    status,
    battery_level,
    is_moving,
    last_update_at,
    updated_at
  ) VALUES (
    p_contractor_id,
    p_job_id,
    p_latitude,
    p_longitude,
    p_accuracy,
    p_heading,
    p_speed,
    p_altitude,
    v_distance,
    v_eta,
    v_arrival_time,
    v_status,
    p_battery_level,
    v_is_moving,
    NOW(),
    NOW()
  )
  ON CONFLICT (contractor_id, job_id)
  DO UPDATE SET
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    accuracy = EXCLUDED.accuracy,
    heading = EXCLUDED.heading,
    speed = EXCLUDED.speed,
    altitude = EXCLUDED.altitude,
    distance_to_job_meters = EXCLUDED.distance_to_job_meters,
    eta_minutes = EXCLUDED.eta_minutes,
    estimated_arrival_time = EXCLUDED.estimated_arrival_time,
    status = EXCLUDED.status,
    battery_level = EXCLUDED.battery_level,
    is_moving = EXCLUDED.is_moving,
    last_update_at = NOW(),
    updated_at = NOW()
  RETURNING contractor_location_tracking.id INTO v_location_id;

  -- Return the updated location info
  RETURN QUERY
  SELECT
    v_location_id,
    v_status,
    v_distance,
    v_eta,
    v_arrival_time;
END;
$$;

-- Add unique constraint to ensure one tracking record per contractor per job
ALTER TABLE contractor_location_tracking
ADD CONSTRAINT unique_contractor_job_tracking UNIQUE (contractor_id, job_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE contractor_location_tracking ENABLE ROW LEVEL SECURITY;

-- Contractors can update their own location
CREATE POLICY "Contractors can update own location"
ON contractor_location_tracking
FOR ALL
USING (contractor_id = auth.uid());

-- Homeowners can view contractor location for their jobs
CREATE POLICY "Homeowners can view contractor location for their jobs"
ON contractor_location_tracking
FOR SELECT
USING (
  job_id IN (
    SELECT id FROM homeowner_jobs WHERE homeowner_id = auth.uid()
  )
);

-- Contractors can view their own location history
CREATE POLICY "Contractors can view own location history"
ON contractor_location_tracking
FOR SELECT
USING (contractor_id = auth.uid());

-- ============================================================================
-- REALTIME PUBLICATION
-- ============================================================================
-- Enable realtime for location updates
ALTER PUBLICATION supabase_realtime ADD TABLE contractor_location_tracking;

-- ============================================================================
-- HELPER VIEW: Active Contractor Tracking
-- ============================================================================
CREATE OR REPLACE VIEW active_contractor_tracking AS
SELECT
  clt.*,
  j.homeowner_id,
  j.title AS job_title,
  j.address AS job_address,
  up.name AS contractor_name,
  up.phone AS contractor_phone,
  up.avatar_url AS contractor_avatar
FROM contractor_location_tracking clt
JOIN homeowner_jobs j ON clt.job_id = j.id
JOIN user_profiles up ON clt.contractor_id = up.id
WHERE clt.status IN ('online', 'en_route', 'arrived', 'working')
  AND clt.last_update_at > NOW() - INTERVAL '10 minutes'; -- Only show recent updates

-- Grant access to the view
GRANT SELECT ON active_contractor_tracking TO authenticated;

-- ============================================================================
-- AUTOMATIC CLEANUP: Mark stale tracking as offline
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_stale_tracking()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE contractor_location_tracking
  SET status = 'offline',
      updated_at = NOW()
  WHERE status IN ('online', 'en_route', 'working')
    AND last_update_at < NOW() - INTERVAL '10 minutes';
END;
$$;

-- Note: Set up a cron job or pg_cron to run this periodically
-- Example: SELECT cron.schedule('cleanup-stale-tracking', '*/5 * * * *', 'SELECT cleanup_stale_tracking()');

COMMENT ON TABLE contractor_location_tracking IS 'Real-time GPS location tracking for contractors during active jobs';
COMMENT ON FUNCTION update_contractor_location IS 'Update contractor location and automatically calculate ETA';
COMMENT ON FUNCTION calculate_contractor_eta IS 'Calculate estimated time of arrival based on distance and speed';
COMMENT ON FUNCTION calculate_haversine_distance IS 'Calculate distance between two GPS coordinates using Haversine formula';
