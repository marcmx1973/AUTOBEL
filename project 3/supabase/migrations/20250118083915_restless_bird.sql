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

-- Create PROGRAM table
CREATE TABLE program (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    oem_id uuid REFERENCES oem(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    CONSTRAINT program_name_unique UNIQUE (name)
);

-- Create CUSTOMER table
CREATE TABLE customer (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    abbreviation text NOT NULL,
    country text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    CONSTRAINT customer_name_unique UNIQUE (name),
    CONSTRAINT customer_abb_unique UNIQUE (abbreviation)
);

-- Create PROCESS table
CREATE TABLE process (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    CONSTRAINT process_name_unique UNIQUE (name)
);

-- Create GROUP DIVISION table
CREATE TABLE division (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    abbreviation text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    CONSTRAINT division_name_unique UNIQUE (name),
    CONSTRAINT division_abb_unique UNIQUE (abbreviation)
);

-- Create SITE table
CREATE TABLE site (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    division_id uuid REFERENCES division(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    CONSTRAINT site_name_unique UNIQUE (name)
);

-- Create PLANT table
CREATE TABLE plant (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    site_id uuid REFERENCES site(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    CONSTRAINT plant_name_unique UNIQUE (name)
);

-- Create EXISTING PROCESS table (junction table between PROCESS and PLANT)
CREATE TABLE existing_process (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    process_id uuid REFERENCES process(id) ON DELETE CASCADE,
    plant_id uuid REFERENCES plant(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    CONSTRAINT existing_process_unique UNIQUE (process_id, plant_id)
);

-- Create DEPARTMENT table
CREATE TABLE department (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    CONSTRAINT department_name_unique UNIQUE (name)
);

-- Create ROLE table
CREATE TABLE role (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    CONSTRAINT role_name_unique UNIQUE (name)
);

-- Create STAKEHOLDER table
CREATE TABLE stakeholder (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    department_id uuid REFERENCES department(id) ON DELETE CASCADE,
    plant_id uuid REFERENCES plant(id) ON DELETE CASCADE,
    role_id uuid REFERENCES role(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    CONSTRAINT stakeholder_name_unique UNIQUE (name)
);

-- Enable RLS on all tables
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

-- Create RLS policies for all tables
CREATE POLICY "Users can read all master data"
    ON oem FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage master data"
    ON oem FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Users can read all programs"
    ON program FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage programs"
    ON program FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Users can read all customers"
    ON customer FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage customers"
    ON customer FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Users can read all processes"
    ON process FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage processes"
    ON process FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Users can read all divisions"
    ON division FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage divisions"
    ON division FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Users can read all sites"
    ON site FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage sites"
    ON site FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Users can read all plants"
    ON plant FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage plants"
    ON plant FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Users can read all existing processes"
    ON existing_process FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage existing processes"
    ON existing_process FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Users can read all departments"
    ON department FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage departments"
    ON department FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Users can read all roles"
    ON role FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage roles"
    ON role FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Users can read all stakeholders"
    ON stakeholder FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage stakeholders"
    ON stakeholder FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_program_oem_id ON program(oem_id);
CREATE INDEX idx_site_division_id ON site(division_id);
CREATE INDEX idx_plant_site_id ON plant(site_id);
CREATE INDEX idx_existing_process_process_id ON existing_process(process_id);
CREATE INDEX idx_existing_process_plant_id ON existing_process(plant_id);
CREATE INDEX idx_stakeholder_department_id ON stakeholder(department_id);
CREATE INDEX idx_stakeholder_plant_id ON stakeholder(plant_id);
CREATE INDEX idx_stakeholder_role_id ON stakeholder(role_id);