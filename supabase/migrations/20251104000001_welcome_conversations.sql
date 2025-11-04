-- ============================================================================
-- WELCOME CONVERSATION SYSTEM
-- ============================================================================
-- Purpose: Automatically create welcome conversations with Rushr Support
-- for new homeowners and contractors. Welcome message appears in messages page.
-- ============================================================================

-- Define Rushr Support system user ID
-- This ID is used as a placeholder for conversations with Rushr Support
DO $$ BEGIN
  -- Just documenting the ID, no need to create in auth.users
  -- RUSHR_SUPPORT_ID = '00000000-0000-0000-0000-000000000000'
END $$;

-- ============================================================================
-- FUNCTION: Create welcome conversation for homeowners
-- ============================================================================
CREATE OR REPLACE FUNCTION create_homeowner_welcome_conversation()
RETURNS TRIGGER AS $$
DECLARE
  v_conversation_id UUID;
  v_rushr_support_id UUID := '00000000-0000-0000-0000-000000000000';
  v_welcome_message TEXT;
BEGIN
  -- Only create for homeowners
  IF NEW.role = 'homeowner' THEN

    -- Create welcome message content
    v_welcome_message := 'Hi ' || COALESCE(NEW.name, 'there') || '! 👋

Welcome to Rushr! We''re excited to help you connect with trusted local professionals for all your home service needs.

🏠 **What you can do:**
• Post jobs and get competitive bids
• Browse verified professionals in your area
• Communicate directly with contractors
• Track your projects from start to finish

💡 **Pro tip:** The more details you provide in your job posts, the better quality bids you''ll receive!

Need help getting started? Just reply to this message and our team will assist you. We''re here to make your home improvement projects smooth and stress-free!

Welcome aboard! 🚀

— The Rushr Team';

    -- Create conversation with Rushr Support
    INSERT INTO conversations (
      homeowner_id,
      pro_id,
      title,
      status,
      created_at,
      updated_at,
      last_message_at
    ) VALUES (
      NEW.id,                        -- New homeowner
      v_rushr_support_id,            -- Rushr Support
      'Welcome to Rushr! 🎉',
      'active',
      NOW(),
      NOW(),
      NOW()
    )
    ON CONFLICT (homeowner_id, pro_id, job_id) DO NOTHING
    RETURNING id INTO v_conversation_id;

    -- If conversation was created, send welcome message
    IF v_conversation_id IS NOT NULL THEN
      INSERT INTO messages (
        conversation_id,
        sender_id,
        message_type,
        content,
        created_at,
        updated_at
      ) VALUES (
        v_conversation_id,
        NULL,                        -- System message (no sender)
        'system',
        v_welcome_message,
        NOW(),
        NOW()
      );
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Create welcome conversation for contractors
-- ============================================================================
CREATE OR REPLACE FUNCTION create_contractor_welcome_conversation()
RETURNS TRIGGER AS $$
DECLARE
  v_conversation_id UUID;
  v_rushr_support_id UUID := '00000000-0000-0000-0000-000000000000';
  v_welcome_message TEXT;
BEGIN

  -- Create welcome message content
  v_welcome_message := 'Hi ' || COALESCE(NEW.name, COALESCE(NEW.business_name, 'there')) || '! 👋

Welcome to Rushr Pro! We''re thrilled to have you join our network of trusted professionals.

🔧 **Your Pro benefits:**
• Find quality jobs in your area
• Communicate directly with homeowners
• Build your reputation with reviews
• Get paid securely through our platform

⚡ **Get started:**
• Complete your profile with licenses & insurance
• Set your service areas and specialties
• Start bidding on jobs that match your skills
• Consider upgrading to Signals for premium leads

Need assistance setting up your profile or have questions? Reply anytime - our team is here to help you succeed!

Ready to grow your business? 📈

— The Rushr Team';

  -- Create conversation with Rushr Support
  INSERT INTO conversations (
    homeowner_id,
    pro_id,
    title,
    status,
    created_at,
    updated_at,
    last_message_at
  ) VALUES (
    v_rushr_support_id,              -- Rushr Support
    NEW.id,                          -- New contractor
    'Welcome to Rushr Pro! 💼',
    'active',
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (homeowner_id, pro_id, job_id) DO NOTHING
  RETURNING id INTO v_conversation_id;

  -- If conversation was created, send welcome message
  IF v_conversation_id IS NOT NULL THEN
    INSERT INTO messages (
      conversation_id,
      sender_id,
      message_type,
      content,
      created_at,
      updated_at
    ) VALUES (
      v_conversation_id,
      NULL,                          -- System message (no sender)
      'system',
      v_welcome_message,
      NOW(),
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS: Create welcome conversations on signup
-- ============================================================================

-- Trigger for homeowner signups
DROP TRIGGER IF EXISTS trigger_homeowner_welcome_conversation ON user_profiles;
CREATE TRIGGER trigger_homeowner_welcome_conversation
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_homeowner_welcome_conversation();

-- Trigger for contractor signups
DROP TRIGGER IF EXISTS trigger_contractor_welcome_conversation ON pro_contractors;
CREATE TRIGGER trigger_contractor_welcome_conversation
  AFTER INSERT ON pro_contractors
  FOR EACH ROW
  EXECUTE FUNCTION create_contractor_welcome_conversation();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION create_homeowner_welcome_conversation() TO authenticated;
GRANT EXECUTE ON FUNCTION create_contractor_welcome_conversation() TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION create_homeowner_welcome_conversation() IS
  'Creates a welcome conversation with Rushr Support when a homeowner signs up';

COMMENT ON FUNCTION create_contractor_welcome_conversation() IS
  'Creates a welcome conversation with Rushr Support when a contractor signs up';

COMMENT ON TRIGGER trigger_homeowner_welcome_conversation ON user_profiles IS
  'Automatically creates welcome conversation after homeowner profile creation';

COMMENT ON TRIGGER trigger_contractor_welcome_conversation ON pro_contractors IS
  'Automatically creates welcome conversation after contractor profile creation';
