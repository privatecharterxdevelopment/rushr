-- ============================================================================
-- ADD ALL MISSING NOTIFICATION TRIGGERS
-- ============================================================================
-- Adds notifications for: work status, cancellations, profile approval,
-- job matching, bid rejection, and reviews
-- ============================================================================

-- =====================================================
-- 1. WORK STATUS NOTIFICATIONS (Started/Completed)
-- =====================================================

CREATE OR REPLACE FUNCTION notify_work_status_change()
RETURNS TRIGGER AS $$
DECLARE
    v_homeowner_id UUID;
    v_contractor_id UUID;
    v_homeowner_name TEXT;
    v_contractor_name TEXT;
    v_job_title TEXT;
BEGIN
    -- Get job and user info
    SELECT
        j.homeowner_id,
        j.title,
        hp.name,
        COALESCE(cp.business_name, cp.name)
    INTO
        v_homeowner_id,
        v_job_title,
        v_homeowner_name,
        v_contractor_name
    FROM homeowner_jobs j
    LEFT JOIN user_profiles hp ON j.homeowner_id = hp.id
    LEFT JOIN job_bids b ON b.job_id = j.id AND b.status = 'accepted'
    LEFT JOIN pro_contractors cp ON b.contractor_id = cp.id
    WHERE j.id = NEW.id;

    -- Get contractor_id from accepted bid
    SELECT contractor_id INTO v_contractor_id
    FROM job_bids
    WHERE job_id = NEW.id AND status = 'accepted'
    LIMIT 1;

    -- WORK STARTED
    IF NEW.status = 'in_progress' AND (OLD.status IS NULL OR OLD.status != 'in_progress') THEN

        -- Notify HOMEOWNER
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            job_id
        ) VALUES (
            v_homeowner_id,
            'work_started',
            'Work Started',
            v_contractor_name || ' has started working on "' || v_job_title || '"',
            NEW.id
        );

        -- Notify CONTRACTOR (confirmation)
        IF v_contractor_id IS NOT NULL THEN
            INSERT INTO notifications (
                user_id,
                type,
                title,
                message,
                job_id
            ) VALUES (
                v_contractor_id,
                'work_started',
                'Work Started',
                'You marked "' || v_job_title || '" as started',
                NEW.id
            );
        END IF;

    END IF;

    -- WORK COMPLETED
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN

        -- Notify HOMEOWNER
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            job_id
        ) VALUES (
            v_homeowner_id,
            'work_completed',
            'Work Completed',
            v_contractor_name || ' has completed "' || v_job_title || '". Please review their work!',
            NEW.id
        );

        -- Notify CONTRACTOR
        IF v_contractor_id IS NOT NULL THEN
            INSERT INTO notifications (
                user_id,
                type,
                title,
                message,
                job_id
            ) VALUES (
                v_contractor_id,
                'work_completed',
                'Work Completed',
                'You marked "' || v_job_title || '" as completed. Waiting for homeowner confirmation.',
                NEW.id
            );
        END IF;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_work_status_change ON homeowner_jobs;
CREATE TRIGGER on_work_status_change
    AFTER UPDATE ON homeowner_jobs
    FOR EACH ROW
    EXECUTE FUNCTION notify_work_status_change();

-- =====================================================
-- 2. JOB CANCELLED NOTIFICATIONS
-- =====================================================

CREATE OR REPLACE FUNCTION notify_job_cancelled()
RETURNS TRIGGER AS $$
DECLARE
    v_homeowner_id UUID;
    v_contractor_id UUID;
    v_homeowner_name TEXT;
    v_contractor_name TEXT;
    v_job_title TEXT;
