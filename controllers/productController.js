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
        const productsToOrder = Product.getProductsToOrder();
        console.log("Products to order:", productsToOrder);
        res.render('productsToOrder', { productsToOrder });
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
    }
    
    
    
    
    
    
    
};

module.exports = productController;
