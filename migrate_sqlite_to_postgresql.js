// Migration SQLite vers PostgreSQL
// Ce script extrait toutes les données de l'ancienne base SQLite et les insère dans PostgreSQL

const Database = require('better-sqlite3');
const { Pool } = require('pg');
const path = require('path');

// Configuration PostgreSQL (Railway)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Ouvrir l'ancienne base SQLite
const sqliteDb = new Database(path.join(__dirname, 'data/project.db'), { readonly: true });

async function migrateData() {
    console.log('🚀 Début de la migration SQLite → PostgreSQL');
    
    const client = await pool.connect();
    
    try {
        // ===== MIGRATION DES CATÉGORIES =====
        console.log('📂 Migration des catégories...');
        
        const categoriesData = sqliteDb.prepare('SELECT * FROM categories ORDER BY id').all();
        console.log(`Trouvé ${categoriesData.length} catégories`);
        
        for (const category of categoriesData) {
            try {
                await client.query(`
                    INSERT INTO categories (name, description, color)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (name) DO UPDATE SET
                        description = EXCLUDED.description,
                        color = EXCLUDED.color
                `, [
                    category.name,
                    category.description || null,
                    category.color || '#007bff'
                ]);
                console.log(`✅ Catégorie: ${category.name}`);
            } catch (err) {
                console.log(`⚠️  Catégorie ${category.name} déjà existe ou erreur:`, err.message);
            }
        }

        // ===== MIGRATION DES PRODUITS =====
        console.log('\n📦 Migration des produits...');
        
        const productsData = sqliteDb.prepare(`
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            ORDER BY p.id
        `).all();
        
        console.log(`Trouvé ${productsData.length} produits`);
        
        for (const product of productsData) {
            try {
                // Récupérer l'ID de la catégorie dans PostgreSQL
                let categoryId = null;
                if (product.category_name) {
                    const catResult = await client.query(
                        'SELECT id FROM categories WHERE name = $1',
                        [product.category_name]
                    );
                    if (catResult.rows.length > 0) {
                        categoryId = catResult.rows[0].id;
                    }
                }

                await client.query(`
                    INSERT INTO products (name, description, price, stock, min_stock, unit, category_id)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    ON CONFLICT (name) DO UPDATE SET
                        description = EXCLUDED.description,
                        price = EXCLUDED.price,
                        stock = EXCLUDED.stock,
                        min_stock = EXCLUDED.min_stock,
                        unit = EXCLUDED.unit,
                        category_id = EXCLUDED.category_id
                `, [
                    product.name,
                    product.description || null,
                    product.price || 0,
                    product.stock || 0,
                    product.min_stock || 0,
                    product.unit || 'pièce',
                    categoryId
                ]);
                console.log(`✅ Produit: ${product.name} (Stock: ${product.stock})`);
            } catch (err) {
                console.log(`❌ Erreur produit ${product.name}:`, err.message);
            }
        }

        // ===== MIGRATION DES LISTES DE COMMANDES =====
        console.log('\n📋 Migration des listes de commandes...');
        
        try {
            const orderListsData = sqliteDb.prepare('SELECT * FROM order_lists ORDER BY id').all();
            console.log(`Trouvé ${orderListsData.length} listes de commandes`);
            
            for (const orderList of orderListsData) {
                try {
                    const result = await client.query(`
                        INSERT INTO order_lists (name, description, status, created_at)
                        VALUES ($1, $2, $3, $4)
                        RETURNING id
                    `, [
                        orderList.name,
                        orderList.description || null,
                        orderList.status || 'en_cours',
                        orderList.created_at || new Date().toISOString()
                    ]);
                    
                    const newOrderListId = result.rows[0].id;
                    
                    // Migrer les items de la liste
                    const listItems = sqliteDb.prepare(`
                        SELECT oli.*, p.name as product_name
                        FROM order_list_items oli
                        JOIN products p ON oli.product_id = p.id
                        WHERE oli.list_id = ?
                    `).all(orderList.id);
                    
                    for (const item of listItems) {
                        // Trouver le produit dans PostgreSQL
                        const productResult = await client.query(
                            'SELECT id FROM products WHERE name = $1',
                            [item.product_name]
                        );
                        
                        if (productResult.rows.length > 0) {
                            await client.query(`
                                INSERT INTO order_list_items (list_id, product_id, quantity, notes)
                                VALUES ($1, $2, $3, $4)
                            `, [
                                newOrderListId,
                                productResult.rows[0].id,
                                item.quantity || 1,
                                item.notes || null
                            ]);
                        }
                    }
                    
                    console.log(`✅ Liste: ${orderList.name} (${listItems.length} items)`);
                } catch (err) {
                    console.log(`❌ Erreur liste ${orderList.name}:`, err.message);
                }
            }
        } catch (err) {
            console.log('⚠️  Pas de listes de commandes à migrer ou erreur:', err.message);
        }

        // ===== STATISTIQUES FINALES =====
        console.log('\n📊 Vérification des données migrées:');
        
        const stats = await client.query(`
            SELECT 
                (SELECT COUNT(*) FROM categories) as categories_count,
                (SELECT COUNT(*) FROM products) as products_count,
                (SELECT COUNT(*) FROM order_lists) as order_lists_count
        `);
        
        const counts = stats.rows[0];
        console.log(`✅ ${counts.categories_count} catégories`);
        console.log(`✅ ${counts.products_count} produits`);
        console.log(`✅ ${counts.order_lists_count} listes de commandes`);
        
        console.log('\n🎉 Migration terminée avec succès !');
        
    } catch (error) {
        console.error('❌ Erreur pendant la migration:', error);
    } finally {
        client.release();
        sqliteDb.close();
        await pool.end();
    }
}

// Lancer la migration
if (require.main === module) {
    migrateData().catch(console.error);
}

module.exports = migrateData;
