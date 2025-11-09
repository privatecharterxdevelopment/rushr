-- =============================================================================
-- ADD DIRECT OFFERS SUPPORT TO PAYMENT_HOLDS TABLE
-- Allow payment holds for both bids AND direct offers
-- =============================================================================

-- 1. Add offer_id column
ALTER TABLE payment_holds
ADD COLUMN IF NOT EXISTS offer_id UUID REFERENCES direct_offers(id) ON DELETE CASCADE;

-- 2. Make job_id and bid_id optional (since offers might not have a job yet)
ALTER TABLE payment_holds
ALTER COLUMN job_id DROP NOT NULL,
ALTER COLUMN bid_id DROP NOT NULL;

-- 3. Add constraint: must have either bid_id OR offer_id (not both, not neither)
ALTER TABLE payment_holds
DROP CONSTRAINT IF EXISTS payment_holds_bid_or_offer_check;

ALTER TABLE payment_holds
ADD CONSTRAINT payment_holds_bid_or_offer_check CHECK (
  (bid_id IS NOT NULL AND offer_id IS NULL) OR
  (bid_id IS NULL AND offer_id IS NOT NULL)
);

-- 4. Update unique constraint
ALTER TABLE payment_holds
DROP CONSTRAINT IF EXISTS payment_holds_bid_id_key;

-- Create unique constraint on offer_id
ALTER TABLE payment_holds
ADD CONSTRAINT payment_holds_offer_id_unique UNIQUE (offer_id);

-- Recreate unique constraint on bid_id
ALTER TABLE payment_holds
ADD CONSTRAINT payment_holds_bid_id_unique UNIQUE (bid_id);

-- 5. Create index for offer_id
CREATE INDEX IF NOT EXISTS idx_payment_holds_offer ON payment_holds(offer_id);

-- 6. Update RLS policies to allow viewing payment holds for offers
DROP POLICY IF EXISTS "Users can view their own payment holds" ON payment_holds;
CREATE POLICY "Users can view their own payment holds" ON payment_holds
  FOR SELECT USING (
    auth.uid() = homeowner_id OR
    auth.uid() = contractor_id
  );

-- 7. Add comments
COMMENT ON COLUMN payment_holds.offer_id IS 'Reference to direct_offers table (mutually exclusive with bid_id)';
COMMENT ON CONSTRAINT payment_holds_bid_or_offer_check ON payment_holds IS 'Payment must be for either a bid OR an offer, not both';

SELECT 'Payment holds now support both bids and direct offers!' as status;
