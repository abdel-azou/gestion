const db = require('./db_config');

const Category = {
    create: (name) => {
        const stmt = db.prepare('INSERT INTO categories (name) VALUES (?)');
        stmt.run(name);
    },
    getAll: () => {
        const stmt = db.prepare('SELECT * FROM categories');
        return stmt.all();
    }
};

module.exports = Category;
