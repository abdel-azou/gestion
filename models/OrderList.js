const db = require('./db_config');

const OrderList = {
    // Créer une nouvelle liste de commandes
    createList: (name, description = '') => {
        const stmt = db.prepare(`
            INSERT INTO order_lists (name, description, created_date, status)
            VALUES (?, ?, datetime('now'), 'draft')
        `);
        return stmt.run(name, description);
    },

    // Ajouter un produit à une liste
    addProductToList: (listId, productId, quantity, notes = '') => {
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO order_list_items (list_id, product_id, quantity, notes)
            VALUES (?, ?, ?, ?)
        `);
        return stmt.run(listId, productId, quantity, notes);
    },

    // Obtenir toutes les listes
    getAllLists: () => {
        const stmt = db.prepare(`
            SELECT ol.*, 
                   COUNT(oli.id) as item_count,
                   SUM(oli.quantity) as total_quantity
            FROM order_lists ol
            LEFT JOIN order_list_items oli ON ol.id = oli.list_id
            GROUP BY ol.id
            ORDER BY ol.created_date DESC
        `);
        return stmt.all();
    },

    // Obtenir une liste avec ses produits
    getListWithProducts: (listId) => {
        const listStmt = db.prepare(`
            SELECT * FROM order_lists WHERE id = ?
        `);
        const list = listStmt.get(listId);

        if (!list) return null;

        const itemsStmt = db.prepare(`
            SELECT oli.*, p.name as product_name, p.stock, p.stock_minimal, c.name as category_name
            FROM order_list_items oli
            JOIN products p ON oli.product_id = p.id
            JOIN categories c ON p.category_id = c.id
            WHERE oli.list_id = ?
            ORDER BY c.name, p.name
        `);
        const items = itemsStmt.all(listId);

        return {
            ...list,
            items: items
        };
    },

    // Mettre à jour une liste
    updateList: (id, name, description, status) => {
        const stmt = db.prepare(`
            UPDATE order_lists 
            SET name = ?, description = ?, status = ?, updated_date = datetime('now')
            WHERE id = ?
        `);
        return stmt.run(name, description, status, id);
    },

    // Supprimer un produit d'une liste
    removeProductFromList: (listId, productId) => {
        const stmt = db.prepare(`
            DELETE FROM order_list_items 
            WHERE list_id = ? AND product_id = ?
        `);
        return stmt.run(listId, productId);
    },

    // Supprimer une liste complète
    deleteList: (id) => {
        const deleteItemsStmt = db.prepare(`
            DELETE FROM order_list_items WHERE list_id = ?
        `);
        const deleteListStmt = db.prepare(`
            DELETE FROM order_lists WHERE id = ?
        `);
        
        deleteItemsStmt.run(id);
        return deleteListStmt.run(id);
    },

    // Dupliquer une liste
    duplicateList: (id, newName) => {
        const originalList = this.getListWithProducts(id);
        if (!originalList) return null;

        const newListResult = this.createList(newName, `Copie de: ${originalList.description}`);
        const newListId = newListResult.lastInsertRowid;

        const insertStmt = db.prepare(`
            INSERT INTO order_list_items (list_id, product_id, quantity, notes)
            VALUES (?, ?, ?, ?)
        `);

        originalList.items.forEach(item => {
            insertStmt.run(newListId, item.product_id, item.quantity, item.notes);
        });

        return newListId;
    },

    // Finaliser une commande (marquer comme commandée)
    finalizeOrder: (listId, notes = '') => {
        const list = this.getListWithProducts(listId);
        if (!list) return null;

        // Marquer la liste comme commandée
        this.updateList(listId, list.name, list.description, 'ordered');

        // Ajouter à l'historique des commandes
        const OrderHistory = require('./OrderHistory');
        
        list.items.forEach(item => {
            OrderHistory.addOrder(
                item.product_id,
                item.product_name,
                item.category_name,
                item.quantity,
                item.stock,
                item.stock + item.quantity,
                `Commande de la liste: ${list.name}${notes ? ' - ' + notes : ''}`
            );
        });

        return list;
    },

    // Obtenir les statistiques des listes
    getStatistics: () => {
        const totalLists = db.prepare('SELECT COUNT(*) as count FROM order_lists').get().count;
        const draftLists = db.prepare('SELECT COUNT(*) as count FROM order_lists WHERE status = ?').get('draft').count;
        const orderedLists = db.prepare('SELECT COUNT(*) as count FROM order_lists WHERE status = ?').get('ordered').count;
        const completedLists = db.prepare('SELECT COUNT(*) as count FROM order_lists WHERE status = ?').get('completed').count;

        return {
            totalLists,
            draftLists,
            orderedLists,
            completedLists
        };
    },

    // Obtenir les produits disponibles pour ajout à une liste
    getAvailableProducts: () => {
        const stmt = db.prepare(`
            SELECT p.*, c.name as category_name
            FROM products p
            JOIN categories c ON p.category_id = c.id
            ORDER BY c.name, p.name
        `);
        return stmt.all();
    },

    // Mettre à jour la quantité d'un produit dans une liste
    updateProductQuantity: (listId, productId, quantity) => {
        const stmt = db.prepare(`
            UPDATE order_list_items 
            SET quantity = ?, updated_date = datetime('now')
            WHERE list_id = ? AND product_id = ?
        `);
        return stmt.run(quantity, listId, productId);
    }
};

module.exports = OrderList;
