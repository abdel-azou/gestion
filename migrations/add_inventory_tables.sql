-- Migration pour ajouter les tables d'inventaire
-- Date: 2025-07-18

-- Table pour stocker les inventaires
CREATE TABLE IF NOT EXISTS inventories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'finalized')),
    created_date DATETIME DEFAULT (datetime('now')),
    finalized_date DATETIME,
    updated_date DATETIME DEFAULT (datetime('now'))
);

-- Table pour stocker les items d'inventaire (état des produits)
CREATE TABLE IF NOT EXISTS inventory_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inventory_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    stock_before INTEGER NOT NULL DEFAULT 0,
    stock_after INTEGER NOT NULL DEFAULT 0,
    difference INTEGER GENERATED ALWAYS AS (stock_after - stock_before) STORED,
    notes TEXT,
    created_date DATETIME DEFAULT (datetime('now')),
    updated_date DATETIME DEFAULT (datetime('now')),
    FOREIGN KEY (inventory_id) REFERENCES inventories(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE(inventory_id, product_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_inventory_items_inventory_id ON inventory_items(inventory_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_product_id ON inventory_items(product_id);
CREATE INDEX IF NOT EXISTS idx_inventories_status ON inventories(status);
CREATE INDEX IF NOT EXISTS idx_inventories_created_date ON inventories(created_date);
