// Contrôleur d'import en masse - Méthode simple
app.get('/admin/bulk-import', (req, res) => {
    res.render('bulk-import', { 
        title: 'Import en masse des produits',
        layout: 'main'
    });
});

app.post('/admin/bulk-import', async (req, res) => {
    const { csvData } = req.body;
    
    try {
        // Parse simple du CSV
        const lines = csvData.split('\n').filter(line => line.trim());
        const results = [];
        
        for (let i = 1; i < lines.length; i++) { // Skip header
            const [categoryName, productName, stock, stockMinimal] = lines[i].split(',');
            
            if (!productName || !categoryName) continue;
            
            // Trouver ou créer la catégorie
            let category = await Category.getByName(categoryName.trim());
            if (!category) {
                category = await Category.create(categoryName.trim());
            }
            
            // Créer le produit
            const product = await Product.create(
                productName.trim(),
                parseInt(stock) || 0,
                category.id,
                parseInt(stockMinimal) || 0
            );
            
            results.push({ product: productName, status: 'success' });
        }
        
        res.json({ 
            success: true, 
            message: `${results.length} produits importés`,
            results 
        });
        
    } catch (error) {
        console.error('Erreur import:', error);
        res.status(500).json({ error: error.message });
    }
});
