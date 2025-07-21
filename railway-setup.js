// railway-setup.js - Script d'initialisation spécifique à Railway
const pool = require('./models/db_config');

async function setupRailwayDatabase() {
    if (!process.env.DATABASE_URL) {
        console.log('ℹ️  Pas de DATABASE_URL, probablement en local - ignorer');
        return;
    }

    try {
        console.log('🚀 Configuration Railway PostgreSQL en cours...');
        
        // Vérifier les tables existantes
        const result = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
        `);
        
        const existingTables = result.rows.map(row => row.table_name);
        console.log('📊 Tables existantes:', existingTables);
        
        // Créer les tables manquantes une par une
        const tablesToCreate = [
            {
                name: 'order_history',
                sql: `
                    CREATE TABLE IF NOT EXISTS order_history (
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
                `
            },
            {
                name: 'inventories',
                sql: `
                    CREATE TABLE IF NOT EXISTS inventories (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        notes TEXT,
                        created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        finalized_date TIMESTAMP,
                        status VARCHAR(50) DEFAULT 'draft',
                        category_id INTEGER,
                        FOREIGN KEY (category_id) REFERENCES categories(id)
                    );
                `
            },
            {
                name: 'inventory_items',
                sql: `
                    CREATE TABLE IF NOT EXISTS inventory_items (
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
                `
            }
        ];

        for (const table of tablesToCreate) {
            if (!existingTables.includes(table.name)) {
                console.log(`➕ Création de la table ${table.name}...`);
                await pool.query(table.sql);
                console.log(`✅ Table ${table.name} créée!`);
            } else {
                console.log(`ℹ️  Table ${table.name} existe déjà`);
            }
        }
        
        console.log('🎉 Configuration Railway PostgreSQL terminée!');
        
    } catch (error) {
        console.error('❌ Erreur configuration Railway:', error.message);
        // Ne pas faire planter l'app, juste loguer l'erreur
    }
}

module.exports = setupRailwayDatabase;
