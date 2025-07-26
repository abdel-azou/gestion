const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { adminAuth, adminLogger, adminSecurity } = require('../middleware/adminMiddleware');

router.get('/products', productController.list);
router.get('/add-product', productController.form);
router.post('/products', productController.create);
router.post('/products/update-stock', productController.updateStock);
router.post('/products/update-minimal-stock', productController.updateMinimalStock);
router.post('/products/mark-as-ordered', productController.markAsOrdered);
router.get('/categories', productController.categories);
router.post('/categories', productController.createCategory);
router.get('/liste_abdelhamid', productController.listeAbdelhamid);
router.get('/chef-patissier', productController.chefPatissier);
router.get('/products-to-order', productController.productsToOrder);
router.get('/inventory', productController.inventoryDashboard);
router.post('/products/delete/:id', productController.deleteProduct);
router.get('/orders', productController.ordersSpace);
router.get('/api/orders/history', productController.getOrderHistory);
router.post('/api/orders/update-status', productController.updateOrderStatus);

// Routes pour l'espace admin (avec middleware de sécurité)
router.get('/admin', adminSecurity, adminLogger, adminAuth, productController.adminDashboard);
router.get('/admin/products/category/:categoryId', adminSecurity, adminLogger, adminAuth, productController.adminGetProductsByCategory);
router.get('/admin/products/:id', adminSecurity, adminLogger, adminAuth, productController.adminGetProduct);
router.post('/admin/products/update', adminSecurity, adminLogger, adminAuth, productController.adminUpdateProduct);
router.post('/admin/products/create', adminSecurity, adminLogger, adminAuth, productController.adminCreateProduct);
router.delete('/admin/products/:id', adminSecurity, adminLogger, adminAuth, productController.adminDeleteProduct);
router.post('/admin/categories', adminSecurity, adminLogger, adminAuth, productController.adminCreateCategory);
router.post('/admin/import-products', adminSecurity, adminLogger, adminAuth, productController.importProducts);

// Route de test simple pour l'import (temporaire)
router.get('/test-import', async (req, res) => {
    try {
        const { pool } = require('../models/db_config');
        const client = await pool.connect();
        
        // Test simple
        await client.query(
            'INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
            ['Test']
        );
        
        await client.query(`
            INSERT INTO products (name, stock, stock_minimal, category_id)
            VALUES ($1, $2, $3, (SELECT id FROM categories WHERE name = $4))
            ON CONFLICT (name) DO UPDATE SET stock = EXCLUDED.stock
        `, ['Produit Test Import', 10, 5, 'Test']);
        
        const result = await client.query('SELECT COUNT(*) as total FROM products');
        client.release();
        
        res.json({ 
            success: true, 
            message: `Test réussi! Total produits: ${result.rows[0].total}` 
        });
        
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Routes pour les listes de commandes
router.get('/order-lists', productController.orderListsPage);
router.post('/api/order-lists/create', productController.createOrderList);
router.post('/api/order-lists/create-with-products', productController.createOrderListWithProducts);
router.get('/api/order-lists/:id', productController.getOrderList);
router.post('/api/order-lists/add-product', productController.addProductToOrderList);
router.post('/api/order-lists/update-product', productController.updateProductInOrderList);
router.post('/api/order-lists/remove-product', productController.removeProductFromOrderList);
router.post('/api/order-lists/finalize', productController.finalizeOrderList);
router.post('/api/order-lists/duplicate', productController.duplicateOrderList);
router.delete('/api/order-lists/:id', productController.deleteOrderList);
router.get('/api/order-lists/:id/export', productController.exportOrderList);

// Routes pour les inventaires
router.get('/inventory', productController.inventoryDashboard);
router.get('/inventory/stats', productController.inventoryStats);
router.post('/api/inventory/create', productController.createInventory);
router.get('/api/inventory/all', productController.getAllInventories);
router.get('/api/inventory/:id', productController.getInventory);
router.post('/api/inventory/update-stock', productController.updateInventoryProductStock);
router.post('/api/inventory/:id/finalize', productController.finalizeInventory);
router.post('/api/inventory/:id/create-order-list', productController.createOrderListFromInventory);
router.delete('/api/inventory/:id', productController.deleteInventory);

// Route spécifique pour créer un inventaire pâtisserie
router.post('/api/inventory/create-patisserie', productController.createPatisserieInventory);

module.exports = router;
