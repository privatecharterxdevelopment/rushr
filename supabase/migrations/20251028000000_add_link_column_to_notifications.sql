-- Migration: Add link column to notifications table
-- This adds an optional text field that can store a URL or internal path
-- associated with a specific notification.

-- ============================================================
-- Add the link column as a nullable text field
-- ============================================================

ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS link TEXT NULL;

-- Add a comment explaining the column purpose
COMMENT ON COLUMN notifications.link IS
'Optional link or URL related to the notification (e.g. /dashboard/homeowner/bids?job_id=123).';

-- ============================================================
-- Example queries for developers
-- ============================================================

-- Example: insert a notification with a link
-- INSERT INTO notifications (user_id, type, title, message, link, read, created_at)
-- VALUES ('user-uuid', 'bid_received', 'New Bid Received', 'A contractor placed a bid.', '/dashboard/homeowner/bids?job_id=123', false, NOW());

-- Example: query notifications that include a link
-- SELECT * FROM notifications WHERE link IS NOT NULL;

-- Example: update an existing notification to add a link
-- UPDATE notifications SET link = '/dashboard/homeowner/bids?job_id=456' WHERE id = 'notification-id';