/*
  # HULIMANE LABOUR MANAGEMENT Database Schema

  1. New Tables
    - `labour_master` - Store labour information (name, phone, address, emergency contact)
    - `work_category` - Work categories with hierarchical structure
    - `payment_type_master` - Payment types with rates and units
    - `daily_entries` - Daily attendance and payment records
    - `labour_balances` - Current balance tracking for each labour

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage data

  3. Indexes
    - Add performance indexes for frequently queried columns
    - Composite indexes for filtering operations
*/

-- Labour Master Table
CREATE TABLE IF NOT EXISTS labour_master (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text NOT NULL,
  address text DEFAULT '',
  emergency_contact text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Work Category Table (with hierarchical support)
CREATE TABLE IF NOT EXISTS work_category (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name text NOT NULL,
  parent_category_id uuid REFERENCES work_category(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Payment Type Master Table
CREATE TABLE IF NOT EXISTS payment_type_master (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_type text NOT NULL,
  rate numeric(10,2) NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'day', -- hour/day/piece
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Daily Entries Table
CREATE TABLE IF NOT EXISTS daily_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  labour_id uuid NOT NULL REFERENCES labour_master(id),
  work_category_id uuid NOT NULL REFERENCES work_category(id),
  payment_type_id uuid NOT NULL REFERENCES payment_type_master(id),
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  attendance_status text NOT NULL DEFAULT 'present', -- present/absent/half-day
  amount_paid numeric(10,2) NOT NULL DEFAULT 0,
  previous_balance numeric(10,2) NOT NULL DEFAULT 0,
  new_balance numeric(10,2) NOT NULL DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Labour Balances Table (for quick balance lookups)
CREATE TABLE IF NOT EXISTS labour_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  labour_id uuid NOT NULL REFERENCES labour_master(id) UNIQUE,
  current_balance numeric(10,2) NOT NULL DEFAULT 0,
  last_updated timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE labour_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_category ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_type_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE labour_balances ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Enable all operations for authenticated users" ON labour_master
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users" ON work_category
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users" ON payment_type_master
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users" ON daily_entries
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users" ON labour_balances
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_labour_master_phone ON labour_master(phone);
CREATE INDEX IF NOT EXISTS idx_labour_master_active ON labour_master(is_active);
CREATE INDEX IF NOT EXISTS idx_work_category_parent ON work_category(parent_category_id);
CREATE INDEX IF NOT EXISTS idx_daily_entries_labour_date ON daily_entries(labour_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_daily_entries_date ON daily_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_labour_balances_labour ON labour_balances(labour_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_labour_master_updated_at BEFORE UPDATE ON labour_master
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_category_updated_at BEFORE UPDATE ON work_category
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_type_master_updated_at BEFORE UPDATE ON payment_type_master
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_entries_updated_at BEFORE UPDATE ON daily_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();