import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database
export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  role: 'homeowner' | 'contractor' | 'admin';
  avatar_url?: string;
  company_name?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface KycDocument {
  id: string;
  user_id: string;
  document_type: string;
  document_url: string;
  status: 'pending' | 'approved' | 'rejected' | 'incomplete';
  rejection_reason?: string;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price_monthly: number;
  price_yearly?: number;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  started_at: string;
  expires_at?: string;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
  subscription_plans?: SubscriptionPlan;
  profiles?: Profile;
}

export interface Auftrag {
  id: string;
  homeowner_id: string;
  contractor_id?: string;
  title: string;
  description: string;
  category: string;
  category_id?: string;
  budget_min?: number;
  budget_max?: number;
  status: 'posted' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  location_address?: string;
  location_lat?: number;
  location_lng?: number;
  accepted_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  homeowner?: Profile;
  contractor?: Profile;
  job_categories?: JobCategory;
}

export interface JobCategory {
  id: string;
  name: string;
  description?: string;
  icon: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface JobLocation {
  id: string;
  auftrag_id: string;
  contractor_id: string;
  action_type: string;
  location_lat?: number;
  location_lng?: number;
  address?: string;
  timestamp: string;
  auftrags?: Auftrag;
  profiles?: Profile;
}

export interface Payment {
  id: string;
  auftrag_id?: string;
  subscription_id?: string;
  payer_id: string;
  payee_id?: string;
  amount: number;
  currency: string;
  payment_type: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  stripe_payment_intent_id?: string;
  description?: string;
  processed_at?: string;
  created_at: string;
  payer?: Profile;
  payee?: Profile;
  auftrags?: Auftrag;
  user_subscriptions?: UserSubscription;
}

export interface SupportEntry {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: string;
  assigned_to?: string;
  resolution_notes?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  assigned_admin?: Profile;
}

export interface ContractorDocument {
  id: string;
  contractor_id: string;
  document_type: string;
  document_name: string;
  document_url: string;
  file_size?: number;
  mime_type?: string;
  status: 'pending' | 'approved' | 'rejected';
  uploaded_at: string;
  verified_at?: string;
  verified_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  contractor?: Profile;
  verifier?: Profile;
}