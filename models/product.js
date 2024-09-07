const db = require('./db_config');

const Product = {
    getAll: () => {
        const stmt = db.prepare(`
            SELECT products.*, categories.name as category
            FROM products
            JOIN categories ON products.category_id = categories.id
        `);
        return stmt.all();
    },
    create: (name, stock, category_id, stock_minimal) => {
        const stmt = db.prepare(`
            INSERT INTO products (name, stock, category_id, stock_minimal)
            VALUES (?, ?, ?, ?)
        `);
        stmt.run(name, stock, category_id, stock_minimal);
    },
    updateStock: (id, stock) => {
        const stmt = db.prepare(`
            UPDATE products SET stock = ? WHERE id = ?
        `);
        stmt.run(stock, id);
    },
    getById: (id) => {
        const stmt = db.prepare(`
            SELECT * FROM products WHERE id = ?
        `);
        return stmt.get(id);
    },
    getProductsToOrder: () => {
        const stmt = db.prepare(`
            SELECT name, (stock_minimal - stock) as difference
            FROM products
            WHERE stock < stock_minimal
        `);
        return stmt.all();
    }
};

module.exports = Product;
