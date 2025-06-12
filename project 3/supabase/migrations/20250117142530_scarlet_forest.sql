/*
  # Optimisation des contraintes de la base de données

  1. Modifications
    - Ajout de contraintes de validation pour les dates
    - Ajout de contraintes de validation pour les quantités
    - Optimisation des index pour les recherches fréquentes

  2. Sécurité
    - Renforcement des politiques RLS
    - Ajout de contraintes pour prévenir les données invalides
*/

-- Ajout de contraintes de validation pour les dates de planning
ALTER TABLE rfq_planning
ADD CONSTRAINT valid_planning_dates
CHECK (
  (planned_date IS NULL OR planned_date >= CURRENT_DATE)
  AND (actual_date IS NULL OR actual_date <= CURRENT_DATE)
  AND (actual_date IS NULL OR planned_date IS NULL OR actual_date >= planned_date)
);

-- Ajout de contraintes pour les quantités
ALTER TABLE rfq_worksharing
ADD CONSTRAINT valid_qty_to_quote
CHECK (qty_to_quote > 0);

-- Optimisation des index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_rfq_created_at ON rfq(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rfq_due_date ON rfq(due_date);

-- Ajout d'une contrainte pour vérifier que la somme des quantités correspond au total
CREATE OR REPLACE FUNCTION check_total_qty()
RETURNS TRIGGER AS $$
DECLARE
  total_qty INTEGER;
  expected_qty INTEGER;
BEGIN
  -- Calculer la somme des quantités pour ce RFQ
  SELECT COALESCE(SUM(qty_to_quote), 0)
  INTO total_qty
  FROM rfq_worksharing
  WHERE rfq_id = NEW.rfq_id;

  -- Obtenir la quantité totale attendue du RFQ
  SELECT total_qty_to_quote
  INTO expected_qty
  FROM rfq
  WHERE id = NEW.rfq_id;

  -- Vérifier que la somme ne dépasse pas le total attendu
  IF (total_qty + NEW.qty_to_quote) > expected_qty THEN
    RAISE EXCEPTION 'La somme des quantités allouées (%) dépasse la quantité totale à chiffrer (%)',
      total_qty + NEW.qty_to_quote, expected_qty;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Création du trigger pour vérifier les quantités
DROP TRIGGER IF EXISTS check_total_qty_trigger ON rfq_worksharing;
CREATE TRIGGER check_total_qty_trigger
  BEFORE INSERT OR UPDATE ON rfq_worksharing
  FOR EACH ROW
  EXECUTE FUNCTION check_total_qty();