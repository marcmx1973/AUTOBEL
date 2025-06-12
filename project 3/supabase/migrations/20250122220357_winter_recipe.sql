-- Create nominal capacity table
CREATE TABLE nominal_capacity (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    process_id uuid NOT NULL REFERENCES process(id) ON DELETE CASCADE,
    plant_id uuid NOT NULL REFERENCES plant(id) ON DELETE CASCADE,
    weekly_hours numeric(10,2) NOT NULL CHECK (weekly_hours >= 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT nominal_capacity_unique UNIQUE (process_id, plant_id)
);

-- Add indexes
CREATE INDEX idx_nominal_capacity_process ON nominal_capacity(process_id);
CREATE INDEX idx_nominal_capacity_plant ON nominal_capacity(plant_id);
CREATE INDEX idx_nominal_capacity_created_by ON nominal_capacity(created_by);

-- Enable RLS
ALTER TABLE nominal_capacity ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can read all nominal capacities"
    ON nominal_capacity FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert nominal capacities"
    ON nominal_capacity FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update nominal capacities"
    ON nominal_capacity FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Users can delete nominal capacities"
    ON nominal_capacity FOR DELETE
    TO authenticated
    USING (true);

-- Create updated_at trigger
CREATE TRIGGER set_nominal_capacity_updated_at
    BEFORE UPDATE ON nominal_capacity
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();