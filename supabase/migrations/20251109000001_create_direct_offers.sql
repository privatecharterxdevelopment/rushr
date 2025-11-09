-- =============================================================================
-- DIRECT CONTRACTOR OFFERS SYSTEM
-- Allows homeowners to send direct job offers to specific contractors
-- Contractors can accept, reject, or counter-bid
-- =============================================================================

-- 1. CREATE DIRECT_OFFERS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS direct_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who is involved
  homeowner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES pro_contractors(id) ON DELETE CASCADE,

  -- Job details
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'emergency')),

  -- Location
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  zip VARCHAR(10),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Homeowner's offer
  offered_amount DECIMAL(10, 2) NOT NULL,
  estimated_duration_hours INTEGER,
  preferred_start_date TIMESTAMPTZ,
  preferred_completion_date TIMESTAMPTZ,

  -- Contractor's response
  contractor_response VARCHAR(20) DEFAULT 'pending' CHECK (
    contractor_response IN ('pending', 'accepted', 'rejected', 'counter_bid')
  ),
  counter_bid_amount DECIMAL(10, 2),
  counter_bid_duration_hours INTEGER,
  counter_bid_start_date TIMESTAMPTZ,
  counter_bid_message TEXT,

  -- Final agreement
  final_agreed_amount DECIMAL(10, 2),
  final_agreed_duration_hours INTEGER,
  homeowner_accepted_counter BOOLEAN DEFAULT false,

  -- Status tracking
  status VARCHAR(20) DEFAULT 'pending' CHECK (
    status IN ('pending', 'accepted', 'counter_bid', 'rejected', 'agreement_reached', 'cancelled')
  ),

  -- Conversion to job
  converted_to_job_id UUID REFERENCES homeowner_jobs(id) ON DELETE SET NULL,

  -- Messages/notes
  homeowner_notes TEXT,
  contractor_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '72 hours'), -- Offers expire after 72 hours

  -- Constraints
  CONSTRAINT offer_amount_positive CHECK (offered_amount > 0),
  CONSTRAINT counter_amount_positive CHECK (counter_bid_amount IS NULL OR counter_bid_amount > 0)
);

-- 2. ADD INDEXES
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_direct_offers_homeowner ON direct_offers(homeowner_id);
CREATE INDEX IF NOT EXISTS idx_direct_offers_contractor ON direct_offers(contractor_id);
CREATE INDEX IF NOT EXISTS idx_direct_offers_status ON direct_offers(status);
CREATE INDEX IF NOT EXISTS idx_direct_offers_created_at ON direct_offers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_offers_expires_at ON direct_offers(expires_at);
CREATE INDEX IF NOT EXISTS idx_direct_offers_contractor_status ON direct_offers(contractor_id, status);

-- 3. ENABLE ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------
ALTER TABLE direct_offers ENABLE ROW LEVEL SECURITY;

-- Homeowners can view and manage their own offers
CREATE POLICY "Homeowners can view their own offers" ON direct_offers
  FOR SELECT USING (auth.uid() = homeowner_id);

CREATE POLICY "Homeowners can create offers" ON direct_offers
  FOR INSERT WITH CHECK (auth.uid() = homeowner_id);

CREATE POLICY "Homeowners can update their offers" ON direct_offers
  FOR UPDATE USING (auth.uid() = homeowner_id);

-- Contractors can view all offers (simplified - can be restricted later if pro_contractors gets auth link)
CREATE POLICY "Contractors can view offers" ON direct_offers
  FOR SELECT USING (true);

-- Contractors can update all offers (simplified - can be restricted later if pro_contractors gets auth link)
CREATE POLICY "Contractors can respond to offers" ON direct_offers
  FOR UPDATE USING (true);

-- 4. CREATE FUNCTIONS
-- -----------------------------------------------------------------------------

