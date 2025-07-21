// import-products-railway.js - Script à exécuter sur Railway
// Ce script sera exécuté directement sur Railway où la connexion PostgreSQL est locale

const pool = require('./models/db_config');

// Données des catégories - version simplifiée pour structure existante
const categoriesData = [
    { name: 'Farine' },
    { name: 'Congel' },
    { name: 'Sachet' },
    { name: 'Divers' },
    { name: 'Boite' },
    { name: 'Frigo' },
    { name: 'Patissier' }
];

// Données des produits (extrait de votre liste)
const productsData = [
    // Catégorie: Farine
    { categoryName: 'Farine', name: 'Semoule baguettes', stock: 50, stock_minimal: 50 },
    { categoryName: 'Farine', name: 'Oumeyma', stock: 50, stock_minimal: 50 },
    { categoryName: 'Farine', name: 'Natural supra', stock: 25, stock_minimal: 25 },
    { categoryName: 'Farine', name: 'Alpha', stock: 20, stock_minimal: 20 },
    { categoryName: 'Farine', name: 'Levure Bruggeman', stock: 6, stock_minimal: 6 },
    { categoryName: 'Farine', name: 'S500 puratos', stock: 2, stock_minimal: 2 },
    { categoryName: 'Farine', name: 'Boscous', stock: 10, stock_minimal: 10 },
    { categoryName: 'Farine', name: 'Seigle', stock: 2, stock_minimal: 2 },
    { categoryName: 'Farine', name: 'Decor cereales', stock: 2, stock_minimal: 2 },
    { categoryName: 'Farine', name: 'Sucre', stock: 15, stock_minimal: 15 },
    { categoryName: 'Farine', name: 'Sucre P4', stock: 2, stock_minimal: 2 },
    { categoryName: 'Farine', name: 'Sel', stock: 10, stock_minimal: 10 },
    { categoryName: 'Farine', name: 'Sésames', stock: 2, stock_minimal: 2 },
    { categoryName: 'Farine', name: 'Son', stock: 2, stock_minimal: 2 },
    { categoryName: 'Farine', name: 'Semoule harcha', stock: 3, stock_minimal: 3 },
    { categoryName: 'Farine', name: 'Œufs', stock: 6, stock_minimal: 6 },
    { categoryName: 'Farine', name: 'Papier cuisson 40x60', stock: 5, stock_minimal: 5 },
    { categoryName: 'Farine', name: 'Papier cuisson 80x60', stock: 2, stock_minimal: 2 },

    // Catégorie: Congel
    { categoryName: 'Congel', name: 'Croissant chocolat', stock: 5, stock_minimal: 5 },
    { categoryName: 'Congel', name: 'Croquant noisette chocolat', stock: 4, stock_minimal: 4 },
    { categoryName: 'Congel', name: 'Noix de pécan', stock: 4, stock_minimal: 4 },
    { categoryName: 'Congel', name: 'Croissant amande', stock: 5, stock_minimal: 5 },
    { categoryName: 'Congel', name: 'Amande cerise', stock: 4, stock_minimal: 4 },
    { categoryName: 'Congel', name: 'Boule de Berlin', stock: 3, stock_minimal: 3 },
    { categoryName: 'Congel', name: 'Croissant nature', stock: 2, stock_minimal: 2 },
    { categoryName: 'Congel', name: 'Couque au chocolat', stock: 2, stock_minimal: 2 },
    { categoryName: 'Congel', name: 'Maton', stock: 2, stock_minimal: 2 },
    { categoryName: 'Congel', name: 'Mini pecan', stock: 2, stock_minimal: 2 },

    // Catégorie: Sachet
    { categoryName: 'Sachet', name: 'P1', stock: 5, stock_minimal: 5 },
    { categoryName: 'Sachet', name: 'P2', stock: 5, stock_minimal: 5 },
    { categoryName: 'Sachet', name: 'P4', stock: 5, stock_minimal: 5 },
    { categoryName: 'Sachet', name: 'P6', stock: 5, stock_minimal: 5 },
    { categoryName: 'Sachet', name: 'Petit pain', stock: 5, stock_minimal: 5 },
    { categoryName: 'Sachet', name: 'Grand pain Carré', stock: 5, stock_minimal: 5 },
    { categoryName: 'Sachet', name: 'Grand pain Rond', stock: 5, stock_minimal: 5 },
    { categoryName: 'Sachet', name: '1 baguette', stock: 3, stock_minimal: 3 },
    { categoryName: 'Sachet', name: '2 baguettes', stock: 3, stock_minimal: 3 },
    { categoryName: 'Sachet', name: 'Sandwich', stock: 5, stock_minimal: 5 },
    { categoryName: 'Sachet', name: 'Sac plastique', stock: 10, stock_minimal: 10 },

    // Catégorie: Patissier (première partie)
    { categoryName: 'Patissier', name: 'CHOCOLAT BLANC', stock: 0, stock_minimal: 0 },
    { categoryName: 'Patissier', name: 'CHOCOLAT AU LAIT', stock: 0, stock_minimal: 0 },
    { categoryName: 'Patissier', name: 'CHOCOLAT NOIR 811', stock: 0, stock_minimal: 0 },
    { categoryName: 'Patissier', name: 'BATONS CHOCOLAT 300pc', stock: 0, stock_minimal: 0 },
    { categoryName: 'Patissier', name: 'PEPITES CHOCOLAT', stock: 0, stock_minimal: 0 },
    { categoryName: 'Patissier', name: 'GRAINS DE CAFE', stock: 0, stock_minimal: 0 },
    { categoryName: 'Patissier', name: 'POUDRE DE CACAO', stock: 0, stock_minimal: 0 },
    { categoryName: 'Patissier', name: 'FONDANT BLANC', stock: 0, stock_minimal: 0 },
    { categoryName: 'Patissier', name: 'FONDANT CHOCOLAT', stock: 0, stock_minimal: 0 },
    { categoryName: 'Patissier', name: 'GLUCOSE', stock: 0, stock_minimal: 0 },
    { categoryName: 'Patissier', name: 'DELI CARAMEL', stock: 0, stock_minimal: 0 },
    { categoryName: 'Patissier', name: 'PRALINE', stock: 0, stock_minimal: 0 },
    { categoryName: 'Patissier', name: 'MIROIR CHOCOLAT', stock: 0, stock_minimal: 0 },
    { categoryName: 'Patissier', name: 'PATE A SUCRE', stock: 0, stock_minimal: 0 },
    { categoryName: 'Patissier', name: 'BEURRE DE CACAO', stock: 0, stock_minimal: 0 },
    
    // Ajoutez le reste selon vos besoins...
];

