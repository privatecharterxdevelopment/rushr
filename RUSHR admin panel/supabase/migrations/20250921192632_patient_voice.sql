/*
  # Complete RUSHR Database Schema

  1. New Tables
    - `profiles` - User profiles extending auth.users
    - `kyc_documents` - KYC document storage and verification
    - `subscription_plans` - Available subscription plans
    - `user_subscriptions` - User subscription tracking
    - `auftrags` - Job postings and management
    - `job_locations` - Location tracking for job acceptance/completion
    - `payments` - Payment transactions between users
    - `support_entries` - Customer support ticket system
    - `payment_methods` - User payment method storage
    - `transactions` - Detailed transaction logging
    - `support_tickets` - Enhanced support system

  2. Storage
    - `kyc-documents` bucket for document storage
    - `profile-avatars` bucket for user avatars

  3. Security
    - Enable RLS on all tables
    - Admin-only policies for management
    - User-specific policies for data access
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types (with IF NOT EXISTS equivalent using DO blocks)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('homeowner', 'contractor', 'user', 'admin');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kyc_status') THEN
    CREATE TYPE kyc_status AS ENUM ('pending', 'under_review', 'verified', 'rejected');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_type') THEN
    CREATE TYPE document_type AS ENUM ('driver_license', 'passport', 'id_card', 'utility_bill', 'business_license');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
    CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired', 'pending', 'trialing');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'billing_period') THEN
    CREATE TYPE billing_period AS ENUM ('monthly', 'yearly');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
    CREATE TYPE job_status AS ENUM ('open', 'assigned', 'in_progress', 'completed', 'cancelled', 'disputed');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status') THEN
    CREATE TYPE application_status AS ENUM ('pending', 'accepted', 'rejected');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method_type') THEN
    CREATE TYPE payment_method_type AS ENUM ('card', 'bank_account', 'paypal');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
    CREATE TYPE transaction_type AS ENUM ('job_payment', 'subscription', 'refund', 'withdrawal', 'platform_fee');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_status') THEN
    CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'cancelled', 'refunded');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'support_category') THEN
    CREATE TYPE support_category AS ENUM ('billing', 'technical', 'account', 'general', 'kyc', 'jobs');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'priority_level') THEN
    CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'urgent');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_status') THEN
    CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
  END IF;
END $$;

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  phone text,
  role user_role NOT NULL DEFAULT 'user',
  avatar_url text,
  company_name text,
  address text,
  city text,
  postal_code text,
  country text DEFAULT 'Germany',
  is_verified boolean DEFAULT false,
  stripe_customer_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- KYC documents table
CREATE TABLE IF NOT EXISTS kyc_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
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
  features jsonb DEFAULT '[]'::jsonb,
  max_jobs integer,
  is_active boolean DEFAULT true,
  stripe_price_id_monthly text,
  stripe_price_id_yearly text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES subscription_plans(id),
  status subscription_status DEFAULT 'pending',
  billing_period billing_period DEFAULT 'monthly',
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  auto_renew boolean DEFAULT true,
  stripe_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Jobs (Auftrags) table
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_number text UNIQUE,
  homeowner_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  contractor_id uuid REFERENCES profiles(id),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  budget_min decimal(10,2),
  budget_max decimal(10,2),
  final_price decimal(10,2),
  status job_status DEFAULT 'open',
  location_address text,
  location_lat decimal(10,8),
  location_lng decimal(10,8),
  scheduled_date timestamptz,
  accepted_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Job applications table
CREATE TABLE IF NOT EXISTS job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  contractor_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  proposed_price decimal(10,2),
  message text,
  status application_status DEFAULT 'pending',
  applied_at timestamptz DEFAULT now(),
  responded_at timestamptz,
  UNIQUE(job_id, contractor_id)
);

-- Job locations table (for tracking where jobs were accepted/fulfilled)
CREATE TABLE IF NOT EXISTS job_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  contractor_id uuid REFERENCES profiles(id),
  action_type text NOT NULL, -- 'accepted', 'started', 'completed', 'cancelled'
  location_lat decimal(10,8),
  location_lng decimal(10,8),
  address text,
  notes text,
  timestamp timestamptz DEFAULT now()
);

-- Payment methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type payment_method_type NOT NULL,
  stripe_payment_method_id text,
  last_four text,
  brand text,
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Transactions table (detailed transaction logging)
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_number text UNIQUE,
  job_id uuid REFERENCES jobs(id),
  subscription_id uuid REFERENCES user_subscriptions(id),
  payer_id uuid REFERENCES profiles(id),
  payee_id uuid REFERENCES profiles(id),
  amount decimal(10,2) NOT NULL,
  platform_fee decimal(10,2) DEFAULT 0,
  net_amount decimal(10,2),
  currency text DEFAULT 'EUR',
  type transaction_type NOT NULL,
  status transaction_status DEFAULT 'pending',
  stripe_payment_intent_id text,
  stripe_charge_id text,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Support tickets table (enhanced support system)
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text UNIQUE,
  user_id uuid REFERENCES profiles(id),
  subject text NOT NULL,
  description text NOT NULL,
  category support_category DEFAULT 'general',
  priority priority_level DEFAULT 'medium',
  status ticket_status DEFAULT 'open',
  assigned_to uuid REFERENCES profiles(id),
  resolution_notes text,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Support ticket messages table
CREATE TABLE IF NOT EXISTS support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES profiles(id),
  message text NOT NULL,
  is_internal boolean DEFAULT false,
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_user_id ON kyc_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_status ON kyc_documents(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_jobs_homeowner_id ON jobs(homeowner_id);
CREATE INDEX IF NOT EXISTS idx_jobs_contractor_id ON jobs(contractor_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_contractor_id ON job_applications(contractor_id);
CREATE INDEX IF NOT EXISTS idx_job_locations_job_id ON job_locations(job_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payer_id ON transactions(payer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payee_id ON transactions(payee_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
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

CREATE POLICY "Users can manage own KYC documents"
  ON kyc_documents
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Anyone can read subscription plans"
  ON subscription_plans
  FOR SELECT
  TO authenticated
  USING (is_active = true);

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

CREATE POLICY "Users can read own subscriptions"
  ON user_subscriptions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all jobs"
  ON jobs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Homeowners can manage own jobs"
  ON jobs
  FOR ALL
  TO authenticated
  USING (homeowner_id = auth.uid());

CREATE POLICY "Contractors can read assigned jobs"
  ON jobs
  FOR SELECT
  TO authenticated
  USING (contractor_id = auth.uid());

CREATE POLICY "Contractors can read open jobs"
  ON jobs
  FOR SELECT
  TO authenticated
  USING (status = 'open');

CREATE POLICY "Admins can manage job applications"
  ON job_applications
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Contractors can manage own applications"
  ON job_applications
  FOR ALL
  TO authenticated
  USING (contractor_id = auth.uid());

CREATE POLICY "Homeowners can read applications for their jobs"
  ON job_applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = job_applications.job_id AND jobs.homeowner_id = auth.uid()
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

CREATE POLICY "Contractors can manage own job locations"
  ON job_locations
  FOR ALL
  TO authenticated
  USING (contractor_id = auth.uid());

CREATE POLICY "Admins can manage payment methods"
  ON payment_methods
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can manage own payment methods"
  ON payment_methods
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all transactions"
  ON transactions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can read own transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (payer_id = auth.uid() OR payee_id = auth.uid());

CREATE POLICY "Admins can manage support tickets"
  ON support_tickets
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can manage own support tickets"
  ON support_tickets
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage support messages"
  ON support_messages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can read messages for own tickets"
  ON support_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets 
      WHERE support_tickets.id = support_messages.ticket_id 
      AND support_tickets.user_id = auth.uid()
    )
  );

-- Create trigger functions
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS trigger AS $$
BEGIN
  NEW.ticket_number := 'TICKET-' || to_char(NEW.created_at, 'YYYYMMDD') || '-' || LPAD(nextval('ticket_number_seq')::text, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_job_number()
RETURNS trigger AS $$
BEGIN
  NEW.job_number := 'JOB-' || to_char(NEW.created_at, 'YYYYMMDD') || '-' || LPAD(nextval('job_number_seq')::text, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_transaction_number()
RETURNS trigger AS $$
BEGIN
  NEW.transaction_number := 'TXN-' || to_char(NEW.created_at, 'YYYYMMDD') || '-' || LPAD(nextval('transaction_number_seq')::text, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_net_amount()
RETURNS trigger AS $$
BEGIN
  NEW.net_amount := NEW.amount - COALESCE(NEW.platform_fee, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequences for numbering
CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS job_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS transaction_number_seq START 1;

-- Create triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

DROP TRIGGER IF EXISTS set_ticket_number_trigger ON support_tickets;
CREATE TRIGGER set_ticket_number_trigger
  BEFORE INSERT ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION set_ticket_number();

DROP TRIGGER IF EXISTS set_job_number_trigger ON jobs;
CREATE TRIGGER set_job_number_trigger
  BEFORE INSERT ON jobs
  FOR EACH ROW EXECUTE FUNCTION set_job_number();

DROP TRIGGER IF EXISTS set_transaction_number_trigger ON transactions;
CREATE TRIGGER set_transaction_number_trigger
  BEFORE INSERT ON transactions
  FOR EACH ROW EXECUTE FUNCTION set_transaction_number();

DROP TRIGGER IF EXISTS calculate_net_amount_trigger ON transactions;
CREATE TRIGGER calculate_net_amount_trigger
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION calculate_net_amount();

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, price_monthly, price_yearly, features, max_jobs) VALUES
('Basic', 'Perfect for occasional users', 9.99, 99.99, '["Up to 3 jobs per month", "Basic support", "Standard matching"]', 3),
('Professional', 'For regular contractors', 29.99, 299.99, '["Unlimited jobs", "Priority support", "Advanced matching", "Analytics dashboard"]', -1),
('Enterprise', 'For large contractors', 99.99, 999.99, '["Unlimited jobs", "24/7 support", "Custom integrations", "Team management", "Advanced analytics"]', -1)
ON CONFLICT DO NOTHING;

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
('kyc-documents', 'kyc-documents', false),
('profile-avatars', 'profile-avatars', true)
ON CONFLICT DO NOTHING;

-- Storage policies
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

CREATE POLICY "Users can upload own KYC documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'kyc-documents');

CREATE POLICY "Users can manage own avatars"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'profile-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view avatars"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'profile-avatars');