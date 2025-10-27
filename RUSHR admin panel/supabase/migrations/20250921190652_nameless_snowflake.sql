/*
  # RUSHR Admin Dashboard Database Schema

  1. New Tables
    - `profiles` - User profiles with role management
    - `kyc_documents` - KYC document management
    - `subscription_plans` - Available subscription plans
    - `user_subscriptions` - User subscription tracking
    - `payments` - Payment transactions between parties
    - `auftrags` (jobs) - Job/contract management
    - `job_locations` - Location tracking for jobs
    - `support_entries` - Support ticket system

  2. Security
    - Enable RLS on all tables
    - Add comprehensive policies for admin access
    - Secure file storage for KYC documents

  3. Storage
    - Create bucket for KYC documents
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('homeowner', 'contractor', 'admin');
CREATE TYPE kyc_status AS ENUM ('pending', 'approved', 'rejected', 'incomplete');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE auftrag_status AS ENUM ('posted', 'accepted', 'in_progress', 'completed', 'cancelled');
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired', 'trial');
CREATE TYPE support_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  phone text,
  role user_role NOT NULL DEFAULT 'homeowner',
  avatar_url text,
  company_name text,
  address text,
  city text,
  postal_code text,
  country text DEFAULT 'Germany',
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- KYC documents table
CREATE TABLE IF NOT EXISTS kyc_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  document_url text NOT NULL,
  status kyc_status DEFAULT 'pending',
  rejection_reason text,
  verified_by uuid REFERENCES profiles(id),
  verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price_monthly decimal(10,2) NOT NULL,
  price_yearly decimal(10,2),
  features jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES subscription_plans(id),
  status subscription_status DEFAULT 'trial',
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  auto_renew boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Auftrags (jobs) table
CREATE TABLE IF NOT EXISTS auftrags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  homeowner_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  contractor_id uuid REFERENCES profiles(id),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  budget_min decimal(10,2),
  budget_max decimal(10,2),
  status auftrag_status DEFAULT 'posted',
  location_address text,
  location_lat decimal(10,8),
  location_lng decimal(10,8),
  accepted_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Job locations table (for tracking where jobs were accepted/fulfilled)
CREATE TABLE IF NOT EXISTS job_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auftrag_id uuid REFERENCES auftrags(id) ON DELETE CASCADE,
  contractor_id uuid REFERENCES profiles(id),
  action_type text NOT NULL, -- 'accepted', 'started', 'completed'
  location_lat decimal(10,8),
  location_lng decimal(10,8),
  address text,
  timestamp timestamptz DEFAULT now()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auftrag_id uuid REFERENCES auftrags(id),
  subscription_id uuid REFERENCES user_subscriptions(id),
  payer_id uuid REFERENCES profiles(id),
  payee_id uuid REFERENCES profiles(id),
  amount decimal(10,2) NOT NULL,
  currency text DEFAULT 'EUR',
  payment_type text NOT NULL, -- 'job_payment', 'subscription', 'commission'
  status payment_status DEFAULT 'pending',
  stripe_payment_intent_id text,
  description text,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Support entries table
CREATE TABLE IF NOT EXISTS support_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  subject text NOT NULL,
  description text NOT NULL,
  status support_status DEFAULT 'open',
  priority text DEFAULT 'medium',
  assigned_to uuid REFERENCES profiles(id),
  resolution_notes text,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auftrags ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin access
CREATE POLICY "Admins can manage all profiles"
  ON profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can manage all KYC documents"
  ON kyc_documents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage subscription plans"
  ON subscription_plans
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage user subscriptions"
  ON user_subscriptions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage auftrags"
  ON auftrags
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage job locations"
  ON job_locations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage payments"
  ON payments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage support entries"
  ON support_entries
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, price_monthly, price_yearly, features) VALUES
('Basic', 'Perfect for occasional users', 9.99, 99.99, '["Up to 3 jobs per month", "Basic support", "Standard matching"]'),
('Professional', 'For regular contractors', 29.99, 299.99, '["Unlimited jobs", "Priority support", "Advanced matching", "Analytics dashboard"]'),
('Enterprise', 'For large contractors', 99.99, 999.99, '["Unlimited jobs", "24/7 support", "Custom integrations", "Team management", "Advanced analytics"]');

-- Create storage bucket for KYC documents
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc-documents', 'kyc-documents', false);

-- Storage policy for KYC documents
CREATE POLICY "Admins can manage KYC documents"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'kyc-documents' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );