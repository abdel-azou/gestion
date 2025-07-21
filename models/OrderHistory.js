const pool = require('./db_config');

const OrderHistory = {
    // Ajouter une commande à l'historique
    addOrder: async (product_id, product_name, category_name, quantity_ordered, previous_stock, new_stock, notes = '') => {
        const query = `
            INSERT INTO order_history (product_id, product_name, category_name, quantity_ordered, previous_stock, new_stock, notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
        `;
        const values = [product_id, product_name, category_name, quantity_ordered, previous_stock, new_stock, notes];
        
        const client = await pool.connect();
        try {
            const result = await client.query(query, values);
            return result.rows[0];
        } finally {
            client.release();
        }
    },

    // Obtenir toutes les commandes avec pagination
    getAll: async (limit = 50, offset = 0, status = null) => {
        let query = `
            SELECT oh.*, p.name as current_product_name, c.name as current_category_name
            FROM order_history oh
            LEFT JOIN products p ON oh.product_id = p.id
            LEFT JOIN categories c ON p.category_id = c.id
        `;
        
        const params = [];
        let paramCounter = 1;
        
        if (status) {
            query += ` WHERE oh.order_status = $${paramCounter}`;
            params.push(status);
            paramCounter++;
        }
        
        query += ` ORDER BY oh.order_date DESC LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`;
        params.push(limit, offset);

        const client = await pool.connect();
        try {
            const result = await client.query(query, params);
            return result.rows;
        } finally {
            client.release();
        }
    },

    // Obtenir les commandes récentes (X derniers jours)
    getRecent: async (days = 30) => {
        const query = `
            SELECT oh.*, p.name as current_product_name, c.name as current_category_name
            FROM order_history oh
            LEFT JOIN products p ON oh.product_id = p.id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE oh.order_date >= NOW() - INTERVAL '${days} days'
            ORDER BY oh.order_date DESC
        `;
        
        const client = await pool.connect();
        try {
            const result = await client.query(query);
            return result.rows;
        } finally {
            client.release();
        }
    },

    // Obtenir les statistiques des commandes
    getStatistics: async () => {
        const queries = [
            // Total des commandes
            'SELECT COUNT(*) as total_orders FROM order_history',
            
            // Commandes ce mois
            `SELECT COUNT(*) as monthly_orders FROM order_history 
             WHERE DATE_TRUNC('month', order_date) = DATE_TRUNC('month', NOW())`,
            
            // Commandes cette semaine
            `SELECT COUNT(*) as weekly_orders FROM order_history 
             WHERE DATE_TRUNC('week', order_date) = DATE_TRUNC('week', NOW())`,
             
            // Statut des commandes
            'SELECT order_status, COUNT(*) as count FROM order_history GROUP BY order_status',
            
            // Produits les plus commandés
            `SELECT product_name, COUNT(*) as order_count, SUM(quantity_ordered) as total_quantity 
             FROM order_history 
             GROUP BY product_id, product_name 
             ORDER BY order_count DESC 
             LIMIT 10`,
             
            // Moyenne des quantités commandées
            'SELECT AVG(quantity_ordered) as avg_quantity FROM order_history'
        ];

        const client = await pool.connect();
        try {
            const results = await Promise.all(
                queries.map(query => client.query(query))
            );

            return {
                totalOrders: parseInt(results[0].rows[0].total_orders),
                monthlyOrders: parseInt(results[1].rows[0].monthly_orders),
                weeklyOrders: parseInt(results[2].rows[0].weekly_orders),
                ordersByStatus: results[3].rows,
                topProducts: results[4].rows,
                avgQuantity: parseFloat(results[5].rows[0].avg_quantity) || 0
            };
        } finally {
            client.release();
        }
    },

    // Mettre à jour le statut d'une commande
    updateStatus: async (order_id, new_status, notes = '') => {
        const query = `
            UPDATE order_history 
            SET order_status = $1, 
                notes = CASE WHEN $2 != '' THEN $2 ELSE notes END,
                updated_at = NOW()
            WHERE id = $3
        `;
        
        const client = await pool.connect();
        try {
            const result = await client.query(query, [new_status, notes, order_id]);
            return result.rowCount > 0;
        } finally {
            client.release();
        }
    },

    // Obtenir l'historique d'un produit spécifique
    getByProduct: async (product_id, limit = 20) => {
        const query = `
            SELECT * FROM order_history 
            WHERE product_id = $1 
            ORDER BY order_date DESC 
            LIMIT $2
        `;
        
        const client = await pool.connect();
        try {
            const result = await client.query(query, [product_id, limit]);
            return result.rows;
        } finally {
            client.release();
        }
    },

    // Obtenir les commandes par période
    getByPeriod: async (start_date, end_date) => {
        const query = `
            SELECT oh.*, p.name as current_product_name, c.name as current_category_name
            FROM order_history oh
            LEFT JOIN products p ON oh.product_id = p.id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE DATE(oh.order_date) BETWEEN $1 AND $2
            ORDER BY oh.order_date DESC
        `;
        
        const client = await pool.connect();
        try {
            const result = await client.query(query, [start_date, end_date]);
            return result.rows;
        } finally {
            client.release();
        }
    },

    // Supprimer une commande de l'historique
    delete: async (order_id) => {
        const query = 'DELETE FROM order_history WHERE id = $1';
        
        const client = await pool.connect();
        try {
            const result = await client.query(query, [order_id]);
            return result.rowCount > 0;
        } finally {
            client.release();
        }
    }
};

module.exports = OrderHistory;
