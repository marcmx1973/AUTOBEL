/*
  # Correction du champ internal_customer

  1. Modifications
    - Rendre le champ internal_customer optionnel dans la table rfq
    
  2. Raison
    - Le champ internal_customer n'est plus requis dans l'interface utilisateur
    - Cette modification permet d'enregistrer des devis sans internal_customer
*/

ALTER TABLE rfq
  ALTER COLUMN internal_customer DROP NOT NULL;