-- Drop existing policies
DO $$ 
BEGIN
  -- OEM policies
  DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON oem;
  DROP POLICY IF EXISTS "Enable insert for authenticated users" ON oem;
  DROP POLICY IF EXISTS "Enable update for authenticated users" ON oem;
  DROP POLICY IF EXISTS "Enable delete for authenticated users" ON oem;
  
  -- Customer policies
  DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON customer;
  DROP POLICY IF EXISTS "Enable insert for authenticated users" ON customer;
  DROP POLICY IF EXISTS "Enable update for authenticated users" ON customer;
  DROP POLICY IF EXISTS "Enable delete for authenticated users" ON customer;
  
  -- Process policies
  DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON process;
  DROP POLICY IF EXISTS "Enable insert for authenticated users" ON process;
  DROP POLICY IF EXISTS "Enable update for authenticated users" ON process;
  DROP POLICY IF EXISTS "Enable delete for authenticated users" ON process;
  
  -- Division policies
  DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON division;
  DROP POLICY IF EXISTS "Enable insert for authenticated users" ON division;
  DROP POLICY IF EXISTS "Enable update for authenticated users" ON division;
  DROP POLICY IF EXISTS "Enable delete for authenticated users" ON division;
  
  -- Site policies
  DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON site;
  DROP POLICY IF EXISTS "Enable insert for authenticated users" ON site;
  DROP POLICY IF EXISTS "Enable update for authenticated users" ON site;
  DROP POLICY IF EXISTS "Enable delete for authenticated users" ON site;
  
  -- Plant policies
  DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON plant;
  DROP POLICY IF EXISTS "Enable insert for authenticated users" ON plant;
  DROP POLICY IF EXISTS "Enable update for authenticated users" ON plant;
  DROP POLICY IF EXISTS "Enable delete for authenticated users" ON plant;
  
  -- Existing Process policies
  DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON existing_process;
  DROP POLICY IF EXISTS "Enable insert for authenticated users" ON existing_process;
  DROP POLICY IF EXISTS "Enable update for authenticated users" ON existing_process;
  DROP POLICY IF EXISTS "Enable delete for authenticated users" ON existing_process;
  
  -- Department policies
  DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON department;
  DROP POLICY IF EXISTS "Enable insert for authenticated users" ON department;
  DROP POLICY IF EXISTS "Enable update for authenticated users" ON department;
  DROP POLICY IF EXISTS "Enable delete for authenticated users" ON department;
  
  -- Role policies
  DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON role;
  DROP POLICY IF EXISTS "Enable insert for authenticated users" ON role;
  DROP POLICY IF EXISTS "Enable update for authenticated users" ON role;
  DROP POLICY IF EXISTS "Enable delete for authenticated users" ON role;
  
  -- Stakeholder policies
  DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON stakeholder;
  DROP POLICY IF EXISTS "Enable insert for authenticated users" ON stakeholder;
  DROP POLICY IF EXISTS "Enable update for authenticated users" ON stakeholder;
  DROP POLICY IF EXISTS "Enable delete for authenticated users" ON stakeholder;
END $$;

-- Create new unified policies for all master data tables
CREATE POLICY "Master data access policy" ON oem FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Master data access policy" ON program FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Master data access policy" ON customer FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Master data access policy" ON process FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Master data access policy" ON division FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Master data access policy" ON site FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Master data access policy" ON plant FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Master data access policy" ON existing_process FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Master data access policy" ON department FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Master data access policy" ON role FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Master data access policy" ON stakeholder FOR ALL TO authenticated USING (true) WITH CHECK (true);