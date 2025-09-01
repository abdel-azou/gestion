const pool = require('./db_config');

const Inventory = {
    // Créer un nouvel inventaire (avec support pour catégorie spécifique)
    create: async (name, notes = '', categoryId = null) => {
        const query = `
            INSERT INTO inventories (name, notes, created_date, status, category_id)
            VALUES ($1, $2, NOW(), 'draft', $3)
            RETURNING id
        `;
        
        const client = await pool.connect();
        try {
            const result = await client.query(query, [name, notes, categoryId]);
            return { lastInsertRowid: result.rows[0].id };
        } finally {
            client.release();
        }
    },

    // Sauvegarder l'état actuel des produits (tous ou d'une catégorie spécifique)
    saveCurrentStock: async (inventoryId, categoryId = null) => {
        let query = `
            INSERT INTO inventory_items (inventory_id, product_id, stock_before, stock_after)
            SELECT $1, p.id, p.stock, p.stock
            FROM products p
        `;
        
        const client = await pool.connect();
        try {
            if (categoryId) {
                query += ` WHERE p.category_id = $2`;
                const result = await client.query(query, [inventoryId, categoryId]);
                return result.rowCount;
            } else {
                const result = await client.query(query, [inventoryId]);
                return result.rowCount;
            }
        } finally {
            client.release();
        }
    },

    // Obtenir tous les inventaires
    getAll: async () => {
        const query = `
            SELECT i.*, 
                   COUNT(ii.id) as item_count,
                   SUM(CASE WHEN ii.stock_before != ii.stock_after THEN 1 ELSE 0 END) as changed_items
            FROM inventories i
            LEFT JOIN inventory_items ii ON i.id = ii.inventory_id
            GROUP BY i.id, i.name, i.notes, i.created_date, i.finalized_date, i.status, i.category_id
            ORDER BY i.created_date DESC
        `;
        
        const client = await pool.connect();
        try {
            const result = await client.query(query);
            return result.rows;
        } finally {
            client.release();
        }
    },

    // Synchroniser un inventaire avec les stocks actuels (ajouter les nouveaux produits)
    syncWithCurrentStock: async (inventoryId, categoryId = null) => {
        let insertQuery = `
            INSERT INTO inventory_items (inventory_id, product_id, stock_before, stock_after)
            SELECT $1, p.id, p.stock, p.stock
            FROM products p
            WHERE p.id NOT IN (
                SELECT product_id FROM inventory_items WHERE inventory_id = $1
            )
        `;
        
        const client = await pool.connect();
        try {
            if (categoryId) {
                insertQuery += ` AND p.category_id = $2`;
                const result = await client.query(insertQuery, [inventoryId, categoryId]);
                return result.rowCount;
            } else {
                const result = await client.query(insertQuery, [inventoryId]);
                return result.rowCount;
            }
        } finally {
            client.release();
        }
    },

    // Obtenir un inventaire avec ses items
    getWithItems: async (inventoryId) => {
        const client = await pool.connect();
        try {
            // D'abord, synchroniser avec les produits actuels (ajouter les nouveaux produits)
            const insertQuery = `
                INSERT INTO inventory_items (inventory_id, product_id, stock_before, stock_after)
                SELECT $1, p.id, p.stock, p.stock
                FROM products p
                WHERE p.id NOT IN (
                    SELECT product_id FROM inventory_items WHERE inventory_id = $1
                )
            `;
            await client.query(insertQuery, [inventoryId]);
            
            const inventoryQuery = `
                SELECT i.*, c.name as category_name
                FROM inventories i
                LEFT JOIN categories c ON i.category_id = c.id
                WHERE i.id = $1
            `;
            
            const itemsQuery = `
                SELECT ii.*, p.name as product_name, c.name as category_name,
                       p.stock as current_stock, p.stock_minimal
                FROM inventory_items ii
                JOIN products p ON ii.product_id = p.id
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE ii.inventory_id = $1
                ORDER BY c.name, p.name
            `;

            const inventoryResult = await client.query(inventoryQuery, [inventoryId]);
            if (inventoryResult.rows.length === 0) {
                return null;
            }

            const itemsResult = await client.query(itemsQuery, [inventoryId]);
            
            const inventory = inventoryResult.rows[0];
            inventory.items = itemsResult.rows;
            
            return inventory;
        } finally {
            client.release();
        }
    },

    // Mettre à jour le stock d'un produit dans l'inventaire
    updateProductStock: async (inventoryId, productId, newStock) => {
        const query = `
            UPDATE inventory_items 
            SET stock_after = $1, updated_at = NOW()
            WHERE inventory_id = $2 AND product_id = $3
        `;
        
        const client = await pool.connect();
        try {
            const result = await client.query(query, [newStock, inventoryId, productId]);
            return result.rowCount > 0;
        } finally {
            client.release();
        }
    },

    // Finaliser un inventaire
    finalize: async (inventoryId, notes = '') => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Mettre à jour le statut de l'inventaire
            await client.query(`
                UPDATE inventories 
                SET status = 'finalized', 
                    finalized_date = NOW(),
                    notes = CASE WHEN $2 != '' THEN $2 ELSE notes END
                WHERE id = $1
            `, [inventoryId, notes]);

            // Mettre à jour les stocks réels des produits
            await client.query(`
                UPDATE products 
                SET stock = ii.stock_after
                FROM inventory_items ii
                WHERE products.id = ii.product_id 
                AND ii.inventory_id = $1
                AND ii.stock_after != ii.stock_before
            `, [inventoryId]);

            await client.query('COMMIT');
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    // Créer une liste de commandes depuis un inventaire
    createOrderListFromInventory: async (inventoryId, listName) => {
        const OrderList = require('./OrderList'); // Import local pour éviter la circularité
        
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Créer la liste de commandes
            const listResult = await OrderList.createList(listName, `Généré depuis inventaire #${inventoryId}`);
            const listId = listResult.lastInsertRowid;

            // Obtenir les produits à commander (stock après inventaire < stock minimal)
            const productsQuery = `
                SELECT ii.product_id, p.name, ii.stock_after, p.stock_minimal,
                       (p.stock_minimal - ii.stock_after) as quantity_needed
                FROM inventory_items ii
                JOIN products p ON ii.product_id = p.id
                WHERE ii.inventory_id = $1 
                AND ii.stock_after < p.stock_minimal
                ORDER BY quantity_needed DESC
            `;

            const productsResult = await client.query(productsQuery, [inventoryId]);
            const products = productsResult.rows;

            // Ajouter chaque produit à la liste
            for (const product of products) {
                await OrderList.addProductToList(
                    listId, 
                    product.product_id, 
                    product.quantity_needed,
                    `Stock inventaire: ${product.stock_after}, Minimum: ${product.stock_minimal}`
                );
            }

            await client.query('COMMIT');
            
            return {
                listId: listId,
                productsCount: products.length,
                products: products
            };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    // Supprimer un inventaire
    delete: async (inventoryId) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Supprimer les items de l'inventaire
            await client.query('DELETE FROM inventory_items WHERE inventory_id = $1', [inventoryId]);
            
            // Supprimer l'inventaire
            const result = await client.query('DELETE FROM inventories WHERE id = $1', [inventoryId]);
            
            await client.query('COMMIT');
            return result.rowCount > 0;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    // Créer un inventaire spécifique pour la pâtisserie
    createPatisserie: async (name, notes = '') => {
        // Utiliser la méthode create avec categoryId = 13 (Patissier)
        return await Inventory.create(name, notes, 13);
    },

    // Obtenir les statistiques d'un inventaire
    getStats: async (inventoryId) => {
        const query = `
            SELECT 
                COUNT(*) as total_products,
                COUNT(CASE WHEN stock_before != stock_after THEN 1 END) as changed_products,
                SUM(CASE WHEN stock_after > stock_before THEN (stock_after - stock_before) ELSE 0 END) as total_gains,
                SUM(CASE WHEN stock_after < stock_before THEN (stock_before - stock_after) ELSE 0 END) as total_losses,
                COUNT(CASE WHEN stock_after = 0 THEN 1 END) as out_of_stock_products,
                AVG(CASE WHEN stock_before != stock_after THEN ABS(stock_after - stock_before) END) as avg_change
            FROM inventory_items ii
            JOIN products p ON ii.product_id = p.id
            WHERE ii.inventory_id = $1
        `;
        
        const client = await pool.connect();
        try {
            const result = await client.query(query, [inventoryId]);
            const stats = result.rows[0];
            
            // Convertir les valeurs en nombres avec les noms attendus par la vue
            return {
                total_products: parseInt(stats.total_products) || 0,
                changed_products: parseInt(stats.changed_products) || 0,
                total_gains: parseInt(stats.total_gains) || 0,
                total_losses: parseInt(stats.total_losses) || 0,
                out_of_stock_products: parseInt(stats.out_of_stock_products) || 0,
                avg_change: parseFloat(stats.avg_change) || 0
            };
        } finally {
            client.release();
        }
    },

    // Obtenir l'historique des inventaires d'un produit
    getProductHistory: async (productId, limit = 10) => {
        const query = `
            SELECT i.name, i.created_date, ii.stock_before, ii.stock_after,
                   (ii.stock_after - ii.stock_before) as stock_change
            FROM inventory_items ii
            JOIN inventories i ON ii.inventory_id = i.id
            WHERE ii.product_id = $1
            ORDER BY i.created_date DESC
            LIMIT $2
        `;
        
        const client = await pool.connect();
        try {
            const result = await client.query(query, [productId, limit]);
            return result.rows;
        } finally {
            client.release();
        }
    }
};

module.exports = Inventory;
