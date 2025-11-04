-- ============================================================================
-- FIX WELCOME NOTIFICATION DUPLICATES
-- ============================================================================
-- Purpose: Prevent duplicate welcome notifications
-- Only send welcome notification if one doesn't already exist for the user
-- ============================================================================

-- Updated function to send welcome notification to homeowners (with duplicate check)
CREATE OR REPLACE FUNCTION send_homeowner_welcome_notification()
RETURNS TRIGGER AS $$
DECLARE
  existing_welcome_count INTEGER;
BEGIN
  -- Only send if this is a homeowner (role = 'homeowner')
  IF NEW.role = 'homeowner' THEN
    -- Check if a welcome notification already exists for this user
    SELECT COUNT(*) INTO existing_welcome_count
    FROM notifications
    WHERE user_id = NEW.id AND type = 'welcome';

    -- Only insert if no welcome notification exists
    IF existing_welcome_count = 0 THEN
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        read,
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
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated function to send welcome notification to contractors (with duplicate check)
CREATE OR REPLACE FUNCTION send_contractor_welcome_notification()
RETURNS TRIGGER AS $$
DECLARE
  existing_welcome_count INTEGER;
BEGIN
  -- Check if a welcome notification already exists for this contractor
  SELECT COUNT(*) INTO existing_welcome_count
  FROM notifications
  WHERE user_id = NEW.id AND type = 'welcome';

  -- Only insert if no welcome notification exists
  IF existing_welcome_count = 0 THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      read,
      created_at
    ) VALUES (
      NEW.id,
      'welcome',
      'Welcome to Rushr Pro! 💼',
      'Your contractor account is ready! Start bidding on emergency jobs in your area. Complete your profile to increase your visibility to homeowners.',
      false,
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CLEAN UP EXISTING DUPLICATES
-- ============================================================================

-- Remove duplicate welcome notifications, keeping only the oldest one per user
DELETE FROM notifications
WHERE id NOT IN (
  SELECT MIN(id)
  FROM notifications
  WHERE type = 'welcome'
  GROUP BY user_id
) AND type = 'welcome';

SELECT 'Welcome notification duplicate prevention added!' as status;
