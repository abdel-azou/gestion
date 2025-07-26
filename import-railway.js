// Import simple vers Railway DB
require('dotenv').config({ path: '.env.railway' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function importToRailway() {
    console.log('🚀 Import vers Railway DB...');
    
    try {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            console.log('📦 Transaction démarrée...');
            
            // 1. Créer les catégories
            console.log('📁 Création des catégories...');
            const categories = ['Farine', 'Congel', 'Sachet', 'Divers', 'Boite', 'Frigo', 'Patissier'];
            
            for (const categoryName of categories) {
                await client.query(
                    'INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
                    [categoryName]
                );
            }
            
            // 2. Import produits par petits groupes
            console.log('🍞 Import des produits...');
            
            // Groupe 1: Farine (18 produits)
            const farineProducts = [
                ['Semoule baguettes', 50, 50],
                ['Oumeyma', 50, 50],
                ['Natural supra', 25, 25],
                ['Alpha', 20, 20],
                ['Levure Bruggeman', 6, 6],
                ['S500 puratos', 2, 2],
                ['Boscous', 10, 10],
                ['Seigle', 2, 2],
                ['Decor cereales', 2, 2],
                ['Sucre', 15, 15],
                ['Sucre P4', 2, 2],
                ['Sel', 10, 10],
                ['Sésames', 2, 2],
                ['Son', 2, 2],
                ['Semoule harcha', 3, 3],
                ['Œufs', 6, 6],
                ['Papier cuisson 40x60', 5, 5],
                ['Papier cuisson 80x60', 2, 2]
            ];
            
            for (const [name, stock, stock_minimal] of farineProducts) {
                await client.query(`
                    INSERT INTO products (name, stock, stock_minimal, category_id)
                    VALUES ($1, $2, $3, (SELECT id FROM categories WHERE name = 'Farine'))
                `, [name, stock, stock_minimal]);
            }
            console.log(`✅ ${farineProducts.length} produits Farine importés`);
            
            // Groupe 2: Congel (10 produits)
            const congelProducts = [
                ['Croissant chocolat', 5, 5],
                ['Croquant noisette chocolat', 4, 4],
                ['Noix de pécan', 4, 4],
                ['Croissant amande', 5, 5],
                ['Amande cerise', 4, 4],
                ['Boule de Berlin', 3, 3],
                ['Croissant nature', 2, 2],
                ['Couque au chocolat', 2, 2],
                ['Maton', 2, 2],
                ['Mini pecan', 2, 2]
            ];
            
            for (const [name, stock, stock_minimal] of congelProducts) {
                await client.query(`
                    INSERT INTO products (name, stock, stock_minimal, category_id)
                    VALUES ($1, $2, $3, (SELECT id FROM categories WHERE name = 'Congel'))
                `, [name, stock, stock_minimal]);
            }
            console.log(`✅ ${congelProducts.length} produits Congel importés`);
            
            // Groupe 3: Sachets (11 produits)
            const sachetProducts = [
                ['P1', 5, 5],
                ['P2', 5, 5],
                ['P4', 5, 5],
                ['P6', 5, 5],
                ['Petit pain', 5, 5],
                ['Grand pain Carré', 5, 5],
                ['Grand pain Rond', 5, 5],
                ['1 baguette', 3, 3],
                ['2 baguettes', 3, 3],
                ['Sandwich', 5, 5],
                ['Sac plastique', 10, 10]
            ];
            
            for (const [name, stock, stock_minimal] of sachetProducts) {
                await client.query(`
                    INSERT INTO products (name, stock, stock_minimal, category_id)
                    VALUES ($1, $2, $3, (SELECT id FROM categories WHERE name = 'Sachet'))
                `, [name, stock, stock_minimal]);
            }
            console.log(`✅ ${sachetProducts.length} produits Sachet importés`);
            
            await client.query('COMMIT');
            console.log('✅ Transaction terminée avec succès !');
            
            // Vérification finale
            const result = await client.query('SELECT COUNT(*) as total FROM products');
            console.log(`📊 Total produits en base: ${result.rows[0].total}`);
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Erreur import:', error.message);
    }
    
    process.exit(0);
}

// Si lancé directement
if (require.main === module) {
    importToRailway();
}

module.exports = { importToRailway };
