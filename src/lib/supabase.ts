import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface LabourMaster {
  id: string;
  full_name: string;
  phone: string;
  address?: string;
  emergency_contact?: string;
  is_active: boolean;
}

export interface WorkCategory {
  id: string;
  work_type: string;
  category: string;
  subcategory?: string;
  narration?: string;
  general_rate: number;
  special_rate: number;
  overtime_rate: number;
  is_active: boolean;
}

export interface PaymentTypeMaster {
  id: string;
  payment_type: string;
  rate: number;
  unit: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DailyEntry {
  id: string;
  labour_id: string;
  work_category_id: string;
  payment_type_id: string;
  entry_date: string;
  attendance_status: 'present' | 'absent' | 'half-day';
  amount_paid: number;
  previous_balance: number;
  new_balance: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  labour_master?: LabourMaster;
  work_category?: WorkCategory;
  payment_type_master?: PaymentTypeMaster;
  debit: number;
  credit: number;
}

export interface LabourBalance {
  id: string;
  labour_id: string;
  current_balance: number;
  last_updated: string;
}