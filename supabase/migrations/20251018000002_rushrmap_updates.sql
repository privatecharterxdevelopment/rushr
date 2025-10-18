-- =============================================================================
-- RUSHRMAP FEATURE UPDATES
-- Updates existing tables for RushrMap bidding workflow
-- =============================================================================
-- This migration UPDATES existing tables instead of creating duplicates
-- Existing: homeowner_jobs, job_bids, conversations, messages, trusted_contractors
-- =============================================================================

-- =====================================================
-- 1. UPDATE HOMEOWNER_JOBS TABLE
-- =====================================================

-- Add 10-minute expiry for emergency requests
ALTER TABLE homeowner_jobs
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS urgency TEXT CHECK (urgency IN ('emergency', 'urgent', 'flexible')) DEFAULT 'flexible',
ADD COLUMN IF NOT EXISTS location_zip TEXT; -- For map search

-- Update existing status check to include new states
ALTER TABLE homeowner_jobs DROP CONSTRAINT IF EXISTS homeowner_jobs_status_check;
ALTER TABLE homeowner_jobs ADD CONSTRAINT homeowner_jobs_status_check
  CHECK (status IN ('pending', 'bidding', 'bid_received', 'bid_accepted', 'in_progress', 'completed', 'cancelled', 'expired'));

-- Create index for expiry queries
CREATE INDEX IF NOT EXISTS idx_homeowner_jobs_expires_at ON homeowner_jobs(expires_at);
CREATE INDEX IF NOT EXISTS idx_homeowner_jobs_location_zip ON homeowner_jobs(location_zip);
CREATE INDEX IF NOT EXISTS idx_homeowner_jobs_urgency ON homeowner_jobs(urgency);

-- =====================================================
-- 2. UPDATE JOB_BIDS TABLE
-- =====================================================

-- Add bid message field (different from description - shorter response message)
ALTER TABLE job_bids
ADD COLUMN IF NOT EXISTS bid_message TEXT; -- Quick message with bid

-- Note: job_bids already has:
-- - bid_amount ✅
-- - description (contractor's proposal) ✅
-- - status (pending/accepted/rejected/withdrawn) ✅
-- - estimated_duration_hours ✅
-- - available_date ✅

-- =====================================================
-- 3. CREATE NOTIFICATIONS TABLE (NEW)
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Notification Content
    type TEXT CHECK (type IN (
        'job_request_received',
        'bid_received',
        'bid_accepted',
        'bid_rejected',
        'job_filled',
        'job_expired',
        'new_message'
    )) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,

    -- Related entities
    job_id UUID REFERENCES homeowner_jobs(id) ON DELETE CASCADE,
    bid_id UUID REFERENCES job_bids(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,

    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_job ON notifications(job_id);

-- =====================================================
-- 4. UPDATE CONVERSATIONS TABLE
-- =====================================================

-- Add proper job_id foreign key (currently TEXT, should be UUID FK)
-- First, update existing conversations to have valid job_ids or NULL
UPDATE conversations
SET job_id = NULL
WHERE job_id IS NOT NULL AND job_id::TEXT !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Now alter the column type and add foreign key
ALTER TABLE conversations
ALTER COLUMN job_id TYPE UUID USING job_id::UUID;

-- Add foreign key constraint
ALTER TABLE conversations
DROP CONSTRAINT IF EXISTS conversations_job_id_fkey;

ALTER TABLE conversations
ADD CONSTRAINT conversations_job_id_fkey
FOREIGN KEY (job_id) REFERENCES homeowner_jobs(id) ON DELETE CASCADE;

-- Add unread counts (may already exist from messaging-system-setup.sql, using IF NOT EXISTS)
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS homeowner_unread_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS contractor_unread_count INTEGER DEFAULT 0;

-- Note: conversations already has:
-- - homeowner_id ✅
-- - pro_id (same as contractor_id) ✅
-- - status ✅
-- - last_message_at ✅

-- =====================================================
-- 5. UPDATE MESSAGES TABLE
-- =====================================================

-- Add sender_type for easier querying
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS sender_type TEXT CHECK (sender_type IN ('homeowner', 'contractor'));

-- Update existing messages to set sender_type
UPDATE messages m
SET sender_type = CASE
    WHEN m.sender_id = c.homeowner_id THEN 'homeowner'
    WHEN m.sender_id = c.pro_id THEN 'contractor'
    ELSE NULL
END
FROM conversations c
WHERE m.conversation_id = c.id AND m.sender_type IS NULL;

-- Note: messages already has:
-- - conversation_id ✅
-- - sender_id ✅
-- - content (message_text) ✅
-- - read_at ✅
-- - created_at ✅

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Notifications Policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create notifications" ON notifications;
CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true); -- Notifications created by triggers/functions

-- =====================================================
-- 7. TRIGGERS & FUNCTIONS
-- =====================================================

-- Auto-expire jobs after expires_at timestamp
CREATE OR REPLACE FUNCTION expire_old_jobs()
RETURNS void AS $$
BEGIN
    UPDATE homeowner_jobs
    SET status = 'expired'
    WHERE status = 'pending'
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create notification when bid is received
CREATE OR REPLACE FUNCTION notify_homeowner_of_new_bid()
RETURNS TRIGGER AS $$
DECLARE
    v_homeowner_id UUID;
    v_contractor_name TEXT;
BEGIN
    -- Get homeowner_id and contractor name
    SELECT j.homeowner_id, up.name
    INTO v_homeowner_id, v_contractor_name
    FROM homeowner_jobs j
    JOIN user_profiles up ON up.id = NEW.contractor_id
    WHERE j.id = NEW.job_id;

    -- Create notification
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        job_id,
        bid_id
    ) VALUES (
        v_homeowner_id,
        'bid_received',
        'New Bid Received',
        v_contractor_name || ' submitted a bid of $' || NEW.bid_amount,
        NEW.job_id,
        NEW.id
    );

    -- Update job status to 'bid_received' if currently 'pending'
    UPDATE homeowner_jobs
    SET status = CASE
        WHEN status = 'pending' THEN 'bid_received'
        ELSE status
    END
    WHERE id = NEW.job_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop old trigger if exists, create new one
