-- MINIMAL TEST - Just create transactions table and one RLS policy

CREATE TABLE IF NOT EXISTS transactions_test (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE transactions_test ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_test_select" ON transactions_test
    FOR SELECT USING (auth.uid() = user_id);

SELECT 'Test complete!' as status;
