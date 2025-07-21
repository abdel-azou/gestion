// Script d'initialisation SQLite pour les tests
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../data/test.db');
const db = new Database(dbPath);

// Création des tables
db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        color TEXT DEFAULT '#007bff',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL DEFAULT 0,
        stock INTEGER DEFAULT 0,
        min_stock INTEGER DEFAULT 0,
        unit TEXT DEFAULT 'pièce',
        category_id INTEGER REFERENCES categories(id),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS inventories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'en_cours',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        finalized_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS inventory_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        inventory_id INTEGER REFERENCES inventories(id),
        product_id INTEGER REFERENCES products(id),
        initial_stock INTEGER DEFAULT 0,
        counted_stock INTEGER,
        difference INTEGER,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_lists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'en_cours',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_list_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        list_id INTEGER REFERENCES order_lists(id),
        product_id INTEGER REFERENCES products(id),
        quantity INTEGER DEFAULT 1,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

// Insertion de données de test
db.exec(`
    INSERT OR IGNORE INTO categories (id, name, description, color) VALUES 
    (1, 'Test Catégorie', 'Catégorie pour tests', '#28a745'),
    (2, 'Pâtisserie', 'Produits de pâtisserie', '#dc3545');

    INSERT OR IGNORE INTO products (id, name, description, stock, category_id) VALUES 
    (1, 'Test Produit 1', 'Produit test 1', 10, 1),
    (2, 'Test Produit 2', 'Produit test 2', 5, 1),
    (3, 'Gâteau Chocolat', 'Délicieux gâteau au chocolat', 3, 2);
`);

console.log('✅ Base de données SQLite de test initialisée');
db.close();
