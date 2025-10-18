-- =============================================================================
-- STRIPE ESCROW PAYMENT SYSTEM
-- =============================================================================
-- Handles payment holds (escrow) for job bidding system
-- When homeowner accepts bid, payment is held in escrow
-- Released to contractor when both parties confirm job completion
-- =============================================================================

-- =====================================================
-- 1. PAYMENT HOLDS TABLE (Stripe PaymentIntent)
-- =====================================================

CREATE TABLE IF NOT EXISTS payment_holds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Related entities
    job_id UUID NOT NULL REFERENCES homeowner_jobs(id) ON DELETE CASCADE,
    bid_id UUID NOT NULL REFERENCES job_bids(id) ON DELETE CASCADE,
    homeowner_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    contractor_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

    -- Stripe details
    stripe_payment_intent_id TEXT UNIQUE, -- Stripe PaymentIntent ID
    stripe_charge_id TEXT, -- Stripe Charge ID (after capture)
    stripe_customer_id TEXT, -- Homeowner's Stripe customer ID

    -- Amount details
    amount DECIMAL(10,2) NOT NULL, -- Bid amount
    platform_fee DECIMAL(10,2) NOT NULL, -- Rushr platform fee (e.g., 10%)
    contractor_payout DECIMAL(10,2) NOT NULL, -- Amount contractor receives
    stripe_fee DECIMAL(10,2), -- Stripe processing fee (2.9% + $0.30)

    -- Status tracking
    status TEXT CHECK (status IN (
        'pending',           -- Payment intent created, awaiting authorization
        'authorized',        -- Payment method authorized, funds on hold
        'captured',          -- Payment captured (charged)
        'released',          -- Funds released to contractor
        'refunded',          -- Full refund issued
        'partial_refund',    -- Partial refund issued
        'disputed',          -- Chargeback/dispute filed
        'failed',            -- Payment failed
        'cancelled'          -- Cancelled before capture
    )) DEFAULT 'pending',

    -- Job completion confirmations
    homeowner_confirmed_complete BOOLEAN DEFAULT false,
    contractor_confirmed_complete BOOLEAN DEFAULT false,
    homeowner_confirmed_at TIMESTAMPTZ,
    contractor_confirmed_at TIMESTAMPTZ,

    -- Release details
    released_at TIMESTAMPTZ,
    stripe_transfer_id TEXT, -- Stripe Transfer ID to contractor

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    UNIQUE(bid_id) -- One payment hold per bid
);

-- =====================================================
-- 2. TRANSACTIONS TABLE (Full payment history)
-- =====================================================

CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- User reference
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    user_type TEXT CHECK (user_type IN ('homeowner', 'contractor')) NOT NULL,

    -- Related entities
    job_id UUID REFERENCES homeowner_jobs(id) ON DELETE SET NULL,
    bid_id UUID REFERENCES job_bids(id) ON DELETE SET NULL,
    payment_hold_id UUID REFERENCES payment_holds(id) ON DELETE SET NULL,

    -- Transaction details
    type TEXT CHECK (type IN (
        'charge',            -- Money charged to homeowner
        'hold',              -- Money held in escrow
        'release',           -- Money released to contractor
        'refund',            -- Refund to homeowner
        'platform_fee',      -- Platform fee collected
        'stripe_fee',        -- Stripe processing fee
        'adjustment'         -- Manual adjustment
    )) NOT NULL,

    -- Amount
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',

    -- Status
    status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')) DEFAULT 'completed',

    -- Description
    description TEXT NOT NULL,

    -- Stripe reference
    stripe_id TEXT, -- Any related Stripe ID (charge, transfer, refund, etc.)

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. STRIPE CUSTOMER INFO (for storing payment methods)
-- =====================================================

CREATE TABLE IF NOT EXISTS stripe_customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE,
    stripe_customer_id TEXT NOT NULL UNIQUE,

    -- Default payment method
    default_payment_method_id TEXT,

    -- Customer details (cached from Stripe)
    email TEXT,
    name TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. STRIPE CONNECT ACCOUNTS (for contractor payouts)
-- =====================================================

CREATE TABLE IF NOT EXISTS stripe_connect_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contractor_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE,
    stripe_account_id TEXT NOT NULL UNIQUE,

    -- Onboarding status
    onboarding_complete BOOLEAN DEFAULT false,
    charges_enabled BOOLEAN DEFAULT false,
    payouts_enabled BOOLEAN DEFAULT false,

    -- Account details (cached from Stripe)
    account_type TEXT, -- standard, express, custom
    country TEXT,
    email TEXT,

    -- Requirements
    requirements_currently_due TEXT[], -- Array of fields currently due
    requirements_eventually_due TEXT[], -- Array of fields eventually due

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. UPDATE HOMEOWNER_JOBS TABLE
-- =====================================================

