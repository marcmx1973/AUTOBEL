-- Drop existing tables if they exist
DROP TABLE IF EXISTS rfq_worksharing CASCADE;
DROP TABLE IF EXISTS rfq_planning CASCADE;
DROP TABLE IF EXISTS rfq CASCADE;

-- Create RFQ table with proper constraints
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
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT rfq_reference_unique UNIQUE (reference)
);

-- Create RFQ Planning table
CREATE TABLE rfq_planning (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rfq_id uuid REFERENCES rfq(id) ON DELETE CASCADE,
    team text NOT NULL,
    planned_date date,
    actual_date date,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Create RFQ Worksharing table
CREATE TABLE rfq_worksharing (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rfq_id uuid REFERENCES rfq(id) ON DELETE CASCADE,
    process text NOT NULL,
    plant text NOT NULL,
    qty_to_quote integer NOT NULL DEFAULT 0,
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

CREATE POLICY "Users can insert RFQs"
    ON rfq FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update RFQs"
    ON rfq FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Users can delete RFQs"
    ON rfq FOR DELETE
    TO authenticated
    USING (true);

-- Create policies for RFQ Planning
CREATE POLICY "Users can manage planning"
    ON rfq_planning FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM rfq
        WHERE rfq.id = rfq_planning.rfq_id
    ));

-- Create policies for RFQ Worksharing
CREATE POLICY "Users can manage worksharing"
    ON rfq_worksharing FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM rfq
        WHERE rfq.id = rfq_worksharing.rfq_id
    ));