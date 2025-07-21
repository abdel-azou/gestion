// init-db.js - Initialisation automatique de la base de données
const fs = require('fs');
const path = require('path');
const db = require('./models/db_config');

function initializeDatabase() {
    try {
        // Vérifier si les tables existent
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
        
        if (tables.length === 0) {
            console.log('📊 Initialisation de la base de données...');
            
            // Lire et exécuter le script d'installation
            const sqlScript = fs.readFileSync(path.join(__dirname, 'db_install.sql'), 'utf8');
            
            // Diviser les commandes SQL
            const commands = sqlScript.split(';').filter(cmd => cmd.trim());
            
            commands.forEach(command => {
                if (command.trim()) {
                    db.exec(command);
                }
            });
            
            console.log('✅ Base de données initialisée avec succès!');
        } else {
            console.log('📊 Base de données existante détectée.');
        }
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de la DB:', error);
    }
}

// Auto-initialisation au démarrage
if (require.main === module) {
    initializeDatabase();
} else {
    // Initialiser quand le module est requis
    initializeDatabase();
}

module.exports = { initializeDatabase };
