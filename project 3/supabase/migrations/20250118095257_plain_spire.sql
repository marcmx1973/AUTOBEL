-- Drop existing tables if they exist
DROP TABLE IF EXISTS stakeholder CASCADE;
DROP TABLE IF EXISTS existing_process CASCADE;
DROP TABLE IF EXISTS plant CASCADE;
DROP TABLE IF EXISTS site CASCADE;
DROP TABLE IF EXISTS division CASCADE;
DROP TABLE IF EXISTS process CASCADE;
DROP TABLE IF EXISTS program CASCADE;
DROP TABLE IF EXISTS customer CASCADE;
DROP TABLE IF EXISTS oem CASCADE;
DROP TABLE IF EXISTS department CASCADE;
DROP TABLE IF EXISTS role CASCADE;

-- Create OEM table
CREATE TABLE oem (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    abbreviation text NOT NULL,
    country text NOT NULL,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT oem_name_unique UNIQUE (name),
    CONSTRAINT oem_abbreviation_unique UNIQUE (abbreviation)
);

-- Create PROGRAM table
CREATE TABLE program (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    oem_id uuid NOT NULL REFERENCES oem(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT program_name_unique UNIQUE (name)
);

-- Create CUSTOMER table
CREATE TABLE customer (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    abbreviation text NOT NULL,
    country text NOT NULL,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT customer_name_unique UNIQUE (name),
    CONSTRAINT customer_abbreviation_unique UNIQUE (abbreviation)
);

-- Create PROCESS table
CREATE TABLE process (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT process_name_unique UNIQUE (name)
);

-- Create GROUP DIVISION table
CREATE TABLE division (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    abbreviation text NOT NULL,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT division_name_unique UNIQUE (name),
    CONSTRAINT division_abbreviation_unique UNIQUE (abbreviation)
);

-- Create SITE table
CREATE TABLE site (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    division_id uuid NOT NULL REFERENCES division(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT site_name_unique UNIQUE (name)
);

-- Create PLANT table
CREATE TABLE plant (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    site_id uuid NOT NULL REFERENCES site(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT plant_name_unique UNIQUE (name)
);

-- Create EXISTING PROCESS table
CREATE TABLE existing_process (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    process_id uuid NOT NULL REFERENCES process(id) ON DELETE CASCADE,
    plant_id uuid NOT NULL REFERENCES plant(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT existing_process_unique UNIQUE (process_id, plant_id)
);

-- Create DEPARTMENT table
CREATE TABLE department (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT department_name_unique UNIQUE (name)
);

-- Create ROLE table
CREATE TABLE role (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT role_name_unique UNIQUE (name)
);

-- Create STAKEHOLDER table
CREATE TABLE stakeholder (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    department_id uuid NOT NULL REFERENCES department(id) ON DELETE CASCADE,
    plant_id uuid NOT NULL REFERENCES plant(id) ON DELETE CASCADE,
    role_id uuid NOT NULL REFERENCES role(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT stakeholder_name_unique UNIQUE (name)
);

-- Enable Row Level Security for all tables
ALTER TABLE oem ENABLE ROW LEVEL SECURITY;
ALTER TABLE program ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer ENABLE ROW LEVEL SECURITY;
ALTER TABLE process ENABLE ROW LEVEL SECURITY;
ALTER TABLE division ENABLE ROW LEVEL SECURITY;
ALTER TABLE site ENABLE ROW LEVEL SECURITY;
ALTER TABLE plant ENABLE ROW LEVEL SECURITY;
ALTER TABLE existing_process ENABLE ROW LEVEL SECURITY;
ALTER TABLE department ENABLE ROW LEVEL SECURITY;
ALTER TABLE role ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakeholder ENABLE ROW LEVEL SECURITY;

-- Create policies for all tables
CREATE POLICY "Enable read access for all authenticated users"
    ON oem FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users"
    ON oem FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
    ON oem FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Enable delete for authenticated users"
    ON oem FOR DELETE
    TO authenticated
    USING (true);

-- Repeat policies for other tables
CREATE POLICY "Enable read access for all authenticated users"
    ON program FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users"
    ON program FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
    ON program FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Enable delete for authenticated users"
    ON program FOR DELETE
    TO authenticated
    USING (true);

-- Customer policies
CREATE POLICY "Enable read access for all authenticated users"
    ON customer FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users"
    ON customer FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
    ON customer FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Enable delete for authenticated users"
    ON customer FOR DELETE
    TO authenticated
    USING (true);

-- Process policies
CREATE POLICY "Enable read access for all authenticated users"
    ON process FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users"
    ON process FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
    ON process FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Enable delete for authenticated users"
    ON process FOR DELETE
    TO authenticated
    USING (true);

-- Division policies
CREATE POLICY "Enable read access for all authenticated users"
    ON division FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users"
    ON division FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
    ON division FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Enable delete for authenticated users"
    ON division FOR DELETE
    TO authenticated
    USING (true);

-- Site policies
CREATE POLICY "Enable read access for all authenticated users"
    ON site FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users"
    ON site FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
    ON site FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Enable delete for authenticated users"
    ON site FOR DELETE
    TO authenticated
    USING (true);

-- Plant policies
CREATE POLICY "Enable read access for all authenticated users"
    ON plant FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users"
    ON plant FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
    ON plant FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Enable delete for authenticated users"
    ON plant FOR DELETE
    TO authenticated
    USING (true);

-- Existing Process policies
CREATE POLICY "Enable read access for all authenticated users"
    ON existing_process FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users"
    ON existing_process FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
    ON existing_process FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Enable delete for authenticated users"
    ON existing_process FOR DELETE
    TO authenticated
    USING (true);

-- Department policies
CREATE POLICY "Enable read access for all authenticated users"
    ON department FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users"
    ON department FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
    ON department FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Enable delete for authenticated users"
    ON department FOR DELETE
    TO authenticated
    USING (true);

-- Role policies
CREATE POLICY "Enable read access for all authenticated users"
    ON role FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users"
    ON role FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
    ON role FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Enable delete for authenticated users"
    ON role FOR DELETE
    TO authenticated
    USING (true);

-- Stakeholder policies
CREATE POLICY "Enable read access for all authenticated users"
    ON stakeholder FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users"
    ON stakeholder FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
    ON stakeholder FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Enable delete for authenticated users"
    ON stakeholder FOR DELETE
    TO authenticated
    USING (true);

-- Insert initial data
INSERT INTO oem (name, abbreviation, country) VALUES
('BMW', 'BMW', 'GERMANY'),
('Mercedes', 'MBZ', 'GERMANY');

INSERT INTO customer (name, abbreviation, country) VALUES
('VALEO', 'VAL', 'France');

INSERT INTO process (name, description) VALUES
('CNC MACHINING', 'cnc'),
('ASSEMBLY', 'ASS');

INSERT INTO division (name, abbreviation) VALUES
('EUROPE SOUTH AMERICA', 'ESA'),
('NORTH AMERICA', 'SNA'),
('ACISPAIN', 'ACI');

-- Insert SITE data
WITH divisions AS (
  SELECT id, name FROM division
)
INSERT INTO site (name, division_id)
SELECT 'GOSS', d.id FROM divisions d WHERE d.name = 'EUROPE SOUTH AMERICA'
UNION ALL
SELECT 'ST CHA', d.id FROM divisions d WHERE d.name = 'NORTH AMERICA'
UNION ALL
SELECT 'AUB', d.id FROM divisions d WHERE d.name = 'NORTH AMERICA'
UNION ALL
SELECT 'SEV', d.id FROM divisions d WHERE d.name = 'ACISPAIN';

-- Insert PLANT data
WITH sites AS (
  SELECT id, name FROM site
)
INSERT INTO plant (name, site_id)
SELECT 'PPE-MO', s.id FROM sites s WHERE s.name = 'GOSS';

-- Insert EXISTING PROCESS data
WITH plants AS (
  SELECT id, name FROM plant
),
processes AS (
  SELECT id, name FROM process
)
INSERT INTO existing_process (process_id, plant_id)
SELECT p.id, pl.id 
FROM processes p, plants pl 
WHERE p.name = 'CNC MACHINING' AND pl.name = 'PPE-MO';

-- Insert DEPARTMENT data
INSERT INTO department (name) VALUES
('COE'),
('FINANCE'),
('DOP'),
('PURCHASING'),
('SALES');

-- Insert ROLE data
INSERT INTO role (name) VALUES
('BD'),
('KAM'),
('CXO'),
('PROPOSAL'),
('COSTING'),
('EXPERT');

-- Insert STAKEHOLDER data
WITH departments AS (
  SELECT id, name FROM department
),
plants AS (
  SELECT id, name FROM plant
),
roles AS (
  SELECT id, name FROM role
)
INSERT INTO stakeholder (name, department_id, plant_id, role_id)
SELECT 'MMX', d.id, p.id, r.id
FROM departments d, plants p, roles r
WHERE d.name = 'DOP' AND p.name = 'PPE-MO' AND r.name = 'COSTING';

-- Insert PROGRAM data
WITH oems AS (
  SELECT id, name FROM oem
)
INSERT INTO program (name, oem_id)
SELECT 'Serie 3', o.id FROM oems o WHERE o.name = 'BMW'
UNION ALL
SELECT 'Serie 5', o.id FROM oems o WHERE o.name = 'BMW';