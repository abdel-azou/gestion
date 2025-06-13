// insertManualProducts.js

const Product = require('./models/Product'); // Assurez-vous que le chemin est correct
const db = require('./models/db_config'); // Assurez-vous que le chemin est correct

// --- MAPPING DES CATÉGORIES AVEC LEURS IDs ---
// *** IMPORTANT : Ajustez ces IDs si vos catégories ont des IDs différents dans la base de données ***
// Si 'Congel' et 'Divers' n'ont pas encore d'IDs dans votre DB, vous devrez d'abord les ajouter
// à votre table 'categories' et leur attribuer des IDs.
const categoryMapping = {
    'Farine': 4,
    'Congel': 7, // Assurez-vous que cette catégorie existe et a cet ID dans votre DB
    'Sachet': 2,
    'Divers': 8, // Assurez-vous que cette catégorie existe et a cet ID dans votre DB
    'Boite': 1,
    'Frigo': 3,
    // Ajoutez d'autres catégories si nécessaire
};

// --- LISTE DES PRODUITS À IMPORTER ---
// Le stock_minimal a été corrigé pour correspondre au stock initial.
const productsData = [
    // Catégorie: Farine (ID: 4)
    { categoryName: 'Farine', name: 'Semoule baguettes', stock: 50, stock_minimal: 50 },
    { categoryName: 'Farine', name: 'Oumeyma', stock: 50, stock_minimal: 50 },
    { categoryName: 'Farine', name: 'Natural supra', stock: 25, stock_minimal: 25 },
    { categoryName: 'Farine', name: 'Alpha', stock: 20, stock_minimal: 20 },
    { categoryName: 'Farine', name: 'Levure Bruggeman', stock: 6, stock_minimal: 6 },
    { categoryName: 'Farine', name: 'S500 puratos', stock: 2, stock_minimal: 2 },
    { categoryName: 'Farine', name: 'Boscous', stock: 10, stock_minimal: 10 },
    { categoryName: 'Farine', name: 'Seigle', stock: 2, stock_minimal: 2 },
    { categoryName: 'Farine', name: 'Decor cereales', stock: 2, stock_minimal: 2 },
    { categoryName: 'Farine', name: 'Sucre', stock: 15, stock_minimal: 15 },
    { categoryName: 'Farine', name: 'Sucre P4', stock: 2, stock_minimal: 2 }, // Corrigé
    { categoryName: 'Farine', name: 'Sel', stock: 10, stock_minimal: 10 },   // Corrigé
    { categoryName: 'Farine', name: 'Sésames', stock: 2, stock_minimal: 2 },  // Corrigé
    { categoryName: 'Farine', name: 'Son', stock: 2, stock_minimal: 2 },     // Corrigé
    { categoryName: 'Farine', name: 'Semoule harcha', stock: 3, stock_minimal: 3 }, // Corrigé
    { categoryName: 'Farine', name: 'Œufs', stock: 6, stock_minimal: 6 },    // Corrigé
    { categoryName: 'Farine', name: 'Papier cuisson 40x60', stock: 5, stock_minimal: 5 },
    { categoryName: 'Farine', name: 'Papier cuisson 80x60', stock: 2, stock_minimal: 2 },

    // Catégorie: Congel (ID: 7)
    { categoryName: 'Congel', name: 'Croissant chocolat', stock: 5, stock_minimal: 5 },
    { categoryName: 'Congel', name: 'Croquant noisette chocolat', stock: 4, stock_minimal: 4 },
    { categoryName: 'Congel', name: 'Noix de pécan', stock: 4, stock_minimal: 4 },
    { categoryName: 'Congel', name: 'Croissant amande', stock: 5, stock_minimal: 5 },
    { categoryName: 'Congel', name: 'Amande cerise', stock: 4, stock_minimal: 4 },
    { categoryName: 'Congel', name: 'Boule de Berlin', stock: 3, stock_minimal: 3 },
    { categoryName: 'Congel', name: 'Croissant nature', stock: 2, stock_minimal: 2 },
    { categoryName: 'Congel', name: 'Couque au chocolat', stock: 2, stock_minimal: 2 },
    { categoryName: 'Congel', name: 'Maton', stock: 2, stock_minimal: 2 },
    { categoryName: 'Congel', name: 'Mini pecan', stock: 2, stock_minimal: 2 },

    // Catégorie: Sachet (ID: 2)
    { categoryName: 'Sachet', name: 'P1', stock: 5, stock_minimal: 5 },
    { categoryName: 'Sachet', name: 'P2', stock: 5, stock_minimal: 5 },
    { categoryName: 'Sachet', name: 'P4', stock: 5, stock_minimal: 5 },
    { categoryName: 'Sachet', name: 'P6', stock: 5, stock_minimal: 5 },
    { categoryName: 'Sachet', name: 'Petit pain', stock: 5, stock_minimal: 5 },
    { categoryName: 'Sachet', name: 'Grand pain Carré', stock: 5, stock_minimal: 5 },
    { categoryName: 'Sachet', name: 'Grand pain Rond', stock: 5, stock_minimal: 5 },
    { categoryName: 'Sachet', name: '1 baguette', stock: 3, stock_minimal: 3 },
    { categoryName: 'Sachet', name: '2 baguettes', stock: 3, stock_minimal: 3 },
    { categoryName: 'Sachet', name: 'Sandwich', stock: 5, stock_minimal: 5 },
    { categoryName: 'Sachet', name: 'Sac plastique', stock: 10, stock_minimal: 10 },

    // Catégorie: Divers (ID: 8)
    { categoryName: 'Divers', name: 'Bobines papier', stock: 10, stock_minimal: 10 },
    { categoryName: 'Divers', name: 'Papier toilette', stock: 2, stock_minimal: 2 },
    { categoryName: 'Divers', name: 'Carton 1000cc', stock: 2, stock_minimal: 2 },
    { categoryName: 'Divers', name: 'Carton 2000cc', stock: 2, stock_minimal: 2 },
    { categoryName: 'Divers', name: 'Pots de wraps de 12 oz', stock: 2, stock_minimal: 2 },
    { categoryName: 'Divers', name: 'Touillettes à café.', stock: 2, stock_minimal: 2 },
    { categoryName: 'Divers', name: 'Serviettes sandwiches', stock: 3, stock_minimal: 3 },
    { categoryName: 'Divers', name: 'Rouleaux bancontact', stock: 3, stock_minimal: 3 },
    { categoryName: 'Divers', name: 'Gants noirs taille L', stock: 5, stock_minimal: 5 },
    { categoryName: 'Divers', name: 'Petit gobelet à café', stock: 2, stock_minimal: 2 },
    { categoryName: 'Divers', name: 'Couvercle Petit gobelet à café', stock: 2, stock_minimal: 2 },
    { categoryName: 'Divers', name: 'Moyen gobelet à café', stock: 2, stock_minimal: 2 },
    { categoryName: 'Divers', name: 'Couvercle Moyen gobelet à café', stock: 2, stock_minimal: 2 },
    { categoryName: 'Divers', name: 'Grand gobelet à café', stock: 2, stock_minimal: 2 },
    { categoryName: 'Divers', name: 'Couvercle Grand gobelet à café', stock: 2, stock_minimal: 2 },
    { categoryName: 'Divers', name: 'Emballage Salade bowl 750', stock: 2, stock_minimal: 2 },
    { categoryName: 'Divers', name: 'Rouleau film pvc 45cm', stock: 2, stock_minimal: 2 },
    { categoryName: 'Divers', name: 'Aluminium 45cm', stock: 2, stock_minimal: 2 },
    { categoryName: 'Divers', name: 'Produit four', stock: 3, stock_minimal: 3 },
    { categoryName: 'Divers', name: 'Bidon liquide vaisselle + rinçage', stock: 2, stock_minimal: 2 },
    { categoryName: 'Divers', name: 'Savon mains', stock: 3, stock_minimal: 3 },
    { categoryName: 'Divers', name: 'Javel', stock: 10, stock_minimal: 10 },
    { categoryName: 'Divers', name: 'Dasty', stock: 10, stock_minimal: 10 },

    // Catégorie: Boite (ID: 1)
    { categoryName: 'Boite', name: '11/8', stock: 5, stock_minimal: 5 },
    { categoryName: 'Boite', name: '13/8', stock: 5, stock_minimal: 5 },
    { categoryName: 'Boite', name: '15/8', stock: 5, stock_minimal: 5 },
    { categoryName: 'Boite', name: '17/8', stock: 5, stock_minimal: 5 },
    { categoryName: 'Boite', name: '19/8', stock: 5, stock_minimal: 5 },
    { categoryName: 'Boite', name: '21/8', stock: 5, stock_minimal: 5 },
    { categoryName: 'Boite', name: '23/8', stock: 5, stock_minimal: 5 },
    { categoryName: 'Boite', name: '25/8', stock: 5, stock_minimal: 5 },
    { categoryName: 'Boite', name: '27/8', stock: 5, stock_minimal: 5 },
    { categoryName: 'Boite', name: '30/8', stock: 5, stock_minimal: 5 },
    { categoryName: 'Boite', name: '19/11', stock: 5, stock_minimal: 5 },
    { categoryName: 'Boite', name: '21/11', stock: 5, stock_minimal: 5 },
    { categoryName: 'Boite', name: '23/11', stock: 5, stock_minimal: 5 },
    { categoryName: 'Boite', name: '25/11', stock: 5, stock_minimal: 5 },
    { categoryName: 'Boite', name: '27/11', stock: 5, stock_minimal: 5 },
    { categoryName: 'Boite', name: '30/11', stock: 5, stock_minimal: 5 },
    { categoryName: 'Boite', name: '35/10', stock: 2, stock_minimal: 2 }, // Corrigé
    { categoryName: 'Boite', name: '40/10', stock: 2, stock_minimal: 2 }, // Corrigé

    // Catégorie: Frigo (ID: 3)
    { categoryName: 'Frigo', name: 'Pâte filo', stock: 3, stock_minimal: 3 }, // Corrigé
    { categoryName: 'Frigo', name: 'Saumon', stock: 4, stock_minimal: 4 }, // Corrigé
    { categoryName: 'Frigo', name: 'Fromage blanc', stock: 4, stock_minimal: 4 }, // Corrigé
    { categoryName: 'Frigo', name: 'Mascarpone', stock: 10, stock_minimal: 10 }, // Corrigé
];

