const pool = require('./db_config');

const Category = {
    getAll: async () => {
        const query = 'SELECT * FROM categories ORDER BY name';
        const result = await pool.query(query);
        return result.rows;
    },
    
    create: async (name) => {
        const query = 'INSERT INTO categories (name) VALUES ($1) RETURNING *';
        const result = await pool.query(query, [name]);
        return result.rows[0];
    },
    
    getById: async (id) => {
        const query = 'SELECT * FROM categories WHERE id = $1';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    },
    
    deleteById: async (id) => {
        const query = 'DELETE FROM categories WHERE id = $1';
        await pool.query(query, [id]);
    },
    
    update: async (id, name) => {
        const query = 'UPDATE categories SET name = $1 WHERE id = $2 RETURNING *';
        const result = await pool.query(query, [name, id]);
        return result.rows[0];
    }
};

module.exports = Category;
