-- Migration: Ajouter la colonne category_id à la table inventories
-- Date: 2025-01-19
-- Description: Permet de créer des inventaires spécifiques par catégorie (ex: pâtisserie)

-- Ajouter la colonne category_id à la table inventories
ALTER TABLE inventories ADD COLUMN category_id INTEGER;

-- Ajouter une contrainte de clé étrangère vers la table categories
-- Note: SQLite ne supporte pas ADD CONSTRAINT sur une table existante
-- La contrainte sera gérée au niveau applicatif

-- Index pour améliorer les performances des requêtes par catégorie
CREATE INDEX IF NOT EXISTS idx_inventories_category ON inventories(category_id);

-- Commentaires pour documentation
-- category_id = NULL : inventaire général (toutes catégories)
-- category_id = 5 : inventaire pâtisserie uniquement
-- category_id = autre : inventaire spécifique à une catégorie
