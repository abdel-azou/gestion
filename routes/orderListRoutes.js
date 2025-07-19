const express = require('express');
const router = express.Router();
const db = require('../models/db_config');
const OrderList = require('../models/OrderList');
const Product = require('../models/product');
const Category = require('../models/category');

// Route pour afficher la page des listes de commandes
router.get('/order-lists', async (req, res) => {
    try {
        console.log('Loading order lists page');
        
        // Récupérer toutes les listes
        const lists = OrderList.getAllLists();
        
        // Récupérer les produits disponibles pour le modal de création
        const availableProducts = Product.getAllWithCategories();
        
        // Récupérer les catégories pour le filtre
        const categories = Category.getAll();
        
        // Calculer les statistiques
        const statistics = OrderList.getStatistics();
        
        res.render('orderLists', { 
            lists, 
            availableProducts, 
            categories, 
            statistics 
        });
    } catch (error) {
        console.error('Error loading order lists:', error);
        res.status(500).send('Erreur lors du chargement des listes de commandes');
    }
});

// API Routes

// GET - Récupérer toutes les listes
router.get('/api/order-lists', (req, res) => {
    try {
        const lists = OrderList.getAllLists();
        // Filtrer pour ne montrer que les listes draft et ordered (modifiables)
        const editableLists = lists.filter(list => list.status === 'draft' || list.status === 'ordered');
        res.json({ success: true, data: editableLists });
    } catch (error) {
        console.error('Error fetching order lists:', error);
        res.status(500).json({ success: false, error: 'Erreur lors de la récupération des listes' });
    }
});

// GET - Récupérer une liste spécifique avec ses produits
router.get('/api/order-lists/:id', (req, res) => {
    try {
        const listId = req.params.id;
        console.log('Fetching order list with ID:', listId);
        
        const list = OrderList.getListWithProducts(listId);
        
        if (!list) {
            return res.status(404).json({ success: false, error: 'Liste non trouvée' });
        }
        
        res.json(list);
    } catch (error) {
        console.error('Error fetching order list:', error);
        res.status(500).json({ success: false, error: 'Erreur lors de la récupération de la liste' });
    }
});

// POST - Créer une nouvelle liste
router.post('/api/order-lists', (req, res) => {
    try {
        const { name, description, products } = req.body;
        
        if (!name || !products || products.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Le nom et au moins un produit sont requis' 
            });
        }
        
        // Créer la liste
        const result = OrderList.createList(name, description);
        const listId = result.lastInsertRowid;
        
        // Ajouter les produits à la liste
        for (const product of products) {
            OrderList.addProductToList(
                listId, 
                product.productId, 
                product.quantity, 
                product.priority || ''
            );
        }
        
        res.json({ 
            success: true, 
            message: 'Liste créée avec succès',
            listId: listId 
        });
        
    } catch (error) {
        console.error('Error creating order list:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur lors de la création de la liste' 
        });
    }
});

// PUT - Modifier une liste existante
router.put('/api/order-lists/:id', (req, res) => {
    try {
        const listId = req.params.id;
        const { name, description, products } = req.body;
        
        console.log(`Updating list ${listId} with:`, { name, description, productsCount: products?.length });
        console.log('Products received:', products);
        
        // Vérifier que la liste existe
        const existingList = OrderList.getListWithProducts(listId);
        if (!existingList) {
            return res.status(404).json({ success: false, error: 'Liste non trouvée' });
        }
        
        console.log('Existing list found:', existingList.name);
        
        // Mettre à jour les informations de base de la liste
        OrderList.updateList(listId, name, description);
        console.log('List info updated');
        
        // Supprimer tous les anciens produits de la liste
        OrderList.removeAllProductsFromList(listId);
        console.log('Old products removed');
        
        // Ajouter les nouveaux produits
        if (products && products.length > 0) {
            for (const product of products) {
                console.log('Adding product:', product);
                OrderList.addProductToList(
                    listId, 
                    product.productId, 
                    product.quantity, 
                    product.priority || ''
                );
            }
            console.log(`Added ${products.length} products`);
        }
        
        res.json({ 
            success: true, 
            message: 'Liste mise à jour avec succès' 
        });
        
    } catch (error) {
        console.error('Error updating order list:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur lors de la mise à jour de la liste' 
        });
    }
});

