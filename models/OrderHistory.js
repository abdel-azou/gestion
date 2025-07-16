const db = require('./db_config');

const OrderHistory = {
    // Ajouter une commande à l'historique
    addOrder: (product_id, product_name, category_name, quantity_ordered, previous_stock, new_stock, notes = '') => {
        const stmt = db.prepare(`
            INSERT INTO order_history (product_id, product_name, category_name, quantity_ordered, previous_stock, new_stock, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(product_id, product_name, category_name, quantity_ordered, previous_stock, new_stock, notes);
    },

    // Obtenir toutes les commandes avec pagination
    getAll: (limit = 50, offset = 0, status = null) => {
        let query = `
            SELECT oh.*, p.name as current_product_name, c.name as current_category_name
            FROM order_history oh
            LEFT JOIN products p ON oh.product_id = p.id
            LEFT JOIN categories c ON p.category_id = c.id
        `;
        
        const params = [];
        
        if (status) {
            query += ' WHERE oh.order_status = ?';
            params.push(status);
        }
        
        query += ' ORDER BY oh.order_date DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);
        
        const stmt = db.prepare(query);
        return stmt.all(...params);
    },

    // Obtenir les commandes par période
    getByDateRange: (startDate, endDate, status = null) => {
        let query = `
            SELECT oh.*, p.name as current_product_name, c.name as current_category_name
            FROM order_history oh
            LEFT JOIN products p ON oh.product_id = p.id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE oh.order_date BETWEEN ? AND ?
        `;
        
        const params = [startDate, endDate];
        
        if (status) {
            query += ' AND oh.order_status = ?';
            params.push(status);
        }
        
        query += ' ORDER BY oh.order_date DESC';
        
        const stmt = db.prepare(query);
        return stmt.all(...params);
    },

    // Obtenir les commandes récentes (7 derniers jours)
    getRecent: (days = 7) => {
        const stmt = db.prepare(`
            SELECT oh.*, p.name as current_product_name, c.name as current_category_name
            FROM order_history oh
            LEFT JOIN products p ON oh.product_id = p.id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE oh.order_date >= datetime('now', '-${days} days')
            ORDER BY oh.order_date DESC
        `);
        return stmt.all();
    },

    // Mettre à jour le statut d'une commande
    updateStatus: (id, status, notes = '') => {
        const stmt = db.prepare(`
            UPDATE order_history 
            SET order_status = ?, notes = ?
            WHERE id = ?
        `);
        return stmt.run(status, notes, id);
    },

    // Obtenir les statistiques des commandes
    getStatistics: () => {
        const totalOrders = db.prepare('SELECT COUNT(*) as count FROM order_history').get().count;
        const pendingOrders = db.prepare("SELECT COUNT(*) as count FROM order_history WHERE order_status = 'pending'").get().count;
        const deliveredOrders = db.prepare("SELECT COUNT(*) as count FROM order_history WHERE order_status = 'delivered'").get().count;
        const cancelledOrders = db.prepare("SELECT COUNT(*) as count FROM order_history WHERE order_status = 'cancelled'").get().count;
        
        const todayOrders = db.prepare(`
            SELECT COUNT(*) as count 
            FROM order_history 
            WHERE date(order_date) = date('now')
        `).get().count;
        
        const weekOrders = db.prepare(`
            SELECT COUNT(*) as count 
            FROM order_history 
            WHERE order_date >= datetime('now', '-7 days')
        `).get().count;
        
        const monthOrders = db.prepare(`
            SELECT COUNT(*) as count 
            FROM order_history 
            WHERE order_date >= datetime('now', '-30 days')
        `).get().count;
        
        return {
            totalOrders,
            pendingOrders,
            deliveredOrders,
            cancelledOrders,
            todayOrders,
            weekOrders,
            monthOrders
        };
    },

    // Obtenir les commandes par produit
    getByProduct: (product_id) => {
        const stmt = db.prepare(`
            SELECT oh.*, p.name as current_product_name, c.name as current_category_name
            FROM order_history oh
            LEFT JOIN products p ON oh.product_id = p.id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE oh.product_id = ?
            ORDER BY oh.order_date DESC
        `);
        return stmt.all(product_id);
    },

    // Supprimer une commande de l'historique
    delete: (id) => {
        const stmt = db.prepare('DELETE FROM order_history WHERE id = ?');
        return stmt.run(id);
    },

    // Obtenir les produits les plus commandés
    getMostOrdered: (limit = 10) => {
        const stmt = db.prepare(`
            SELECT 
                product_name,
                category_name,
                COUNT(*) as order_count,
                SUM(quantity_ordered) as total_quantity,
                AVG(quantity_ordered) as avg_quantity
            FROM order_history
            GROUP BY product_id, product_name, category_name
            ORDER BY order_count DESC, total_quantity DESC
            LIMIT ?
        `);
        return stmt.all(limit);
    }
};

module.exports = OrderHistory;
