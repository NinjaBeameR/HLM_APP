/*
  # Fix Labour Master RLS Policies

  1. Security Updates
    - Drop existing overly restrictive policy
    - Add proper policies for authenticated users to perform CRUD operations
    - Ensure authenticated users can manage labour records

  2. Policy Changes
    - Allow authenticated users to SELECT all labour records
    - Allow authenticated users to INSERT new labour records
    - Allow authenticated users to UPDATE labour records
    - Allow authenticated users to soft DELETE (update is_active) labour records
*/

-- Drop the existing policy that might be too restrictive
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON labour_master;

-- Create specific policies for each operation
CREATE POLICY "Allow authenticated users to view labour records"
  ON labour_master
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert labour records"
  ON labour_master
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update labour records"
  ON labour_master
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete labour records"
  ON labour_master
  FOR DELETE
  TO authenticated
  USING (true);