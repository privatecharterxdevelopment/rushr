-- ============================================================================
-- WELCOME NOTIFICATION SYSTEM
-- ============================================================================
-- Purpose: Automatically send welcome notifications to newly registered users
-- Triggers on both homeowner and contractor signups
-- ============================================================================

-- First, update the notifications table to allow 'welcome' type
ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
ADD CONSTRAINT notifications_type_check CHECK (type IN (
    'job_request_received',
    'bid_received',
    'bid_accepted',
    'bid_rejected',
    'job_filled',
    'job_expired',
    'new_message',
    'welcome'
));

-- Function to send welcome notification to homeowners
CREATE OR REPLACE FUNCTION send_homeowner_welcome_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only send if this is a homeowner (role = 'homeowner')
  IF NEW.role = 'homeowner' THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      is_read,
      created_at
    ) VALUES (
      NEW.id,
      'welcome',
      'Welcome to Rushr! 🎉',
      'Thanks for joining Rushr! Post your first emergency job and get connected with verified professionals in minutes. Need help? Check out our quick start guide.',
      false,
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send welcome notification to contractors
CREATE OR REPLACE FUNCTION send_contractor_welcome_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    is_read,
    created_at
  ) VALUES (
    NEW.id,
    'welcome',
    'Welcome to Rushr Pro! 💼',
    'Your contractor account is ready! Start bidding on emergency jobs in your area. Complete your profile to increase your visibility to homeowners.',
    false,
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for homeowner signups (user_profiles table)
DROP TRIGGER IF EXISTS trigger_homeowner_welcome ON user_profiles;
CREATE TRIGGER trigger_homeowner_welcome
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION send_homeowner_welcome_notification();

-- Trigger for contractor signups (pro_contractors table)
DROP TRIGGER IF EXISTS trigger_contractor_welcome ON pro_contractors;
CREATE TRIGGER trigger_contractor_welcome
  AFTER INSERT ON pro_contractors
  FOR EACH ROW
  EXECUTE FUNCTION send_contractor_welcome_notification();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Allow authenticated users to receive welcome notifications
GRANT EXECUTE ON FUNCTION send_homeowner_welcome_notification() TO authenticated;
GRANT EXECUTE ON FUNCTION send_contractor_welcome_notification() TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION send_homeowner_welcome_notification() IS
  'Automatically sends a welcome notification to homeowners when they sign up';

COMMENT ON FUNCTION send_contractor_welcome_notification() IS
  'Automatically sends a welcome notification to contractors when they sign up';

COMMENT ON TRIGGER trigger_homeowner_welcome ON user_profiles IS
  'Fires after a new homeowner creates their profile';

COMMENT ON TRIGGER trigger_contractor_welcome ON pro_contractors IS
  'Fires after a new contractor creates their account';
