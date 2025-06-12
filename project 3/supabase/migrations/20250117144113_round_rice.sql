/*
  # Fix RFQ Database Schema

  1. New Tables
    - `rfq`: Main table for Request For Quotations
      - `id` (uuid, primary key)
      - `reference` (text, unique)
      - `round` (text)
      - `opportunity` (text)
      - `customer` (text)
      - `program` (text)
      - `workpackage` (text, nullable)
      - `due_date` (date, nullable)
      - `internal_customer` (text, nullable)
      - `phase_status` (text)
      - `total_qty_to_quote` (integer)
      - `created_at` (timestamptz)
      - `created_by` (uuid, references auth.users)
      - `updated_at` (timestamptz)
    
    - `rfq_planning`: Planning information for RFQs
      - `id` (uuid, primary key)
      - `rfq_id` (uuid, references rfq)
      - `team` (text)
      - `planned_date` (date, nullable)
      - `actual_date` (date, nullable)
      - `created_at` (timestamptz)
    
    - `rfq_worksharing`: Worksharing details for RFQs
      - `id` (uuid, primary key)
      - `rfq_id` (uuid, references rfq)
      - `process` (text)
      - `plant` (text)
      - `qty_to_quote` (integer)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS rfq_worksharing CASCADE;
DROP TABLE IF EXISTS rfq_planning CASCADE;
DROP TABLE IF EXISTS rfq CASCADE;

-- Create RFQ table
CREATE TABLE rfq (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reference text NOT NULL,
    round text NOT NULL,
    opportunity text NOT NULL,
    customer text NOT NULL,
    program text NOT NULL,
    workpackage text,
    due_date date,
    internal_customer text,
    phase_status text NOT NULL DEFAULT 'PROSPECT',
    total_qty_to_quote integer NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT rfq_reference_unique UNIQUE (reference)
);

-- Create RFQ Planning table
CREATE TABLE rfq_planning (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rfq_id uuid REFERENCES rfq(id) ON DELETE CASCADE,
    team text NOT NULL,
    planned_date date,
    actual_date date,
    created_at timestamptz DEFAULT now()
);

-- Create RFQ Worksharing table
CREATE TABLE rfq_worksharing (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rfq_id uuid REFERENCES rfq(id) ON DELETE CASCADE,
    process text NOT NULL,
    plant text NOT NULL,
    qty_to_quote integer NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_rfq_created_by ON rfq(created_by);
CREATE INDEX idx_rfq_created_at ON rfq(created_at DESC);
CREATE INDEX idx_rfq_planning_rfq_id ON rfq_planning(rfq_id);
CREATE INDEX idx_rfq_worksharing_rfq_id ON rfq_worksharing(rfq_id);

-- Enable Row Level Security
ALTER TABLE rfq ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfq_planning ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfq_worksharing ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for authenticated users"
    ON rfq FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert access for authenticated users"
    ON rfq FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Enable update access for authenticated users"
    ON rfq FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by);

CREATE POLICY "Enable delete access for authenticated users"
    ON rfq FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by);

-- Create policies for RFQ Planning
CREATE POLICY "Enable all access for authenticated users on planning"
    ON rfq_planning FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM rfq
        WHERE rfq.id = rfq_planning.rfq_id
        AND rfq.created_by = auth.uid()
    ));

-- Create policies for RFQ Worksharing
CREATE POLICY "Enable all access for authenticated users on worksharing"
    ON rfq_worksharing FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM rfq
        WHERE rfq.id = rfq_worksharing.rfq_id
        AND rfq.created_by = auth.uid()
    ));