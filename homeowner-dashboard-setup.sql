-- =============================================================================
-- HOMEOWNER DASHBOARD SETUP
-- Creates views, tables, and functions needed for the homeowner dashboard
-- =============================================================================

-- 1. Create homeowner_messages table
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS homeowner_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  homeowner_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  contractor_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  job_id UUID REFERENCES homeowner_jobs(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  message_type TEXT CHECK (message_type IN ('text', 'image', 'document', 'system')) DEFAULT 'text',
  sender_type TEXT CHECK (sender_type IN ('homeowner', 'contractor', 'system')) DEFAULT 'system',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for homeowner_messages
CREATE INDEX IF NOT EXISTS idx_homeowner_messages_homeowner_id ON homeowner_messages(homeowner_id);
CREATE INDEX IF NOT EXISTS idx_homeowner_messages_contractor_id ON homeowner_messages(contractor_id);
CREATE INDEX IF NOT EXISTS idx_homeowner_messages_job_id ON homeowner_messages(job_id);
CREATE INDEX IF NOT EXISTS idx_homeowner_messages_is_read ON homeowner_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_homeowner_messages_created_at ON homeowner_messages(created_at);

-- Enable RLS for homeowner_messages
ALTER TABLE homeowner_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for homeowner_messages
CREATE POLICY "Homeowners can manage their own messages" ON homeowner_messages
  FOR ALL USING (homeowner_id = auth.uid());

CREATE POLICY "Contractors can view messages for their jobs" ON homeowner_messages
  FOR SELECT USING (contractor_id = auth.uid());

-- Grant permissions
GRANT ALL ON homeowner_messages TO authenticated;

-- Add trigger for homeowner_messages updated_at
CREATE TRIGGER update_homeowner_messages_updated_at
  BEFORE UPDATE ON homeowner_messages
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 2. Create trusted_contractors table
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS trusted_contractors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  homeowner_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  contractor_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  trust_level TEXT CHECK (trust_level IN ('trusted', 'preferred')) DEFAULT 'trusted',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(homeowner_id, contractor_id)
);

-- Add indexes for trusted_contractors
CREATE INDEX IF NOT EXISTS idx_trusted_contractors_homeowner_id ON trusted_contractors(homeowner_id);
CREATE INDEX IF NOT EXISTS idx_trusted_contractors_contractor_id ON trusted_contractors(contractor_id);

-- Enable RLS for trusted_contractors
ALTER TABLE trusted_contractors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for trusted_contractors
CREATE POLICY "Homeowners can manage their trusted contractors" ON trusted_contractors
  FOR ALL USING (homeowner_id = auth.uid());

-- Grant permissions
GRANT ALL ON trusted_contractors TO authenticated;

-- 3. Create homeowner_dashboard_stats view
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW homeowner_dashboard_stats AS
SELECT
  up.id as homeowner_id,
  -- Active services (pending, confirmed, in_progress jobs)
  COALESCE(active_jobs.count, 0) as active_services,
  -- Completed services
  COALESCE(completed_jobs.count, 0) as completed_services,
  -- Unread messages
  COALESCE(unread_msgs.count, 0) as unread_messages,
  -- Trusted contractors count
  COALESCE(trusted_count.count, 0) as trusted_contractors,
  -- Total spent (sum of final_cost for completed jobs)
  COALESCE(total_spending.amount, 0) as total_spent,
  -- First job completed
  COALESCE(completed_jobs.count > 0, false) as first_job_completed,
  -- Member since
  up.created_at as member_since
FROM user_profiles up

-- Active jobs count
LEFT JOIN (
  SELECT
    homeowner_id,
    COUNT(*) as count
  FROM homeowner_jobs
  WHERE status IN ('pending', 'confirmed', 'in_progress')
  GROUP BY homeowner_id
) active_jobs ON up.id = active_jobs.homeowner_id

-- Completed jobs count
LEFT JOIN (
  SELECT
    homeowner_id,
    COUNT(*) as count
  FROM homeowner_jobs
  WHERE status = 'completed'
  GROUP BY homeowner_id
) completed_jobs ON up.id = completed_jobs.homeowner_id

-- Unread messages count
LEFT JOIN (
  SELECT
    homeowner_id,
    COUNT(*) as count
  FROM homeowner_messages
  WHERE is_read = false
  GROUP BY homeowner_id
) unread_msgs ON up.id = unread_msgs.homeowner_id

-- Trusted contractors count
LEFT JOIN (
  SELECT
    homeowner_id,
    COUNT(*) as count
  FROM trusted_contractors
  GROUP BY homeowner_id
) trusted_count ON up.id = trusted_count.homeowner_id

-- Total spending
LEFT JOIN (
  SELECT
    homeowner_id,
    SUM(final_cost) as amount
  FROM homeowner_jobs
  WHERE status = 'completed' AND final_cost IS NOT NULL
  GROUP BY homeowner_id
) total_spending ON up.id = total_spending.homeowner_id

WHERE up.role = 'homeowner';

-- Grant access to the view
GRANT SELECT ON homeowner_dashboard_stats TO authenticated;

-- 4. Create RPC functions
-- -----------------------------------------------------------------------------

-- Function to mark message as read
CREATE OR REPLACE FUNCTION mark_message_read(p_message_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY definer
AS $$
BEGIN
  UPDATE homeowner_messages
  SET is_read = true, updated_at = NOW()
  WHERE id = p_message_id
    AND (homeowner_id = auth.uid() OR contractor_id = auth.uid());
END;
$$;

-- Function to update job status
CREATE OR REPLACE FUNCTION update_job_status(
  p_job_id UUID,
  p_new_status TEXT,
  p_completed_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY definer
AS $$
BEGIN
  UPDATE homeowner_jobs
  SET
    status = p_new_status,
    completed_date = CASE
      WHEN p_new_status = 'completed' THEN COALESCE(p_completed_date, NOW())
      ELSE completed_date
    END,
    updated_at = NOW()
  WHERE id = p_job_id
    AND homeowner_id = auth.uid();

  -- Create system message for status change
  INSERT INTO homeowner_messages (
    homeowner_id,
    job_id,
    message_text,
    message_type,
    sender_type
  )
  SELECT
    homeowner_id,
    id,
    'Job status updated to: ' || p_new_status,
    'system',
    'system'
  FROM homeowner_jobs
  WHERE id = p_job_id;
END;
$$;

-- Function to add trusted contractor
CREATE OR REPLACE FUNCTION add_trusted_contractor(
  p_homeowner_id UUID,
  p_contractor_id UUID,
  p_trust_level TEXT DEFAULT 'trusted'
)
RETURNS void
LANGUAGE plpgsql
SECURITY definer
AS $$
BEGIN
  -- Only allow homeowner to add their own trusted contractors
  IF p_homeowner_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  INSERT INTO trusted_contractors (homeowner_id, contractor_id, trust_level)
  VALUES (p_homeowner_id, p_contractor_id, p_trust_level)
  ON CONFLICT (homeowner_id, contractor_id)
  DO UPDATE SET trust_level = p_trust_level, created_at = NOW();

  -- Create system message
  INSERT INTO homeowner_messages (
    homeowner_id,
    contractor_id,
    message_text,
    message_type,
    sender_type
  )
  VALUES (
    p_homeowner_id,
    p_contractor_id,
    'Contractor added to your trusted list',
    'system',
    'system'
  );
END;
$$;

SELECT 'Homeowner dashboard setup completed successfully!' as status;