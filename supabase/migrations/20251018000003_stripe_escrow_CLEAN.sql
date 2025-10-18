-- =============================================================================
-- STRIPE ESCROW PAYMENT SYSTEM - CLEAN VERSION WITH DROPS
-- =============================================================================

-- 1. DROP EXISTING TABLES (in reverse dependency order)
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS payment_holds CASCADE;
DROP TABLE IF EXISTS stripe_customers CASCADE;
DROP TABLE IF EXISTS stripe_connect_accounts CASCADE;

-- DROP VIEWS
DROP VIEW IF EXISTS homeowner_payment_history CASCADE;
DROP VIEW IF EXISTS contractor_earnings_history CASCADE;

-- 2. CREATE PAYMENT HOLDS TABLE
CREATE TABLE payment_holds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES homeowner_jobs(id) ON DELETE CASCADE,
    bid_id UUID NOT NULL REFERENCES job_bids(id) ON DELETE CASCADE,
    homeowner_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    contractor_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    stripe_payment_intent_id TEXT UNIQUE,
    stripe_charge_id TEXT,
    stripe_customer_id TEXT,
    amount DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) NOT NULL,
    contractor_payout DECIMAL(10,2) NOT NULL,
    stripe_fee DECIMAL(10,2),
    status TEXT CHECK (status IN (
        'pending', 'authorized', 'captured', 'released',
        'refunded', 'partial_refund', 'disputed', 'failed', 'cancelled'
    )) DEFAULT 'pending',
    homeowner_confirmed_complete BOOLEAN DEFAULT false,
    contractor_confirmed_complete BOOLEAN DEFAULT false,
    homeowner_confirmed_at TIMESTAMPTZ,
    contractor_confirmed_at TIMESTAMPTZ,
    released_at TIMESTAMPTZ,
    stripe_transfer_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(bid_id)
);

-- 3. CREATE TRANSACTIONS TABLE
CREATE TABLE transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    user_type TEXT CHECK (user_type IN ('homeowner', 'contractor')) NOT NULL,
    job_id UUID REFERENCES homeowner_jobs(id) ON DELETE SET NULL,
    bid_id UUID REFERENCES job_bids(id) ON DELETE SET NULL,
    payment_hold_id UUID REFERENCES payment_holds(id) ON DELETE SET NULL,
    type TEXT CHECK (type IN (
        'charge', 'hold', 'release', 'refund',
        'platform_fee', 'stripe_fee', 'adjustment'
    )) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')) DEFAULT 'completed',
    description TEXT NOT NULL,
    stripe_id TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CREATE STRIPE CUSTOMERS TABLE
CREATE TABLE stripe_customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE,
    stripe_customer_id TEXT NOT NULL UNIQUE,
    default_payment_method_id TEXT,
    email TEXT,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CREATE STRIPE CONNECT ACCOUNTS TABLE
CREATE TABLE stripe_connect_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contractor_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE,
    stripe_account_id TEXT NOT NULL UNIQUE,
    onboarding_complete BOOLEAN DEFAULT false,
    charges_enabled BOOLEAN DEFAULT false,
    payouts_enabled BOOLEAN DEFAULT false,
    account_type TEXT,
    country TEXT,
    email TEXT,
    requirements_currently_due TEXT[],
    requirements_eventually_due TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ADD COLUMNS TO HOMEOWNER_JOBS TABLE
