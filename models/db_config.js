// models/db_config.js
const Database = require('better-sqlite3');
const path = require('path');

// Chemin de la base de données - utilise une variable d'env si disponible
const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'project.db');

// Options recommandées pour la production
const options = {
    verbose: process.env.NODE_ENV === 'development' ? console.log : null,
    fileMustExist: false // Permet de créer la DB si elle n'existe pas
};

const db = new Database(dbPath, options);

// Configuration pour la performance
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = 1000000');
db.pragma('temp_store = memory');

module.exports = db;
