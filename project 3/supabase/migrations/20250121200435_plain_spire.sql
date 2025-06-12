-- Drop existing process constraint
ALTER TABLE existing_process DROP CONSTRAINT IF EXISTS existing_process_unique;

-- Add new constraint with ON CONFLICT DO NOTHING behavior
ALTER TABLE existing_process 
ADD CONSTRAINT existing_process_unique 
UNIQUE (process_id, plant_id) 
DEFERRABLE INITIALLY DEFERRED;

-- Add trigger to handle duplicates
CREATE OR REPLACE FUNCTION handle_existing_process_duplicates()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM existing_process 
    WHERE process_id = NEW.process_id 
    AND plant_id = NEW.plant_id 
    AND id != NEW.id
  ) THEN
    RETURN NULL;  -- Silently ignore duplicates
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER existing_process_duplicate_check
BEFORE INSERT OR UPDATE ON existing_process
FOR EACH ROW
EXECUTE FUNCTION handle_existing_process_duplicates();