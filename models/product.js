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
     createMany: (productsArray) => {
        // Prépare l'instruction SQL une seule fois pour une meilleure performance
        const insertStmt = db.prepare(`
            INSERT INTO products (name, stock, category_id, stock_minimal)
            VALUES (?, ?, ?, ?)
        `);

        // Utilise une transaction pour assurer que toutes les insertions réussissent ou échouent
        db.transaction((products) => {
            for (const product of products) {
                // Exécute l'insertion pour chaque produit dans le tableau
                insertStmt.run(product.name, product.stock, product.category_id, product.stock_minimal);
            }
        })(productsArray); // Passe le tableau de produits à la fonction de transaction
    },
    updateStock: (id, stock) => {
        const stmt = db.prepare(`
            UPDATE products SET stock = ? WHERE id = ?
        `);
        stmt.run(stock, id);
    },

    updateMinimalStock: (id, stock_minimal) => {
        const stmt = db.prepare(`
            UPDATE products SET stock_minimal = ? WHERE id = ?
        `);
        stmt.run(stock_minimal, id);
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
    },
    delete: (id) => {
        const parsedId = parseInt(id, 10);  // Force l'ID à être un nombre entier
        if (isNaN(parsedId)) {
            throw new Error("Invalid ID for deletion");
        }
        console.log(`Deleting product with ID: ${parsedId}`);
        const stmt = db.prepare(`
            DELETE FROM products WHERE id = ?
        `);
        stmt.run(parsedId);
    },
    
    // Méthodes pour l'espace admin
    update: (id, name, stock, category_id, stock_minimal) => {
        const stmt = db.prepare(`
            UPDATE products 
            SET name = ?, stock = ?, category_id = ?, stock_minimal = ?
            WHERE id = ?
        `);
        stmt.run(name, stock, category_id, stock_minimal, id);
    },
    
    getByCategory: (category_id = null) => {
        let stmt;
        if (category_id) {
            stmt = db.prepare(`
                SELECT products.*, categories.name as category
                FROM products
                JOIN categories ON products.category_id = categories.id
                WHERE products.category_id = ?
            `);
            return stmt.all(category_id);
        } else {
            return Product.getAll();
        }
    },
    
    getBelowMinimalStock: () => {
        const stmt = db.prepare(`
            SELECT products.*, categories.name as category
            FROM products
            JOIN categories ON products.category_id = categories.id
            WHERE products.stock < products.stock_minimal
        `);
        return stmt.all();
    },
    
    getStatistics: () => {
        const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
        const lowStockProducts = db.prepare('SELECT COUNT(*) as count FROM products WHERE stock < stock_minimal').get().count;
        const outOfStockProducts = db.prepare('SELECT COUNT(*) as count FROM products WHERE stock = 0').get().count;
        
        return {
            totalProducts,
            lowStockProducts,
            outOfStockProducts
        };
    }

};

module.exports = Product;
