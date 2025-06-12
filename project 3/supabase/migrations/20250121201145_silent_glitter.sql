-- Drop existing stakeholder name unique constraint
ALTER TABLE stakeholder DROP CONSTRAINT IF EXISTS stakeholder_name_unique;

-- Add a more appropriate composite unique constraint
ALTER TABLE stakeholder 
ADD CONSTRAINT stakeholder_unique_combination 
UNIQUE (name, department_id, plant_id, role_id);

-- Update the stakeholder table to better handle duplicates
CREATE OR REPLACE FUNCTION handle_stakeholder_duplicates()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if exact combination already exists
  IF EXISTS (
    SELECT 1 FROM stakeholder 
    WHERE name = NEW.name 
    AND department_id = NEW.department_id 
    AND plant_id = NEW.plant_id 
    AND role_id = NEW.role_id 
    AND id != NEW.id
  ) THEN
    RETURN NULL;  -- Silently ignore duplicates
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stakeholder_duplicate_check
BEFORE INSERT OR UPDATE ON stakeholder
FOR EACH ROW
EXECUTE FUNCTION handle_stakeholder_duplicates();