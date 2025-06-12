-- Add proposal_leader column to RFQ table
ALTER TABLE rfq ADD COLUMN proposal_leader text;

-- Update RLS policies to include the new column
DROP POLICY IF EXISTS "Users can read all RFQs" ON rfq;
DROP POLICY IF EXISTS "Users can insert RFQs" ON rfq;
DROP POLICY IF EXISTS "Users can update RFQs" ON rfq;
DROP POLICY IF EXISTS "Users can delete RFQs" ON rfq;

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