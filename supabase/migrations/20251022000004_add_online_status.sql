-- Add 'online' to the pro_contractor_status enum

-- Check if the enum type exists and add 'online' status
DO $$
BEGIN
    -- Add 'online' to the enum if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'online'
        AND enumtypid = 'pro_contractor_status'::regtype
    ) THEN
        ALTER TYPE pro_contractor_status ADD VALUE 'online';
    END IF;
END $$;

-- Also add 'pending_approval' if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'pending_approval'
        AND enumtypid = 'pro_contractor_status'::regtype
    ) THEN
        ALTER TYPE pro_contractor_status ADD VALUE 'pending_approval';
    END IF;
END $$;
