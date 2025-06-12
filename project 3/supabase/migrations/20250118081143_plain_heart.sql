/*
  # Initial Database Setup for RFQ Management System

  1. Tables
    - rfq: Main table for Request For Quotations
      - Core fields for RFQ information
      - Proper constraints and defaults
      - Unique reference enforcement
    - rfq_planning: Planning stages for each RFQ
      - Team assignments and dates
      - Proper validation for dates
    - rfq_worksharing: Work distribution for RFQs
      - Process and plant allocation
      - Quantity management

  2. Security
    - RLS enabled on all tables
    - Proper policies for authenticated users
    - Cascading deletes for related records

  3. Performance
    - Strategic indexes on frequently queried columns
    - Optimized constraints
*/

-- Clean slate - drop existing tables
DROP TABLE IF EXISTS rfq_worksharing CASCADE;
DROP TABLE IF EXISTS rfq_planning CASCADE;
DROP TABLE IF EXISTS rfq CASCADE;

-- Create RFQ table with proper constraints
CREATE TABLE rfq (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reference text NOT NULL,
    round text NOT NULL CHECK (round IN ('NEW', 'SES', 'RFI', 'RFQ-1', 'RFQ-2', 'RFQ-3', 'BAFO', 'RENEWAL', 'INTERNAL')),
    opportunity text NOT NULL,
    customer text NOT NULL,
    program text NOT NULL,
    workpackage text,
    due_date date,
    internal_customer text,
    phase_status text NOT NULL DEFAULT 'PROSPECT' 
        CHECK (phase_status IN ('PROSPECT', 'PROPOSAL', 'NEGOTIATION', 'LOST', 'AWARDED', 'STANDBY', 'CANCELED', 'CLOSED')),
    total_qty_to_quote integer NOT NULL DEFAULT 0 CHECK (total_qty_to_quote >= 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT rfq_reference_unique UNIQUE (reference)
);

-- Create RFQ Planning table with proper constraints
CREATE TABLE rfq_planning (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rfq_id uuid REFERENCES rfq(id) ON DELETE CASCADE,
    team text NOT NULL CHECK (team IN ('BLU', 'PIN', 'EOQ', 'GRE', 'RED')),
    planned_date date,
    actual_date date,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT valid_dates CHECK (
        (actual_date IS NULL OR planned_date IS NULL OR actual_date >= planned_date)
        AND (actual_date IS NULL OR actual_date <= CURRENT_DATE)
    )
);

-- Create RFQ Worksharing table with proper constraints
CREATE TABLE rfq_worksharing (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rfq_id uuid REFERENCES rfq(id) ON DELETE CASCADE,
    process text NOT NULL,
    plant text NOT NULL,
    qty_to_quote integer NOT NULL CHECK (qty_to_quote > 0),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_rfq_reference ON rfq(reference);
CREATE INDEX idx_rfq_customer ON rfq(customer);
CREATE INDEX idx_rfq_program ON rfq(program);
CREATE INDEX idx_rfq_phase_status ON rfq(phase_status);
CREATE INDEX idx_rfq_created_by ON rfq(created_by);
CREATE INDEX idx_rfq_created_at ON rfq(created_at DESC);
CREATE INDEX idx_rfq_planning_rfq_id ON rfq_planning(rfq_id);
CREATE INDEX idx_rfq_worksharing_rfq_id ON rfq_worksharing(rfq_id);

-- Enable Row Level Security
ALTER TABLE rfq ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfq_planning ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfq_worksharing ENABLE ROW LEVEL SECURITY;

-- Create RLS policies with proper security
CREATE POLICY "Users can read all RFQs"
    ON rfq FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert their own RFQs"
    ON rfq FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own RFQs"
    ON rfq FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own RFQs"
    ON rfq FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by);

-- Create policies for RFQ Planning
CREATE POLICY "Users can manage planning for their RFQs"
    ON rfq_planning FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM rfq
        WHERE rfq.id = rfq_planning.rfq_id
        AND rfq.created_by = auth.uid()
    ));

-- Create policies for RFQ Worksharing
CREATE POLICY "Users can manage worksharing for their RFQs"
    ON rfq_worksharing FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM rfq
        WHERE rfq.id = rfq_worksharing.rfq_id
        AND rfq.created_by = auth.uid()
    ));

-- Create function to validate worksharing quantities
CREATE OR REPLACE FUNCTION check_total_qty()
RETURNS TRIGGER AS $$
DECLARE
    total_qty INTEGER;
    expected_qty INTEGER;
BEGIN
    -- Calculate sum of quantities for this RFQ
    SELECT COALESCE(SUM(qty_to_quote), 0)
    INTO total_qty
    FROM rfq_worksharing
    WHERE rfq_id = NEW.rfq_id;

    -- Get expected total from RFQ
    SELECT total_qty_to_quote
    INTO expected_qty
    FROM rfq
    WHERE id = NEW.rfq_id;

    -- Verify sum doesn't exceed total
    IF (total_qty + NEW.qty_to_quote) > expected_qty THEN
        RAISE EXCEPTION 'Total worksharing quantities (%) cannot exceed RFQ total quantity (%)',
            total_qty + NEW.qty_to_quote, expected_qty;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for worksharing validation
CREATE TRIGGER check_total_qty_trigger
    BEFORE INSERT OR UPDATE ON rfq_worksharing
    FOR EACH ROW
    EXECUTE FUNCTION check_total_qty();