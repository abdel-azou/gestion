const Product = require('../models/product');
const Category = require('../models/category');
const OrderHistory = require('../models/OrderHistory');
const OrderList = require('../models/OrderList');

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

    // Nouvelle méthode pour marquer comme commandé avec historique
    markAsOrdered: (req, res) => {
        console.log("Marking as ordered");
        const { id, quantity } = req.body;
        console.log("Received data:", { id, quantity });
        
        try {
            const product = Product.getById(id);
            if (product) {
                const previousStock = product.stock;
                const newStock = product.stock + quantity;
                
                // Obtenir les informations de catégorie
                const categoryInfo = Category.getAll().find(cat => cat.id === product.category_id);
                const categoryName = categoryInfo ? categoryInfo.name : 'Unknown';
                
                // Mettre à jour le stock
                Product.updateStock(id, newStock);
                
                // Ajouter à l'historique
                OrderHistory.addOrder(
                    id,
                    product.name,
                    categoryName,
                    quantity,
                    previousStock,
                    newStock,
                    'Commande marquée comme reçue'
                );
                
                console.log("Updated stock after order:", newStock);
                res.json({ success: true, message: 'Commande marquée comme reçue' });
            } else {
                res.status(404).json({ error: 'Product not found' });
            }
        } catch (error) {
            console.error("Error marking as ordered:", error);
            res.status(500).json({ error: 'Error marking as ordered' });
        }
    },
    
    // Espace Admin - Méthodes d'administration
    adminDashboard: (req, res) => {
        console.log("Loading admin dashboard");
        const products = Product.getAll();
        const categories = Category.getAll();
        const statistics = Product.getStatistics();
        
        const productsByCategory = categories.map(category => ({
            id: category.id,
            name: category.name,
            products: products.filter(product => product.category_id === category.id)
        }));
        
        res.render('admin', { 
            productsByCategory, 
            categories, 
            statistics,
            products
        });
    },
    
    adminGetProductsByCategory: (req, res) => {
        const category_id = req.params.categoryId;
        console.log(`Fetching products for category: ${category_id}`);
        
        try {
            const products = Product.getByCategory(category_id);
            res.json(products);
        } catch (error) {
            console.error("Error fetching products by category:", error);
            res.status(500).json({ error: 'Error fetching products' });
        }
    },
    
    adminUpdateProduct: (req, res) => {
        console.log("Admin updating product");
        const { id, name, stock, category_id, stock_minimal } = req.body;
        console.log("Received data:", { id, name, stock, category_id, stock_minimal });
        
        try {
            Product.update(id, name, parseInt(stock), parseInt(category_id), parseInt(stock_minimal));
            res.json({ success: true, message: 'Produit mis à jour avec succès' });
        } catch (error) {
            console.error("Error updating product:", error);
            res.status(500).json({ error: 'Erreur lors de la mise à jour' });
        }
    },
    
    adminGetProduct: (req, res) => {
        const id = req.params.id;
        console.log(`Fetching product with ID: ${id}`);
        
        try {
            const product = Product.getById(id);
            if (product) {
                res.json(product);
            } else {
                res.status(404).json({ error: 'Produit non trouvé' });
            }
        } catch (error) {
            console.error("Error fetching product:", error);
            res.status(500).json({ error: 'Erreur lors de la récupération' });
        }
    },
    
    adminCreateProduct: (req, res) => {
        console.log("Admin creating new product");
        const { name, stock, category_id, stock_minimal } = req.body;
        console.log("Received data:", { name, stock, category_id, stock_minimal });
        
        try {
            Product.create(name, parseInt(stock), parseInt(category_id), parseInt(stock_minimal));
            res.json({ success: true, message: 'Produit créé avec succès' });
        } catch (error) {
            console.error("Error creating product:", error);
            res.status(500).json({ error: 'Erreur lors de la création' });
        }
    },
    
    adminDeleteProduct: (req, res) => {
        const id = req.params.id;
        console.log(`Admin deleting product with ID: ${id}`);
        
        try {
            Product.delete(id);
            res.json({ success: true, message: 'Produit supprimé avec succès' });
        } catch (error) {
            console.error("Error deleting product:", error);
            res.status(500).json({ error: 'Erreur lors de la suppression' });
        }
    },
    
    adminCreateCategory: (req, res) => {
        console.log("Admin creating new category");
        const { name } = req.body;
        console.log("Received data:", { name });
        
        try {
            Category.create(name);
            res.json({ success: true, message: 'Catégorie créée avec succès' });
        } catch (error) {
            console.error("Error creating category:", error);
            res.status(500).json({ error: 'Erreur lors de la création de la catégorie' });
        }
    },
    
    // Nouvelle méthode pour l'espace commandes amélioré
    ordersSpace: (req, res) => {
        console.log("Loading orders space");
        const products = Product.getAll();
        const categories = Category.getAll();
        const orderStats = OrderHistory.getStatistics();
        const recentOrders = OrderHistory.getRecent(30);
        
        const productsToOrder = products.filter(product => product.stock < product.stock_minimal);
        
        // Enrichir les données avec les informations nécessaires
        const enrichedProducts = productsToOrder.map(product => {
            const categoryInfo = categories.find(cat => cat.id === product.category_id);
            const productOrders = recentOrders.filter(order => order.product_id === product.id);
            
            return {
                id: product.id,
                name: product.name,
                category: categoryInfo ? categoryInfo.name : 'Unknown',
                category_id: product.category_id,
                currentStock: product.stock,
                minimalStock: product.stock_minimal,
                quantityNeeded: product.stock_minimal - product.stock,
                stockStatus: product.stock === 0 ? 'out' : product.stock < product.stock_minimal * 0.2 ? 'critical' : 'low',
                lastOrdered: productOrders.length > 0 ? productOrders[0].order_date : null,
                orderCount: productOrders.length
            };
        });
        
        res.render('ordersSpace', { 
            productsToOrder: enrichedProducts,
            categories,
            orderStats,
            recentOrders: recentOrders.slice(0, 10) // 10 dernières commandes
        });
    },
    
    // Obtenir l'historique des commandes
    getOrderHistory: (req, res) => {
        console.log("Fetching order history");
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const status = req.query.status || null;
        const offset = (page - 1) * limit;
        
        try {
            const orders = OrderHistory.getAll(limit, offset, status);
            const stats = OrderHistory.getStatistics();
            
            res.json({
                orders,
                stats,
                pagination: {
                    page,
                    limit,
                    hasMore: orders.length === limit
                }
            });
        } catch (error) {
            console.error("Error fetching order history:", error);
            res.status(500).json({ error: 'Erreur lors du chargement de l\'historique' });
        }
    },
    
    // Mettre à jour le statut d'une commande
    updateOrderStatus: (req, res) => {
        console.log("Updating order status");
        const { id, status, notes } = req.body;
        console.log("Received data:", { id, status, notes });
        
        try {
            OrderHistory.updateStatus(id, status, notes);
            res.json({ success: true, message: 'Statut mis à jour avec succès' });
        } catch (error) {
            console.error("Error updating order status:", error);
            res.status(500).json({ error: 'Erreur lors de la mise à jour du statut' });
        }
    },
    
    // Gestion des listes de commandes
    orderListsPage: (req, res) => {
        console.log("Loading order lists page");
        try {
            const lists = OrderList.getAllLists();
            const statistics = OrderList.getStatistics();
            const availableProducts = OrderList.getAvailableProducts();
            const categories = Category.getAll();
            
            res.render('orderLists', {
                lists,
                statistics,
                availableProducts,
                categories
            });
        } catch (error) {
            console.error("Error loading order lists page:", error);
            res.status(500).send('Erreur lors du chargement des listes');
        }
    },
    
    // Créer une nouvelle liste de commandes
    createOrderList: (req, res) => {
        console.log("Creating new order list");
        const { name, description } = req.body;
        console.log("Received data:", { name, description });
        
        try {
            const result = OrderList.createList(name, description);
            res.json({ 
                success: true, 
                message: 'Liste créée avec succès',
                listId: result.lastInsertRowid
            });
        } catch (error) {
            console.error("Error creating order list:", error);
            res.status(500).json({ error: 'Erreur lors de la création de la liste' });
        }
    },
    
    // Créer une nouvelle liste avec des produits
    createOrderListWithProducts: (req, res) => {
        console.log("Creating new order list with products");
        const { name, description, products } = req.body;
        console.log("Received data:", { name, description, products });
        
        try {
            // Créer la liste
            const result = OrderList.createList(name, description);
            const listId = result.lastInsertRowid;
            
            // Ajouter les produits à la liste
            if (products && products.length > 0) {
                products.forEach(product => {
                    const notes = product.priority ? `Priorité: ${product.priority}` : null;
                    OrderList.addProductToList(listId, product.productId, product.quantity, notes);
                });
            }
            
            res.json({ 
                success: true, 
                message: 'Liste créée avec succès',
                listId: listId
            });
        } catch (error) {
            console.error("Error creating order list with products:", error);
            res.status(500).json({ error: 'Erreur lors de la création de la liste' });
        }
    },

    // Obtenir une liste avec ses produits
    getOrderList: (req, res) => {
        const listId = req.params.id;
        console.log(`Fetching order list with ID: ${listId}`);
        
        try {
            const list = OrderList.getListWithProducts(listId);
            if (list) {
                res.json(list);
            } else {
                res.status(404).json({ error: 'Liste non trouvée' });
            }
        } catch (error) {
            console.error("Error fetching order list:", error);
            res.status(500).json({ error: 'Erreur lors du chargement de la liste' });
        }
    },
    
    // Ajouter un produit à une liste
    addProductToOrderList: (req, res) => {
        console.log("Adding product to order list");
        const { listId, productId, quantity, notes } = req.body;
        console.log("Received data:", { listId, productId, quantity, notes });
        
        try {
            OrderList.addProductToList(listId, productId, quantity, notes);
            res.json({ success: true, message: 'Produit ajouté à la liste' });
        } catch (error) {
            console.error("Error adding product to list:", error);
            res.status(500).json({ error: 'Erreur lors de l\'ajout du produit' });
        }
    },
    
    // Mettre à jour la quantité d'un produit dans une liste
    updateProductInOrderList: (req, res) => {
        console.log("Updating product quantity in order list");
        const { listId, productId, quantity } = req.body;
        console.log("Received data:", { listId, productId, quantity });
        
        try {
            OrderList.updateProductQuantity(listId, productId, quantity);
            res.json({ success: true, message: 'Quantité mise à jour' });
        } catch (error) {
            console.error("Error updating product quantity:", error);
            res.status(500).json({ error: 'Erreur lors de la mise à jour' });
        }
    },
    
    // Supprimer un produit d'une liste
    removeProductFromOrderList: (req, res) => {
        console.log("Removing product from order list");
        const { listId, productId } = req.body;
        console.log("Received data:", { listId, productId });
        
        try {
            OrderList.removeProductFromList(listId, productId);
            res.json({ success: true, message: 'Produit retiré de la liste' });
        } catch (error) {
            console.error("Error removing product from list:", error);
            res.status(500).json({ error: 'Erreur lors de la suppression' });
        }
    },
    
    // Finaliser une commande (marquer comme commandée)
    finalizeOrderList: (req, res) => {
        console.log("Finalizing order list");
        const { listId, notes } = req.body;
        console.log("Received data:", { listId, notes });
        
        try {
            const result = OrderList.finalizeOrder(listId, notes);
            if (result) {
                res.json({ success: true, message: 'Commande finalisée avec succès' });
            } else {
                res.status(404).json({ error: 'Liste non trouvée' });
            }
        } catch (error) {
            console.error("Error finalizing order list:", error);
            res.status(500).json({ error: 'Erreur lors de la finalisation' });
        }
    },
    
    // Supprimer une liste complète
    deleteOrderList: (req, res) => {
        const listId = req.params.id;
        console.log(`Deleting order list with ID: ${listId}`);
        
        try {
            OrderList.deleteList(listId);
            res.json({ success: true, message: 'Liste supprimée avec succès' });
        } catch (error) {
            console.error("Error deleting order list:", error);
            res.status(500).json({ error: 'Erreur lors de la suppression' });
        }
    },
    
    // Dupliquer une liste
    duplicateOrderList: (req, res) => {
        console.log("Duplicating order list");
        const { listId, newName } = req.body;
        console.log("Received data:", { listId, newName });
        
        try {
            const newListId = OrderList.duplicateList(listId, newName);
            if (newListId) {
                res.json({ 
                    success: true, 
                    message: 'Liste dupliquée avec succès',
                    newListId 
                });
            } else {
                res.status(404).json({ error: 'Liste originale non trouvée' });
            }
        } catch (error) {
            console.error("Error duplicating order list:", error);
            res.status(500).json({ error: 'Erreur lors de la duplication' });
        }
    },
    
    // Exporter une liste de commandes
    exportOrderList: (req, res) => {
        const listId = req.params.id;
        const format = req.query.format || 'print'; // print, csv, json
        
        console.log(`Exporting order list ${listId} in format ${format}`);
        
        try {
            const list = OrderList.getListWithProducts(listId);
            if (!list) {
                return res.status(404).json({ error: 'Liste non trouvée' });
            }
            
            if (format === 'print') {
                res.render('orderListPrint', { list });
            } else if (format === 'csv') {
                let csv = 'Produit,Catégorie,Quantité,Stock Actuel,Notes\n';
                list.items.forEach(item => {
                    csv += `"${item.product_name}","${item.category_name}",${item.quantity},${item.stock},"${item.notes || ''}"\n`;
                });
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename="liste_${list.name}_${new Date().toISOString().split('T')[0]}.csv"`);
                res.send(csv);
            } else if (format === 'json') {
                res.json(list);
            }
        } catch (error) {
            console.error("Error exporting order list:", error);
            res.status(500).json({ error: 'Erreur lors de l\'export' });
        }
    }
};

module.exports = productController;
