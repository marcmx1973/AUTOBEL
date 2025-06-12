/*
  # Correction de la structure RFQ

  1. Modifications
    - Ajout de contraintes de validation plus strictes
    - Optimisation des index
    - Correction des politiques RLS

  2. Sécurité
    - Renforcement des politiques RLS
    - Ajout de contraintes pour garantir l'intégrité des données
*/

-- Suppression des tables existantes dans le bon ordre
DROP TABLE IF EXISTS rfq_worksharing CASCADE;
DROP TABLE IF EXISTS rfq_planning CASCADE;
DROP TABLE IF EXISTS rfq CASCADE;

-- Création de la table RFQ avec les contraintes appropriées
CREATE TABLE rfq (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reference text NOT NULL,
    round text NOT NULL CHECK (round IN ('NEW', 'SES', 'RFI', 'RFQ-1', 'RFQ-2', 'RFQ-3', 'BAFO', 'RENEWAL', 'INTERNAL')),
    opportunity text NOT NULL,
    customer text NOT NULL,
    program text NOT NULL,
    workpackage text,
    due_date date,
    internal_customer text,
    phase_status text NOT NULL DEFAULT 'PROSPECT' CHECK (phase_status IN ('PROSPECT', 'PROPOSAL', 'NEGOTIATION', 'LOST', 'AWARDED', 'STANDBY', 'CANCELED', 'CLOSED')),
    total_qty_to_quote integer NOT NULL DEFAULT 0 CHECK (total_qty_to_quote >= 0),
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id) NOT NULL,
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT rfq_reference_unique UNIQUE (reference)
);

-- Création de la table RFQ Planning avec les contraintes appropriées
CREATE TABLE rfq_planning (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rfq_id uuid REFERENCES rfq(id) ON DELETE CASCADE NOT NULL,
    team text NOT NULL CHECK (team IN ('BLU', 'PIN', 'EOQ', 'GRE', 'RED')),
    planned_date date,
    actual_date date,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT valid_dates CHECK (
        (actual_date IS NULL OR planned_date IS NULL OR actual_date >= planned_date)
        AND (actual_date IS NULL OR actual_date <= CURRENT_DATE)
    )
);

-- Création de la table RFQ Worksharing avec les contraintes appropriées
CREATE TABLE rfq_worksharing (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rfq_id uuid REFERENCES rfq(id) ON DELETE CASCADE NOT NULL,
    process text NOT NULL,
    plant text NOT NULL,
    qty_to_quote integer NOT NULL CHECK (qty_to_quote > 0),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Création des index pour les performances
CREATE INDEX idx_rfq_reference ON rfq(reference);
CREATE INDEX idx_rfq_customer ON rfq(customer);
CREATE INDEX idx_rfq_program ON rfq(program);
CREATE INDEX idx_rfq_phase_status ON rfq(phase_status);
CREATE INDEX idx_rfq_created_by ON rfq(created_by);
CREATE INDEX idx_rfq_created_at ON rfq(created_at DESC);
CREATE INDEX idx_rfq_planning_rfq_id ON rfq_planning(rfq_id);
CREATE INDEX idx_rfq_worksharing_rfq_id ON rfq_worksharing(rfq_id);

-- Activation de la sécurité niveau ligne
ALTER TABLE rfq ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfq_planning ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfq_worksharing ENABLE ROW LEVEL SECURITY;

-- Création des politiques d'accès
CREATE POLICY "Users can read all RFQs"
    ON rfq FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert their own RFQs"
    ON rfq FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own RFQs"
    ON rfq FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own RFQs"
    ON rfq FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by);

-- Politiques pour la table Planning
CREATE POLICY "Users can manage planning for their RFQs"
    ON rfq_planning FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM rfq
        WHERE rfq.id = rfq_planning.rfq_id
        AND rfq.created_by = auth.uid()
    ));

-- Politiques pour la table Worksharing
CREATE POLICY "Users can manage worksharing for their RFQs"
    ON rfq_worksharing FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM rfq
        WHERE rfq.id = rfq_worksharing.rfq_id
        AND rfq.created_by = auth.uid()
    ));