DROP TRIGGER IF EXISTS on_bid_created_notify ON job_bids;
CREATE TRIGGER on_bid_created_notify AFTER INSERT ON job_bids
    FOR EACH ROW EXECUTE FUNCTION notify_homeowner_of_new_bid();

-- Notify contractor when bid is accepted
CREATE OR REPLACE FUNCTION notify_contractor_bid_accepted()
RETURNS TRIGGER AS $$
DECLARE
    v_contractor_id UUID;
    v_homeowner_name TEXT;
BEGIN
    -- Only run when status changes to 'accepted'
    IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
        -- Get contractor and homeowner info
        SELECT NEW.contractor_id, up.name
        INTO v_contractor_id, v_homeowner_name
        FROM user_profiles up
        WHERE up.id = NEW.homeowner_id;

        -- Notify contractor
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            job_id,
            bid_id
        ) VALUES (
            v_contractor_id,
            'bid_accepted',
            'Bid Accepted!',
            v_homeowner_name || ' accepted your bid of $' || NEW.bid_amount,
            NEW.job_id,
            NEW.id
        );

        -- Create conversation between homeowner and contractor
        INSERT INTO conversations (
            homeowner_id,
            pro_id,
            job_id,
            title,
            status
        ) VALUES (
            NEW.homeowner_id,
            v_contractor_id,
            NEW.job_id,
            'Job Discussion',
            'active'
        )
        ON CONFLICT (homeowner_id, pro_id, job_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_bid_accepted_notify ON job_bids;
CREATE TRIGGER on_bid_accepted_notify AFTER UPDATE ON job_bids
    FOR EACH ROW EXECUTE FUNCTION notify_contractor_bid_accepted();

-- Update conversation unread counts when message is sent
CREATE OR REPLACE FUNCTION update_conversation_unread_counts()
RETURNS TRIGGER AS $$
DECLARE
    v_sender_type TEXT;
BEGIN
    -- Determine sender type
    SELECT CASE
        WHEN NEW.sender_id = c.homeowner_id THEN 'homeowner'
        WHEN NEW.sender_id = c.pro_id THEN 'contractor'
        ELSE NULL
    END INTO v_sender_type
    FROM conversations c
    WHERE c.id = NEW.conversation_id;

    -- Update unread count for recipient
    UPDATE conversations
    SET
        last_message_at = NEW.created_at,
        homeowner_unread_count = CASE
            WHEN v_sender_type = 'contractor' THEN homeowner_unread_count + 1
            ELSE homeowner_unread_count
        END,
        contractor_unread_count = CASE
            WHEN v_sender_type = 'homeowner' THEN contractor_unread_count + 1
            ELSE contractor_unread_count
        END
    WHERE id = NEW.conversation_id;

    -- Set sender_type on message
    NEW.sender_type = v_sender_type;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_message_update_unread ON messages;
CREATE TRIGGER on_message_update_unread BEFORE INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_unread_counts();

-- =====================================================
-- 8. GRANT PERMISSIONS
-- =====================================================

-- Grant access to authenticated users
GRANT ALL ON notifications TO authenticated;

-- =====================================================
-- 9. VIEWS FOR RUSHRMAP
-- =====================================================

-- View for contractors to see job requests sent to them
CREATE OR REPLACE VIEW contractor_job_requests AS
SELECT
    j.id as job_id,
    j.homeowner_id,
    j.title,
    j.description,
    j.category,
    j.urgency,
    j.priority,
    j.status,
    j.expires_at,
    j.created_at,
    j.address,
    j.city,
    j.state,
    j.location_zip,
    hp.name as homeowner_name,
    hp.phone as homeowner_phone,
    -- Check if contractor already bid
    CASE WHEN b.id IS NOT NULL THEN true ELSE false END as has_bid,
    b.id as bid_id,
    b.bid_amount as my_bid_amount,
    b.status as my_bid_status,
    -- Time remaining
    CASE
        WHEN j.expires_at IS NOT NULL AND j.expires_at > NOW()
        THEN EXTRACT(EPOCH FROM (j.expires_at - NOW()))::INTEGER
        ELSE 0
    END as seconds_remaining
FROM homeowner_jobs j
JOIN user_profiles hp ON j.homeowner_id = hp.id
LEFT JOIN job_bids b ON j.id = b.job_id AND b.contractor_id = auth.uid()
WHERE j.status IN ('pending', 'bid_received', 'bidding')
  AND (j.expires_at IS NULL OR j.expires_at > NOW())
ORDER BY
    CASE WHEN j.urgency = 'emergency' THEN 1
         WHEN j.urgency = 'urgent' THEN 2
         ELSE 3 END,
    j.created_at DESC;

GRANT SELECT ON contractor_job_requests TO authenticated;

SELECT 'RushrMap feature updates completed successfully!' as status;
