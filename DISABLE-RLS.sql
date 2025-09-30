-- Disable RLS on all tables to bypass permission issues
-- Run this in your Supabase SQL Editor

-- Disable RLS on user_profiles (if it exists)
ALTER TABLE IF EXISTS user_profiles DISABLE ROW LEVEL SECURITY;

-- Disable RLS on pro_contractors (if it exists)
ALTER TABLE IF EXISTS pro_contractors DISABLE ROW LEVEL SECURITY;

-- Disable RLS on contractor_profiles (if it exists)
ALTER TABLE IF EXISTS contractor_profiles DISABLE ROW LEVEL SECURITY;

-- Disable RLS on pro_kyc_data (if it exists)
ALTER TABLE IF EXISTS pro_kyc_data DISABLE ROW LEVEL SECURITY;

-- Disable RLS on pro_documents (if it exists)
ALTER TABLE IF EXISTS pro_documents DISABLE ROW LEVEL SECURITY;

-- Check what tables exist
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;