/*
  # Simplification finale de la structure de la base de données

  1. Modifications
    - Simplification maximale des tables
    - Suppression des contraintes non essentielles
    - Optimisation des politiques RLS

  2. Sécurité
    - Maintien des politiques RLS de base
    - Simplification des contraintes
*/

-- Suppression des tables existantes
DROP TABLE IF EXISTS rfq_worksharing CASCADE;
DROP TABLE IF EXISTS rfq_planning CASCADE;
DROP TABLE IF EXISTS rfq CASCADE;

-- Création de la table RFQ simplifiée
CREATE TABLE rfq (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reference text NOT NULL,
    round text NOT NULL,
    opportunity text NOT NULL,
    customer text NOT NULL,
    program text NOT NULL,
    workpackage text,
    due_date date,
    internal_customer text,
    phase_status text NOT NULL DEFAULT 'PROSPECT',
    total_qty_to_quote integer NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    created_by uuid,
    updated_at timestamptz DEFAULT now()
);

-- Création de la table Planning simplifiée
CREATE TABLE rfq_planning (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rfq_id uuid REFERENCES rfq(id) ON DELETE CASCADE,
    team text NOT NULL,
    planned_date date,
    actual_date date,
    created_at timestamptz DEFAULT now()
);

-- Création de la table Worksharing simplifiée
CREATE TABLE rfq_worksharing (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rfq_id uuid REFERENCES rfq(id) ON DELETE CASCADE,
    process text NOT NULL,
    plant text NOT NULL,
    qty_to_quote integer NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- Index essentiels uniquement
CREATE INDEX idx_rfq_created_by ON rfq(created_by);
CREATE INDEX idx_rfq_created_at ON rfq(created_at DESC);

-- Activation RLS
ALTER TABLE rfq ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfq_planning ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfq_worksharing ENABLE ROW LEVEL SECURITY;

-- Politiques RLS simplifiées
CREATE POLICY "Accès global aux RFQs"
    ON rfq FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Accès global au planning"
    ON rfq_planning FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Accès global au worksharing"
    ON rfq_worksharing FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);