-- Function to create a direct offer
CREATE OR REPLACE FUNCTION create_direct_offer(
  p_contractor_id UUID,
  p_title VARCHAR,
  p_description TEXT,
  p_category VARCHAR,
  p_offered_amount DECIMAL,
  p_priority VARCHAR DEFAULT 'normal',
  p_address TEXT DEFAULT NULL,
  p_city VARCHAR DEFAULT NULL,
  p_state VARCHAR DEFAULT NULL,
  p_zip VARCHAR DEFAULT NULL,
  p_latitude DECIMAL DEFAULT NULL,
  p_longitude DECIMAL DEFAULT NULL,
  p_estimated_duration_hours INTEGER DEFAULT NULL,
  p_preferred_start_date TIMESTAMPTZ DEFAULT NULL,
  p_homeowner_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_offer_id UUID;
  v_homeowner_id UUID;
BEGIN
  v_homeowner_id := auth.uid();

  IF v_homeowner_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Verify contractor exists
  IF NOT EXISTS(SELECT 1 FROM pro_contractors WHERE id = p_contractor_id) THEN
    RAISE EXCEPTION 'Contractor not found';
  END IF;

  -- Create the offer
  INSERT INTO direct_offers (
    homeowner_id,
    contractor_id,
    title,
    description,
    category,
    priority,
    address,
    city,
    state,
    zip,
    latitude,
    longitude,
    offered_amount,
    estimated_duration_hours,
    preferred_start_date,
    homeowner_notes
  ) VALUES (
    v_homeowner_id,
    p_contractor_id,
    p_title,
    p_description,
    p_category,
    p_priority,
    p_address,
    p_city,
    p_state,
    p_zip,
    p_latitude,
    p_longitude,
    p_offered_amount,
    p_estimated_duration_hours,
    p_preferred_start_date,
    p_homeowner_notes
  ) RETURNING id INTO v_offer_id;

  RETURN v_offer_id;
END;
$$;

-- Function for contractor to accept offer
CREATE OR REPLACE FUNCTION accept_direct_offer(
  p_offer_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_offer RECORD;
BEGIN
  -- Get offer details
  SELECT * INTO v_offer
  FROM direct_offers
  WHERE id = p_offer_id;

  IF v_offer.id IS NULL THEN
    RAISE EXCEPTION 'Offer not found';
  END IF;

  IF v_offer.status != 'pending' THEN
    RAISE EXCEPTION 'Offer is no longer pending';
  END IF;

  -- Update offer
  UPDATE direct_offers
  SET
    contractor_response = 'accepted',
    status = 'accepted',
    final_agreed_amount = offered_amount,
    final_agreed_duration_hours = estimated_duration_hours,
    responded_at = NOW(),
    updated_at = NOW()
  WHERE id = p_offer_id;
END;
$$;

-- Function for contractor to reject offer
CREATE OR REPLACE FUNCTION reject_direct_offer(
  p_offer_id UUID,
  p_contractor_notes TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update offer
  UPDATE direct_offers
  SET
    contractor_response = 'rejected',
    status = 'rejected',
    contractor_notes = p_contractor_notes,
    responded_at = NOW(),
    updated_at = NOW()
  WHERE id = p_offer_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Offer not found';
  END IF;
END;
$$;

-- Function for contractor to counter-bid
CREATE OR REPLACE FUNCTION counter_bid_direct_offer(
  p_offer_id UUID,
  p_counter_amount DECIMAL,
  p_counter_duration_hours INTEGER DEFAULT NULL,
  p_counter_start_date TIMESTAMPTZ DEFAULT NULL,
  p_counter_message TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update offer with counter-bid
  UPDATE direct_offers
  SET
    contractor_response = 'counter_bid',
    status = 'counter_bid',
    counter_bid_amount = p_counter_amount,
    counter_bid_duration_hours = p_counter_duration_hours,
    counter_bid_start_date = p_counter_start_date,
    counter_bid_message = p_counter_message,
    responded_at = NOW(),
    updated_at = NOW()
  WHERE id = p_offer_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Offer not found';
  END IF;
END;
$$;

-- Function for homeowner to accept counter-bid
CREATE OR REPLACE FUNCTION accept_counter_bid(
  p_offer_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update offer
  UPDATE direct_offers
  SET
    homeowner_accepted_counter = true,
    status = 'agreement_reached',
    final_agreed_amount = counter_bid_amount,
    final_agreed_duration_hours = counter_bid_duration_hours,
    updated_at = NOW()
  WHERE id = p_offer_id AND homeowner_id = auth.uid() AND status = 'counter_bid';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Offer not found, access denied, or not in counter-bid state';
  END IF;
END;
$$;

-- Function to convert accepted offer to job
CREATE OR REPLACE FUNCTION convert_offer_to_job(
  p_offer_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_offer RECORD;
  v_job_id UUID;
BEGIN
  -- Get offer details
  SELECT o.*
  INTO v_offer
  FROM direct_offers o
  WHERE o.id = p_offer_id
    AND o.homeowner_id = auth.uid()
    AND o.status IN ('accepted', 'agreement_reached');

  IF v_offer.id IS NULL THEN
    RAISE EXCEPTION 'Offer not found or not in accepted state';
  END IF;

  -- Create job
  INSERT INTO homeowner_jobs (
    homeowner_id,
    contractor_id,
    title,
    description,
    category,
    priority,
    address,
    city,
    state,
    zip,
    latitude,
    longitude,
    estimated_cost,
    status,
    source
  ) VALUES (
    v_offer.homeowner_id,
    v_offer.contractor_id, -- Use the contractor's ID directly
    v_offer.title,
    v_offer.description,
    v_offer.category,
    v_offer.priority,
    v_offer.address,
    v_offer.city,
    v_offer.state,
    v_offer.zip,
    v_offer.latitude,
    v_offer.longitude,
    v_offer.final_agreed_amount,
    'bid_accepted', -- Start in bid_accepted status
    'direct_offer'
  ) RETURNING id INTO v_job_id;

  -- Update offer with job reference
  UPDATE direct_offers
  SET
    converted_to_job_id = v_job_id,
    updated_at = NOW()
  WHERE id = p_offer_id;

  RETURN v_job_id;
END;
$$;

-- 5. CREATE TRIGGER
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_direct_offers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER direct_offers_updated_at
  BEFORE UPDATE ON direct_offers
  FOR EACH ROW
  EXECUTE FUNCTION update_direct_offers_updated_at();

-- 6. GRANT PERMISSIONS
-- -----------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE ON direct_offers TO authenticated;
GRANT EXECUTE ON FUNCTION create_direct_offer TO authenticated;
GRANT EXECUTE ON FUNCTION accept_direct_offer TO authenticated;
GRANT EXECUTE ON FUNCTION reject_direct_offer TO authenticated;
GRANT EXECUTE ON FUNCTION counter_bid_direct_offer TO authenticated;
GRANT EXECUTE ON FUNCTION accept_counter_bid TO authenticated;
GRANT EXECUTE ON FUNCTION convert_offer_to_job TO authenticated;

-- 7. ADD COMMENTS
-- -----------------------------------------------------------------------------
COMMENT ON TABLE direct_offers IS 'Direct job offers from homeowners to specific contractors';
COMMENT ON COLUMN direct_offers.contractor_response IS 'Contractor response: pending, accepted, rejected, counter_bid';
COMMENT ON COLUMN direct_offers.status IS 'Overall offer status: pending, accepted, counter_bid, rejected, agreement_reached, cancelled';
COMMENT ON COLUMN direct_offers.final_agreed_amount IS 'Final agreed amount after potential counter-bidding';

SELECT 'Direct offers system created successfully!' as status;
