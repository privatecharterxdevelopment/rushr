-- ============================================================================
-- REMOVE EMAIL TRIGGERS (They're causing signup failures)
-- ============================================================================
-- Purpose: Remove database triggers for emails since we're now handling
--          email notifications in the application code instead
-- ============================================================================

-- Drop all email-related triggers
DROP TRIGGER IF EXISTS trigger_send_homeowner_welcome_email ON user_profiles;
DROP TRIGGER IF EXISTS trigger_send_contractor_welcome_email ON pro_contractors;
DROP TRIGGER IF EXISTS trigger_send_bid_received_email ON job_bids;
DROP TRIGGER IF EXISTS trigger_send_bid_accepted_email ON homeowner_jobs;

-- Drop the functions as well (optional, but clean)
DROP FUNCTION IF EXISTS send_homeowner_welcome_email();
DROP FUNCTION IF EXISTS send_contractor_welcome_email();
DROP FUNCTION IF EXISTS send_bid_received_email();
DROP FUNCTION IF EXISTS send_bid_accepted_email();

-- Comment
COMMENT ON SCHEMA public IS 'Email notifications are now handled in application code via API routes instead of database triggers';
