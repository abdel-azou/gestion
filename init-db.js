// init-db.js - Initialisation automatique de la base PostgreSQL
const fs = require('fs');
const path = require('path');
const pool = require('./models/db_config');

async function initializeDatabase() {
    try {
        console.log('📊 Vérification de la base PostgreSQL...');
        
        // Vérifier si les tables existent
        const result = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
        `);
        
        if (result.rows.length === 0) {
            console.log('📊 Initialisation de la base PostgreSQL...');
            
            // Lire et adapter le script SQL pour PostgreSQL
            let sqlScript = fs.readFileSync(path.join(__dirname, 'db_install.sql'), 'utf8');
            
            // Adapter le SQL pour PostgreSQL
            sqlScript = sqlScript
                .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/g, 'SERIAL PRIMARY KEY')
                .replace(/DATETIME DEFAULT CURRENT_TIMESTAMP/g, 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP')
                .replace(/TEXT UNIQUE NOT NULL/g, 'VARCHAR(255) UNIQUE NOT NULL')
                .replace(/TEXT NOT NULL/g, 'VARCHAR(255) NOT NULL')
                .replace(/TEXT DEFAULT/g, 'VARCHAR(255) DEFAULT')
                .replace(/TEXT,/g, 'TEXT,');
            
            // Exécuter le script
            await pool.query(sqlScript);
            
            console.log('✅ Base PostgreSQL initialisée avec succès!');
        } else {
            console.log('📊 Base PostgreSQL existante détectée.');
        }
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation PostgreSQL:', error);
    }
}

// Auto-initialisation au démarrage
if (require.main === module) {
    initializeDatabase().then(() => process.exit(0));
} else {
    // Initialiser quand le module est requis
    initializeDatabase();
}

module.exports = { initializeDatabase };
