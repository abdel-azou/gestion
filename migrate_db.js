const db = require('./models/db_config');

// Script de migration pour ajouter les tables d'historique des commandes
function migrateDatabaseToV2() {
    console.log('🚀 Début de la migration de la base de données vers v2...');
    
    try {
        // Vérifier si les tables existent déjà
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
        const tableNames = tables.map(t => t.name);
        
        console.log('📋 Tables existantes:', tableNames);
        
        // Créer la table order_history si elle n'existe pas
        if (!tableNames.includes('order_history')) {
            console.log('📦 Création de la table order_history...');
            db.prepare(`
                CREATE TABLE order_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    product_id INTEGER NOT NULL,
                    product_name TEXT NOT NULL,
                    category_name TEXT NOT NULL,
                    quantity_ordered INTEGER NOT NULL,
                    previous_stock INTEGER NOT NULL,
                    new_stock INTEGER NOT NULL,
                    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    order_status TEXT DEFAULT 'pending',
                    notes TEXT,
                    FOREIGN KEY (product_id) REFERENCES products(id)
                )
            `).run();
            console.log('✅ Table order_history créée avec succès');
        } else {
            console.log('⚠️ Table order_history existe déjà');
        }
        
        // Créer la table order_sessions si elle n'existe pas
        if (!tableNames.includes('order_sessions')) {
            console.log('📦 Création de la table order_sessions...');
            db.prepare(`
                CREATE TABLE order_sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_name TEXT NOT NULL,
                    total_items INTEGER DEFAULT 0,
                    total_products INTEGER DEFAULT 0,
                    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    status TEXT DEFAULT 'active',
                    notes TEXT
                )
            `).run();
            console.log('✅ Table order_sessions créée avec succès');
        } else {
            console.log('⚠️ Table order_sessions existe déjà');
        }
        
        // Créer la table order_lists si elle n'existe pas
        if (!tableNames.includes('order_lists')) {
            console.log('📦 Création de la table order_lists...');
            db.prepare(`
                CREATE TABLE order_lists (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT,
                    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    status TEXT DEFAULT 'draft',
                    notes TEXT
                )
            `).run();
            console.log('✅ Table order_lists créée avec succès');
        } else {
            console.log('⚠️ Table order_lists existe déjà');
        }
        
        // Créer la table order_list_items si elle n'existe pas
        if (!tableNames.includes('order_list_items')) {
            console.log('📦 Création de la table order_list_items...');
            db.prepare(`
                CREATE TABLE order_list_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    list_id INTEGER NOT NULL,
                    product_id INTEGER NOT NULL,
                    quantity INTEGER NOT NULL,
                    notes TEXT,
                    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (list_id) REFERENCES order_lists(id),
                    FOREIGN KEY (product_id) REFERENCES products(id),
                    UNIQUE(list_id, product_id)
                )
            `).run();
            console.log('✅ Table order_list_items créée avec succès');
        } else {
            console.log('⚠️ Table order_list_items existe déjà');
        }
        
        // Ajouter quelques données de test dans l'historique
        const orderHistoryCount = db.prepare("SELECT COUNT(*) as count FROM order_history").get().count;
        
        if (orderHistoryCount === 0) {
            console.log('📝 Ajout de données de test dans l\'historique...');
            
            // Obtenir quelques produits existants
            const products = db.prepare(`
                SELECT p.*, c.name as category_name 
                FROM products p 
                JOIN categories c ON p.category_id = c.id 
                LIMIT 3
            `).all();
            
            if (products.length > 0) {
                const insertOrder = db.prepare(`
                    INSERT INTO order_history (product_id, product_name, category_name, quantity_ordered, previous_stock, new_stock, order_date, order_status, notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);
                
                products.forEach((product, index) => {
                    const quantity = 5 + index * 3;
                    const previousStock = product.stock - quantity;
                    const orderDate = new Date(Date.now() - (index * 24 * 60 * 60 * 1000)).toISOString();
                    const statuses = ['delivered', 'pending', 'delivered'];
                    
                    insertOrder.run(
                        product.id,
                        product.name,
                        product.category_name,
                        quantity,
                        previousStock,
                        product.stock,
                        orderDate,
                        statuses[index],
                        `Commande de test ${index + 1}`
                    );
                });
                
                console.log('✅ Données de test ajoutées');
            }
        }
        
        // Ajouter quelques listes de test
        const orderListsCount = db.prepare("SELECT COUNT(*) as count FROM order_lists").get().count;
        
        if (orderListsCount === 0) {
            console.log('📝 Ajout de listes de test...');
            
            // Créer une liste de test
            const insertList = db.prepare(`
                INSERT INTO order_lists (name, description, status)
                VALUES (?, ?, ?)
            `);
            
            const listResult = insertList.run(
                'Liste de test',
                'Liste de démonstration avec quelques produits',
                'draft'
            );
            
            // Ajouter quelques produits à la liste de test
            const products = db.prepare(`
                SELECT id FROM products LIMIT 3
            `).all();
            
            if (products.length > 0) {
                const insertItem = db.prepare(`
                    INSERT INTO order_list_items (list_id, product_id, quantity)
                    VALUES (?, ?, ?)
                `);
                
                products.forEach((product, index) => {
                    insertItem.run(listResult.lastInsertRowid, product.id, (index + 1) * 2);
                });
            }
            
            console.log('✅ Listes de test ajoutées');
        }
        
        console.log('🎉 Migration terminée avec succès !');
        
        // Afficher les statistiques
        const stats = {
            products: db.prepare("SELECT COUNT(*) as count FROM products").get().count,
            categories: db.prepare("SELECT COUNT(*) as count FROM categories").get().count,
            orders: db.prepare("SELECT COUNT(*) as count FROM order_history").get().count,
            sessions: db.prepare("SELECT COUNT(*) as count FROM order_sessions").get().count
        };
        
        console.log('📊 Statistiques de la base de données:');
        console.log(`   - Produits: ${stats.products}`);
        console.log(`   - Catégories: ${stats.categories}`);
        console.log(`   - Commandes: ${stats.orders}`);
        console.log(`   - Sessions: ${stats.sessions}`);
        
    } catch (error) {
        console.error('❌ Erreur lors de la migration:', error);
        throw error;
    }
}

// Exécuter la migration si le script est lancé directement
if (require.main === module) {
    migrateDatabaseToV2();
}

module.exports = { migrateDatabaseToV2 };
