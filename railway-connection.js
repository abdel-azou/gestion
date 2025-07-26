// Configuration pour se connecter à Railway DB en local
require('dotenv').config({ path: '.env.railway' });
const { Pool } = require('pg');

// URL de connexion Railway (lue depuis .env.railway)
const DATABASE_URL = process.env.DATABASE_URL;

console.log('🔗 Utilisation de l\'URL:', DATABASE_URL ? DATABASE_URL.replace(/:[^:@]+@/, ':***@') : 'AUCUNE URL TROUVÉE');

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function testConnection() {
    console.log('🔗 Test connexion Railway DB...');
    
    try {
        const client = await pool.connect();
        
        // Test simple
        const result = await client.query('SELECT NOW() as time, VERSION() as version');
        console.log('✅ Connexion réussie !');
        console.log('📅 Heure serveur:', result.rows[0].time);
        
        // Vérifier les tables
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        
        console.log('📋 Tables disponibles:');
        tables.rows.forEach(row => console.log('  -', row.table_name));
        
        // Compter les produits
        const products = await client.query('SELECT COUNT(*) as total FROM products');
        console.log('📦 Produits actuels:', products.rows[0].total);
        
        client.release();
        
    } catch (error) {
        console.error('❌ Erreur connexion:', error.message);
        console.log('\n💡 Vérifiez:');
        console.log('1. Votre DATABASE_URL dans Railway');
        console.log('2. Que la DB Railway est bien démarrée');
        console.log('3. Votre connexion internet');
    }
    
    process.exit(0);
}

module.exports = { pool, testConnection };

// Si lancé directement
if (require.main === module) {
    testConnection();
}
