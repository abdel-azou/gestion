-- db_install_postgres.sql
-- Script d'installation pour PostgreSQL

-- Supprimer les tables si elles existent
DROP TABLE IF EXISTS order_list_items CASCADE;
DROP TABLE IF EXISTS order_lists CASCADE;
DROP TABLE IF EXISTS order_sessions CASCADE;
DROP TABLE IF EXISTS order_history CASCADE;
DROP TABLE IF EXISTS inventories CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- Créer les tables avec les types PostgreSQL
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    stock INTEGER NOT NULL,
    category_id INTEGER,
    stock_minimal INTEGER NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Table pour l'historique des commandes
CREATE TABLE order_history (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    category_name VARCHAR(255) NOT NULL,
    quantity_ordered INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    order_status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Table pour les sessions de commande
CREATE TABLE order_sessions (
    id SERIAL PRIMARY KEY,
    session_name VARCHAR(255) NOT NULL,
    total_items INTEGER DEFAULT 0,
    total_products INTEGER DEFAULT 0,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active',
    notes TEXT
);

-- Tables pour les listes de commandes personnalisées
CREATE TABLE order_lists (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'draft',
    notes TEXT
);

CREATE TABLE order_list_items (
    id SERIAL PRIMARY KEY,
    list_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    notes TEXT,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (list_id) REFERENCES order_lists(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    UNIQUE(list_id, product_id)
);

-- Table pour les inventaires
CREATE TABLE inventories (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    quantity_counted INTEGER NOT NULL,
    quantity_expected INTEGER NOT NULL,
    difference INTEGER NOT NULL,
    notes TEXT,
    inventory_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_name VARCHAR(255),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Insertion des catégories initiales
INSERT INTO categories (name) VALUES 
('boite'), 
('sachet'), 
('frigo'), 
('farine'), 
('patissier'), 
('boisson');
