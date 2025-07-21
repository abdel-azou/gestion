require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const exphbs = require('express-handlebars');
const path = require('path');
const fs = require('fs');

// Initialiser la base de données au démarrage
require('./init-db');

const app = express();
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
