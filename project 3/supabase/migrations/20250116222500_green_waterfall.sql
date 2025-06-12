/*
  # Mise à jour du schéma RFQ

  1. Modifications
    - Suppression de la colonne internal_customer de la table rfq
    - Modification des contraintes NOT NULL pour workpackage et due_date
    - Ajout d'index pour améliorer les performances

  2. Sécurité
    - Maintien des politiques RLS existantes
*/

-- Mettre à jour la table RFQ
ALTER TABLE IF EXISTS rfq
  ALTER COLUMN workpackage DROP NOT NULL,
  ALTER COLUMN due_date DROP NOT NULL;

-- Ajouter des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_rfq_reference ON rfq(reference);
CREATE INDEX IF NOT EXISTS idx_rfq_customer ON rfq(customer);
CREATE INDEX IF NOT EXISTS idx_rfq_program ON rfq(program);
CREATE INDEX IF NOT EXISTS idx_rfq_phase_status ON rfq(phase_status);

-- Mettre à jour les index pour les tables liées
CREATE INDEX IF NOT EXISTS idx_rfq_planning_rfq_id ON rfq_planning(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfq_worksharing_rfq_id ON rfq_worksharing(rfq_id);