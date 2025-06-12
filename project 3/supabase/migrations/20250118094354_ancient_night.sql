-- Insert OEM data
INSERT INTO oem (name, abbreviation, country) VALUES
('BMW', 'BMW', 'GERMANY'),
('Mercedes', 'MBZ', 'GERMANY');

-- Insert CUSTOMER data
INSERT INTO customer (name, abbreviation, country) VALUES
('VALEO', 'VAL', 'France');

-- Insert PROCESS data
INSERT INTO process (name, description) VALUES
('CNC MACHINING', 'cnc'),
('ASSEMBLY', 'ASS');

-- Insert GROUP DIVISION data
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