async function importAllProducts() {
    console.log('🚀 Import produits Railway - Démarrage...');
    
    const client = await pool.connect();
    
    try {
        // Créer les catégories
        const categoryMapping = {};
        
        for (const category of categoriesData) {
            const result = await client.query(`
                INSERT INTO categories (name)
                VALUES ($1)
                ON CONFLICT (name) DO NOTHING
                RETURNING id
            `, [category.name]);
            
            // Récupérer l'ID (nouveau ou existant)
            let categoryId;
            if (result.rows.length > 0) {
                categoryId = result.rows[0].id;
            } else {
                const existing = await client.query('SELECT id FROM categories WHERE name = $1', [category.name]);
                categoryId = existing.rows[0].id;
            }
            
            categoryMapping[category.name] = categoryId;
            console.log(`✅ Catégorie: ${category.name}`);
        }

        // Créer les produits
        let count = 0;
        for (const product of productsData) {
            const categoryId = categoryMapping[product.categoryName];
            
            await client.query(`
                INSERT INTO products (name, stock, stock_minimal, category_id, unit, price)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (name) DO UPDATE SET
                    stock = EXCLUDED.stock,
                    stock_minimal = EXCLUDED.stock_minimal
            `, [
                product.name,
                product.stock,
                product.stock_minimal,
                categoryId,
                'pièce',
                0
            ]);
            
            count++;
            console.log(`✅ ${count}: ${product.name} (${product.stock})`);
        }
        
        console.log(`🎉 ${count} produits importés !`);
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        client.release();
    }
}

// Créer une route pour déclencher l'import
if (require.main === module) {
    importAllProducts().then(() => process.exit(0));
} else {
    module.exports = importAllProducts;
}
