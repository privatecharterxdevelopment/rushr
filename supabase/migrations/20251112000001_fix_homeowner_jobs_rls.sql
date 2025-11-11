-- Fix RLS policies for homeowner_jobs table to allow homeowners to insert jobs

-- Drop existing policies if any
DROP POLICY IF EXISTS "Homeowners can insert their own jobs" ON homeowner_jobs;
DROP POLICY IF EXISTS "Homeowners can view their own jobs" ON homeowner_jobs;
DROP POLICY IF EXISTS "Homeowners can update their own jobs" ON homeowner_jobs;
DROP POLICY IF EXISTS "Contractors can view jobs" ON homeowner_jobs;

-- Create INSERT policy: Allow authenticated users to insert jobs with their own homeowner_id
CREATE POLICY "Homeowners can insert their own jobs"
ON homeowner_jobs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = homeowner_id);

-- Create SELECT policy: Allow homeowners to view their own jobs
CREATE POLICY "Homeowners can view their own jobs"
ON homeowner_jobs
FOR SELECT
TO authenticated
USING (auth.uid() = homeowner_id);

-- Create UPDATE policy: Allow homeowners to update their own jobs
CREATE POLICY "Homeowners can update their own jobs"
ON homeowner_jobs
FOR UPDATE
TO authenticated
USING (auth.uid() = homeowner_id)
WITH CHECK (auth.uid() = homeowner_id);

-- Create SELECT policy for contractors: Allow contractors to view all jobs
CREATE POLICY "Contractors can view jobs"
ON homeowner_jobs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM pro_contractors
    WHERE pro_contractors.id = auth.uid()
  )
);

-- Ensure RLS is enabled
ALTER TABLE homeowner_jobs ENABLE ROW LEVEL SECURITY;

-- Add comment
COMMENT ON TABLE homeowner_jobs IS 'RLS policies: Homeowners can CRUD their own jobs, Contractors can view all jobs';
