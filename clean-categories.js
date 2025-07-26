// Nettoyage des doublons de catégories
require('dotenv').config({ path: '.env.railway' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function cleanDuplicateCategories() {
    console.log('🧹 Nettoyage des doublons de catégories...');
    
    try {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // 1. Afficher l'état actuel
            const currentCats = await client.query('SELECT id, name FROM categories ORDER BY name');
            console.log('\n📋 Catégories actuelles:');
            currentCats.rows.forEach(cat => console.log(`  ${cat.id}: ${cat.name}`));
            
            // 2. Déplacer les produits des catégories en minuscules vers les majuscules
            console.log('\n🔄 Migration des produits...');
            
            const migrations = [
                { from: 'boite', to: 'Boite' },
                { from: 'farine', to: 'Farine' },
                { from: 'frigo', to: 'Frigo' },
                { from: 'patissier', to: 'Patissier' },
                { from: 'sachet', to: 'Sachet' },
                { from: 'boisson', to: 'Divers' } // Cette catégorie vide peut être supprimée
            ];
            
            for (const { from, to } of migrations) {
                // Vérifier si les deux catégories existent
                const fromCat = await client.query('SELECT id FROM categories WHERE name = $1', [from]);
                const toCat = await client.query('SELECT id FROM categories WHERE name = $1', [to]);
                
                if (fromCat.rows.length > 0 && toCat.rows.length > 0) {
                    // Compter les produits à migrer
                    const countResult = await client.query(
                        'SELECT COUNT(*) as count FROM products WHERE category_id = $1',
                        [fromCat.rows[0].id]
                    );
                    
                    const count = countResult.rows[0].count;
                    if (count > 0) {
                        // Migrer les produits
                        await client.query(
                            'UPDATE products SET category_id = $1 WHERE category_id = $2',
                            [toCat.rows[0].id, fromCat.rows[0].id]
                        );
                        console.log(`  ✅ ${count} produits migrés de "${from}" vers "${to}"`);
                    } else {
                        console.log(`  ℹ️ Aucun produit dans "${from}"`);
                    }
                }
            }
            
            // 3. Supprimer les catégories vides/doublons
            console.log('\n🗑️ Suppression des catégories vides...');
            
            const categoriesToDelete = ['boite', 'farine', 'frigo', 'patissier', 'sachet', 'boisson'];
            
            for (const catName of categoriesToDelete) {
                const result = await client.query(
                    'DELETE FROM categories WHERE name = $1 AND id NOT IN (SELECT DISTINCT category_id FROM products WHERE category_id IS NOT NULL)',
                    [catName]
                );
                
                if (result.rowCount > 0) {
                    console.log(`  🗑️ Catégorie "${catName}" supprimée`);
                } else {
                    console.log(`  ℹ️ Catégorie "${catName}" non trouvée ou contient des produits`);
                }
            }
            
            await client.query('COMMIT');
            console.log('\n✅ Nettoyage terminé !');
            
            // 4. Affichage final
            const finalCats = await client.query(`
                SELECT c.name, COUNT(p.id) as count
                FROM categories c
                LEFT JOIN products p ON c.id = p.category_id
                GROUP BY c.id, c.name
                ORDER BY c.name
            `);
            
            console.log('\n📊 Catégories finales:');
            let total = 0;
            finalCats.rows.forEach(cat => {
                console.log(`  ${cat.name}: ${cat.count} produits`);
                total += parseInt(cat.count);
            });
            console.log(`\n📦 TOTAL: ${total} produits`);
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Erreur nettoyage:', error.message);
    }
    
    process.exit(0);
}

// Si lancé directement
if (require.main === module) {
    cleanDuplicateCategories();
}

module.exports = { cleanDuplicateCategories };
