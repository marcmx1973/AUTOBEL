/*
  # RFQ Database Schema

  1. New Tables
    - `rfq`
      - Main RFQ information including reference, customer, program, etc.
    - `rfq_planning`
      - Planning dates for each team
    - `rfq_worksharing`
      - Worksharing details including process, plant, and quantities

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their RFQs
*/

-- RFQ Main Table
CREATE TABLE IF NOT EXISTS rfq (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL,
  round text NOT NULL,
  opportunity text NOT NULL,
  customer text NOT NULL,
  program text NOT NULL,
  workpackage text NOT NULL,
  due_date date NOT NULL,
  internal_customer text NOT NULL,
  phase_status text NOT NULL,
  total_qty_to_quote integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now()
);

-- RFQ Planning Table
CREATE TABLE IF NOT EXISTS rfq_planning (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id uuid REFERENCES rfq(id) ON DELETE CASCADE,
  team text NOT NULL,
  planned_date date,
  actual_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RFQ Worksharing Table
CREATE TABLE IF NOT EXISTS rfq_worksharing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id uuid REFERENCES rfq(id) ON DELETE CASCADE,
  process text NOT NULL,
  plant text NOT NULL,
  qty_to_quote integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE rfq ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfq_planning ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfq_worksharing ENABLE ROW LEVEL SECURITY;

-- RFQ Policies
CREATE POLICY "Users can view their own RFQs"
  ON rfq
  FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own RFQs"
  ON rfq
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Planning Policies
CREATE POLICY "Users can manage planning for their RFQs"
  ON rfq_planning
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rfq
      WHERE rfq.id = rfq_planning.rfq_id
      AND rfq.created_by = auth.uid()
    )
  );

-- Worksharing Policies
CREATE POLICY "Users can manage worksharing for their RFQs"
  ON rfq_worksharing
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rfq
      WHERE rfq.id = rfq_worksharing.rfq_id
      AND rfq.created_by = auth.uid()
    )
  );