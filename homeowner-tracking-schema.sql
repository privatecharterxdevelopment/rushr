-- =============================================================================
-- HOMEOWNER REAL-TIME TRACKING SYSTEM
-- Creates tables and functions for tracking homeowner statistics
-- =============================================================================

-- 1. JOBS/SERVICES TRACKING TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS homeowner_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  homeowner_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,

  -- Job details
  title TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'plumbing', 'electrical', 'hvac', etc.
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'emergency')) DEFAULT 'medium',

  -- Status tracking
  status TEXT CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',

  -- Contractor assignment
  contractor_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,

  -- Pricing
  estimated_cost DECIMAL(10,2),
  final_cost DECIMAL(10,2),

  -- Scheduling
  scheduled_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,

  -- Location
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. MESSAGES TRACKING TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS homeowner_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  homeowner_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  contractor_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  job_id UUID REFERENCES homeowner_jobs(id) ON DELETE CASCADE,

  -- Message content
  message_text TEXT NOT NULL,
  message_type TEXT CHECK (message_type IN ('text', 'image', 'document', 'system')) DEFAULT 'text',

  -- Sender info
  sender_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL NOT NULL,
  sender_type TEXT CHECK (sender_type IN ('homeowner', 'contractor', 'system')) NOT NULL,

  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TRUSTED CONTRACTORS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS homeowner_trusted_contractors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  homeowner_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  contractor_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,

  -- Trust details
  trust_level TEXT CHECK (trust_level IN ('trusted', 'preferred', 'blocked')) DEFAULT 'trusted',
  notes TEXT,

  -- Stats
  jobs_completed INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.00,

  -- Dates
  first_job_date TIMESTAMPTZ,
  last_job_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint
  UNIQUE(homeowner_id, contractor_id)
);

-- 4. HOMEOWNER STATISTICS VIEW (Real-time calculated)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW homeowner_dashboard_stats AS
SELECT
  hp.id as homeowner_id,
  hp.email,
  hp.name,

  -- Active Services (pending, confirmed, in_progress)
  COALESCE(active_jobs.count, 0) as active_services,

  -- Completed Services
  COALESCE(completed_jobs.count, 0) as completed_services,

  -- Unread Messages
  COALESCE(unread_messages.count, 0) as unread_messages,

  -- Trusted Contractors (for quick booking)
  COALESCE(trusted_contractors.count, 0) as trusted_contractors,

  -- Additional stats
  COALESCE(total_spent.amount, 0) as total_spent,
  hp.first_job_completed,
  hp.created_at as member_since

FROM user_profiles hp
LEFT JOIN (
  -- Count active jobs (pending, confirmed, in_progress)
  SELECT homeowner_id, COUNT(*) as count
  FROM homeowner_jobs
  WHERE status IN ('pending', 'confirmed', 'in_progress')
    AND homeowner_id IS NOT NULL
  GROUP BY homeowner_id
) active_jobs ON hp.id = active_jobs.homeowner_id

LEFT JOIN (
  -- Count completed jobs
  SELECT homeowner_id, COUNT(*) as count
  FROM homeowner_jobs
  WHERE status = 'completed'
    AND homeowner_id IS NOT NULL
  GROUP BY homeowner_id
) completed_jobs ON hp.id = completed_jobs.homeowner_id

LEFT JOIN (
  -- Count unread messages
  SELECT homeowner_id, COUNT(*) as count
  FROM homeowner_messages
  WHERE is_read = FALSE
    AND sender_type != 'homeowner' -- Don't count own messages
    AND homeowner_id IS NOT NULL
  GROUP BY homeowner_id
) unread_messages ON hp.id = unread_messages.homeowner_id

LEFT JOIN (
  -- Count trusted contractors
  SELECT homeowner_id, COUNT(*) as count
  FROM homeowner_trusted_contractors
  WHERE trust_level IN ('trusted', 'preferred')
    AND homeowner_id IS NOT NULL
  GROUP BY homeowner_id
) trusted_contractors ON hp.id = trusted_contractors.homeowner_id

LEFT JOIN (
  -- Total amount spent
  SELECT homeowner_id, SUM(final_cost) as amount
  FROM homeowner_jobs
  WHERE status = 'completed'
    AND final_cost IS NOT NULL
    AND homeowner_id IS NOT NULL
  GROUP BY homeowner_id
) total_spent ON hp.id = total_spent.homeowner_id

WHERE hp.role = 'homeowner';

-- 5. INDEXES FOR PERFORMANCE
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_homeowner_jobs_homeowner_id ON homeowner_jobs(homeowner_id);
CREATE INDEX IF NOT EXISTS idx_homeowner_jobs_status ON homeowner_jobs(status);
CREATE INDEX IF NOT EXISTS idx_homeowner_jobs_contractor_id ON homeowner_jobs(contractor_id);
CREATE INDEX IF NOT EXISTS idx_homeowner_jobs_created_at ON homeowner_jobs(created_at);

