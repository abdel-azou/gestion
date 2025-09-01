// Gestion des inventaires - JavaScript frontend

// Variables globales
let currentInventoryId = null;

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    console.log('Inventory page loaded');
    initializeInventoryForms();
});

// Initialiser les formulaires
function initializeInventoryForms() {
    // Formulaire de création d'inventaire
    const newInventoryForm = document.getElementById('newInventoryForm');
    if (newInventoryForm) {
        newInventoryForm.addEventListener('submit', handleCreateInventory);
    }

    // Formulaire de création de liste de commandes
    const orderListForm = document.getElementById('createOrderListForm');
    if (orderListForm) {
        orderListForm.addEventListener('submit', handleCreateOrderList);
    }
}

// Créer un nouvel inventaire
function startNewInventory() {
    const modal = document.getElementById('newInventoryModal');
    modal.style.display = 'block';
    
    // Générer un nom par défaut
    const now = new Date();
    const defaultName = `Inventaire ${now.toLocaleDateString('fr-FR')}`;
    document.getElementById('inventoryName').value = defaultName;
}

// Alias pour maintenir la compatibilité
function createNewInventory() {
    startNewInventory();
}

// Gérer la création d'inventaire
async function handleCreateInventory(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = {
        name: formData.get('name'),
        notes: formData.get('notes')
    };

    try {
        const response = await fetch('/api/inventory/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Inventaire créé avec succès!', 'success');
            closeModal('newInventoryModal');
            
            // Rediriger vers la page de l'inventaire ou recharger
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            showNotification(result.error || 'Erreur lors de la création', 'error');
        }
    } catch (error) {
        console.error('Error creating inventory:', error);
        showNotification('Erreur de connexion', 'error');
    }
}

// Voir les détails d'un inventaire
async function viewInventory(inventoryId) {
    try {
        const response = await fetch(`/api/inventory/${inventoryId}`);
        const inventory = await response.json();

        if (response.ok) {
            displayInventoryDetails(inventory);
            const modal = document.getElementById('inventoryDetailsModal');
            modal.style.display = 'block';
        } else {
            showNotification(inventory.error || 'Erreur lors du chargement', 'error');
        }
    } catch (error) {
        console.error('Error viewing inventory:', error);
        showNotification('Erreur de connexion', 'error');
    }
}

