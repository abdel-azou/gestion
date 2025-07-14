const Product = require('../models/product');
const Category = require('../models/category');

const productController = {
    list: (req, res) => {
        console.log("Fetching product list");
        const products = Product.getAll();
        console.log("Products:", products);
        const categories = Category.getAll();
        console.log("Categories:", categories);

        const productsByCategory = categories.map(category => ({
            id: category.id,
            name: category.name,
            products: products.filter(product => product.category_id === category.id)
        }));
        
        console.log("Products by category:", JSON.stringify(productsByCategory, null, 2));
        res.render('products', { productsByCategory });
    },
    form: (req, res) => {
        console.log("Fetching form for adding product");
        const categories = Category.getAll();
        console.log("Categories:", categories);
        res.render('addProduct', { categories });
    },
    create: (req, res) => {
        console.log("Creating new product");
        const { name, stock, category_id, stock_minimal } = req.body;
        console.log("Received data:", { name, stock, category_id, stock_minimal });
        Product.create(name, parseInt(stock), parseInt(category_id), parseInt(stock_minimal));
        res.redirect('liste_abdelhamid');
    },
    updateStock: (req, res) => {
        console.log("Updating stock");
        const { id, amount } = req.body;
        console.log("Received data:", { id, amount });
        const product = Product.getById(id);
        if (product) {
            const newStock = product.stock + amount;
            if (newStock < 0) {
                console.log("Stock cannot be negative. Update aborted.");
                res.status(400).send('Stock cannot be negative.');
            } else {
                Product.updateStock(id, newStock);
                console.log("Updated stock:", newStock);
                res.sendStatus(200);
            }
        } else {
            console.error("Product not found");
            res.status(404).send('Product not found');
        }
    },
    listeAbdelhamid: (req, res) => {
        console.log("Fetching product list for liste_abdelhamid");
        const products = Product.getAll();
        console.log("Products:", products);
        const categories = Category.getAll();
        console.log("Categories:", categories);

        const productsByCategory = categories.map(category => ({
            id: category.id,
            name: category.name,
            products: products.filter(product => product.category_id === category.id)
        }));
        
        console.log("Products by category:", JSON.stringify(productsByCategory, null, 2));
        res.render('liste_abdelhamid', { productsByCategory });
    },
    categories: (req, res) => {
        console.log("Fetching categories");
        const categories = Category.getAll();
        res.json(categories);
    },
    createCategory: (req, res) => {
        console.log("Creating new category");
        const { name } = req.body;
        Category.create(name);
        res.sendStatus(201);
    },
    productsToOrder: (req, res) => {
        console.log("Fetching products to order");
        const products = Product.getAll();
        const productsToOrder = products.filter(product => product.stock < product.stock_minimal);
        
        // Enrichir les données avec les informations nécessaires pour le tableau interactif
        const enrichedProducts = productsToOrder.map(product => ({
            id: product.id,
            name: product.name,
            category: product.category,
            category_id: product.category_id,
            currentStock: product.stock,
            minimalStock: product.stock_minimal,
            quantityNeeded: product.stock_minimal - product.stock,
            stockStatus: product.stock === 0 ? 'out' : product.stock < product.stock_minimal * 0.2 ? 'critical' : 'low'
        }));
        
        console.log("Products to order:", enrichedProducts);
        res.render('productsToOrder', { productsToOrder: enrichedProducts });
    },
    deleteProduct: (req, res) => {
        const productId = req.params.id;
        console.log(`Received request to delete product with ID: ${productId}`);  // Log ID reçu
    
        if (!productId) {
            console.log("No product ID provided.");
            return res.status(400).send('ID de produit manquant.');
        }
    
        try {
            Product.delete(productId);  // Appel à la méthode de suppression
            console.log(`Product deletion successful for ID: ${productId}`);  // Log après suppression
            res.status(200).send('Produit supprimé');  // Confirmation succès
        } catch (err) {
            console.error("Error during product deletion:", err);
            res.status(500).send('Erreur lors de la suppression.');
        }
    },
    // Nouvelle méthode pour mettre à jour le stock minimal
    updateMinimalStock: (req, res) => {
        console.log("Updating minimal stock");
        const { id, stock_minimal } = req.body;
        console.log("Received data:", { id, stock_minimal });
        
        try {
            Product.updateMinimalStock(id, stock_minimal);
            console.log("Updated minimal stock:", stock_minimal);
            res.sendStatus(200);
        } catch (error) {
            console.error("Error updating minimal stock:", error);
            res.status(500).send('Error updating minimal stock');
        }
    },

    // Nouvelle méthode pour marquer comme commandé
    markAsOrdered: (req, res) => {
        console.log("Marking as ordered");
        const { id, quantity } = req.body;
        console.log("Received data:", { id, quantity });
        
        try {
            const product = Product.getById(id);
            if (product) {
                const newStock = product.stock + quantity;
                Product.updateStock(id, newStock);
                console.log("Updated stock after order:", newStock);
                res.sendStatus(200);
            } else {
                res.status(404).send('Product not found');
            }
        } catch (error) {
            console.error("Error marking as ordered:", error);
            res.status(500).send('Error marking as ordered');
        }
    },
};

module.exports = productController;
