// Script de test pour l'import via Railway
const { pool } = require('./models/db_config');

async function testImport() {
    console.log('🚀 Test import sur Railway...');
    
    try {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Test simple - créer une catégorie
            await client.query(
                'INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
                ['Test']
            );
            
            // Test simple - créer un produit
            await client.query(`
                INSERT INTO products (name, stock, stock_minimal, category_id)
                VALUES ($1, $2, $3, (SELECT id FROM categories WHERE name = $4))
                ON CONFLICT (name) DO UPDATE SET
                  stock = EXCLUDED.stock,
                  stock_minimal = EXCLUDED.stock_minimal
            `, ['Produit Test', 10, 5, 'Test']);
            
            await client.query('COMMIT');
            
            console.log('✅ Test réussi !');
            
            // Vérifier
            const result = await client.query('SELECT COUNT(*) FROM products');
            console.log(`📊 Nombre total de produits: ${result.rows[0].count}`);
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    }
    
    process.exit(0);
}

testImport();