BEGIN
    -- Only trigger when status changes to 'cancelled'
    IF NEW.status = 'cancelled' AND (OLD.status IS NULL OR OLD.status != 'cancelled') THEN

        -- Get job and user info
        SELECT
            j.homeowner_id,
            j.title,
            hp.name
        INTO
            v_homeowner_id,
            v_job_title,
            v_homeowner_name
        FROM homeowner_jobs j
        LEFT JOIN user_profiles hp ON j.homeowner_id = hp.id
        WHERE j.id = NEW.id;

        -- Get contractor_id and name from accepted bid
        SELECT
            b.contractor_id,
            COALESCE(cp.business_name, cp.name)
        INTO
            v_contractor_id,
            v_contractor_name
        FROM job_bids b
        LEFT JOIN pro_contractors cp ON b.contractor_id = cp.id
        WHERE b.job_id = NEW.id AND b.status = 'accepted'
        LIMIT 1;

        -- Notify CONTRACTOR (if there was an accepted bid)
        IF v_contractor_id IS NOT NULL THEN
            INSERT INTO notifications (
                user_id,
                type,
                title,
                message,
                job_id
            ) VALUES (
                v_contractor_id,
                'job_cancelled',
                'Job Cancelled',
                v_homeowner_name || ' cancelled the job "' || v_job_title || '"',
                NEW.id
            );
        END IF;

        -- Notify all contractors who bid (but weren't accepted)
        INSERT INTO notifications (user_id, type, title, message, job_id)
        SELECT
            b.contractor_id,
            'job_cancelled',
            'Job Cancelled',
            'Job "' || v_job_title || '" was cancelled by the homeowner',
            NEW.id
        FROM job_bids b
        WHERE b.job_id = NEW.id
        AND b.status != 'accepted'
        AND b.contractor_id != COALESCE(v_contractor_id, '00000000-0000-0000-0000-000000000000'::uuid);

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_job_cancelled ON homeowner_jobs;
CREATE TRIGGER on_job_cancelled
    AFTER UPDATE ON homeowner_jobs
    FOR EACH ROW
    EXECUTE FUNCTION notify_job_cancelled();

-- =====================================================
-- 3. BID REJECTED/WITHDRAWN NOTIFICATIONS
-- =====================================================

CREATE OR REPLACE FUNCTION notify_bid_status_change()
RETURNS TRIGGER AS $$
DECLARE
    v_homeowner_name TEXT;
    v_contractor_name TEXT;
    v_job_title TEXT;
BEGIN
    -- BID REJECTED
    IF NEW.status = 'rejected' AND (OLD.status IS NULL OR OLD.status != 'rejected') THEN

        SELECT
            up.name,
            COALESCE(cp.business_name, cp.name),
            j.title
        INTO
            v_homeowner_name,
            v_contractor_name,
            v_job_title
        FROM user_profiles up
        LEFT JOIN pro_contractors cp ON NEW.contractor_id = cp.id
        LEFT JOIN homeowner_jobs j ON NEW.job_id = j.id
        WHERE up.id = NEW.homeowner_id;

        -- Notify CONTRACTOR
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            job_id,
            bid_id
        ) VALUES (
            NEW.contractor_id,
            'bid_rejected',
            'Bid Not Selected',
            v_homeowner_name || ' selected another contractor for "' || v_job_title || '"',
            NEW.job_id,
            NEW.id
        );

    END IF;

    -- BID WITHDRAWN
    IF NEW.status = 'withdrawn' AND (OLD.status IS NULL OR OLD.status != 'withdrawn') THEN

        SELECT
            up.name,
            COALESCE(cp.business_name, cp.name),
            j.title
        INTO
            v_homeowner_name,
            v_contractor_name,
            v_job_title
        FROM user_profiles up
        LEFT JOIN pro_contractors cp ON NEW.contractor_id = cp.id
        LEFT JOIN homeowner_jobs j ON NEW.job_id = j.id
        WHERE up.id = NEW.homeowner_id;

        -- Notify HOMEOWNER
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            job_id,
            bid_id
        ) VALUES (
            NEW.homeowner_id,
            'bid_withdrawn',
            'Bid Withdrawn',
            v_contractor_name || ' withdrew their bid for "' || v_job_title || '"',
            NEW.job_id,
            NEW.id
        );

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_bid_status_change ON job_bids;
CREATE TRIGGER on_bid_status_change
    AFTER UPDATE ON job_bids
    FOR EACH ROW
    EXECUTE FUNCTION notify_bid_status_change();

-- =====================================================
-- 4. PROFILE APPROVED NOTIFICATION
-- =====================================================

CREATE OR REPLACE FUNCTION notify_profile_approved()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger when status changes to 'approved'
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN

        INSERT INTO notifications (
            user_id,
            type,
            title,
            message
        ) VALUES (
            NEW.id,
            'profile_approved',
            '🎉 Profile Approved!',
            'Congratulations! Your contractor profile has been approved. You can now start accepting jobs and earning money!'
        );

    END IF;

    -- Status changed to 'rejected'
    IF NEW.status = 'rejected' AND (OLD.status IS NULL OR OLD.status != 'rejected') THEN

        INSERT INTO notifications (
            user_id,
            type,
            title,
            message
        ) VALUES (
            NEW.id,
            'profile_rejected',
            'Profile Needs Attention',
            'Your profile submission needs some updates. Please check your email for details or contact support.'
        );

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profile_status_change ON pro_contractors;
CREATE TRIGGER on_profile_status_change
    AFTER UPDATE ON pro_contractors
    FOR EACH ROW
    EXECUTE FUNCTION notify_profile_approved();

-- =====================================================
-- 5. NEW JOB POSTED IN AREA (Matching Contractors)
-- =====================================================

CREATE OR REPLACE FUNCTION notify_contractors_new_job()
RETURNS TRIGGER AS $$
DECLARE
    v_matching_contractor RECORD;
    v_homeowner_name TEXT;
