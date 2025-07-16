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
router.get('/products-to-order', productController.productsToOrder);
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

module.exports = router;