// Afficher les détails de l'inventaire
function displayInventoryDetails(inventory) {
    console.log('Displaying inventory details:', inventory);
    
    const title = document.getElementById('inventoryDetailsTitle');
    const content = document.getElementById('inventoryDetailsContent');
    
    if (!title || !content) {
        console.error('Modal elements not found');
        return;
    }
    
    title.textContent = `Inventaire: ${inventory.name}`;
    
    // Informations de base
    let html = `
        <div class="inventory-details">
            <div class="inventory-info">
                <h3>Informations générales</h3>
                <p><strong>ID:</strong> #${inventory.id}</p>
                <p><strong>Statut:</strong> 
                    <span class="status-badge status-${inventory.status}">
                        ${inventory.status === 'draft' ? 'Brouillon' : 'Finalisé'}
                    </span>
                </p>
                <p><strong>Date de création:</strong> ${formatDateLocal(inventory.created_date)}</p>
                ${inventory.finalized_date ? `<p><strong>Date de finalisation:</strong> ${formatDateLocal(inventory.finalized_date)}</p>` : ''}
                ${inventory.notes ? `<p><strong>Notes:</strong> ${inventory.notes}</p>` : ''}
            </div>
    `;
    
    // Produits de l'inventaire
    if (inventory.items && inventory.items.length > 0) {
        html += `
            <div class="inventory-items-section">
                <h3>Produits dans l'inventaire (${inventory.items.length} articles)</h3>
                
                <!-- Barre de recherche -->
                <div class="search-container-modal">
                    <div class="search-box">
                        <i class="fas fa-search search-icon"></i>
                        <input 
                            type="text" 
                            id="modal-product-search" 
                            class="search-input"
                            placeholder="Rechercher un produit..." 
                            onkeyup="filterModalProducts()"
                        >
                        <button class="clear-search" onclick="clearModalSearch()" style="display: none;">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <!-- Filtres -->
                    <div class="filter-buttons">
                        <button class="filter-btn active" onclick="setModalFilter('all')" data-filter="all">
                            <i class="fas fa-list"></i> Tous
                        </button>
                        <button class="filter-btn" onclick="setModalFilter('modified')" data-filter="modified">
                            <i class="fas fa-edit"></i> Modifiés seulement
                        </button>
                        <button class="filter-btn" onclick="setModalFilter('unmodified')" data-filter="unmodified">
                            <i class="fas fa-equals"></i> Non modifiés
                        </button>
                    </div>
                    
                    <p class="search-stats">
                        <span id="modal-search-results-count">${inventory.items.length} produits</span>
                    </p>
                </div>
                
                <!-- Container pour les catégories -->
                <div id="modal-items-container">
                    <!-- Les produits organisés par catégories seront ajoutés ici -->
                </div>
        `;
        
        // On termine la section mais on organisera les produits avec JavaScript
        html += `
            </div>
        `;
    } else {
        html += `
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i>
                Aucun produit dans cet inventaire.
            </div>
        `;
    }
    
    // Actions disponibles
    html += `
        <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--gray-200);">
            <h3>Actions</h3>
            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
    `;
    
    // Bouton supprimer toujours disponible
    html += `
        <button class="btn btn-danger" onclick="closeModal('inventoryDetailsModal'); deleteInventory(${inventory.id})">
            <i class="fas fa-trash"></i> Supprimer
        </button>
    `;
    
    html += `
            <button class="btn btn-secondary" onclick="closeModal('inventoryDetailsModal')">
                <i class="fas fa-times"></i> Fermer
            </button>
        </div>
    </div>
    </div>
    `;
    
    content.innerHTML = html;
    
    // Organiser les produits par catégories dans la modal
    if (inventory.items && inventory.items.length > 0) {
        organizeModalItemsByCategory(inventory.items);
    }
}

// Fonction utilitaire pour formater les dates
function formatDateLocal(dateString) {
    if (!dateString) return '-';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateString;
    }
}

// Créer une liste de commandes depuis un inventaire
function createOrderListFromInventory(inventoryId) {
    currentInventoryId = inventoryId;
    const modal = document.getElementById('createOrderListModal');
    document.getElementById('orderListInventoryId').value = inventoryId;
    
    // Générer un nom par défaut
    const now = new Date();
    const defaultName = `Commandes suite à inventaire ${now.toLocaleDateString('fr-FR')}`;
    document.getElementById('orderListName').value = defaultName;
    
    modal.style.display = 'block';
}

// Gérer la création de liste de commandes
async function handleCreateOrderList(event) {
    event.preventDefault();
    
    const inventoryId = document.getElementById('orderListInventoryId').value;
    const listName = document.getElementById('orderListName').value;

    try {
        const response = await fetch(`/api/inventory/${inventoryId}/create-order-list`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ listName })
        });

        const result = await response.json();

        if (result.success) {
            showNotification(result.message, 'success');
            closeModal('createOrderListModal');
            
            // Optionnel: rediriger vers la liste de commandes créée
            if (confirm('Liste de commandes créée! Voulez-vous la voir maintenant?')) {
                window.location.href = '/order-lists';
            }
        } else {
            showNotification(result.error || 'Erreur lors de la création', 'error');
        }
    } catch (error) {
        console.error('Error creating order list:', error);
        showNotification('Erreur de connexion', 'error');
    }
}

