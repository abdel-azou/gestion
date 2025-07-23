const pool = require('./db_config');

const OrderList = {
    // Obtenir toutes les listes
    getAllLists: async () => {
        const query = `
            SELECT ol.*, 
                   COUNT(oli.id) as item_count,
                   SUM(oli.quantity) as total_quantity
            FROM order_lists ol
            LEFT JOIN order_list_items oli ON ol.id = oli.list_id
            GROUP BY ol.id, ol.name, ol.description, ol.created_date, ol.updated_date, ol.status, ol.notes
            ORDER BY ol.updated_date DESC
        `;
        const result = await pool.query(query);
        return result.rows;
    },

    // Créer une nouvelle liste
    create: async (name, description, notes) => {
        const query = `
            INSERT INTO order_lists (name, description, notes)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
        const result = await pool.query(query, [name, description || '', notes || '']);
        return result.rows[0];
    },

    // Obtenir une liste par ID avec ses items
    getByIdWithItems: async (id) => {
        const listQuery = 'SELECT * FROM order_lists WHERE id = $1';
        const itemsQuery = `
            SELECT oli.*, p.name as product_name, c.name as category_name
            FROM order_list_items oli
            JOIN products p ON oli.product_id = p.id
            JOIN categories c ON p.category_id = c.id
            WHERE oli.list_id = $1
            ORDER BY c.name, p.name
        `;
        
        const [listResult, itemsResult] = await Promise.all([
            pool.query(listQuery, [id]),
            pool.query(itemsQuery, [id])
        ]);
        
        if (listResult.rows.length === 0) return null;
        
        return {
            ...listResult.rows[0],
            items: itemsResult.rows
        };
    },

    // Ajouter un item à une liste
    addItem: async (listId, productId, quantity, notes) => {
        const query = `
            INSERT INTO order_list_items (list_id, product_id, quantity, notes)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (list_id, product_id)
            DO UPDATE SET 
                quantity = order_list_items.quantity + EXCLUDED.quantity,
                updated_date = CURRENT_TIMESTAMP
            RETURNING *
        `;
        const result = await pool.query(query, [listId, productId, quantity, notes || '']);
        return result.rows[0];
    },

    // Mettre à jour une liste
    update: async (id, name, description, status, notes) => {
        const query = `
            UPDATE order_lists 
            SET name = $1, description = $2, status = $3, notes = $4, updated_date = CURRENT_TIMESTAMP
            WHERE id = $5
            RETURNING *
        `;
        const result = await pool.query(query, [name, description || '', status, notes || '', id]);
        return result.rows[0];
    },

    // Supprimer une liste
    delete: async (id) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('DELETE FROM order_list_items WHERE list_id = $1', [id]);
            await client.query('DELETE FROM order_lists WHERE id = $1', [id]);
            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }
};

module.exports = OrderList;
