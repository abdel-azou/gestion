-- db_install.sql
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS products;

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
