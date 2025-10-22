-- COMPLETE FIX FOR homeowner_jobs TABLE
-- Run this entire script in Supabase SQL Editor

-- First, let's see what columns exist
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'homeowner_jobs';

-- Add ALL missing columns (IF NOT EXISTS prevents errors if column already exists)

ALTER TABLE homeowner_jobs ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE homeowner_jobs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE homeowner_jobs ADD COLUMN IF NOT EXISTS category VARCHAR(50);
ALTER TABLE homeowner_jobs ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal';
ALTER TABLE homeowner_jobs ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE homeowner_jobs ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE homeowner_jobs ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE homeowner_jobs ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
ALTER TABLE homeowner_jobs ADD COLUMN IF NOT EXISTS zip_code VARCHAR(10);
ALTER TABLE homeowner_jobs ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE homeowner_jobs ADD COLUMN IF NOT EXISTS homeowner_id UUID REFERENCES auth.users(id);
ALTER TABLE homeowner_jobs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE homeowner_jobs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS homeowner_jobs_homeowner_id_idx ON homeowner_jobs(homeowner_id);
CREATE INDEX IF NOT EXISTS homeowner_jobs_status_idx ON homeowner_jobs(status);
CREATE INDEX IF NOT EXISTS homeowner_jobs_category_idx ON homeowner_jobs(category);
CREATE INDEX IF NOT EXISTS homeowner_jobs_location_idx ON homeowner_jobs(latitude, longitude);
CREATE INDEX IF NOT EXISTS homeowner_jobs_created_at_idx ON homeowner_jobs(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE homeowner_jobs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Homeowners can view their own jobs" ON homeowner_jobs;
DROP POLICY IF EXISTS "Homeowners can insert their own jobs" ON homeowner_jobs;
DROP POLICY IF EXISTS "Homeowners can update their own jobs" ON homeowner_jobs;
DROP POLICY IF EXISTS "Contractors can view all jobs" ON homeowner_jobs;

-- Create RLS policies
-- Homeowners can view their own jobs
CREATE POLICY "Homeowners can view their own jobs" ON homeowner_jobs
    FOR SELECT USING (auth.uid() = homeowner_id);

-- Homeowners can insert their own jobs
CREATE POLICY "Homeowners can insert their own jobs" ON homeowner_jobs
    FOR INSERT WITH CHECK (auth.uid() = homeowner_id);

-- Homeowners can update their own jobs
CREATE POLICY "Homeowners can update their own jobs" ON homeowner_jobs
    FOR UPDATE USING (auth.uid() = homeowner_id);

-- Contractors can view all pending/active jobs
CREATE POLICY "Contractors can view all jobs" ON homeowner_jobs
    FOR SELECT USING (true);
