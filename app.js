// Chargement des variables d'environnement
// Ordre de priorité: Railway production > .env.railway (local) > .env.local > .env
if (process.env.NODE_ENV === 'production') {
    // En production sur Railway, utilise les variables d'environnement automatiques
    console.log('🚀 Mode production - utilisation des variables Railway');
} else {
    // En développement local
    require('dotenv').config({ path: '.env.railway' });
    if (!process.env.DATABASE_URL) {
        require('dotenv').config({ path: '.env.local' });
        if (!process.env.DATABASE_URL) {
            require('dotenv').config(); // Fallback vers .env standard
        }
    }
}

// Vérification des variables sensibles
if (!process.env.DATABASE_URL) {
    console.error('❌ Erreur: DATABASE_URL non configurée');
    console.log('💡 Conseil: Copiez .env.railway.template vers .env.railway et complétez les clés');
    process.exit(1);
}

const express = require('express');
const bodyParser = require('body-parser');
const exphbs = require('express-handlebars');
const path = require('path');
const fs = require('fs');

// Initialiser la base de données au démarrage
const setupRailwayDatabase = require('./railway-setup');

// Configuration asynchrone de la base
(async () => {
    await setupRailwayDatabase();
})().catch(err => console.log('Setup DB warning:', err.message));

const app = express();
// Import temporaire des produits
app.get('/admin/import-products', async (req, res) => {
    try {
        const importFunction = require('./import-products-railway');
        await importFunction();
        res.json({ success: true, message: 'Produits importés avec succès!' });
    } catch (error) {
        console.error('Erreur import:', error);
        res.status(500).json({ error: error.message });
    }
});

const port = process.env.PORT || 8080;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Importer les helpers Handlebars
const handlebarsHelpers = require('./helpers/handlebars-helpers');

// Configurer Handlebars avec tous les helpers
const hbs = exphbs.create({
    extname: 'hbs',
    defaultLayout: 'main',
    layoutsDir: 'views/layouts/',
    partialsDir: 'views/partials/',
    helpers: {
        if_eq: function(a, b, options) {
            if (a == b) {
                return options.fn(this);
            }
            return options.inverse(this);
        },
        ...handlebarsHelpers
    }
});

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', './views');

// Middleware pour vérifier chaque requête
app.use((req, res, next) => {
    console.log(`Received request for: ${req.url}`);
    next();
});

// Route de débogage
app.get('/debug', (req, res) => {
    console.log('Debug route accessed');
    res.send('Debug route accessed');
});

// Importer et utiliser les routes des produits
const productRoutes = require('./routes/productRoutes');
app.use('/', productRoutes);

// Importer et utiliser les routes des listes de commandes
const orderListRoutes = require('./routes/orderListRoutes');
app.use('/', orderListRoutes);

// Route pour afficher directement les produits
const productController = require('./controllers/productController');
app.get('/', productController.list);

// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
    console.error('Global error handler:', err.stack);
    res.status(500).send('Something broke!');
});

app.listen(port, () => {
    console.log(`App running at http://localhost:${port}`);
});

module.exports = app;