-- Add payment-related columns to homeowner_jobs
ALTER TABLE homeowner_jobs
ADD COLUMN IF NOT EXISTS payment_status TEXT CHECK (payment_status IN (
    'not_required',      -- Free job or no payment needed
    'pending',           -- Awaiting payment
    'authorized',        -- Payment authorized (on hold)
    'paid',              -- Payment captured and held in escrow
    'released',          -- Payment released to contractor
    'refunded',          -- Payment refunded to homeowner
    'disputed'           -- Payment disputed
)) DEFAULT 'not_required',
ADD COLUMN IF NOT EXISTS payment_hold_id UUID REFERENCES payment_holds(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS escrow_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS payment_authorized_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_captured_at TIMESTAMPTZ;

-- =====================================================
-- 6. INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_payment_holds_job ON payment_holds(job_id);
CREATE INDEX IF NOT EXISTS idx_payment_holds_bid ON payment_holds(bid_id);
CREATE INDEX IF NOT EXISTS idx_payment_holds_homeowner ON payment_holds(homeowner_id);
CREATE INDEX IF NOT EXISTS idx_payment_holds_contractor ON payment_holds(contractor_id);
CREATE INDEX IF NOT EXISTS idx_payment_holds_status ON payment_holds(status);
CREATE INDEX IF NOT EXISTS idx_payment_holds_stripe_pi ON payment_holds(stripe_payment_intent_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_job ON transactions(job_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_hold ON transactions(payment_hold_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stripe_customers_user ON stripe_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_connect_contractor ON stripe_connect_accounts(contractor_id);

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE payment_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_connect_accounts ENABLE ROW LEVEL SECURITY;

-- Payment Holds Policies
DROP POLICY IF EXISTS "Users can view their own payment holds" ON payment_holds;
CREATE POLICY "Users can view their own payment holds" ON payment_holds
    FOR SELECT USING (
        auth.uid() = homeowner_id OR auth.uid() = contractor_id
    );

DROP POLICY IF EXISTS "Users can update payment hold confirmations" ON payment_holds;
CREATE POLICY "Users can update payment hold confirmations" ON payment_holds
    FOR UPDATE USING (
        auth.uid() = homeowner_id OR auth.uid() = contractor_id
    );

-- Transactions Policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
CREATE POLICY "Users can view their own transactions" ON transactions
    FOR SELECT USING (auth.uid() = transactions.user_id);

-- Stripe Customers Policies
DROP POLICY IF EXISTS "Users can view their own stripe customer" ON stripe_customers;
CREATE POLICY "Users can view their own stripe customer" ON stripe_customers
    FOR SELECT USING (auth.uid() = stripe_customers.user_id);

-- Stripe Connect Accounts Policies
DROP POLICY IF EXISTS "Contractors can view their own connect account" ON stripe_connect_accounts;
CREATE POLICY "Contractors can view their own connect account" ON stripe_connect_accounts
    FOR SELECT USING (auth.uid() = stripe_connect_accounts.contractor_id);

-- =====================================================
-- 8. TRIGGERS & FUNCTIONS
-- =====================================================

-- Ensure handle_updated_at function exists
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create transaction when payment hold is created
CREATE OR REPLACE FUNCTION create_hold_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- Create "hold" transaction for homeowner (debit)
    INSERT INTO transactions (
        user_id,
        user_type,
        job_id,
        bid_id,
        payment_hold_id,
        type,
        amount,
        description,
        stripe_id
    ) VALUES (
        NEW.homeowner_id,
        'homeowner',
        NEW.job_id,
        NEW.bid_id,
        NEW.id,
        'hold',
        -NEW.amount, -- Negative for homeowner (they're paying)
        'Payment held in escrow for job',
        NEW.stripe_payment_intent_id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_payment_hold_created ON payment_holds;
CREATE TRIGGER on_payment_hold_created AFTER INSERT ON payment_holds
    FOR EACH ROW EXECUTE FUNCTION create_hold_transaction();

-- Create transaction when payment is released to contractor
CREATE OR REPLACE FUNCTION create_release_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- Only run when status changes to 'released'
    IF NEW.status = 'released' AND (OLD.status IS NULL OR OLD.status != 'released') THEN
        -- Create "release" transaction for contractor (credit)
        INSERT INTO transactions (
            user_id,
            user_type,
            job_id,
            bid_id,
            payment_hold_id,
            type,
            amount,
            description,
            stripe_id
        ) VALUES (
            NEW.contractor_id,
            'contractor',
            NEW.job_id,
            NEW.bid_id,
            NEW.id,
            'release',
            NEW.contractor_payout, -- Positive for contractor (they're receiving)
            'Payment released from escrow',
            NEW.stripe_transfer_id
        );

        -- Update job payment status
        UPDATE homeowner_jobs
        SET payment_status = 'released'
        WHERE id = NEW.job_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_payment_released ON payment_holds;
CREATE TRIGGER on_payment_released AFTER UPDATE ON payment_holds
    FOR EACH ROW EXECUTE FUNCTION create_release_transaction();

-- Auto-release payment when both parties confirm completion
CREATE OR REPLACE FUNCTION check_auto_release_payment()
RETURNS TRIGGER AS $$
BEGIN
    -- If both parties have confirmed and payment is captured
    IF NEW.homeowner_confirmed_complete = true
       AND NEW.contractor_confirmed_complete = true
       AND NEW.status = 'captured'
       AND (OLD.homeowner_confirmed_complete = false OR OLD.contractor_confirmed_complete = false)
    THEN
        -- Mark as ready for release (actual release happens via Stripe API)
        NEW.status = 'released';
        NEW.released_at = NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_payment_release ON payment_holds;
CREATE TRIGGER check_payment_release BEFORE UPDATE ON payment_holds
    FOR EACH ROW EXECUTE FUNCTION check_auto_release_payment();

-- Updated_at trigger for payment_holds
CREATE TRIGGER update_payment_holds_updated_at
    BEFORE UPDATE ON payment_holds
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Updated_at trigger for stripe_customers
CREATE TRIGGER update_stripe_customers_updated_at
    BEFORE UPDATE ON stripe_customers
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Updated_at trigger for stripe_connect_accounts
CREATE TRIGGER update_stripe_connect_updated_at
    BEFORE UPDATE ON stripe_connect_accounts
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- =====================================================
-- 9. VIEWS FOR EASY QUERYING
-- =====================================================

-- Homeowner payment history view
CREATE OR REPLACE VIEW homeowner_payment_history
WITH (security_invoker=true) AS
SELECT
    t.id as transaction_id,
    t.user_id,
    t.created_at,
    t.type,
    t.amount,
    t.status,
    t.description,
    t.job_id,
    t.bid_id,
    t.payment_hold_id,
    j.title as job_title,
    j.category as job_category,
    ph.status as payment_hold_status,
    ph.homeowner_confirmed_complete,
    ph.contractor_confirmed_complete,
    ph.contractor_id
FROM transactions t
LEFT JOIN homeowner_jobs j ON t.job_id = j.id
LEFT JOIN payment_holds ph ON t.payment_hold_id = ph.id
WHERE t.user_type = 'homeowner';

-- Contractor earnings view
CREATE OR REPLACE VIEW contractor_earnings_history
WITH (security_invoker=true) AS
SELECT
    t.id as transaction_id,
    t.user_id,
    t.created_at,
    t.type,
    t.amount,
    t.status,
    t.description,
    t.job_id,
    t.bid_id,
    t.payment_hold_id,
    j.title as job_title,
    j.category as job_category,
    ph.status as payment_hold_status,
    ph.homeowner_confirmed_complete,
    ph.contractor_confirmed_complete,
    ph.homeowner_id
FROM transactions t
LEFT JOIN homeowner_jobs j ON t.job_id = j.id
LEFT JOIN payment_holds ph ON t.payment_hold_id = ph.id
WHERE t.user_type = 'contractor';

-- Payment holds requiring action view
CREATE OR REPLACE VIEW payment_holds_pending_confirmation
WITH (security_invoker=true) AS
SELECT
    ph.id as payment_hold_id,
    ph.job_id,
    ph.bid_id,
    ph.homeowner_id,
    ph.contractor_id,
    ph.amount,
    ph.contractor_payout,
    ph.status,
    ph.homeowner_confirmed_complete,
    ph.contractor_confirmed_complete,
    ph.created_at,
    j.title as job_title,
    j.status as job_status
FROM payment_holds ph
JOIN homeowner_jobs j ON ph.job_id = j.id
WHERE ph.status IN ('captured', 'authorized')
  AND j.status IN ('in_progress', 'completed')
ORDER BY ph.created_at DESC;

-- =====================================================
-- 10. GRANT PERMISSIONS
-- =====================================================

GRANT ALL ON payment_holds TO authenticated;
GRANT ALL ON transactions TO authenticated;
GRANT ALL ON stripe_customers TO authenticated;
GRANT ALL ON stripe_connect_accounts TO authenticated;
GRANT SELECT ON homeowner_payment_history TO authenticated;
GRANT SELECT ON contractor_earnings_history TO authenticated;
GRANT SELECT ON payment_holds_pending_confirmation TO authenticated;

-- =====================================================
-- 11. HELPER FUNCTIONS
-- =====================================================

-- Function to calculate platform fee (10% default)
CREATE OR REPLACE FUNCTION calculate_platform_fee(bid_amount DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
    RETURN ROUND(bid_amount * 0.10, 2); -- 10% platform fee
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate contractor payout (after platform fee)
CREATE OR REPLACE FUNCTION calculate_contractor_payout(bid_amount DECIMAL)
RETURNS DECIMAL AS $$
DECLARE
    platform_fee DECIMAL;
BEGIN
    platform_fee := calculate_platform_fee(bid_amount);
    RETURN bid_amount - platform_fee;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to estimate Stripe fee (2.9% + $0.30)
CREATE OR REPLACE FUNCTION estimate_stripe_fee(amount DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
    RETURN ROUND((amount * 0.029) + 0.30, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

SELECT 'Stripe escrow system created successfully!' as status;
