const db = require('./db_config');

const Inventory = {
    // Créer un nouvel inventaire
    create: (name, notes = '') => {
        const stmt = db.prepare(`
            INSERT INTO inventories (name, notes, created_date, status)
            VALUES (?, ?, datetime('now'), 'draft')
        `);
        return stmt.run(name, notes);
    },

    // Sauvegarder l'état actuel de tous les produits dans un inventaire
    saveCurrentStock: (inventoryId) => {
        const stmt = db.prepare(`
            INSERT INTO inventory_items (inventory_id, product_id, stock_before, stock_after)
            SELECT ?, p.id, p.stock, p.stock
            FROM products p
        `);
        return stmt.run(inventoryId);
    },

    // Mettre à jour le stock d'un produit dans l'inventaire
    updateProductStock: (inventoryId, productId, newStock) => {
        // D'abord, récupérer le stock actuel
        const getStockStmt = db.prepare(`
            SELECT stock_before FROM inventory_items 
            WHERE inventory_id = ? AND product_id = ?
        `);
        const currentItem = getStockStmt.get(inventoryId, productId);
        
        if (!currentItem) {
            // Si l'item n'existe pas, le créer
            const getProductStmt = db.prepare(`SELECT stock FROM products WHERE id = ?`);
            const product = getProductStmt.get(productId);
            
            const insertStmt = db.prepare(`
                INSERT INTO inventory_items (inventory_id, product_id, stock_before, stock_after)
                VALUES (?, ?, ?, ?)
            `);
            return insertStmt.run(inventoryId, productId, product.stock, newStock);
        } else {
            // Mettre à jour l'item existant
            const updateStmt = db.prepare(`
                UPDATE inventory_items 
                SET stock_after = ?, updated_date = datetime('now')
                WHERE inventory_id = ? AND product_id = ?
            `);
            return updateStmt.run(newStock, inventoryId, productId);
        }
    },

    // Finaliser un inventaire et mettre à jour le stock réel des produits
    finalize: (inventoryId, notes = '') => {
        console.log('Starting finalize for inventory:', inventoryId);
        
        try {
            // Marquer l'inventaire comme finalisé
            const updateInventoryStmt = db.prepare(`
                UPDATE inventories 
                SET status = 'finalized', notes = ?, finalized_date = datetime('now')
                WHERE id = ?
            `);
            const updateResult = updateInventoryStmt.run(notes, inventoryId);
            console.log('Inventory update result:', updateResult);

            // Vérifier qu'il y a des éléments d'inventaire
            const countStmt = db.prepare('SELECT COUNT(*) as count FROM inventory_items WHERE inventory_id = ?');
            const itemCount = countStmt.get(inventoryId);
            console.log('Inventory items count:', itemCount);

            // Mettre à jour le stock réel des produits
            const updateProductsStmt = db.prepare(`
                UPDATE products 
                SET stock = (
                    SELECT stock_after 
                    FROM inventory_items 
                    WHERE inventory_id = ? AND product_id = products.id
                )
                WHERE id IN (
                    SELECT product_id 
                    FROM inventory_items 
                    WHERE inventory_id = ?
                )
            `);
            const productsResult = updateProductsStmt.run(inventoryId, inventoryId);
            console.log('Products update result:', productsResult);

            return { success: true };
        } catch (error) {
            console.error('Error in finalize:', error);
            throw error;
        }
    },

    // Créer une liste de commandes basée sur l'inventaire
    createOrderListFromInventory: (inventoryId, listName) => {
        const OrderList = require('./OrderList');
        
        // Créer une nouvelle liste de commandes
        const createResult = OrderList.createList(listName, `Généré depuis l'inventaire ID: ${inventoryId}`);
        const listId = createResult.lastInsertRowid;

        // Ajouter les produits qui sont sous le stock minimum après l'inventaire
        const getProductsStmt = db.prepare(`
            SELECT ii.product_id, p.name, p.stock_minimal, ii.stock_after,
                   (p.stock_minimal - ii.stock_after) as quantity_needed,
                   c.name as category_name
            FROM inventory_items ii
            JOIN products p ON ii.product_id = p.id
            JOIN categories c ON p.category_id = c.id
            WHERE ii.inventory_id = ? AND ii.stock_after < p.stock_minimal
            ORDER BY c.name, p.name
        `);
        const productsToOrder = getProductsStmt.all(inventoryId);

        // Ajouter chaque produit à la liste de commandes
        productsToOrder.forEach(product => {
            OrderList.addProductToList(
                listId, 
                product.product_id, 
                product.quantity_needed,
                `Stock actuel: ${product.stock_after}, Stock minimum: ${product.stock_minimal}`
            );
        });

        return {
            listId,
            productsCount: productsToOrder.length,
            products: productsToOrder
        };
    },

    // Obtenir tous les inventaires
    getAll: () => {
        const stmt = db.prepare(`
            SELECT i.*, 
                   COUNT(ii.id) as items_count,
                   SUM(CASE WHEN ii.difference != 0 THEN 1 ELSE 0 END) as modified_items_count
            FROM inventories i
            LEFT JOIN inventory_items ii ON i.id = ii.inventory_id
            GROUP BY i.id
            ORDER BY i.created_date DESC
        `);
        return stmt.all();
    },

    // Obtenir un inventaire avec ses items
    getWithItems: (inventoryId) => {
        const inventoryStmt = db.prepare(`
            SELECT * FROM inventories WHERE id = ?
        `);
        const inventory = inventoryStmt.get(inventoryId);

        if (!inventory) return null;

        const itemsStmt = db.prepare(`
            SELECT ii.*, p.name as product_name, p.stock_minimal, c.name as category_name,
                   (ii.stock_after < p.stock_minimal) as below_minimum
            FROM inventory_items ii
            JOIN products p ON ii.product_id = p.id
            JOIN categories c ON p.category_id = c.id
            WHERE ii.inventory_id = ?
            ORDER BY c.name, p.name
        `);
        const items = itemsStmt.all(inventoryId);

        return {
            ...inventory,
            items
        };
    },

    // Supprimer un inventaire
    delete: (id) => {
        const deleteItemsStmt = db.prepare(`
            DELETE FROM inventory_items WHERE inventory_id = ?
        `);
        const deleteInventoryStmt = db.prepare(`
            DELETE FROM inventories WHERE id = ?
        `);
        
        deleteItemsStmt.run(id);
        return deleteInventoryStmt.run(id);
    },

    // Obtenir les statistiques des inventaires
    getStatistics: () => {
        const totalInventories = db.prepare('SELECT COUNT(*) as count FROM inventories').get().count;
        const draftInventories = db.prepare('SELECT COUNT(*) as count FROM inventories WHERE status = ?').get('draft').count;
        const finalizedInventories = db.prepare('SELECT COUNT(*) as count FROM inventories WHERE status = ?').get('finalized').count;

        return {
            totalInventories,
            draftInventories,
            finalizedInventories
        };
    }
};

module.exports = Inventory;
