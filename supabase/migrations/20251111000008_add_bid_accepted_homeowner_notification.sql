-- ============================================================================
-- BID ACCEPTED - NOTIFY HOMEOWNER TO PLACE PAYMENT
-- ============================================================================
-- When contractor's bid is accepted, notify homeowner to proceed with payment
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_homeowner_bid_accepted()
RETURNS TRIGGER AS $$
DECLARE
    v_homeowner_id UUID;
    v_contractor_name TEXT;
    v_job_title TEXT;
    v_bid_amount DECIMAL;
    v_homeowner_email TEXT;
    v_api_url TEXT;
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

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_bid_accepted_notify_homeowner ON job_bids;

-- Create trigger
CREATE TRIGGER on_bid_accepted_notify_homeowner
    AFTER UPDATE ON job_bids
    FOR EACH ROW
    EXECUTE FUNCTION notify_homeowner_bid_accepted();

COMMENT ON FUNCTION notify_homeowner_bid_accepted() IS 'Notifies homeowner via bell and email when their accepted bid requires payment';

SELECT 'Bid accepted homeowner notification created!' as status;
