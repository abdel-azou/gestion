module.exports = {
    // Helper pour comparaison inférieure
    lt: (a, b) => a < b,
    
    // Helper pour comparaison d'égalité
    eq: (a, b) => a === b,
    
    // Helper pour comparaison supérieure
    gt: (a, b) => a > b,
    
    // Helper pour comparaison inférieure ou égale
    lte: (a, b) => a <= b,
    
    // Helper pour comparaison supérieure ou égale
    gte: (a, b) => a >= b,
    
    // Helper pour convertir en JSON
    json: (context) => JSON.stringify(context),
    
    // Helper pour calculer la différence
    subtract: (a, b) => a - b,
    
    // Helper pour addition
    add: (a, b) => a + b,
    
    // Helper pour multiplication
    multiply: (a, b) => a * b,
    
    // Helper pour division
    divide: (a, b) => b !== 0 ? a / b : 0,
    
    // Helper pour formater les nombres
    formatNumber: (num) => {
        return new Intl.NumberFormat('fr-FR').format(num);
    },
    
    // Helper pour formater les dates
    formatDate: (dateString) => {
        if (!dateString) return '';
        if (dateString === 'now') {
            dateString = new Date().toISOString();
        }
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    // Helper pour status du stock
    stockStatus: (stock, minimalStock) => {
        if (stock === 0) return 'out-of-stock';
        if (stock < minimalStock) return 'low-stock';
        return 'good-stock';
    },
    
    // Helper pour message du stock
    stockMessage: (stock, minimalStock) => {
        if (stock === 0) return 'Rupture de stock';
        if (stock < minimalStock) return 'Stock faible';
        return 'Stock OK';
    },
    
    // Helper pour icône du stock
    stockIcon: (stock, minimalStock) => {
        if (stock === 0) return '🚨';
        if (stock < minimalStock) return '⚠️';
        return '✅';
    },
    
    // Helper pour calculer le pourcentage de stock
    stockPercentage: (stock, minimalStock) => {
        if (minimalStock === 0) return 100;
        return Math.round((stock / minimalStock) * 100);
    },
    
    // Helper pour calculer un pourcentage
    calc: (value, total) => {
        if (total === 0) return 0;
        return Math.round((value / total) * 100);
    },
    
    // Helper pour formater un pourcentage
    formatPercentage: (value) => {
        return Math.round(value);
    },
    
    // Helper pour formater un nombre avec décimales
    formatNumber: (value) => {
        return Math.round(value * 100) / 100;
    }
};