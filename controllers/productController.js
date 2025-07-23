const Product = require('../models/product');
const Category = require('../models/category');
const OrderHistory = require('../models/OrderHistory');
const OrderList = require('../models/OrderList');
const Inventory = require('../models/Inventory');
const { pool } = require('../models/db_config');

const productController = {
    list: async (req, res) => {
        console.log("Fetching product list");
        const products = await Product.getAll();
        console.log("Products:", products);
        const categories = await Category.getAll();
        console.log("Categories:", categories);

        const productsByCategory = categories.map(category => ({
            id: category.id,
            name: category.name,
            products: products.filter(product => product.category_id === category.id)
        }));
        
        console.log("Products by category:", JSON.stringify(productsByCategory, null, 2));
        res.render('products', { productsByCategory });
    },
    form: async (req, res) => {
        console.log("Fetching form for adding product");
        const categories = await Category.getAll();
        console.log("Categories:", categories);
        res.render('addProduct', { categories });
    },
    create: async (req, res) => {
        console.log("Creating new product");
        const { name, stock, category_id, stock_minimal } = req.body;
        console.log("Received data:", { name, stock, category_id, stock_minimal });
        await Product.create(name, parseInt(stock), parseInt(category_id), parseInt(stock_minimal));
        res.redirect('liste_abdelhamid');
    },
    updateStock: async (req, res) => {
        console.log("Updating stock");
        const { id, amount } = req.body;
        console.log("Received data:", { id, amount });
        const product = await Product.getById(id);
        if (product) {
            const newStock = product.stock + amount;
            if (newStock < 0) {
                console.log("Stock cannot be negative. Update aborted.");
                res.status(400).send('Stock cannot be negative.');
            } else {
                await Product.updateStock(id, newStock);
                console.log("Updated stock:", newStock);
                res.sendStatus(200);
            }
        } else {
            console.error("Product not found");
            res.status(404).send('Product not found');
        }
    },
    listeAbdelhamid: async (req, res) => {
        console.log("Fetching product list for liste_abdelhamid");
        const products = await Product.getAll();
        console.log("Products:", products);
        const categories = await Category.getAll();
        console.log("Categories:", categories);

        const productsByCategory = categories.map(category => ({
            id: category.id,
            name: category.name,
            products: products.filter(product => product.category_id === category.id)
        }));
        
        console.log("Products by category:", JSON.stringify(productsByCategory, null, 2));
        res.render('liste_abdelhamid', { productsByCategory });
    },
    chefPatissier: async (req, res) => {
        console.log("Fetching product list for chef-patissier");
        const products = await Product.getAll();
        console.log("Products:", products);
        const categories = await Category.getAll();
        console.log("Categories:", categories);

        // Filtrer pour ne garder que la catégorie "Patissier" (ID: 5)
        const patissierCategory = categories.find(category => category.name === 'patissier' || category.id === 5);
        
        if (!patissierCategory) {
            console.error("Catégorie Patissier non trouvée");
            return res.status(404).send('Catégorie Patissier non trouvée');
        }

        const productsByCategory = [{
            id: patissierCategory.id,
            name: patissierCategory.name,
            products: products.filter(product => product.category_id === patissierCategory.id)
        }];
        
        console.log("Patissier products by category:", JSON.stringify(productsByCategory, null, 2));
        res.render('chef_patissier', { productsByCategory });
    },
    inventoryDashboard: async (req, res) => {
        console.log("Fetching inventory dashboard");
        try {
            // Récupérer les paramètres de filtre
            const { period, year, month, week } = req.query;
            console.log("Filter parameters:", { period, year, month, week });
            
            let allInventories = await Inventory.getAll();
            
            // Appliquer les filtres si spécifiés
            if (period || year || month || week) {
                allInventories = filterInventoriesByPeriod(allInventories, { period, year, month, week });
                console.log(`Filtered inventories: ${allInventories.length} remaining`);
            }
            
            const activeInventory = allInventories.find(inv => inv.status === 'active');
            const recentInventories = allInventories
                .filter(inv => inv.status === 'finalized')
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 10);
            
            // Préparer les données pour les filtres
            const allInventoriesForYears = await Inventory.getAll(); // Pour obtenir toutes les années disponibles
            const availableYears = [...new Set(allInventoriesForYears
                .map(inv => new Date(inv.created_date).getFullYear())
                .filter(year => !isNaN(year))
            )].sort((a, b) => b - a);
            
            res.render('inventory', { 
                activeInventory,
                recentInventories,
                inventories: allInventories,
                availableYears,
                filters: {
                    period: period || 'all',
                    year: year ? parseInt(year) : null,
                    month: month ? parseInt(month) : null,
                    week: week ? parseInt(week) : null
                },
                title: 'Gestion des Inventaires'
            });
        } catch (error) {
            console.error('Error fetching inventory dashboard:', error);
            res.status(500).render('error', { error: 'Erreur lors du chargement des inventaires' });
        }
    },
    categories: async (req, res) => {
        console.log("Fetching categories");
        const categories = await Category.getAll();
        res.json(categories);
    },
    createCategory: async (req, res) => {
        console.log("Creating new category");
        const { name } = req.body;
        await Category.create(name);
        res.sendStatus(201);
    },
    productsToOrder: async (req, res) => {
        console.log("Fetching products to order");
        const products = await Product.getAll();
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
    deleteProduct: async (req, res) => {
        const productId = req.params.id;
        console.log(`Received request to delete product with ID: ${productId}`);  // Log ID reçu
    
        if (!productId) {
            console.log("No product ID provided.");
            return res.status(400).send('ID de produit manquant.');
        }
    
        try {
            await Product.delete(productId);  // Appel à la méthode de suppression
            console.log(`Product deletion successful for ID: ${productId}`);  // Log après suppression
            res.status(200).send('Produit supprimé');  // Confirmation succès
        } catch (err) {
            console.error("Error during product deletion:", err);
            res.status(500).send('Erreur lors de la suppression.');
        }
    },
    // Nouvelle méthode pour mettre à jour le stock minimal
    updateMinimalStock: async (req, res) => {
        console.log("Updating minimal stock");
        const { id, stock_minimal } = req.body;
        console.log("Received data:", { id, stock_minimal });
        
        try {
            await Product.updateMinimalStock(id, stock_minimal);
            console.log("Updated minimal stock:", stock_minimal);
            res.sendStatus(200);
        } catch (error) {
            console.error("Error updating minimal stock:", error);
            res.status(500).send('Error updating minimal stock');
        }
    },

    // Nouvelle méthode pour marquer comme commandé avec historique
    markAsOrdered: async (req, res) => {
        console.log("Marking as ordered");
        const { id, quantity } = req.body;
        console.log("Received data:", { id, quantity });
        
        try {
            const product = await Product.getById(id);
            if (product) {
                const previousStock = product.stock;
                const newStock = product.stock + quantity;
                
                // Obtenir les informations de catégorie
                const categories = await Category.getAll();
                const categoryInfo = categories.find(cat => cat.id === product.category_id);
                const categoryName = categoryInfo ? categoryInfo.name : 'Unknown';
                
                // Mettre à jour le stock
                await Product.updateStock(id, newStock);
                
                // Ajouter à l'historique
                await OrderHistory.addOrder(
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
    adminDashboard: async (req, res) => {
        console.log("Loading admin dashboard");
        const products = await Product.getAll();
        const categories = await Category.getAll();
        const statistics = await Product.getStatistics();
        
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
    
    adminGetProductsByCategory: async (req, res) => {
        const category_id = req.params.categoryId;
        console.log(`Fetching products for category: ${category_id}`);
        
        try {
            const products = await Product.getByCategory(category_id);
            res.json(products);
        } catch (error) {
            console.error("Error fetching products by category:", error);
            res.status(500).json({ error: 'Error fetching products' });
        }
    },
    
    adminUpdateProduct: async (req, res) => {
        console.log("Admin updating product");
        const { id, name, stock, category_id, stock_minimal } = req.body;
        console.log("Received data:", { id, name, stock, category_id, stock_minimal });
        
        try {
            await Product.update(id, name, parseInt(stock), parseInt(category_id), parseInt(stock_minimal));
            res.json({ success: true, message: 'Produit mis à jour avec succès' });
        } catch (error) {
            console.error("Error updating product:", error);
            res.status(500).json({ error: 'Erreur lors de la mise à jour' });
        }
    },
    
    adminGetProduct: async (req, res) => {
        const id = req.params.id;
        console.log(`Fetching product with ID: ${id}`);
        
        try {
            const product = await Product.getById(id);
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
    
    adminCreateProduct: async (req, res) => {
        console.log("Admin creating new product");
        const { name, stock, category_id, stock_minimal } = req.body;
        console.log("Received data:", { name, stock, category_id, stock_minimal });
        
        try {
            await Product.create(name, parseInt(stock), parseInt(category_id), parseInt(stock_minimal));
            res.json({ success: true, message: 'Produit créé avec succès' });
        } catch (error) {
            console.error("Error creating product:", error);
            res.status(500).json({ error: 'Erreur lors de la création' });
        }
    },
    
    adminDeleteProduct: async (req, res) => {
        const id = req.params.id;
        console.log(`Admin deleting product with ID: ${id}`);
        
        try {
            await Product.delete(id);
            res.json({ success: true, message: 'Produit supprimé avec succès' });
        } catch (error) {
            console.error("Error deleting product:", error);
            res.status(500).json({ error: 'Erreur lors de la suppression' });
        }
    },
    
    adminCreateCategory: async (req, res) => {
        console.log("Admin creating new category");
        const { name } = req.body;
        console.log("Received data:", { name });
        
        try {
            await Category.create(name);
            res.json({ success: true, message: 'Catégorie créée avec succès' });
        } catch (error) {
            console.error("Error creating category:", error);
            res.status(500).json({ error: 'Erreur lors de la création de la catégorie' });
        }
    },

    // Import rapide des produits
    importProducts: async (req, res) => {
        try {
            const client = await pool.connect();
            
            try {
                await client.query('BEGIN');
                
                // Créer les catégories
                const categories = [
                    'Farine', 'Congel', 'Sachet', 'Divers', 'Boite', 'Frigo', 'Patissier'
                ];
                
                for (const categoryName of categories) {
                    await client.query(
                        'INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
                        [categoryName]
                    );
                }
                
                // Tous les produits en une seule operation
                const allProducts = [
                    // Farine (18 produits)
                    ['Semoule baguettes', 50, 50, 'Farine'],
                    ['Oumeyma', 50, 50, 'Farine'],
                    ['Natural supra', 25, 25, 'Farine'],
                    ['Alpha', 20, 20, 'Farine'],
                    ['Levure Bruggeman', 6, 6, 'Farine'],
                    ['S500 puratos', 2, 2, 'Farine'],
                    ['Boscous', 10, 10, 'Farine'],
                    ['Seigle', 2, 2, 'Farine'],
                    ['Decor cereales', 2, 2, 'Farine'],
                    ['Sucre', 15, 15, 'Farine'],
                    ['Sucre P4', 2, 2, 'Farine'],
                    ['Sel', 10, 10, 'Farine'],
                    ['Sésames', 2, 2, 'Farine'],
                    ['Son', 2, 2, 'Farine'],
                    ['Semoule harcha', 3, 3, 'Farine'],
                    ['Œufs', 6, 6, 'Farine'],
                    ['Papier cuisson 40x60', 5, 5, 'Farine'],
                    ['Papier cuisson 80x60', 2, 2, 'Farine'],
                    
                    // Congel (10 produits)
                    ['Croissant chocolat', 5, 5, 'Congel'],
                    ['Croquant noisette chocolat', 4, 4, 'Congel'],
                    ['Noix de pécan', 4, 4, 'Congel'],
                    ['Croissant amande', 5, 5, 'Congel'],
                    ['Amande cerise', 4, 4, 'Congel'],
                    ['Boule de Berlin', 3, 3, 'Congel'],
                    ['Croissant nature', 2, 2, 'Congel'],
                    ['Couque au chocolat', 2, 2, 'Congel'],
                    ['Maton', 2, 2, 'Congel'],
                    ['Mini pecan', 2, 2, 'Congel'],
                    
                    // Sachet (11 produits)
                    ['P1', 5, 5, 'Sachet'],
                    ['P2', 5, 5, 'Sachet'],
                    ['P4', 5, 5, 'Sachet'],
                    ['P6', 5, 5, 'Sachet'],
                    ['Petit pain', 5, 5, 'Sachet'],
                    ['Grand pain Carré', 5, 5, 'Sachet'],
                    ['Grand pain Rond', 5, 5, 'Sachet'],
                    ['1 baguette', 3, 3, 'Sachet'],
                    ['2 baguettes', 3, 3, 'Sachet'],
                    ['Sandwich', 5, 5, 'Sachet'],
                    ['Sac plastique', 10, 10, 'Sachet']
                ];
                
                // Insérer tous les produits
                for (const [name, stock, stock_minimal, categoryName] of allProducts) {
                    await client.query(`
                        INSERT INTO products (name, stock, stock_minimal, category_id)
                        VALUES ($1, $2, $3, (SELECT id FROM categories WHERE name = $4))
                        ON CONFLICT (name) DO UPDATE SET
                          stock = EXCLUDED.stock,
                          stock_minimal = EXCLUDED.stock_minimal
                    `, [name, stock, stock_minimal, categoryName]);
                }
                
                await client.query('COMMIT');
                
                res.json({ 
                    success: true, 
                    message: `${allProducts.length} produits importés avec succès!`,
                    categories: categories.length
                });
                
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
            
        } catch (error) {
            console.error('Erreur import:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Erreur lors de l\'import des produits' 
            });
        }
    },
    
    // Nouvelle méthode pour l'espace commandes amélioré
    ordersSpace: async (req, res) => {
        console.log("Loading orders space");
        const products = await Product.getAll();
        const categories = await Category.getAll();
        const orderStats = await OrderHistory.getStatistics();
        const recentOrders = await OrderHistory.getRecent(30);
        
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
    getOrderHistory: async (req, res) => {
        console.log("Fetching order history");
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const status = req.query.status || null;
        const offset = (page - 1) * limit;
        
        try {
            const orders = await OrderHistory.getAll(limit, offset, status);
            const stats = await OrderHistory.getStatistics();
            
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
    updateOrderStatus: async (req, res) => {
        console.log("Updating order status");
        const { id, status, notes } = req.body;
        console.log("Received data:", { id, status, notes });
        
        try {
            await OrderHistory.updateStatus(id, status, notes);
            res.json({ success: true, message: 'Statut mis à jour avec succès' });
        } catch (error) {
            console.error("Error updating order status:", error);
            res.status(500).json({ error: 'Erreur lors de la mise à jour du statut' });
        }
    },
    
    // Gestion des listes de commandes
    orderListsPage: async (req, res) => {
        console.log("Loading order lists page");
        try {
            const lists = await OrderList.getAllLists();
            const categories = await Category.getAll();
            const products = await Product.getAll();
            
            // Calculer des statistiques basiques
            const statistics = {
                totalLists: lists.length,
                draftLists: lists.filter(list => list.status === 'draft').length,
                finalizedLists: lists.filter(list => list.status === 'finalized').length
            };
            
            res.render('orderLists', {
                lists,
                statistics,
                availableProducts: products,
                categories
            });
        } catch (error) {
            console.error("Error loading order lists page:", error);
            res.status(500).send('Erreur lors du chargement des listes');
        }
    },
    
    // Créer une nouvelle liste de commandes
    createOrderList: async (req, res) => {
        console.log("Creating new order list");
        const { name, description } = req.body;
        console.log("Received data:", { name, description });
        
        try {
            const result = await OrderList.createList(name, description);
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
    deleteOrderList: async (req, res) => {
        const listId = req.params.id;
        console.log(`Deleting order list with ID: ${listId}`);
        
        try {
            await OrderList.deleteList(listId);
            res.json({ success: true, message: 'Liste supprimée avec succès' });
        } catch (error) {
            console.error("Error deleting order list:", error);
            res.status(500).json({ error: 'Erreur lors de la suppression' });
        }
    },
    
    // Dupliquer une liste
    duplicateOrderList: async (req, res) => {
        console.log("Duplicating order list");
        const { listId, newName } = req.body;
        console.log("Received data:", { listId, newName });
        
        try {
            const newListId = await OrderList.duplicateList(listId, newName);
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
    exportOrderList: async (req, res) => {
        const listId = req.params.id;
        const format = req.query.format || 'print'; // print, csv, json
        
        console.log(`Exporting order list ${listId} in format ${format}`);
        
        try {
            const list = await OrderList.getListWithProducts(listId);
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
    },

    // === FONCTIONNALITÉS D'INVENTAIRE ===

    // Page de gestion des inventaires
    // Créer un nouvel inventaire
    createInventory: async (req, res) => {
        const { name, notes } = req.body;
        
        try {
            console.log("Creating new inventory:", { name, notes });
            const result = await Inventory.create(name, notes || '');
            const inventoryId = result.lastInsertRowid;
            
            // Sauvegarder l'état actuel de tous les produits
            await Inventory.saveCurrentStock(inventoryId);
            
            res.json({ 
                success: true, 
                inventoryId,
                message: 'Inventaire créé avec succès' 
            });
        } catch (error) {
            console.error("Error creating inventory:", error);
            res.status(500).json({ error: 'Erreur lors de la création de l\'inventaire' });
        }
    },

    getAllInventories: async (req, res) => {
        try {
            console.log("Fetching all inventories");
            const inventories = await Inventory.getAll();
            res.json(inventories);
        } catch (error) {
            console.error("Error fetching inventories:", error);
            res.status(500).json({ error: 'Erreur lors de la récupération des inventaires' });
        }
    },

    // Obtenir un inventaire avec ses items
    getInventory: async (req, res) => {
        const inventoryId = req.params.id;
        
        try {
            const inventory = await Inventory.getWithItems(inventoryId);
            if (!inventory) {
                return res.status(404).json({ error: 'Inventaire non trouvé' });
            }
            
            res.json(inventory);
        } catch (error) {
            console.error("Error getting inventory:", error);
            res.status(500).json({ error: 'Erreur lors de la récupération de l\'inventaire' });
        }
    },

    // Mettre à jour le stock d'un produit dans l'inventaire
    updateInventoryProductStock: async (req, res) => {
        const { inventoryId, productId, newStock } = req.body;
        
        try {
            console.log("Updating inventory product stock:", { inventoryId, productId, newStock });
            await Inventory.updateProductStock(inventoryId, productId, parseInt(newStock));
            
            res.json({ 
                success: true, 
                message: 'Stock mis à jour dans l\'inventaire' 
            });
        } catch (error) {
            console.error("Error updating inventory product stock:", error);
            res.status(500).json({ error: 'Erreur lors de la mise à jour du stock' });
        }
    },

    // Finaliser un inventaire
    finalizeInventory: async (req, res) => {
        const inventoryId = req.params.id;
        const { notes } = req.body;
        
        try {
            console.log("Finalizing inventory:", inventoryId);
            await Inventory.finalize(inventoryId, notes || '');
            
            res.json({ 
                success: true, 
                message: 'Inventaire finalisé avec succès' 
            });
        } catch (error) {
            console.error("Error finalizing inventory:", error);
            res.status(500).json({ error: 'Erreur lors de la finalisation de l\'inventaire' });
        }
    },

    // Créer une liste de commandes depuis un inventaire
    createOrderListFromInventory: async (req, res) => {
        const inventoryId = req.params.id;
        const { listName } = req.body;
        
        try {
            console.log("Creating order list from inventory:", { inventoryId, listName });
            const result = await Inventory.createOrderListFromInventory(inventoryId, listName);
            
            res.json({ 
                success: true, 
                listId: result.listId,
                productsCount: result.productsCount,
                products: result.products,
                message: `Liste de commandes créée avec ${result.productsCount} produits` 
            });
        } catch (error) {
            console.error("Error creating order list from inventory:", error);
            res.status(500).json({ error: 'Erreur lors de la création de la liste de commandes' });
        }
    },

    // Supprimer un inventaire
    deleteInventory: async (req, res) => {
        const inventoryId = req.params.id;
        
        try {
            console.log("Deleting inventory:", inventoryId);
            await Inventory.delete(inventoryId);
            
            res.json({ 
                success: true, 
                message: 'Inventaire supprimé avec succès' 
            });
        } catch (error) {
            console.error("Error deleting inventory:", error);
            res.status(500).json({ error: 'Erreur lors de la suppression de l\'inventaire' });
        }
    },

    // Statistiques des inventaires
    inventoryStats: async (req, res) => {
        try {
            console.log("Fetching inventory statistics");
            
            // Récupérer les paramètres de filtre
            const { period, year, month, week } = req.query;
            console.log("Filter parameters:", { period, year, month, week });
            
            // Récupérer tous les inventaires avec leurs items
            let inventories = await Inventory.getAll();
            const inventoriesWithItems = await Promise.all(
                inventories.map(async inventory => {
                    const items = await Inventory.getWithItems(inventory.id);
                    return items ? items : { ...inventory, items: [] };
                })
            );
            
            // Appliquer les filtres par période
            if (period || year || month || week) {
                inventories = filterInventoriesByPeriod(inventoriesWithItems, { period, year, month, week });
                console.log(`Filtered inventories: ${inventories.length} remaining`);
            } else {
                inventories = inventoriesWithItems;
            }
            
            const products = await Product.getAll();
            const categories = await Category.getAll();
            
            // 1. Fréquence des inventaires
            const inventoryFrequency = calculateInventoryFrequency(inventories);
            
            // 2. Produits jamais modifiés vs souvent ajustés
            const productModificationStats = calculateProductModifications(inventories);
            
            // 3. Évolution des ruptures dans le temps
            const ruptureEvolution = calculateRuptureEvolution(inventories);
            
            // 4. Produits chroniquement en rupture
            const chronicRuptures = calculateChronicRuptures(inventories, products);
            
            // 5. Catégories les plus problématiques
            const problematicCategories = calculateProblematicCategories(inventories, categories, products);
            
            // 6. Répartition du stock par catégorie
            const stockDistribution = calculateStockDistribution(products, categories);
            
            const stats = {
                inventoryFrequency,
                productModificationStats,
                ruptureEvolution,
                chronicRuptures,
                problematicCategories,
                stockDistribution,
                totalInventories: inventories.length,
                totalProducts: products.length,
                // Ajouter les informations de filtre pour l'affichage
                filters: {
                    period: period || 'all',
                    year: year || new Date().getFullYear(),
                    month: month || new Date().getMonth() + 1,
                    week: week || null
                }
            };
            
            console.log("Stats calculated:", stats);
            res.render('inventoryStats', { stats });
            
        } catch (error) {
            console.error("Error fetching inventory statistics:", error);
            res.status(500).render('error', { error: 'Erreur lors du calcul des statistiques' });
        }
    }
};

// Fonction pour filtrer les inventaires par période
function filterInventoriesByPeriod(inventories, filters) {
    const { period, year, month, week } = filters;
    
    return inventories.filter(inventory => {
        if (!inventory.created_date) return false;
        
        const inventoryDate = new Date(inventory.created_date);
        const now = new Date();
        
        if (period) {
            switch (period) {
                case 'week':
                    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    return inventoryDate >= oneWeekAgo;
                    
                case 'month':
                    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                    return inventoryDate >= oneMonthAgo;
                    
                case 'year':
                    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                    return inventoryDate >= oneYearAgo;
                    
                case 'all':
                default:
                    return true;
            }
        }
        
        // Filtres spécifiques par année, mois ou semaine
        if (year && inventoryDate.getFullYear() !== parseInt(year)) {
            return false;
        }
        
        if (month && (inventoryDate.getMonth() + 1) !== parseInt(month)) {
            return false;
        }
        
        if (week) {
            const weekNumber = getWeekNumber(inventoryDate);
            if (weekNumber !== parseInt(week)) {
                return false;
            }
        }
        
        return true;
    });
}

// Fonction pour obtenir le numéro de la semaine
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
}

// Fonctions utilitaires pour les calculs statistiques
function calculateInventoryFrequency(inventories) {
    if (inventories.length < 2) return { averageDays: 0, frequency: 'Insuffisant' };
    
    const dates = inventories.map(inv => new Date(inv.created_date)).sort();
    let totalDays = 0;
    
    for (let i = 1; i < dates.length; i++) {
        const diff = (dates[i] - dates[i-1]) / (1000 * 60 * 60 * 24);
        totalDays += diff;
    }
    
    const averageDays = Math.round(totalDays / (dates.length - 1));
    let frequency = 'Irrégulier';
    
    if (averageDays <= 7) frequency = 'Hebdomadaire';
    else if (averageDays <= 14) frequency = 'Bi-hebdomadaire';
    else if (averageDays <= 30) frequency = 'Mensuel';
    else if (averageDays <= 90) frequency = 'Trimestriel';
    
    return { averageDays, frequency };
}

function calculateProductModifications(inventories) {
    const productChanges = {};
    
    inventories.forEach(inventory => {
        if (inventory.items) {
            inventory.items.forEach(item => {
                if (!productChanges[item.product_id]) {
                    productChanges[item.product_id] = {
                        name: item.product_name,
                        modifications: 0,
                        totalChange: 0
                    };
                }
                
                const change = item.stock_after - item.stock_before;
                if (change !== 0) {
                    productChanges[item.product_id].modifications++;
                    productChanges[item.product_id].totalChange += Math.abs(change);
                }
            });
        }
    });
    
    const sortedProducts = Object.values(productChanges).sort((a, b) => b.modifications - a.modifications);
    
    return {
        neverModified: sortedProducts.filter(p => p.modifications === 0).length,
        oftenAdjusted: sortedProducts.slice(0, 10), // Top 10 most modified
        totalProducts: sortedProducts.length
    };
}

function calculateRuptureEvolution(inventories) {
    const rupturesByDate = {};
    
    inventories.forEach(inventory => {
        const date = inventory.created_date.split('T')[0]; // Format YYYY-MM-DD
        let ruptures = 0;
        
        if (inventory.items) {
            inventory.items.forEach(item => {
                if (item.stock_after === 0) {
                    ruptures++;
                }
            });
        }
        
        rupturesByDate[date] = ruptures;
    });
    
    return Object.entries(rupturesByDate)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
}

function calculateChronicRuptures(inventories, products) {
    const productRuptures = {};
    
    inventories.forEach(inventory => {
        if (inventory.items) {
            inventory.items.forEach(item => {
                if (!productRuptures[item.product_id]) {
                    productRuptures[item.product_id] = {
                        name: item.product_name,
                        ruptureCount: 0,
                        totalInventories: 0
                    };
                }
                
                productRuptures[item.product_id].totalInventories++;
                if (item.stock_after === 0) {
                    productRuptures[item.product_id].ruptureCount++;
                }
            });
        }
    });
    
    return Object.values(productRuptures)
        .map(p => ({
            ...p,
            ruptureRate: p.totalInventories > 0 ? (p.ruptureCount / p.totalInventories * 100) : 0
        }))
        .filter(p => p.ruptureRate > 50) // Plus de 50% de ruptures
        .sort((a, b) => b.ruptureRate - a.ruptureRate);
}

function calculateProblematicCategories(inventories, categories, products) {
    const categoryStats = {};
    
    categories.forEach(cat => {
        categoryStats[cat.id] = {
            name: cat.name,
            totalChanges: 0,
            totalProducts: 0,
            averageChange: 0
        };
    });
    
    inventories.forEach(inventory => {
        if (inventory.items) {
            inventory.items.forEach(item => {
                // Trouver la catégorie du produit
                const product = products.find(p => p.id === item.product_id);
                const categoryId = product ? product.category_id : null;
                
                if (categoryId && categoryStats[categoryId]) {
                    const change = Math.abs(item.stock_after - item.stock_before);
                    categoryStats[categoryId].totalChanges += change;
                    categoryStats[categoryId].totalProducts++;
                }
            });
        }
    });
    
    return Object.values(categoryStats)
        .map(cat => ({
            ...cat,
            averageChange: cat.totalProducts > 0 ? (cat.totalChanges / cat.totalProducts) : 0
        }))
        .sort((a, b) => b.averageChange - a.averageChange);
}

function calculateStockDistribution(products, categories) {
    const distribution = {};
    
    categories.forEach(cat => {
        distribution[cat.name] = {
            totalStock: 0,
            productCount: 0,
            lowStockCount: 0
        };
    });
    
    products.forEach(product => {
        const category = categories.find(cat => cat.id === product.category_id);
        if (category && distribution[category.name]) {
            distribution[category.name].totalStock += product.stock;
            distribution[category.name].productCount++;
            
            if (product.stock < product.stock_minimal) {
                distribution[category.name].lowStockCount++;
            }
        }
    });
    
    return Object.entries(distribution).map(([name, data]) => ({
        name,
        ...data,
        averageStock: data.productCount > 0 ? Math.round(data.totalStock / data.productCount) : 0,
        lowStockPercentage: data.productCount > 0 ? Math.round((data.lowStockCount / data.productCount) * 100) : 0
    }));
}

// Créer un inventaire spécifique pour la pâtisserie
productController.createPatisserieInventory = async (req, res) => {
    try {
        const { name, notes } = req.body;
        
        if (!name) {
            return res.status(400).json({ 
                success: false, 
                message: 'Le nom de l\'inventaire est requis' 
            });
        }

        // Créer l'inventaire pâtisserie (category_id = 5)
        const result = await Inventory.createPatisserie(name, notes);
        
        if (result.lastInsertRowid) {
            const inventoryId = result.lastInsertRowid;
            
            // Sauvegarder l'état actuel des produits de pâtisserie uniquement
            await Inventory.saveCurrentStock(inventoryId, 5); // 5 = catégorie pâtissier
            
            res.json({ 
                success: true, 
                inventoryId: inventoryId,
                message: 'Inventaire pâtisserie créé avec succès',
                type: 'patisserie'
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'Erreur lors de la création de l\'inventaire' 
            });
        }
    } catch (error) {
        console.error('Erreur lors de la création de l\'inventaire pâtisserie:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur serveur lors de la création de l\'inventaire' 
        });
    }
};

module.exports = productController;
