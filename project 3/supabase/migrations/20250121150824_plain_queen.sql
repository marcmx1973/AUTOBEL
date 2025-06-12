-- Drop existing table if it exists
DROP TABLE IF EXISTS oem CASCADE;

-- Create OEM table
CREATE TABLE oem (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    abbreviation text NOT NULL,
    country text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    CONSTRAINT oem_name_unique UNIQUE (name),
    CONSTRAINT oem_abb_unique UNIQUE (abbreviation)
);

-- Enable RLS
ALTER TABLE oem ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can read all OEMs"
    ON oem FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert OEMs"
    ON oem FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update OEMs"
    ON oem FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Users can delete OEMs"
    ON oem FOR DELETE
    TO authenticated
    USING (true);