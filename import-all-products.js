// Import COMPLET de tous les produits vers Railway
require('dotenv').config({ path: '.env.railway' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function importAllProducts() {
    console.log('🚀 Import COMPLET vers Railway DB...');
    
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
            
            // Groupe 4: Divers (23 produits)
            console.log('🔧 Import Divers...');
            const diversProducts = [
                ['Bobines papier', 10, 10],
                ['Papier toilette', 2, 2],
                ['Carton 1000cc', 2, 2],
                ['Carton 2000cc', 2, 2],
                ['Pots de wraps de 12 oz', 2, 2],
                ['Touillettes à café.', 2, 2],
                ['Serviettes sandwiches', 3, 3],
                ['Rouleaux bancontact', 3, 3],
                ['Gants noirs taille L', 5, 5],
                ['Petit gobelet à café', 2, 2],
                ['Couvercle Petit gobelet à café', 2, 2],
                ['Moyen gobelet à café', 2, 2],
                ['Couvercle Moyen gobelet à café', 2, 2],
                ['Grand gobelet à café', 2, 2],
                ['Couvercle Grand gobelet à café', 2, 2],
                ['Emballage Salade bowl 750', 2, 2],
                ['Rouleau film pvc 45cm', 2, 2],
                ['Aluminium 45cm', 2, 2],
                ['Produit four', 3, 3],
                ['Bidon liquide vaisselle + rinçage', 2, 2],
                ['Savon mains', 3, 3],
                ['Javel', 10, 10],
                ['Dasty', 10, 10]
            ];
            
            for (const [name, stock, stock_minimal] of diversProducts) {
                await client.query(`
                    INSERT INTO products (name, stock, stock_minimal, category_id)
                    VALUES ($1, $2, $3, (SELECT id FROM categories WHERE name = 'Divers'))
                `, [name, stock, stock_minimal]);
            }
            console.log(`✅ ${diversProducts.length} produits Divers importés`);
            
            // Groupe 5: Boite (18 produits)
            console.log('📦 Import Boites...');
            const boiteProducts = [
                ['11/8', 5, 5], ['13/8', 5, 5], ['15/8', 5, 5], ['17/8', 5, 5], ['19/8', 5, 5],
                ['21/8', 5, 5], ['23/8', 5, 5], ['25/8', 5, 5], ['27/8', 5, 5], ['30/8', 5, 5],
                ['19/11', 5, 5], ['21/11', 5, 5], ['23/11', 5, 5], ['25/11', 5, 5], ['27/11', 5, 5],
                ['30/11', 5, 5], ['35/10', 2, 2], ['40/10', 2, 2]
            ];
            
            for (const [name, stock, stock_minimal] of boiteProducts) {
                await client.query(`
                    INSERT INTO products (name, stock, stock_minimal, category_id)
                    VALUES ($1, $2, $3, (SELECT id FROM categories WHERE name = 'Boite'))
                `, [name, stock, stock_minimal]);
            }
            console.log(`✅ ${boiteProducts.length} produits Boite importés`);
            
            // Groupe 6: Frigo (4 produits)
            console.log('❄️ Import Frigo...');
            const frigoProducts = [
                ['Pâte filo', 3, 3],
                ['Saumon', 4, 4],
                ['Fromage blanc', 4, 4],
                ['Mascarpone', 10, 10]
            ];
            
            for (const [name, stock, stock_minimal] of frigoProducts) {
                await client.query(`
                    INSERT INTO products (name, stock, stock_minimal, category_id)
                    VALUES ($1, $2, $3, (SELECT id FROM categories WHERE name = 'Frigo'))
                `, [name, stock, stock_minimal]);
            }
            console.log(`✅ ${frigoProducts.length} produits Frigo importés`);
            
            // Groupe 7: Patissier (60+ produits)
            console.log('🧁 Import Patissier...');
            const patissierProducts = [
                ['CHOCOLAT BLANC', 0, 0], ['CHOCOLAT AU LAIT', 0, 0], ['CHOCOLAT NOIR 811', 0, 0],
                ['BATONS CHOCOLAT 300pc', 0, 0], ['PEPITES CHOCOLAT', 0, 0], ['GRAINS DE CAFE', 0, 0],
                ['CHOCOLAT', 0, 0], ['POUDRE DE CACAO', 0, 0], ['FONDANT BLANC', 0, 0], ['FONDANT CHOCOLAT', 0, 0],
                ['GLUCOSE', 0, 0], ['DELI CARAMEL', 0, 0], ['POIRES CONSERVES', 0, 0], ['ABRICOT CONSERVES', 0, 0],
                ['CERISES CONSERVES', 0, 0], ['CORIN D\'ABRICOT', 0, 0], ['DECORGEL NEUTRAL', 0, 0],
                ['MIROIR NEUTRE', 0, 0], ['PRALINE', 0, 0], ['MIROIR CHOCOLAT', 0, 0], ['PATE A SUCRE', 0, 0],
                ['BEURRE DE CACAO', 0, 0], ['SOUS GATEAUX 16CM', 0, 0], ['SOUS GATEAUX 18 CM', 0, 0],
                ['SOUS GATEAUX 20 CM', 0, 0], ['SOUS GATEAUX 22 CM', 0, 0], ['SOUS GATEAUX 24 CM', 0, 0],
                ['LANGUETTES CARR NOIR 8CM', 0, 0], ['CAISSETTES RONDES', 0, 0], ['CAISSETTES OVALES', 0, 0],
                ['CAISSETTES TRIANGULAIRES', 0, 0], ['CAISSETTES CALYPSO', 0, 0], ['CARTONS D\'OR 60/40', 0, 0],
                ['ASSIETTES RONDES NOIRES', 0, 0], ['BAVARIX 5CM', 0, 0], ['COLORANTS', 0, 0],
                ['MACARONS CHOCOLAT', 0, 0], ['FEUILLTINE', 0, 0], ['BRESILIENNE', 0, 0], ['GELATINE POUDRE', 0, 0],
                ['BACKING', 0, 0], ['VANILLE LIQUIDE', 0, 0], ['VANILLE POUDRE', 0, 0], ['CAFÉ TRABLE', 0, 0],
                ['SUCRE SO', 0, 0], ['SUCRE RAFTISNOW', 0, 0], ['RAISAINS SECS', 0, 0], ['POUDRE D\'AMANDE', 0, 0],
                ['AMANDES ÉFILÉES', 0, 0], ['AMANDES HACHÉES', 0, 0], ['AMANDES CONCASSÉES', 0, 0],
                ['PAILLETTES CHOCO NOIR', 0, 0], ['PAILLETTES CHOCO BLANC', 0, 0], ['MERINGUES 200PCS', 0, 0],
                ['SPECULOOS CONCASSÉES', 0, 0], ['BONBONNES DE GAZ', 0, 0], ['CREME PATISSIERE', 0, 0],
                ['BISCUIT', 0, 0], ['VEGETOP SUCRE', 0, 0], ['VEGETOP SANS SUCRE', 0, 0], ['BLANC D\'ŒUF', 0, 0],
                ['JAUNE D\'OEUF', 0, 0], ['BEURRE MONTAIGU', 0, 0], ['MARGARINE MIRA', 0, 0], ['FROMAGE', 0, 0],
                ['RIZ DEBIC PRECUIT', 0, 0], ['PURÉE DE FRAMBOISE', 0, 0], ['PURÉE DE PASSION', 0, 0],
                ['PURÉE DE FRAISE', 0, 0], ['PURÉE DE MANGUE', 0, 0], ['PURÉE DE CITRON', 0, 0], ['FRAMBOISES CONGELÉES', 0, 0]
            ];
            
            for (const [name, stock, stock_minimal] of patissierProducts) {
                await client.query(`
                    INSERT INTO products (name, stock, stock_minimal, category_id)
                    VALUES ($1, $2, $3, (SELECT id FROM categories WHERE name = 'Patissier'))
                `, [name, stock, stock_minimal]);
            }
            console.log(`✅ ${patissierProducts.length} produits Patissier importés`);
            
            await client.query('COMMIT');
            console.log('✅ Transaction terminée avec succès !');
            
            // Vérification finale
            const result = await client.query('SELECT COUNT(*) as total FROM products');
            console.log(`📊 TOTAL PRODUITS EN BASE: ${result.rows[0].total}`);
            
            // Vérification par catégorie
            const catStats = await client.query(`
                SELECT c.name, COUNT(p.id) as count
                FROM categories c
                LEFT JOIN products p ON c.id = p.category_id
                GROUP BY c.name
                ORDER BY c.name
            `);
            
            console.log('\n📋 Répartition par catégorie:');
            catStats.rows.forEach(row => console.log(`  ${row.name}: ${row.count} produits`));
            
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
    importAllProducts();
}

module.exports = { importAllProducts };