BEGIN
    -- Only trigger for new jobs in 'pending' or 'bidding' status
    IF NEW.status IN ('pending', 'bidding') AND (TG_OP = 'INSERT' OR OLD.status NOT IN ('pending', 'bidding')) THEN

        -- Get homeowner name
        SELECT name INTO v_homeowner_name
        FROM user_profiles
        WHERE id = NEW.homeowner_id;

        -- Find contractors in the job's service area who match the category
        FOR v_matching_contractor IN
            SELECT DISTINCT pc.id, COALESCE(pc.business_name, pc.name) as contractor_name
            FROM pro_contractors pc
            WHERE pc.status = 'approved'
            AND pc.kyc_status = 'completed'
            AND (
                -- Check if job zip is in contractor's service area
                NEW.location_zip = ANY(pc.service_area_zips)
                OR NEW.zip_code = ANY(pc.service_area_zips)
                OR pc.base_zip = NEW.location_zip
                OR pc.base_zip = NEW.zip_code
            )
            AND (
                -- Check if job category matches contractor's categories
                NEW.category = ANY(pc.categories)
                OR pc.categories IS NULL
                OR array_length(pc.categories, 1) IS NULL
            )
            LIMIT 50 -- Don't spam too many contractors
        LOOP
            -- Create notification for each matching contractor
            INSERT INTO notifications (
                user_id,
                type,
                title,
                message,
                job_id
            ) VALUES (
                v_matching_contractor.id,
                'new_job_posted',
                '💼 New Job in Your Area',
                v_homeowner_name || ' posted a ' || COALESCE(NEW.category, 'job') || ' job: "' || NEW.title || '"',
                NEW.id
            );
        END LOOP;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_new_job_notify_contractors ON homeowner_jobs;
CREATE TRIGGER on_new_job_notify_contractors
    AFTER INSERT OR UPDATE ON homeowner_jobs
    FOR EACH ROW
    EXECUTE FUNCTION notify_contractors_new_job();

-- =====================================================
-- 6. REVIEW RECEIVED NOTIFICATION
-- =====================================================

-- Create review notification function (will only work if reviews table exists)
CREATE OR REPLACE FUNCTION notify_review_received()
RETURNS TRIGGER AS $$
DECLARE
    v_reviewer_name TEXT;
    v_contractor_name TEXT;
BEGIN
    -- Get reviewer name
    SELECT name INTO v_reviewer_name
    FROM user_profiles
    WHERE id = NEW.reviewer_id;

    -- Get contractor name
    SELECT COALESCE(business_name, name) INTO v_contractor_name
    FROM pro_contractors
    WHERE id = NEW.contractor_id;

    -- Notify CONTRACTOR of new review
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message
    ) VALUES (
        NEW.contractor_id,
        'review_received',
        '⭐ New Review',
        v_reviewer_name || ' left you a ' || NEW.rating || '-star review!' ||
        CASE WHEN NEW.rating >= 4 THEN ' Great job!' ELSE '' END
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only create trigger if reviews table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
        DROP TRIGGER IF EXISTS on_review_created ON reviews;
        CREATE TRIGGER on_review_created
            AFTER INSERT ON reviews
            FOR EACH ROW
            EXECUTE FUNCTION notify_review_received();
    END IF;
END $$;

-- =====================================================
-- 7. UPDATE NOTIFICATIONS TABLE TYPE CONSTRAINT
-- =====================================================

-- Add all new notification types to the constraint
DO $$
BEGIN
    ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

    ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
        CHECK (type IN (
            'job_request_received',
            'bid_received',
            'bid_accepted',
            'bid_rejected',
            'bid_withdrawn',
            'job_filled',
            'job_expired',
            'job_cancelled',
            'new_message',
            'payment_completed',
            'work_started',
            'work_completed',
            'profile_approved',
            'profile_rejected',
            'new_job_posted',
            'review_received',
            'welcome',
            'success',
            'warning',
            'info'
        ));
EXCEPTION
    WHEN check_violation THEN
        RAISE NOTICE 'Could not add type constraint due to existing data';
END $$;

-- =====================================================
-- 8. COMMENTS
-- =====================================================

COMMENT ON FUNCTION notify_work_status_change() IS 'Notifies both homeowner and contractor when work starts or completes';
COMMENT ON FUNCTION notify_job_cancelled() IS 'Notifies contractors when a job is cancelled';
COMMENT ON FUNCTION notify_bid_status_change() IS 'Notifies when bids are rejected or withdrawn';
COMMENT ON FUNCTION notify_profile_approved() IS 'Notifies contractor when their profile is approved/rejected';
COMMENT ON FUNCTION notify_contractors_new_job() IS 'Notifies matching contractors when a new job is posted in their area';

SELECT 'All missing notification triggers added successfully! 🎉' as status;
