const path = require('path');
const fs = require('fs');

// Chemin de la base de données
const dbDir = path.join(__dirname, 'data');

// Vérifier si le répertoire existe, sinon le créer
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log(`Directory ${dbDir} created.`);
} else {
    console.log(`Directory ${dbDir} already exists.`);
}
