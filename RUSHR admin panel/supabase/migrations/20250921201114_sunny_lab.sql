/*
  # Add subscription plans data

  1. New Data
    - Insert predefined subscription plans with features and pricing
    - Basic, Pro, and Enterprise tiers
    - Monthly and yearly pricing options

  2. Features
    - JSON array of features for each plan
    - Different job limits and capabilities
    - Stripe integration ready
*/

-- Insert subscription plans
INSERT INTO subscription_plans (name, description, price_monthly, price_yearly, features, max_jobs, is_active, stripe_price_id_monthly, stripe_price_id_yearly) VALUES
(
  'Basic',
  'Perfect for individual homeowners with occasional projects',
  9.99,
  99.99,
  '["Post up to 3 jobs per month", "Basic contractor matching", "Standard support", "Job progress tracking", "Payment protection"]'::jsonb,
  3,
  true,
  'price_basic_monthly',
  'price_basic_yearly'
),
(
  'Pro',
  'Ideal for active homeowners and small property managers',
  29.99,
  299.99,
  '["Post up to 15 jobs per month", "Priority contractor matching", "Advanced job management", "Priority support", "Payment protection", "Job analytics", "Multiple property management"]'::jsonb,
  15,
  true,
  'price_pro_monthly',
  'price_pro_yearly'
),
(
  'Enterprise',
  'For property management companies and large-scale operations',
  99.99,
  999.99,
  '["Unlimited job postings", "Dedicated account manager", "Custom contractor network", "24/7 priority support", "Advanced analytics", "API access", "White-label options", "Bulk operations"]'::jsonb,
  null,
  true,
  'price_enterprise_monthly',
  'price_enterprise_yearly'
),
(
  'Contractor Basic',
  'For individual contractors starting their business',
  19.99,
  199.99,
  '["Apply to unlimited jobs", "Basic profile features", "Standard support", "Payment processing", "Job history tracking"]'::jsonb,
  null,
  true,
  'price_contractor_basic_monthly',
  'price_contractor_basic_yearly'
),
(
  'Contractor Pro',
  'For established contractors and small teams',
  49.99,
  499.99,
  '["Priority job matching", "Enhanced profile features", "Lead generation tools", "Priority support", "Advanced analytics", "Team management", "Marketing tools"]'::jsonb,
  null,
  true,
  'price_contractor_pro_monthly',
  'price_contractor_pro_yearly'
);