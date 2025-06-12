-- Create load per unit table
CREATE TABLE load_per_unit (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    process_id uuid NOT NULL REFERENCES process(id) ON DELETE CASCADE,
    plant_id uuid NOT NULL REFERENCES plant(id) ON DELETE CASCADE,
    hours_per_unit numeric(10,2) NOT NULL CHECK (hours_per_unit >= 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT load_per_unit_unique UNIQUE (process_id, plant_id)
);

-- Add indexes
CREATE INDEX idx_load_per_unit_process ON load_per_unit(process_id);
CREATE INDEX idx_load_per_unit_plant ON load_per_unit(plant_id);
CREATE INDEX idx_load_per_unit_created_by ON load_per_unit(created_by);

-- Enable RLS
ALTER TABLE load_per_unit ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can read all load per unit values"
    ON load_per_unit FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert load per unit values"
    ON load_per_unit FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update load per unit values"
    ON load_per_unit FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Users can delete load per unit values"
    ON load_per_unit FOR DELETE
    TO authenticated
    USING (true);

-- Create updated_at trigger
CREATE TRIGGER set_load_per_unit_updated_at
    BEFORE UPDATE ON load_per_unit
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();