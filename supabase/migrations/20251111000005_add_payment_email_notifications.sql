-- ============================================================================
-- ADD EMAIL NOTIFICATIONS FOR PAYMENTS
-- ============================================================================
-- Enhances existing payment notification trigger to also send emails
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_users_on_payment_completed()
RETURNS TRIGGER AS $$
DECLARE
    v_homeowner_name TEXT;
    v_contractor_name TEXT;
    v_job_title TEXT;
    v_homeowner_email TEXT;
    v_contractor_email TEXT;
    v_api_url TEXT;
BEGIN
    -- Use production URL
    v_api_url := 'https://rushr-main.vercel.app';

    -- Only notify when payment status changes to 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN

        -- Get names, emails and job info
        SELECT
            hp.name,
            COALESCE(cp.business_name, cp.name),
            j.title,
            hu.email,
            cu.email
        INTO
            v_homeowner_name,
            v_contractor_name,
            v_job_title,
            v_homeowner_email,
            v_contractor_email
        FROM homeowner_jobs j
        LEFT JOIN user_profiles hp ON j.homeowner_id = hp.id
        LEFT JOIN pro_contractors cp ON NEW.contractor_id = cp.id
        LEFT JOIN auth.users hu ON j.homeowner_id = hu.id
        LEFT JOIN auth.users cu ON NEW.contractor_id = cu.id
        WHERE j.id = NEW.job_id;

        -- Create in-app notification for HOMEOWNER
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

        -- Create in-app notification for CONTRACTOR
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

        -- Send EMAIL notifications to BOTH parties (non-blocking)
        IF v_contractor_email IS NOT NULL AND v_homeowner_email IS NOT NULL THEN
            PERFORM net.http_post(
                url := v_api_url || '/api/send-payment-notification',
                headers := '{"Content-Type": "application/json"}'::jsonb,
                body := json_build_object(
                    'contractorEmail', v_contractor_email,
                    'contractorName', v_contractor_name,
                    'homeownerEmail', v_homeowner_email,
                    'homeownerName', v_homeowner_name,
                    'amount', NEW.amount,
                    'jobTitle', v_job_title,
                    'jobId', NEW.job_id
                )::jsonb
            );
        END IF;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger (already exists, but we're updating the function)
DROP TRIGGER IF EXISTS on_payment_completed_notify ON payments;
CREATE TRIGGER on_payment_completed_notify
    AFTER INSERT OR UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION notify_users_on_payment_completed();

COMMENT ON FUNCTION notify_users_on_payment_completed() IS 'Sends both in-app and email notifications when payment is completed - to BOTH homeowner and contractor';

SELECT 'Payment email notifications enabled!' as status;