CREATE INDEX IF NOT EXISTS idx_homeowner_messages_homeowner_id ON homeowner_messages(homeowner_id);
CREATE INDEX IF NOT EXISTS idx_homeowner_messages_is_read ON homeowner_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_homeowner_messages_sender_type ON homeowner_messages(sender_type);
CREATE INDEX IF NOT EXISTS idx_homeowner_messages_job_id ON homeowner_messages(job_id);

CREATE INDEX IF NOT EXISTS idx_trusted_contractors_homeowner_id ON homeowner_trusted_contractors(homeowner_id);
CREATE INDEX IF NOT EXISTS idx_trusted_contractors_trust_level ON homeowner_trusted_contractors(trust_level);

-- 6. ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------
ALTER TABLE homeowner_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE homeowner_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE homeowner_trusted_contractors ENABLE ROW LEVEL SECURITY;

-- Jobs policies
CREATE POLICY "Homeowners can manage their own jobs" ON homeowner_jobs
  FOR ALL USING (
    homeowner_id = auth.uid() OR
    contractor_id = auth.uid()
  );

-- Messages policies
CREATE POLICY "Users can access their own messages" ON homeowner_messages
  FOR ALL USING (
    homeowner_id = auth.uid() OR
    contractor_id = auth.uid() OR
    sender_id = auth.uid()
  );

-- Trusted contractors policies
CREATE POLICY "Homeowners can manage their trusted contractors" ON homeowner_trusted_contractors
  FOR ALL USING (homeowner_id = auth.uid());

CREATE POLICY "Contractors can view their trust status" ON homeowner_trusted_contractors
  FOR SELECT USING (contractor_id = auth.uid());

-- 7. FUNCTIONS FOR REAL-TIME UPDATES
-- -----------------------------------------------------------------------------

-- Function to update job status and trigger stat recalculation
CREATE OR REPLACE FUNCTION update_job_status(
  p_job_id UUID,
  p_new_status TEXT,
  p_completed_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE homeowner_jobs
  SET
    status = p_new_status,
    completed_date = CASE WHEN p_new_status = 'completed' THEN COALESCE(p_completed_date, NOW()) ELSE completed_date END,
    updated_at = NOW()
  WHERE id = p_job_id;

  -- Update first_job_completed flag if this is first completed job
  IF p_new_status = 'completed' THEN
    UPDATE user_profiles
    SET first_job_completed = TRUE
    WHERE id = (SELECT homeowner_id FROM homeowner_jobs WHERE id = p_job_id)
      AND first_job_completed = FALSE;
  END IF;
END;
$$;

-- Function to mark message as read
CREATE OR REPLACE FUNCTION mark_message_read(p_message_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE homeowner_messages
  SET
    is_read = TRUE,
    read_at = NOW()
  WHERE id = p_message_id AND is_read = FALSE;
END;
$$;

-- Function to add trusted contractor
CREATE OR REPLACE FUNCTION add_trusted_contractor(
  p_homeowner_id UUID,
  p_contractor_id UUID,
  p_trust_level TEXT DEFAULT 'trusted'
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO homeowner_trusted_contractors (homeowner_id, contractor_id, trust_level)
  VALUES (p_homeowner_id, p_contractor_id, p_trust_level)
  ON CONFLICT (homeowner_id, contractor_id)
  DO UPDATE SET
    trust_level = p_trust_level,
    updated_at = NOW();
END;
$$;

-- 8. TRIGGERS FOR AUTOMATIC UPDATES
-- -----------------------------------------------------------------------------

-- Update timestamps
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_homeowner_jobs_updated_at
  BEFORE UPDATE ON homeowner_jobs
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_trusted_contractors_updated_at
  BEFORE UPDATE ON homeowner_trusted_contractors
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 9. GRANT PERMISSIONS
-- -----------------------------------------------------------------------------
GRANT SELECT ON homeowner_dashboard_stats TO authenticated;
GRANT ALL ON homeowner_jobs TO authenticated;
GRANT ALL ON homeowner_messages TO authenticated;
GRANT ALL ON homeowner_trusted_contractors TO authenticated;

-- =============================================================================
-- SAMPLE DATA FOR TESTING (REMOVE IN PRODUCTION)
-- =============================================================================

-- This creates sample data for testing - remove this section in production
/*
-- Sample job for testing (replace with real homeowner ID)
INSERT INTO homeowner_jobs (homeowner_id, title, description, category, status, estimated_cost)
VALUES (
  (SELECT id FROM user_profiles WHERE role = 'homeowner' LIMIT 1),
  'Fix kitchen sink leak',
  'Kitchen sink is leaking under the cabinet',
  'plumbing',
  'pending',
  150.00
);
*/

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check the dashboard stats for all homeowners
SELECT * FROM homeowner_dashboard_stats LIMIT 5;

-- Check table structures
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('homeowner_jobs', 'homeowner_messages', 'homeowner_trusted_contractors')
ORDER BY table_name, ordinal_position;

SELECT 'Homeowner tracking system created successfully!' as status;