// Test temporaire avec SQLite pour vérifier la logique async/await
const Database = require('better-sqlite3');
const path = require('path');

// Base de données SQLite temporaire
const dbPath = path.join(__dirname, '../data/test.db');
const db = new Database(dbPath);

// Simulation d'un pool PostgreSQL avec SQLite
const pool = {
    query: async (text, params = []) => {
        try {
            // Convertir la syntaxe PostgreSQL en SQLite
            let sqliteQuery = text
                .replace(/\$\d+/g, '?') // $1, $2 -> ?
                .replace(/RETURNING \*/g, '') // Supprimer RETURNING
                .replace(/SERIAL/g, 'INTEGER') // SERIAL -> INTEGER
                .replace(/TIMESTAMP DEFAULT CURRENT_TIMESTAMP/g, 'DATETIME DEFAULT CURRENT_TIMESTAMP');

            console.log('🔍 Executing SQLite query:', sqliteQuery, 'with params:', params);

            if (text.includes('INSERT') || text.includes('UPDATE') || text.includes('DELETE')) {
                const stmt = db.prepare(sqliteQuery);
                const result = stmt.run(...params);
                return {
                    rows: [],
                    rowCount: result.changes,
                    lastInsertRowid: result.lastInsertRowid
                };
            } else {
                const stmt = db.prepare(sqliteQuery);
                const rows = stmt.all(...params);
                return { rows, rowCount: rows.length };
            }
        } catch (error) {
            console.error('❌ SQLite Error:', error.message);
            console.error('Query:', text);
            console.error('Params:', params);
            throw error;
        }
    }
};

module.exports = pool;