async function importProducts() {
    console.log("Démarrage de l'importation manuelle des produits...");

    const productsToCreate = productsData.map(product => {
        const category_id = categoryMapping[product.categoryName];
        if (category_id === undefined) {
            console.warn(`Avertissement : Catégorie "${product.categoryName}" non trouvée pour le produit "${product.name}". Ce produit sera ignoré.`);
            return null; // Ignore ce produit s'il n'y a pas de mapping
        }
        return {
            name: product.name,
            stock: product.stock,
            category_id: category_id,
            stock_minimal: product.stock_minimal
        };
    }).filter(p => p !== null); // Supprime les produits ignorés

    if (productsToCreate.length === 0) {
        console.log("Aucun produit valide à importer après le mapping des catégories.");
        return;
    }

    try {
        Product.createMany(productsToCreate);
        console.log(`🎉 ${productsToCreate.length} produits ont été ajoutés avec succès à la base de données !`);
    } catch (error) {
        console.error("❌ Erreur lors de l'importation des produits :", error.message);
        console.error(error.stack); // Afficher la trace complète de l'erreur pour le débogage
    } finally {
        // La connexion à la base de données SQLite3 se ferme généralement automatiquement.
        // Si vous utilisez une autre base de données ou si vous avez un besoin spécifique de fermeture,
        // décommentez et ajustez la ligne ci-dessous si votre db_config expose une méthode close.
        // if (db && typeof db.close === 'function') {
        //     db.close();
        //     console.log("Connexion à la base de données fermée.");
        // }
    }
}

// Exécute le script
importProducts();