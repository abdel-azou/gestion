-- db_install.sql
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS order_history;
DROP TABLE IF EXISTS order_sessions;
DROP TABLE IF EXISTS order_lists;
DROP TABLE IF EXISTS order_list_items;

CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    stock INTEGER NOT NULL,
    category_id INTEGER,
    stock_minimal INTEGER NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Insertion des catégories initiales
INSERT INTO categories (name) VALUES ('boite'), ('sachet'), ('frigo'), ('farine'), ('patissier'), ('boisson');

-- Table pour l'historique des commandes
CREATE TABLE order_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    category_name TEXT NOT NULL,
    quantity_ordered INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    order_status TEXT DEFAULT 'pending', -- pending, delivered, cancelled
    notes TEXT,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Table pour les sessions de commande (grouper plusieurs commandes)
CREATE TABLE order_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_name TEXT NOT NULL,
    total_items INTEGER DEFAULT 0,
    total_products INTEGER DEFAULT 0,
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'active', -- active, completed, cancelled
    notes TEXT
);

-- Tables pour les listes de commandes personnalisées
CREATE TABLE order_lists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'draft', -- draft, ordered, completed, cancelled
    notes TEXT
);

CREATE TABLE order_list_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    list_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    notes TEXT,
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (list_id) REFERENCES order_lists(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    UNIQUE(list_id, product_id)
);
