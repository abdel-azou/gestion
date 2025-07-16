// Middleware de sécurité basique pour l'espace admin
const adminAuth = (req, res, next) => {
    // Pour une sécurité basique, on peut vérifier un paramètre ou un header
    // Dans un vrai projet, vous devriez utiliser une authentification propre
    
    // Exemple simple : vérifier si l'utilisateur a le bon mot de passe en query parameter
    // ?admin_pass=admin123
    const adminPass = req.query.admin_pass || req.headers['admin-pass'];
    
    // Ou simplement permettre l'accès (vous pouvez commenter cette ligne pour activer la sécurité)
    return next();
    
    // Décommentez ces lignes pour activer une sécurité basique
    /*
    if (adminPass === 'admin123') {
        next();
    } else {
        res.status(401).json({ 
            error: 'Accès non autorisé à l\'espace admin',
            message: 'Utilisez ?admin_pass=admin123 pour accéder à l\'admin' 
        });
    }
    */
};

// Middleware pour logger les actions admin
const adminLogger = (req, res, next) => {
    const timestamp = new Date().toISOString();
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    console.log(`[ADMIN] ${timestamp} - ${req.method} ${req.path} - IP: ${ip} - UA: ${userAgent}`);
    
    // Log des données sensibles (création, modification, suppression)
    if (req.method !== 'GET' && req.body) {
        console.log(`[ADMIN] Data:`, JSON.stringify(req.body, null, 2));
    }
    
    next();
};

// Middleware pour ajouter des headers de sécurité
const adminSecurity = (req, res, next) => {
    // Empêcher la mise en cache des pages admin
    res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    });
    
    next();
};

module.exports = {
    adminAuth,
    adminLogger,
    adminSecurity
};