// Supprimer un inventaire
async function deleteInventory(inventoryId) {
    // Récupérer les informations de l'inventaire pour adapter le message
    try {
        const response = await fetch(`/api/inventory/${inventoryId}`);
        const inventory = await response.json();
        
        let confirmMessage = 'Êtes-vous sûr de vouloir supprimer cet inventaire? Cette action est irréversible.';
        
        if (inventory && inventory.status === 'finalized') {
            confirmMessage = '⚠️ ATTENTION: Cet inventaire est finalisé et les stocks ont été mis à jour.\n\nSupprimer cet inventaire pourrait affecter vos données historiques.\n\nÊtes-vous vraiment sûr de vouloir le supprimer?';
        }
        
        if (!confirm(confirmMessage)) {
            return;
        }
    } catch (error) {
        // Si on ne peut pas récupérer l'inventaire, on affiche le message standard
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet inventaire? Cette action est irréversible.')) {
            return;
        }
    }

    try {
        const response = await fetch(`/api/inventory/${inventoryId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Inventaire supprimé avec succès!', 'success');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            showNotification(result.error || 'Erreur lors de la suppression', 'error');
        }
    } catch (error) {
        console.error('Error deleting inventory:', error);
        showNotification('Erreur de connexion', 'error');
    }
}

// Fermer une modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'none';
    
    // Réinitialiser les formulaires
    const forms = modal.querySelectorAll('form');
    forms.forEach(form => form.reset());
}

// Fermer les modals en cliquant à l'extérieur
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal && modal.style.display === 'block') {
            modal.style.display = 'none';
        }
    });
}

// Chargement initial
document.addEventListener('DOMContentLoaded', function() {
    loadInventories();
});

// Charger tous les inventaires
async function loadInventories() {
    try {
        const response = await fetch('/api/inventory/all');
        const inventories = await response.json();
        
        if (response.ok) {
            displayInventoriesList(inventories);
        } else {
            console.error('Error loading inventories:', inventories.error);
            showNotification('Erreur lors du chargement des inventaires', 'error');
        }
    } catch (error) {
        console.error('Error loading inventories:', error);
        showNotification('Erreur de connexion', 'error');
    }
}

// Afficher la liste des inventaires
function displayInventoriesList(inventories) {
    const tbody = document.querySelector('table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (inventories.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Aucun inventaire trouvé</td></tr>';
        return;
    }
    
    inventories.forEach(inventory => {
        const row = document.createElement('tr');
        const statusClass = inventory.status === 'finalized' ? 'finalized' : 'draft';
        const statusText = inventory.status === 'finalized' ? 'Finalisé' : 'Brouillon';
        const finalizedDate = inventory.finalized_date ? 
            new Date(inventory.finalized_date).toLocaleDateString('fr-FR') : 
            '-';
        
        row.innerHTML = `
            <td>${inventory.id}</td>
            <td>${inventory.name}</td>
            <td>${new Date(inventory.created_date).toLocaleDateString('fr-FR')}</td>
            <td>${finalizedDate}</td>
            <td><span class="status-badge status-${statusClass}">${statusText}</span></td>
            <td>
                <div class="action-buttons-small">
                    <button class="btn btn-sm btn-info" onclick="viewInventory(${inventory.id})">
                        <i class="fas fa-eye"></i> Voir
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteInventory(${inventory.id})">
                        <i class="fas fa-trash"></i> Supprimer
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Afficher une notification
function showNotification(message, type = 'info') {
    // Créer l'élément de notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Ajouter au DOM
    document.body.appendChild(notification);
    
    // Supprimer après 3 secondes
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Formater une date
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Styles pour les notifications (ajoutés dynamiquement)
if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 4px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        }
        
        .notification-success { background-color: #28a745; }
        .notification-error { background-color: #dc3545; }
        .notification-info { background-color: #17a2b8; }
        .notification-warning { background-color: #ffc107; color: #212529; }
        
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        .difference.positive { color: #28a745; font-weight: bold; }
        .difference.negative { color: #dc3545; font-weight: bold; }
        .difference.neutral { color: #6c757d; }
        
        .below-minimum { background-color: #fff3cd; }
        
        .alert-badge {
            background-color: #ffc107;
            color: #212529;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 0.8em;
        }
        
        .ok-badge {
            background-color: #28a745;
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 0.8em;
        }
        
        .inventory-actions {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
        }
        
        .inventory-info {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
    `;
    document.head.appendChild(style);
}

// Organiser les produits par catégories dans la modal
function organizeModalItemsByCategory(items) {
    console.log('Organisation des produits par catégories dans la modal...');
    const container = document.getElementById('modal-items-container');
    
    if (!container) {
        console.error('Container modal non trouvé');
        return;
    }
    
    // Organiser les items par catégorie
    const categoriesMap = {};
    
    items.forEach(item => {
        const category = item.category_name || 'Sans catégorie';
        if (!categoriesMap[category]) {
            categoriesMap[category] = [];
        }
        categoriesMap[category].push(item);
    });
    
    console.log('Catégories trouvées:', Object.keys(categoriesMap));
    
    // Créer le HTML pour chaque catégorie
    let html = '';
    const categories = Object.keys(categoriesMap).sort();
    
    categories.forEach(categoryName => {
        const categoryItems = categoriesMap[categoryName];
        const modifiedCount = categoryItems.filter(item => item.stock_before !== item.stock_after).length;
        
        html += `
            <div class="modal-category-section" data-category="${categoryName}">
                <div class="modal-category-header">
                    <h4>
                        <i class="fas fa-folder-open"></i>
                        ${categoryName}
                        <span class="modal-category-stats">(${categoryItems.length} produits, ${modifiedCount} modifiés)</span>
                    </h4>
                </div>
                <div class="modal-category-items">
                    <div class="modal-items-mobile">
        `;
        
        categoryItems.forEach(item => {
            const difference = item.stock_after - item.stock_before;
            let differenceClass = 'difference-zero';
            let differenceIcon = '';
            let differenceText = '';
            
            if (difference > 0) {
                differenceClass = 'difference-positive';
                differenceIcon = '📈';
                differenceText = `+${difference}`;
            } else if (difference < 0) {
                differenceClass = 'difference-negative';
                differenceIcon = '📉';
                differenceText = `${difference}`;
            } else {
                differenceIcon = '➖';
                differenceText = '0';
            }
            
            const isUnderMinimum = item.stock_after < item.stock_minimal;
            const stockWarning = isUnderMinimum ? 'stock-warning' : '';
            const isModified = item.stock_before !== item.stock_after;
            
            html += `
                <div class="inventory-item-card" 
                     data-product-name="${(item.product_name || '').toLowerCase()}"
                     data-modified="${isModified}"
                     data-difference="${difference}">
                    <div class="item-header">
                        <h4 class="item-name">${item.product_name || `Produit #${item.product_id}`}</h4>
                        <span class="item-category">${item.category_name || 'Sans catégorie'}</span>
                        ${isModified ? '<span class="modified-badge"><i class="fas fa-edit"></i> Modifié</span>' : ''}
                    </div>
                    
                    <div class="item-stocks">
                        <div class="stock-info">
                            <span class="stock-label">Initial</span>
                            <span class="stock-value">${item.stock_before}</span>
                        </div>
                        <div class="stock-arrow">→</div>
                        <div class="stock-info ${stockWarning}">
                            <span class="stock-label">Final</span>
                            <span class="stock-value">${item.stock_after}</span>
                        </div>
                        <div class="stock-minimum">
                            <span class="stock-label">Min.</span>
                            <span class="stock-value">${item.stock_minimal}</span>
                        </div>
                    </div>
                    
                    <div class="item-difference">
                        <span class="difference-label">Différence :</span>
                        <span class="difference-value ${differenceClass}">
                            ${differenceIcon} ${differenceText}
                        </span>
                    </div>
                    
                    ${isUnderMinimum ? `
                    <div class="stock-alert">
                        <i class="fas fa-exclamation-triangle"></i>
                        Stock sous le minimum !
                    </div>
                    ` : ''}
                </div>
            `;
        });
        
        html += `
                    </div>
                    
                    <!-- Version tableau pour écrans plus larges -->
                    <div class="modal-items-desktop">
                        <div class="table-responsive">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Produit</th>
                                        <th>Stock Initial</th>
                                        <th>Stock Final</th>
                                        <th>Stock Min.</th>
                                        <th>Différence</th>
                                    </tr>
                                </thead>
                                <tbody>
        `;
        
        categoryItems.forEach(item => {
            const difference = item.stock_after - item.stock_before;
            let differenceClass = 'difference-zero';
            let differenceIcon = '';
            
            if (difference > 0) {
                differenceClass = 'difference-positive';
                differenceIcon = '↗️';
            } else if (difference < 0) {
                differenceClass = 'difference-negative';
                differenceIcon = '↘️';
            } else {
                differenceIcon = '→';
            }
            
            const isUnderMinimum = item.stock_after < item.stock_minimal;
            const stockWarning = isUnderMinimum ? 'stock-warning' : '';
            const isModified = item.stock_before !== item.stock_after;
            
            html += `
                <tr data-product-name="${(item.product_name || '').toLowerCase()}"
                    data-modified="${isModified}"
                    data-difference="${difference}"
                    class="${isModified ? 'table-row-modified' : ''}">
                    <td>
                        <strong>${item.product_name || `Produit #${item.product_id}`}</strong>
                        ${isModified ? '<span class="modified-badge-small"><i class="fas fa-edit"></i></span>' : ''}
                    </td>
                    <td>${item.stock_before}</td>
                    <td class="${stockWarning}">${item.stock_after}</td>
                    <td>${item.stock_minimal}</td>
                    <td class="${differenceClass}">
                        ${differenceIcon} ${difference > 0 ? '+' : ''}${difference}
                    </td>
                </tr>
            `;
        });
        
        html += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    updateModalSearchStats();
    console.log('Organisation terminée');
}

// Effacer la recherche dans la modal
function clearModalSearch() {
    document.getElementById('modal-product-search').value = '';
    // Réinitialiser aussi le filtre à "Tous"
    setModalFilter('all');
    document.getElementById('modal-product-search').focus();
}

// Mettre à jour les statistiques de recherche dans la modal
function updateModalSearchStats(visibleCount, categoriesCount, searchTerm) {
    const statsElement = document.getElementById('modal-search-results-count');
    const allProducts = document.querySelectorAll('.modal-category-section [data-product-name]');
    const totalItems = allProducts.length;
    
    if (visibleCount !== undefined && visibleCount !== null) {
        if (searchTerm) {
            statsElement.textContent = `${visibleCount} produits trouvés dans ${categoriesCount} catégories`;
        } else {
            statsElement.textContent = `${totalItems} produits`;
        }
    } else {
        statsElement.textContent = `${totalItems} produits`;
    }
}

// Variable globale pour le filtre actuel
let currentModalFilter = 'all';

// Définir le filtre pour la modal
function setModalFilter(filterType) {
    currentModalFilter = filterType;
    
    // Mettre à jour l'apparence des boutons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-filter') === filterType) {
            btn.classList.add('active');
        }
    });
    
    // Appliquer le filtre
    filterModalProducts();
}

// Fonction modifiée pour prendre en compte le filtre
function filterModalProducts() {
    const searchTerm = document.getElementById('modal-product-search').value.toLowerCase();
    const clearButton = document.querySelector('.clear-search');
    const categories = document.querySelectorAll('.modal-category-section');
    
    // Afficher/masquer le bouton clear
    if (clearButton) {
        clearButton.style.display = searchTerm ? 'block' : 'none';
    }
    
    let visibleProductsCount = 0;
    let visibleCategoriesCount = 0;
    
    categories.forEach(category => {
        const products = category.querySelectorAll('[data-product-name]');
        let visibleProductsInCategory = 0;
        
        products.forEach(product => {
            const productName = product.getAttribute('data-product-name');
            const isModified = product.getAttribute('data-modified') === 'true';
            
            // Vérifier si le produit correspond à la recherche
            const matchesSearch = productName.indexOf(searchTerm) >= 0;
            
            // Vérifier si le produit correspond au filtre
            let matchesFilter = true;
            if (currentModalFilter === 'modified') {
                matchesFilter = isModified;
            } else if (currentModalFilter === 'unmodified') {
                matchesFilter = !isModified;
            }
            
            const isVisible = matchesSearch && matchesFilter;
            product.style.display = isVisible ? '' : 'none';
            
            if (isVisible) {
                visibleProductsInCategory++;
                visibleProductsCount++;
            }
        });
        
        // Masquer la catégorie si aucun produit n'est visible
        if (visibleProductsInCategory > 0) {
            category.style.display = '';
            visibleCategoriesCount++;
        } else {
            category.style.display = 'none';
        }
    });
    
    updateModalSearchStats(visibleProductsCount, visibleCategoriesCount, searchTerm);
}
