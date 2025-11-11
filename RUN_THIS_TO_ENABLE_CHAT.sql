-- ============================================================================
-- 🚀 RUN THIS IN SUPABASE SQL EDITOR TO ENABLE CHAT IMMEDIATELY
-- ============================================================================
-- This makes conversations available AS SOON AS a bid is accepted
-- Homeowner and contractor can chat immediately (don't need to wait for payment)
-- ============================================================================

-- Update the notification trigger to ALSO create conversation
CREATE OR REPLACE FUNCTION notify_homeowner_bid_accepted()
RETURNS TRIGGER AS $$
DECLARE
    v_homeowner_id UUID;
    v_contractor_name TEXT;
    v_job_title TEXT;
    v_bid_amount DECIMAL;
    v_homeowner_email TEXT;
    v_api_url TEXT;
    v_conversation_id UUID;
BEGIN
    -- Only notify when bid status changes to 'accepted'
    IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN

        -- Use production URL
        v_api_url := 'https://rushr-main.vercel.app';

        -- Get homeowner ID and bid details
        SELECT
            j.homeowner_id,
            j.title,
            COALESCE(pc.business_name, pc.name),
            NEW.bid_amount,
            hu.email
        INTO
            v_homeowner_id,
            v_job_title,
            v_contractor_name,
            v_bid_amount,
            v_homeowner_email
        FROM homeowner_jobs j
        LEFT JOIN pro_contractors pc ON NEW.contractor_id = pc.id
        LEFT JOIN auth.users hu ON j.homeowner_id = hu.id
        WHERE j.id = NEW.job_id;

        -- Create in-app notification for HOMEOWNER
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            job_id,
            bid_id
        ) VALUES (
            v_homeowner_id,
            'bid_accepted_payment_required',
            '💳 Payment Required',
            'You accepted ' || v_contractor_name || '''s bid of $' || v_bid_amount || ' for "' || v_job_title || '". Click to place payment in escrow.',
            NEW.job_id,
            NEW.id
        );

        -- Send EMAIL notification to homeowner
        IF v_homeowner_email IS NOT NULL THEN
            PERFORM net.http_post(
                url := v_api_url || '/api/send-bid-accepted-notification',
                headers := '{"Content-Type": "application/json"}'::jsonb,
                body := json_build_object(
                    'homeownerEmail', v_homeowner_email,
                    'contractorName', v_contractor_name,
                    'jobTitle', v_job_title,
                    'bidAmount', v_bid_amount,
                    'bidId', NEW.id,
                    'jobId', NEW.job_id
                )::jsonb
            );
        END IF;

        -- 🚀 NEW: Create conversation IMMEDIATELY when bid is accepted
        -- This allows homeowner and contractor to chat right away
        INSERT INTO conversations (
            homeowner_id,
            pro_id,
            job_id,
            title,
            status,
            created_at,
            updated_at
        ) VALUES (
            v_homeowner_id,
            NEW.contractor_id,
            NEW.job_id::TEXT,
            v_job_title,
            'active',
            NOW(),
            NOW()
        )
        ON CONFLICT (homeowner_id, pro_id, job_id) DO NOTHING
        RETURNING id INTO v_conversation_id;

        -- Send initial system message if new conversation was created
        IF v_conversation_id IS NOT NULL THEN
            INSERT INTO messages (
                conversation_id,
                sender_id,
                message_type,
                content,
                created_at
            ) VALUES (
                v_conversation_id,
                NULL,
                'system',
                'Bid accepted for "' || v_job_title || '" ($' || v_bid_amount || '). You can now discuss the project! Payment will be held in escrow once placed.',
                NOW()
            );
        END IF;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comment explaining the change
COMMENT ON FUNCTION notify_homeowner_bid_accepted() IS 'Notifies homeowner via bell/email AND creates conversation immediately when bid is accepted (chat enabled before payment)';

SELECT '✅ Success! Conversations now created immediately when bid is accepted!' as status;
