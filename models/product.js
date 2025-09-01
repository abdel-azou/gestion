const pool = require('./db_config');

const Product = {
    getAll: async () => {
        const query = `
            SELECT products.*, categories.name as category
            FROM products
            JOIN categories ON products.category_id = categories.id
        `;
        const result = await pool.query(query);
        return result.rows;
    },
    
    create: async (name, stock, category_id, stock_minimal) => {
        const query = `
            INSERT INTO products (name, stock, category_id, stock_minimal)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const result = await pool.query(query, [name, stock, category_id, stock_minimal]);
        return result.rows[0];
    },
    
    createMany: async (productsArray) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            for (const product of productsArray) {
                await client.query(
                    'INSERT INTO products (name, stock, category_id, stock_minimal) VALUES ($1, $2, $3, $4)',
                    [product.name, product.stock, product.category_id, product.stock_minimal]
                );
            }
            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    },
    
    updateStock: async (id, stock) => {
        const query = 'UPDATE products SET stock = $1 WHERE id = $2';
        await pool.query(query, [stock, id]);
    },

    updateMinimalStock: async (id, stock_minimal) => {
        const query = 'UPDATE products SET stock_minimal = $1 WHERE id = $2';
        await pool.query(query, [stock_minimal, id]);
    },
    
    getById: async (id) => {
        const query = 'SELECT * FROM products WHERE id = $1';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    },
    
    deleteById: async (id) => {
        const query = 'DELETE FROM products WHERE id = $1';
        await pool.query(query, [id]);
    },
    
    getByCategory: async (categoryId) => {
        const query = `
            SELECT products.*, categories.name as category
            FROM products
            JOIN categories ON products.category_id = categories.id
            WHERE products.category_id = $1
        `;
        const result = await pool.query(query, [categoryId]);
        return result.rows;
    },
    
    getLowStockProducts: async () => {
        const query = `
            SELECT products.*, categories.name as category
            FROM products
            JOIN categories ON products.category_id = categories.id
            WHERE products.stock <= products.stock_minimal
        `;
        const result = await pool.query(query);
        return result.rows;
    },
    
    getOutOfStockProducts: async () => {
        const query = `
            SELECT products.*, categories.name as category
            FROM products
            JOIN categories ON products.category_id = categories.id
            WHERE products.stock = 0
        `;
        const result = await pool.query(query);
        return result.rows;
    },
    
    updateProduct: async (id, name, stock, category_id, stock_minimal) => {
        const query = `
            UPDATE products 
            SET name = $1, stock = $2, category_id = $3, stock_minimal = $4 
            WHERE id = $5
            RETURNING *
        `;
        const result = await pool.query(query, [name, stock, category_id, stock_minimal, id]);
        return result.rows[0];
    },
    
    getStatistics: async () => {
        const totalQuery = 'SELECT COUNT(*) as total FROM products';
        const lowStockQuery = 'SELECT COUNT(*) as low_stock FROM products WHERE stock <= stock_minimal AND stock > 0';
        const outOfStockQuery = 'SELECT COUNT(*) as out_of_stock FROM products WHERE stock = 0';
        
        const [totalResult, lowStockResult, outOfStockResult] = await Promise.all([
            pool.query(totalQuery),
            pool.query(lowStockQuery),
            pool.query(outOfStockQuery)
        ]);
        
        return {
            totalProducts: parseInt(totalResult.rows[0].total),
            lowStockProducts: parseInt(lowStockResult.rows[0].low_stock),
            outOfStockProducts: parseInt(outOfStockResult.rows[0].out_of_stock)
        };
    },

    getGeneralStats: async () => {
        const client = await pool.connect();
        try {
            // Statistiques des produits
            const productsQuery = 'SELECT COUNT(*) as total FROM products';
            const productsResult = await client.query(productsQuery);
            
            // Statistiques des catégories
            const categoriesQuery = 'SELECT COUNT(*) as total FROM categories';
            const categoriesResult = await client.query(categoriesQuery);
            
            // Statistiques des inventaires actifs
            const inventoriesQuery = 'SELECT COUNT(*) as total FROM inventories WHERE status = $1';
            const inventoriesResult = await client.query(inventoriesQuery, ['active']);
            
            return {
                totalProducts: parseInt(productsResult.rows[0].total) || 0,
                totalCategories: parseInt(categoriesResult.rows[0].total) || 0,
                activeInventories: parseInt(inventoriesResult.rows[0].total) || 0
            };
        } finally {
            client.release();
        }
    }
};

module.exports = Product;
