-- Create job_bids table for contractor bids on homeowner jobs

CREATE TABLE IF NOT EXISTS job_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES homeowner_jobs(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES pro_contractors(id) ON DELETE CASCADE,
  homeowner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Bid details
  bid_amount DECIMAL(10, 2),
  estimated_duration INTEGER, -- in minutes
  message TEXT,

  -- Status tracking
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, rejected, withdrawn

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn'))
);

-- Add indexes
CREATE INDEX IF NOT EXISTS job_bids_job_id_idx ON job_bids(job_id);
CREATE INDEX IF NOT EXISTS job_bids_contractor_id_idx ON job_bids(contractor_id);
CREATE INDEX IF NOT EXISTS job_bids_homeowner_id_idx ON job_bids(homeowner_id);
CREATE INDEX IF NOT EXISTS job_bids_status_idx ON job_bids(status);
CREATE INDEX IF NOT EXISTS job_bids_created_at_idx ON job_bids(created_at DESC);

-- Enable RLS
ALTER TABLE job_bids ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Homeowners can view bids on their jobs
CREATE POLICY "Homeowners can view bids on their jobs" ON job_bids
    FOR SELECT USING (auth.uid() = homeowner_id);

-- Contractors can view their own bids
CREATE POLICY "Contractors can view their own bids" ON job_bids
    FOR SELECT USING (auth.uid() = contractor_id);

-- Contractors can insert bids
CREATE POLICY "Contractors can insert bids" ON job_bids
    FOR INSERT WITH CHECK (auth.uid() = contractor_id);

-- Contractors can update their own bids
CREATE POLICY "Contractors can update own bids" ON job_bids
    FOR UPDATE USING (auth.uid() = contractor_id);

-- Homeowners can update bid status (accept/reject)
CREATE POLICY "Homeowners can update bid status" ON job_bids
    FOR UPDATE USING (auth.uid() = homeowner_id);

-- Comments
COMMENT ON TABLE job_bids IS 'Contractor bids on homeowner emergency jobs';
COMMENT ON COLUMN job_bids.status IS 'Bid status: pending, accepted, rejected, withdrawn';
COMMENT ON COLUMN job_bids.bid_amount IS 'Contractor bid amount in dollars';
COMMENT ON COLUMN job_bids.estimated_duration IS 'Estimated job duration in minutes';
