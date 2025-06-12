-- Create planning steps table
CREATE TABLE planning_steps (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    role_in_charge text NOT NULL,
    starting_step text NOT NULL CHECK (starting_step IN ('BLU', 'PIN', 'EOQ', 'GRE', 'RED')),
    end_step text NOT NULL CHECK (end_step IN ('BLU', 'PIN', 'EOQ', 'GRE', 'RED')),
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add indexes
CREATE INDEX idx_planning_steps_created_by ON planning_steps(created_by);
CREATE INDEX idx_planning_steps_role ON planning_steps(role_in_charge);

-- Enable RLS
ALTER TABLE planning_steps ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can read all planning steps"
    ON planning_steps FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert planning steps"
    ON planning_steps FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update planning steps"
    ON planning_steps FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Users can delete planning steps"
    ON planning_steps FOR DELETE
    TO authenticated
    USING (true);

-- Create updated_at trigger
CREATE TRIGGER set_planning_steps_updated_at
    BEFORE UPDATE ON planning_steps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();