ALTER TABLE homeowner_jobs
ADD COLUMN IF NOT EXISTS payment_status TEXT CHECK (payment_status IN (
    'not_required', 'pending', 'authorized', 'paid', 'released', 'refunded', 'disputed'
)) DEFAULT 'not_required',
ADD COLUMN IF NOT EXISTS payment_hold_id UUID REFERENCES payment_holds(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS escrow_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS payment_authorized_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_captured_at TIMESTAMPTZ;

-- 7. CREATE INDEXES
CREATE INDEX idx_payment_holds_job ON payment_holds(job_id);
CREATE INDEX idx_payment_holds_bid ON payment_holds(bid_id);
CREATE INDEX idx_payment_holds_homeowner ON payment_holds(homeowner_id);
CREATE INDEX idx_payment_holds_contractor ON payment_holds(contractor_id);
CREATE INDEX idx_payment_holds_status ON payment_holds(status);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_job ON transactions(job_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);

-- 8. ENABLE ROW LEVEL SECURITY
ALTER TABLE payment_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_connect_accounts ENABLE ROW LEVEL SECURITY;

-- 9. CREATE RLS POLICIES
CREATE POLICY "payment_holds_select" ON payment_holds
    FOR SELECT USING (auth.uid() = homeowner_id OR auth.uid() = contractor_id);

CREATE POLICY "payment_holds_update" ON payment_holds
    FOR UPDATE USING (auth.uid() = homeowner_id OR auth.uid() = contractor_id);

CREATE POLICY "transactions_select" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "stripe_customers_select" ON stripe_customers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "stripe_connect_select" ON stripe_connect_accounts
    FOR SELECT USING (auth.uid() = contractor_id);

-- 10. CREATE FUNCTIONS (reuse existing handle_updated_at if it exists)
CREATE OR REPLACE FUNCTION create_hold_transaction()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO transactions (user_id, user_type, job_id, bid_id, payment_hold_id, type, amount, description, stripe_id)
    VALUES (NEW.homeowner_id, 'homeowner', NEW.job_id, NEW.bid_id, NEW.id, 'hold', -NEW.amount, 'Payment held in escrow for job', NEW.stripe_payment_intent_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_release_transaction()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'released' AND (OLD.status IS NULL OR OLD.status != 'released') THEN
        INSERT INTO transactions (user_id, user_type, job_id, bid_id, payment_hold_id, type, amount, description, stripe_id)
        VALUES (NEW.contractor_id, 'contractor', NEW.job_id, NEW.bid_id, NEW.id, 'release', NEW.contractor_payout, 'Payment released from escrow', NEW.stripe_transfer_id);
        UPDATE homeowner_jobs SET payment_status = 'released' WHERE id = NEW.job_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_auto_release_payment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.homeowner_confirmed_complete = true
       AND NEW.contractor_confirmed_complete = true
       AND NEW.status = 'captured'
       AND (OLD.homeowner_confirmed_complete = false OR OLD.contractor_confirmed_complete = false)
    THEN
        NEW.status = 'released';
        NEW.released_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. CREATE TRIGGERS
CREATE TRIGGER on_payment_hold_created AFTER INSERT ON payment_holds
    FOR EACH ROW EXECUTE FUNCTION create_hold_transaction();

CREATE TRIGGER on_payment_released AFTER UPDATE ON payment_holds
    FOR EACH ROW EXECUTE FUNCTION create_release_transaction();

CREATE TRIGGER check_payment_release BEFORE UPDATE ON payment_holds
    FOR EACH ROW EXECUTE FUNCTION check_auto_release_payment();

CREATE TRIGGER update_payment_holds_updated_at BEFORE UPDATE ON payment_holds
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_stripe_customers_updated_at BEFORE UPDATE ON stripe_customers
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_stripe_connect_updated_at BEFORE UPDATE ON stripe_connect_accounts
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 12. CREATE VIEWS
CREATE VIEW homeowner_payment_history AS
SELECT
    t.id as transaction_id,
    t.user_id,
    t.created_at,
    t.type,
    t.amount,
    t.status,
    t.description,
    t.job_id,
    j.title as job_title,
    j.category as job_category
FROM transactions t
LEFT JOIN homeowner_jobs j ON t.job_id = j.id
WHERE t.user_type = 'homeowner';

CREATE VIEW contractor_earnings_history AS
SELECT
    t.id as transaction_id,
    t.user_id,
    t.created_at,
    t.type,
    t.amount,
    t.status,
    t.description,
    t.job_id,
    j.title as job_title,
    j.category as job_category
FROM transactions t
LEFT JOIN homeowner_jobs j ON t.job_id = j.id
WHERE t.user_type = 'contractor';

-- 13. GRANT PERMISSIONS
GRANT ALL ON payment_holds TO authenticated;
GRANT ALL ON transactions TO authenticated;
GRANT ALL ON stripe_customers TO authenticated;
GRANT ALL ON stripe_connect_accounts TO authenticated;
GRANT SELECT ON homeowner_payment_history TO authenticated;
GRANT SELECT ON contractor_earnings_history TO authenticated;

SELECT 'Stripe escrow system created successfully!' as status;
