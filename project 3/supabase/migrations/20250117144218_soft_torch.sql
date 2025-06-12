/*
  # Fix Database Schema and Constraints

  1. Changes
    - Add proper constraints for round and phase_status
    - Add validation triggers
    - Improve RLS policies
    - Add better error handling
*/

-- Drop existing tables if they exist
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
    phase_status text NOT NULL DEFAULT 'PROSPECT' CHECK (phase_status IN ('PROSPECT', 'PROPOSAL', 'NEGOTIATION', 'LOST', 'AWARDED', 'STANDBY', 'CANCELED', 'CLOSED')),
    total_qty_to_quote integer NOT NULL CHECK (total_qty_to_quote >= 0),
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id) NOT NULL,
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT rfq_reference_unique UNIQUE (reference)
);

-- Create RFQ Planning table with proper constraints
CREATE TABLE rfq_planning (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rfq_id uuid REFERENCES rfq(id) ON DELETE CASCADE NOT NULL,
    team text NOT NULL CHECK (team IN ('BLU', 'PIN', 'EOQ', 'GRE', 'RED')),
    planned_date date,
    actual_date date,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT valid_dates CHECK (
        (actual_date IS NULL OR planned_date IS NULL OR actual_date >= planned_date)
        AND (actual_date IS NULL OR actual_date <= CURRENT_DATE)
    )
);

-- Create RFQ Worksharing table with proper constraints
CREATE TABLE rfq_worksharing (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rfq_id uuid REFERENCES rfq(id) ON DELETE CASCADE NOT NULL,
    process text NOT NULL,
    plant text NOT NULL,
    qty_to_quote integer NOT NULL CHECK (qty_to_quote > 0),
    created_at timestamptz DEFAULT now()
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

-- Create RLS policies with better security
CREATE POLICY "Authenticated users can read RFQs"
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

-- Create policies for RFQ Planning with proper checks
CREATE POLICY "Users can manage planning for their RFQs"
    ON rfq_planning FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM rfq
        WHERE rfq.id = rfq_planning.rfq_id
        AND rfq.created_by = auth.uid()
    ));

-- Create policies for RFQ Worksharing with proper checks
CREATE POLICY "Users can manage worksharing for their RFQs"
    ON rfq_worksharing FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM rfq
        WHERE rfq.id = rfq_worksharing.rfq_id
        AND rfq.created_by = auth.uid()
    ));

-- Create function to validate worksharing quantities
CREATE OR REPLACE FUNCTION validate_worksharing_quantities()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM rfq r
        LEFT JOIN (
            SELECT rfq_id, SUM(qty_to_quote) as total_qty
            FROM rfq_worksharing
            WHERE rfq_id = NEW.rfq_id
            GROUP BY rfq_id
        ) ws ON ws.rfq_id = r.id
        WHERE r.id = NEW.rfq_id
        AND (ws.total_qty + NEW.qty_to_quote) > r.total_qty_to_quote
    ) THEN
        RAISE EXCEPTION 'Total worksharing quantities cannot exceed RFQ total quantity';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for worksharing validation
CREATE TRIGGER validate_worksharing_quantities_trigger
    BEFORE INSERT OR UPDATE ON rfq_worksharing
    FOR EACH ROW
    EXECUTE FUNCTION validate_worksharing_quantities();