// DELETE - Supprimer une liste
router.delete('/api/order-lists/:id', (req, res) => {
    try {
        const listId = req.params.id;
        
        // Vérifier que la liste existe
        const existingList = OrderList.getListWithProducts(listId);
        if (!existingList) {
            return res.status(404).json({ success: false, error: 'Liste non trouvée' });
        }
        
        // Supprimer la liste (les items seront supprimés automatiquement grâce aux contraintes FK)
        OrderList.deleteList(listId);
        
        res.json({ 
            success: true, 
            message: 'Liste supprimée avec succès' 
        });
        
    } catch (error) {
        console.error('Error deleting order list:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur lors de la suppression de la liste' 
        });
    }
});

// POST - Finaliser une liste (changer le statut à 'ordered')
router.post('/api/order-lists/finalize', (req, res) => {
    try {
        const { listId, notes } = req.body;
        
        // Vérifier que la liste existe
        const existingList = OrderList.getListWithProducts(listId);
        if (!existingList) {
            return res.status(404).json({ success: false, error: 'Liste non trouvée' });
        }
        
        // Mettre à jour le statut
        OrderList.finalizeList(listId, notes);
        
        res.json({ 
            success: true, 
            message: 'Liste finalisée avec succès' 
        });
        
    } catch (error) {
        console.error('Error finalizing order list:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur lors de la finalisation de la liste' 
        });
    }
});

// POST - Dupliquer une liste
router.post('/api/order-lists/duplicate', (req, res) => {
    try {
        const { listId, newName } = req.body;
        
        // Récupérer la liste originale
        const originalList = OrderList.getListWithProducts(listId);
        if (!originalList) {
            return res.status(404).json({ success: false, error: 'Liste originale non trouvée' });
        }
        
        // Créer la nouvelle liste
        const result = OrderList.createList(newName, originalList.description);
        const newListId = result.lastInsertRowid;
        
        // Copier tous les produits
        if (originalList.products && originalList.products.length > 0) {
            for (const product of originalList.products) {
                OrderList.addProductToList(
                    newListId, 
                    product.product_id, 
                    product.quantity, 
                    product.notes || ''
                );
            }
        }
        
        res.json({ 
            success: true, 
            message: 'Liste dupliquée avec succès',
            newListId: newListId 
        });
        
    } catch (error) {
        console.error('Error duplicating order list:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur lors de la duplication de la liste' 
        });
    }
});

// GET - Exporter une liste
router.get('/api/order-lists/:id/export', (req, res) => {
    try {
        const listId = req.params.id;
        const format = req.query.format || 'print';
        
        const list = OrderList.getListWithProducts(listId);
        if (!list) {
            return res.status(404).json({ success: false, error: 'Liste non trouvée' });
        }
        
        switch (format) {
            case 'print':
                res.render('orderListPrint', { list }, (err, html) => {
                    if (err) {
                        console.error('Error rendering print view:', err);
                        return res.status(500).send('Erreur lors de la génération');
                    }
                    res.send(html);
                });
                break;
                
            case 'csv':
                let csv = 'Produit,Quantité,Catégorie,Notes\\n';
                if (list.products) {
                    list.products.forEach(product => {
                        csv += `"${product.product_name}","${product.quantity}","${product.category_name}","${product.notes || ''}"\\n`;
                    });
                }
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename="${list.name}.csv"`);
                res.send(csv);
                break;
                
            case 'json':
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Disposition', `attachment; filename="${list.name}.json"`);
                res.json(list);
                break;
                
            default:
                res.status(400).json({ success: false, error: 'Format non supporté' });
        }
        
    } catch (error) {
        console.error('Error exporting order list:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur lors de l\'exportation de la liste' 
        });
    }
});

module.exports = router;
