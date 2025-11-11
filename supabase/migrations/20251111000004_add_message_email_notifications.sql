-- ============================================================================
-- ADD EMAIL NOTIFICATIONS FOR MESSAGES
-- ============================================================================
-- Enhances existing message notification trigger to also send emails
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_user_on_new_message()
RETURNS TRIGGER AS $$
DECLARE
    v_recipient_id UUID;
    v_sender_name TEXT;
    v_conversation_title TEXT;
    v_recipient_email TEXT;
    v_message_preview TEXT;
    v_api_url TEXT;
BEGIN
    -- Use production URL
    v_api_url := 'https://rushr-main.vercel.app';

    -- Truncate message for preview
    v_message_preview := CASE
        WHEN LENGTH(NEW.content) > 100 THEN SUBSTRING(NEW.content FROM 1 FOR 100) || '...'
        ELSE NEW.content
    END;

    -- Determine recipient (opposite of sender)
    SELECT
        CASE
            WHEN NEW.sender_type = 'homeowner' THEN c.pro_id
            WHEN NEW.sender_type = 'contractor' THEN c.homeowner_id
            ELSE NULL
        END,
        CASE
            WHEN NEW.sender_type = 'homeowner' THEN hp.name
            WHEN NEW.sender_type = 'contractor' THEN COALESCE(cp.business_name, cp.name)
            ELSE 'Someone'
        END,
        j.title
    INTO v_recipient_id, v_sender_name, v_conversation_title
    FROM conversations c
    LEFT JOIN homeowner_jobs j ON c.job_id = j.id
    LEFT JOIN user_profiles hp ON c.homeowner_id = hp.id
    LEFT JOIN pro_contractors cp ON c.pro_id = cp.id
    WHERE c.id = NEW.conversation_id;

    -- Get recipient email
    SELECT email INTO v_recipient_email
    FROM auth.users
    WHERE id = v_recipient_id;

    -- Only proceed if we found a recipient
    IF v_recipient_id IS NOT NULL THEN
        -- Create in-app bell notification
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

        -- Send email notification (non-blocking)
        IF v_recipient_email IS NOT NULL THEN
            PERFORM net.http_post(
                url := v_api_url || '/api/send-message-notification',
                headers := '{"Content-Type": "application/json"}'::jsonb,
                body := json_build_object(
                    'recipientEmail', v_recipient_email,
                    'recipientName', (SELECT name FROM user_profiles WHERE id = v_recipient_id LIMIT 1),
                    'senderName', v_sender_name,
                    'jobTitle', v_conversation_title,
                    'messagePreview', v_message_preview,
                    'conversationId', NEW.conversation_id
                )::jsonb
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger (already exists, but we're updating the function)
DROP TRIGGER IF EXISTS on_message_notify_recipient ON messages;
CREATE TRIGGER on_message_notify_recipient
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION notify_user_on_new_message();

COMMENT ON FUNCTION notify_user_on_new_message() IS 'Sends both in-app and email notifications when a new message is received';

SELECT 'Message email notifications enabled!' as status;
