-- Create the user_profiles table to store additional user information
-- This table will be linked to Supabase Auth users

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT CHECK (role IN ('homeowner', 'contractor')) NOT NULL DEFAULT 'homeowner',
  subscription_type TEXT CHECK (subscription_type IN ('free', 'pro', 'signals')) NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read and update their own profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create policy to allow users to insert their own profile (for signup)
DROP POLICY IF EXISTS "Users can create their own profile" ON user_profiles;
CREATE POLICY "Users can create their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create a function to automatically create a user profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY definer SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, name, role, subscription_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'homeowner'),
    'free'
  );
  RETURN NEW;
END;
$$;

-- Create a trigger to call the function when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create an updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create trigger for updated_at
CREATE TRIGGER handle_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Optional: Create indexes for better performance
CREATE INDEX IF NOT EXISTS user_profiles_role_idx ON user_profiles(role);
CREATE INDEX IF NOT EXISTS user_profiles_subscription_type_idx ON user_profiles(subscription_type);
CREATE INDEX IF NOT EXISTS user_profiles_email_idx ON user_profiles(email);

-- Create contractor_profiles table for Pro users
CREATE TABLE IF NOT EXISTS contractor_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  business_name TEXT,
  phone TEXT,
  license_number TEXT,
  license_state TEXT,
  insurance_carrier TEXT,
  categories TEXT[] DEFAULT '{}',
  base_zip TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) NOT NULL DEFAULT 'pending',
  kyc_status TEXT CHECK (kyc_status IN ('not_started', 'in_progress', 'completed', 'failed')) NOT NULL DEFAULT 'not_started',
  subscription_type TEXT CHECK (subscription_type IN ('free', 'pro')) NOT NULL DEFAULT 'pro',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  profile_approved_at TIMESTAMPTZ,
  kyc_completed_at TIMESTAMPTZ
);

-- Enable RLS for contractor_profiles
ALTER TABLE contractor_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for contractor_profiles
DROP POLICY IF EXISTS "Contractors can view their own profile" ON contractor_profiles;
CREATE POLICY "Contractors can view their own profile" ON contractor_profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Contractors can update their own profile" ON contractor_profiles;
CREATE POLICY "Contractors can update their own profile" ON contractor_profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Contractors can create their own profile" ON contractor_profiles;
CREATE POLICY "Contractors can create their own profile" ON contractor_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create trigger for contractor_profiles updated_at
CREATE TRIGGER handle_contractor_profiles_updated_at
  BEFORE UPDATE ON contractor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create KYC data table for sensitive information
CREATE TABLE IF NOT EXISTS contractor_kyc_data (
  id UUID REFERENCES contractor_profiles(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  date_of_birth DATE,
  ssn_encrypted TEXT, -- Should be encrypted
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  driver_license_number TEXT,
  driver_license_state TEXT,
  bank_account_number_encrypted TEXT, -- Should be encrypted
  bank_routing_number TEXT,
  tax_id TEXT,
  identity_document_url TEXT,
  proof_of_address_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for KYC data
ALTER TABLE contractor_kyc_data ENABLE ROW LEVEL SECURITY;

-- Create policies for KYC data (very restrictive)
DROP POLICY IF EXISTS "Contractors can insert their own KYC data" ON contractor_kyc_data;
CREATE POLICY "Contractors can insert their own KYC data" ON contractor_kyc_data
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Contractors can view their own KYC data" ON contractor_kyc_data;
CREATE POLICY "Contractors can view their own KYC data" ON contractor_kyc_data
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Contractors can update their own KYC data" ON contractor_kyc_data;
CREATE POLICY "Contractors can update their own KYC data" ON contractor_kyc_data
  FOR UPDATE USING (auth.uid() = id);

-- Create trigger for KYC data updated_at
CREATE TRIGGER handle_contractor_kyc_data_updated_at
  BEFORE UPDATE ON contractor_kyc_data
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for contractor tables
CREATE INDEX IF NOT EXISTS contractor_profiles_status_idx ON contractor_profiles(status);
CREATE INDEX IF NOT EXISTS contractor_profiles_kyc_status_idx ON contractor_profiles(kyc_status);
CREATE INDEX IF NOT EXISTS contractor_profiles_categories_idx ON contractor_profiles USING GIN(categories);
CREATE INDEX IF NOT EXISTS contractor_profiles_base_zip_idx ON contractor_profiles(base_zip);