const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/products', productController.list);
router.get('/add-product', productController.form);
router.post('/products', productController.create);
router.post('/products/update-stock', productController.updateStock);
router.get('/categories', productController.categories);
router.post('/categories', productController.createCategory);
router.get('/liste_abdelhamid', productController.listeAbdelhamid);
router.get('/products-to-order', productController.productsToOrder);

module.exports = router;
