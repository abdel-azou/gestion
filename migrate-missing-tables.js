// migrate-missing-tables.js - Script pour ajouter les tables manquantes à Railway
const pool = require('./models/db_config');

async function addMissingTables() {
    try {
        console.log('🔧 Ajout des tables manquantes à PostgreSQL...');
        
        // Vérifier quelles tables existent
        const result = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
        `);
        
        const existingTables = result.rows.map(row => row.table_name);
        console.log('📊 Tables existantes:', existingTables);
        
        // Ajouter order_history si elle n'existe pas
        if (!existingTables.includes('order_history')) {
            console.log('➕ Création de la table order_history...');
            await pool.query(`
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
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (product_id) REFERENCES products(id)
                );
            `);
            console.log('✅ Table order_history créée!');
        }
        
        // Ajouter inventories si elle n'existe pas
        if (!existingTables.includes('inventories')) {
            console.log('➕ Création de la table inventories...');
            await pool.query(`
                CREATE TABLE inventories (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    notes TEXT,
                    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    finalized_date TIMESTAMP,
                    status VARCHAR(50) DEFAULT 'draft',
                    category_id INTEGER,
                    FOREIGN KEY (category_id) REFERENCES categories(id)
                );
            `);
            console.log('✅ Table inventories créée!');
        }
        
        // Ajouter inventory_items si elle n'existe pas
        if (!existingTables.includes('inventory_items')) {
            console.log('➕ Création de la table inventory_items...');
            await pool.query(`
                CREATE TABLE inventory_items (
                    id SERIAL PRIMARY KEY,
                    inventory_id INTEGER NOT NULL,
                    product_id INTEGER NOT NULL,
                    stock_before INTEGER NOT NULL,
                    stock_after INTEGER NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (inventory_id) REFERENCES inventories(id),
                    FOREIGN KEY (product_id) REFERENCES products(id),
                    UNIQUE(inventory_id, product_id)
                );
            `);
            console.log('✅ Table inventory_items créée!');
        }
        
        console.log('🎉 Migration des tables terminée avec succès!');
        
    } catch (error) {
        console.error('❌ Erreur lors de la migration:', error);
    } finally {
        process.exit(0);
    }
}

addMissingTables();
