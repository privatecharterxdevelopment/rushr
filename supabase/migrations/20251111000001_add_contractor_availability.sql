-- ============================================================================
-- ADD CONTRACTOR AVAILABILITY FIELD
-- ============================================================================
-- This migration adds an 'availability' field to track contractor online/busy/offline status
-- separately from the approval status field
-- ============================================================================

-- Add availability column to pro_contractors table
ALTER TABLE pro_contractors
ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT 'offline' CHECK (availability IN ('online', 'busy', 'offline'));

-- Update existing contractors to have availability based on their current status
UPDATE pro_contractors
SET availability = CASE
  WHEN status = 'online' THEN 'online'
  WHEN status = 'approved' THEN 'offline'
  ELSE 'offline'
END
WHERE availability IS NULL;

-- Add index for faster queries on availability
CREATE INDEX IF NOT EXISTS idx_pro_contractors_availability ON pro_contractors(availability);

-- Add comment
COMMENT ON COLUMN pro_contractors.availability IS 'Contractor current availability status: online (accepting jobs), busy (on a job), offline (not accepting jobs)';
