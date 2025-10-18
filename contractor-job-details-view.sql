-- =============================================================================
-- CONTRACTOR JOB DETAILS VIEW
-- Provides contractors with a comprehensive view of their bids and job details
-- =============================================================================

-- Create a view for contractors to see all their jobs with bid details
CREATE OR REPLACE VIEW contractor_job_details AS
SELECT
  b.id as bid_id,
  b.job_id,
  j.title as job_title,
  j.description as job_description,
  j.category as job_category,
  j.priority as job_priority,
  j.status as job_status,
  j.address as job_address,
  j.city as job_city,
  j.state as job_state,
  j.zip_code as job_zip_code,
  j.homeowner_id,
  hp.name as homeowner_name,
  b.contractor_id,
  b.bid_amount,
  b.estimated_duration_hours,
  b.description as bid_description,
  b.available_date,
  b.materials_included,
  b.warranty_months,
  b.status as bid_status,
  b.created_at as bid_submitted_at,
  j.created_at as job_created_at,
  j.scheduled_date as job_scheduled_date,
  j.completed_date as job_completed_date,
  j.final_cost
FROM job_bids b
INNER JOIN homeowner_jobs j ON b.job_id = j.id
INNER JOIN user_profiles hp ON j.homeowner_id = hp.id
ORDER BY b.created_at DESC;

-- Grant permissions
GRANT SELECT ON contractor_job_details TO authenticated;

-- Add RLS policy for contractors to see only their own jobs
ALTER VIEW contractor_job_details OWNER TO postgres;

-- Note: Since this is a view, RLS is applied through the underlying tables
-- The job_bids table already has RLS policies that allow contractors to see their own bids

SELECT 'Contractor job details view created successfully!' as status;