-- =============================================================================
-- JOB BIDDING SYSTEM
-- Allows contractors to bid on homeowner jobs
-- =============================================================================

-- 1. JOB BIDS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS job_bids (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES homeowner_jobs(id) ON DELETE CASCADE NOT NULL,
  contractor_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  homeowner_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,

  -- Bid details
  bid_amount DECIMAL(10,2) NOT NULL,
  estimated_duration_hours INTEGER, -- Duration in hours
  description TEXT NOT NULL, -- Contractor's proposal/approach

  -- Availability
  available_date TIMESTAMPTZ, -- When contractor can start
  completion_date TIMESTAMPTZ, -- Estimated completion date

  -- Bid status
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')) DEFAULT 'pending',

  -- Additional info
  materials_included BOOLEAN DEFAULT false,
  warranty_months INTEGER DEFAULT 0,
  emergency_surcharge DECIMAL(10,2) DEFAULT 0.00,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(job_id, contractor_id) -- One bid per contractor per job
);

-- 2. UPDATE HOMEOWNER_JOBS TABLE FOR BIDDING
-- -----------------------------------------------------------------------------

-- Add bidding-related columns to existing jobs table
ALTER TABLE homeowner_jobs
ADD COLUMN IF NOT EXISTS bidding_deadline TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS min_bid_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS max_bid_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS accepted_bid_id UUID REFERENCES job_bids(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS bid_count INTEGER DEFAULT 0;

-- 3. JOB STATUS UPDATES
-- -----------------------------------------------------------------------------

-- Update job status enum to include bidding states
-- Note: This assumes we're using TEXT constraints, not ENUMs
ALTER TABLE homeowner_jobs DROP CONSTRAINT IF EXISTS homeowner_jobs_status_check;
ALTER TABLE homeowner_jobs ADD CONSTRAINT homeowner_jobs_status_check
  CHECK (status IN ('pending', 'bidding', 'bid_accepted', 'in_progress', 'completed', 'cancelled'));

-- 4. REAL-TIME BIDDING FUNCTIONS
-- -----------------------------------------------------------------------------

-- Function to submit a bid
CREATE OR REPLACE FUNCTION submit_job_bid(
  p_job_id UUID,
  p_contractor_id UUID,
  p_bid_amount DECIMAL(10,2),
  p_description TEXT,
  p_estimated_duration_hours INTEGER DEFAULT NULL,
  p_available_date TIMESTAMPTZ DEFAULT NULL,
  p_materials_included BOOLEAN DEFAULT false,
  p_warranty_months INTEGER DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_homeowner_id UUID;
  v_bid_id UUID;
  v_job_status TEXT;
BEGIN
  -- Get job details and homeowner
  SELECT homeowner_id, status INTO v_homeowner_id, v_job_status
  FROM homeowner_jobs
  WHERE id = p_job_id;

  -- Check if job exists and is open for bidding
  IF v_homeowner_id IS NULL THEN
    RAISE EXCEPTION 'Job not found';
  END IF;

  IF v_job_status NOT IN ('pending', 'bidding') THEN
    RAISE EXCEPTION 'Job is no longer accepting bids';
  END IF;

  -- Check if contractor already bid on this job
  IF EXISTS(SELECT 1 FROM job_bids WHERE job_id = p_job_id AND contractor_id = p_contractor_id) THEN
    RAISE EXCEPTION 'You have already bid on this job';
  END IF;

  -- Insert the bid
  INSERT INTO job_bids (
    job_id,
    contractor_id,
    homeowner_id,
    bid_amount,
    description,
    estimated_duration_hours,
    available_date,
    materials_included,
    warranty_months
  )
  VALUES (
    p_job_id,
    p_contractor_id,
    v_homeowner_id,
    p_bid_amount,
    p_description,
    p_estimated_duration_hours,
    p_available_date,
    p_materials_included,
    p_warranty_months
  )
  RETURNING id INTO v_bid_id;

  -- Update job status to 'bidding' if it was 'pending'
  UPDATE homeowner_jobs
  SET
    status = 'bidding',
    bid_count = bid_count + 1,
    updated_at = NOW()
  WHERE id = p_job_id AND status = 'pending';

  -- If job was already 'bidding', just update bid count
  UPDATE homeowner_jobs
  SET
    bid_count = bid_count + 1,
    updated_at = NOW()
  WHERE id = p_job_id AND status = 'bidding';

  RETURN v_bid_id;
END;
$$;

-- Function to accept a bid
CREATE OR REPLACE FUNCTION accept_job_bid(
  p_bid_id UUID,
  p_homeowner_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_job_id UUID;
  v_contractor_id UUID;
  v_bid_amount DECIMAL(10,2);
BEGIN
  -- Get bid details
  SELECT job_id, contractor_id, bid_amount
  INTO v_job_id, v_contractor_id, v_bid_amount
  FROM job_bids
  WHERE id = p_bid_id AND homeowner_id = p_homeowner_id;

  IF v_job_id IS NULL THEN
    RAISE EXCEPTION 'Bid not found or access denied';
  END IF;

  -- Update the accepted bid
  UPDATE job_bids
  SET status = 'accepted', updated_at = NOW()
  WHERE id = p_bid_id;

  -- Reject all other bids for this job
  UPDATE job_bids
  SET status = 'rejected', updated_at = NOW()
  WHERE job_id = v_job_id AND id != p_bid_id;

  -- Update the job
  UPDATE homeowner_jobs
  SET
    status = 'bid_accepted',
    accepted_bid_id = p_bid_id,
    contractor_id = v_contractor_id,
    estimated_cost = v_bid_amount,
    updated_at = NOW()
  WHERE id = v_job_id;

  -- TODO: Create payment hold (mock for now)
  -- This is where we'll integrate Stripe later

END;
$$;

-- Function to start job work
CREATE OR REPLACE FUNCTION start_job_work(
  p_job_id UUID,
  p_contractor_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Verify contractor is assigned to this job
  IF NOT EXISTS(
    SELECT 1 FROM homeowner_jobs
    WHERE id = p_job_id
      AND contractor_id = p_contractor_id
      AND status = 'bid_accepted'
  ) THEN
    RAISE EXCEPTION 'Job not found or access denied';
  END IF;

  -- Update job status
  UPDATE homeowner_jobs
  SET
    status = 'in_progress',
    updated_at = NOW()
  WHERE id = p_job_id;
END;
$$;

-- 5. BIDDING VIEWS FOR EASY QUERYING
-- -----------------------------------------------------------------------------

-- View for homeowners to see bids on their jobs
CREATE OR REPLACE VIEW homeowner_job_bids AS
SELECT
  j.id as job_id,
  j.title as job_title,
  j.homeowner_id,
  j.status as job_status,
  j.bid_count,
  b.id as bid_id,
  b.contractor_id,
  up.name as contractor_name,
  b.bid_amount,
  b.estimated_duration_hours,
  b.description as bid_description,
  b.available_date,
  b.materials_included,
  b.warranty_months,
  b.status as bid_status,
  b.created_at as bid_submitted_at,
  -- Calculate contractor rating (placeholder for now)
  4.5 as contractor_rating,
  15 as contractor_jobs_completed
FROM homeowner_jobs j
LEFT JOIN job_bids b ON j.id = b.job_id
LEFT JOIN user_profiles up ON b.contractor_id = up.id
WHERE j.status IN ('bidding', 'bid_accepted')
ORDER BY j.created_at DESC, b.bid_amount ASC;

-- View for contractors to see available jobs
CREATE OR REPLACE VIEW contractor_available_jobs AS
SELECT
  j.id as job_id,
  j.title,
  j.description,
  j.category,
  j.priority,
  j.address,
  j.city,
  j.state,
  j.estimated_cost,
  j.bid_count,
  j.bidding_deadline,
  j.created_at,
  hp.name as homeowner_name,
  -- Check if this contractor already bid
  CASE WHEN cb.id IS NOT NULL THEN true ELSE false END as already_bid,
  cb.bid_amount as my_bid_amount,
  cb.status as my_bid_status
FROM homeowner_jobs j
JOIN user_profiles hp ON j.homeowner_id = hp.id
LEFT JOIN job_bids cb ON j.id = cb.job_id AND cb.contractor_id = auth.uid()
WHERE j.status IN ('pending', 'bidding')
  AND (j.bidding_deadline IS NULL OR j.bidding_deadline > NOW())
ORDER BY
  CASE WHEN j.priority = 'emergency' THEN 1
       WHEN j.priority = 'high' THEN 2
       ELSE 3 END,
  j.created_at DESC;

-- 6. INDEXES FOR PERFORMANCE
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_job_bids_job_id ON job_bids(job_id);
CREATE INDEX IF NOT EXISTS idx_job_bids_contractor_id ON job_bids(contractor_id);
CREATE INDEX IF NOT EXISTS idx_job_bids_homeowner_id ON job_bids(homeowner_id);
CREATE INDEX IF NOT EXISTS idx_job_bids_status ON job_bids(status);
CREATE INDEX IF NOT EXISTS idx_job_bids_created_at ON job_bids(created_at);

CREATE INDEX IF NOT EXISTS idx_homeowner_jobs_bidding_deadline ON homeowner_jobs(bidding_deadline);
CREATE INDEX IF NOT EXISTS idx_homeowner_jobs_bid_count ON homeowner_jobs(bid_count);

-- 7. ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------
ALTER TABLE job_bids ENABLE ROW LEVEL SECURITY;

-- Contractors can manage their own bids
CREATE POLICY "Contractors can manage their own bids" ON job_bids
  FOR ALL USING (contractor_id = auth.uid());

-- Homeowners can view bids on their jobs
CREATE POLICY "Homeowners can view bids on their jobs" ON job_bids
  FOR SELECT USING (homeowner_id = auth.uid());

-- Homeowners can update bid status (accept/reject)
CREATE POLICY "Homeowners can update bid status" ON job_bids
  FOR UPDATE USING (homeowner_id = auth.uid());

-- 8. GRANT PERMISSIONS
-- -----------------------------------------------------------------------------
GRANT SELECT ON homeowner_job_bids TO authenticated;
GRANT SELECT ON contractor_available_jobs TO authenticated;
GRANT ALL ON job_bids TO authenticated;

-- 9. TRIGGERS
-- -----------------------------------------------------------------------------
CREATE TRIGGER update_job_bids_updated_at
  BEFORE UPDATE ON job_bids
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- =============================================================================
-- SAMPLE QUERIES FOR TESTING
-- =============================================================================

-- Get bids for a specific homeowner job
-- SELECT * FROM homeowner_job_bids WHERE job_id = 'your-job-id';

-- Get available jobs for contractors
-- SELECT * FROM contractor_available_jobs LIMIT 10;

-- Submit a bid (example)
-- SELECT submit_job_bid(
--   'job-id',
--   'contractor-id',
--   250.00,
--   'I can fix this quickly with quality materials',
--   2,
--   NOW() + INTERVAL '2 hours',
--   true,
--   12
-- );

-- Accept a bid (example)
-- SELECT accept_job_bid('bid-id', 'homeowner-id');

SELECT 'Job bidding system created successfully!' as status;