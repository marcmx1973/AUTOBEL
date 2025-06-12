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
    phase_status text NOT NULL DEFAULT 'PROSPECT' 
        CHECK (phase_status IN ('PROSPECT', 'PROPOSAL', 'NEGOTIATION', 'LOST', 'AWARDED', 'STANDBY', 'CANCELED', 'CLOSED')),
    total_qty_to_quote integer NOT NULL DEFAULT 0 CHECK (total_qty_to_quote >= 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id) NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create RFQ Planning table
CREATE TABLE rfq_planning (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rfq_id uuid NOT NULL REFERENCES rfq(id) ON DELETE CASCADE,
    team text NOT NULL CHECK (team IN ('BLU', 'PIN', 'EOQ', 'GRE', 'RED')),
    planned_date date,
    actual_date date,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Create RFQ Worksharing table
CREATE TABLE rfq_worksharing (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rfq_id uuid NOT NULL REFERENCES rfq(id) ON DELETE CASCADE,
    process text NOT NULL,
    plant text NOT NULL,
    qty_to_quote integer NOT NULL CHECK (qty_to_quote > 0),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Create essential indexes
CREATE INDEX idx_rfq_created_by ON rfq(created_by);
CREATE INDEX idx_rfq_created_at ON rfq(created_at DESC);
CREATE INDEX idx_rfq_planning_rfq_id ON rfq_planning(rfq_id);
CREATE INDEX idx_rfq_worksharing_rfq_id ON rfq_worksharing(rfq_id);

-- Enable Row Level Security
ALTER TABLE rfq ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfq_planning ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfq_worksharing ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can read all RFQs" ON rfq;
DROP POLICY IF EXISTS "Users can insert their own RFQs" ON rfq;
DROP POLICY IF EXISTS "Users can update their own RFQs" ON rfq;
DROP POLICY IF EXISTS "Users can delete their own RFQs" ON rfq;
DROP POLICY IF EXISTS "Users can manage planning for their RFQs" ON rfq_planning;
DROP POLICY IF EXISTS "Users can manage worksharing for their RFQs" ON rfq_worksharing;

-- Create simplified RLS policies
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

-- Create simplified policies for related tables
CREATE POLICY "Users can manage planning"
    ON rfq_planning FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Users can manage worksharing"
    ON rfq_worksharing FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);