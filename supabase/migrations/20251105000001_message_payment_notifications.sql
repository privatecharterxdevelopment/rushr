-- =============================================================================
-- MESSAGE AND PAYMENT NOTIFICATIONS
-- Automatically create bell notifications when messages are sent or payments completed
-- =============================================================================

-- =====================================================
-- 1. CREATE NOTIFICATION TRIGGER FOR NEW MESSAGES
-- =====================================================

CREATE OR REPLACE FUNCTION notify_user_on_new_message()
RETURNS TRIGGER AS $$
DECLARE
    v_recipient_id UUID;
    v_sender_name TEXT;
    v_conversation_title TEXT;
BEGIN
    -- Determine recipient (opposite of sender)
    SELECT
        CASE
            WHEN NEW.sender_type = 'homeowner' THEN c.pro_id
            WHEN NEW.sender_type = 'contractor' THEN c.homeowner_id
            ELSE NULL
        END,
        CASE
            WHEN NEW.sender_type = 'homeowner' THEN hp.name
            WHEN NEW.sender_type = 'contractor' THEN cp.business_name
            ELSE 'Someone'
        END,
        j.title
    INTO v_recipient_id, v_sender_name, v_conversation_title
    FROM conversations c
    LEFT JOIN homeowner_jobs j ON c.job_id = j.id
    LEFT JOIN user_profiles hp ON c.homeowner_id = hp.id
    LEFT JOIN pro_contractors cp ON c.pro_id = cp.id
    WHERE c.id = NEW.conversation_id;

    -- Only create notification if we found a recipient
    IF v_recipient_id IS NOT NULL THEN
        -- Create notification for recipient
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            conversation_id
        ) VALUES (
            v_recipient_id,
            'new_message',
            'New Message',
            v_sender_name || ' sent you a message about "' || COALESCE(v_conversation_title, 'your job') || '"',
            NEW.conversation_id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_message_notify_recipient ON messages;

-- Create trigger on messages table
CREATE TRIGGER on_message_notify_recipient
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION notify_user_on_new_message();

-- =====================================================
-- 2. CREATE NOTIFICATION TRIGGER FOR PAYMENTS
-- =====================================================

-- First, let's check if payments table exists, if not we'll create a placeholder
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
        -- Create payments table if it doesn't exist
        CREATE TABLE payments (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            job_id UUID REFERENCES homeowner_jobs(id) ON DELETE CASCADE,
            homeowner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            contractor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            amount DECIMAL(10, 2) NOT NULL,
            status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
            payment_method TEXT,
            stripe_payment_intent_id TEXT,
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX idx_payments_job_id ON payments(job_id);
        CREATE INDEX idx_payments_homeowner_id ON payments(homeowner_id);
        CREATE INDEX idx_payments_contractor_id ON payments(contractor_id);
        CREATE INDEX idx_payments_status ON payments(status);

        -- Enable RLS
        ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

        -- RLS Policies
        CREATE POLICY "Users can view their own payments" ON payments
            FOR SELECT USING (
                auth.uid() = homeowner_id OR
                auth.uid() = contractor_id
            );

        CREATE POLICY "Homeowners can create payments" ON payments
            FOR INSERT WITH CHECK (auth.uid() = homeowner_id);

        CREATE POLICY "Users can update their own payments" ON payments
            FOR UPDATE USING (
                auth.uid() = homeowner_id OR
                auth.uid() = contractor_id
            );
    END IF;
END $$;

-- Create notification function for payment completion
CREATE OR REPLACE FUNCTION notify_users_on_payment_completed()
RETURNS TRIGGER AS $$
DECLARE
    v_homeowner_name TEXT;
    v_contractor_name TEXT;
    v_job_title TEXT;
BEGIN
    -- Only notify when payment status changes to 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN

        -- Get names and job info
        SELECT
            hp.name,
            cp.business_name,
            j.title
        INTO
            v_homeowner_name,
            v_contractor_name,
            v_job_title
        FROM homeowner_jobs j
        LEFT JOIN user_profiles hp ON j.homeowner_id = hp.id
        LEFT JOIN pro_contractors cp ON NEW.contractor_id = cp.id
        WHERE j.id = NEW.job_id;

        -- Notify homeowner
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            job_id
        ) VALUES (
            NEW.homeowner_id,
            'payment_completed',
            'Payment Confirmed',
            'Your payment of $' || NEW.amount || ' for "' || COALESCE(v_job_title, 'your job') || '" has been processed.',
            NEW.job_id
        );

        -- Notify contractor
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            job_id
        ) VALUES (
            NEW.contractor_id,
            'payment_completed',
            'Payment Received',
            v_homeowner_name || ' completed payment of $' || NEW.amount || ' for "' || COALESCE(v_job_title, 'the job') || '".',
            NEW.job_id
        );

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_payment_completed_notify ON payments;

-- Create trigger on payments table
CREATE TRIGGER on_payment_completed_notify
    AFTER INSERT OR UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION notify_users_on_payment_completed();

-- =====================================================
-- 3. GRANT PERMISSIONS
-- =====================================================

GRANT ALL ON payments TO authenticated;

-- =====================================================
-- 4. UPDATE NOTIFICATIONS TABLE IF NEEDED
-- =====================================================

-- Make sure notifications table has the payment_completed type
DO $$
BEGIN
    -- Check if the type constraint exists and update it
    ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
    ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
        CHECK (type IN (
            'job_request_received',
            'bid_received',
            'bid_accepted',
            'bid_rejected',
            'job_filled',
            'job_expired',
            'new_message',
            'payment_completed',
            'welcome',
            'success',
            'warning',
            'info'
        ));
END $$;

SELECT 'Message and payment notifications setup completed!' as status;
