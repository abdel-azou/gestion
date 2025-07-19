// Fonctionnalités avancées pour la gestion des listes de commandes

class OrderListManager {
    constructor() {
        this.selectedProducts = new Map();
        this.suggestedProducts = [];
        this.initializeAdvancedFeatures();
    }

    initializeAdvancedFeatures() {
        this.setupProductSuggestions();
        this.setupSmartReordering();
        this.setupKeyboardShortcuts();
        this.setupDragAndDrop();
    }

    // Suggestions intelligentes basées sur l'historique
    setupProductSuggestions() {
        const suggestionContainer = document.createElement('div');
        suggestionContainer.id = 'smartSuggestions';
        suggestionContainer.className = 'smart-suggestions';
        suggestionContainer.innerHTML = `
            <div class="suggestions-header">
                <h4><i class="fas fa-lightbulb"></i> Suggestions intelligentes</h4>
                <button class="btn btn-sm btn-outline" onclick="orderListManager.refreshSuggestions()">
                    <i class="fas fa-sync"></i> Actualiser
                </button>
            </div>
            <div id="suggestionsList" class="suggestions-list">
                <!-- Suggestions chargées dynamiquement -->
            </div>
        `;

        const productSelector = document.getElementById('productSelector');
        if (productSelector) {
            productSelector.parentNode.insertBefore(suggestionContainer, productSelector);
        }

        this.loadSmartSuggestions();
    }

    async loadSmartSuggestions() {
        try {
            const response = await fetch('/api/products/suggestions');
            const suggestions = await response.json();
            
            this.displaySuggestions(suggestions);
        } catch (error) {
            console.error('Erreur lors du chargement des suggestions:', error);
        }
    }

    displaySuggestions(suggestions) {
        const suggestionsList = document.getElementById('suggestionsList');
        if (!suggestionsList) return;

        if (suggestions.length === 0) {
            suggestionsList.innerHTML = '<p class="no-suggestions">Aucune suggestion disponible</p>';
            return;
        }

        suggestionsList.innerHTML = suggestions.map(product => `
            <div class="suggestion-item ${product.priority}" onclick="orderListManager.applySuggestion(${product.id})">
                <div class="suggestion-info">
                    <div class="suggestion-name">${product.name}</div>
                    <div class="suggestion-reason">${product.reason}</div>
                </div>
                <div class="suggestion-quantity">
                    <span class="suggested-qty">${product.suggested_quantity}</span>
                    <button class="btn btn-sm btn-success" onclick="event.stopPropagation(); orderListManager.applySuggestion(${product.id})">
                        <i class="fas fa-plus"></i> Ajouter
                    </button>
                </div>
            </div>
        `).join('');
    }

    applySuggestion(productId) {
        const productCheckbox = document.querySelector(`input[data-product-id="${productId}"]`);
        if (productCheckbox && !productCheckbox.checked) {
            productCheckbox.checked = true;
            if (typeof updateProductSelection === 'function') {
                updateProductSelection(productCheckbox);
            }
            
            // Animer l'élément pour montrer qu'il a été ajouté
            const productItem = productCheckbox.closest('.product-item');
            if (productItem) {
                productItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                productItem.classList.add('highlighted');
                
                setTimeout(() => {
                    productItem.classList.remove('highlighted');
                }, 2000);
            }
        }
    }

    // Réapprovisionnement intelligent
    setupSmartReordering() {
        const reorderButton = document.createElement('button');
        reorderButton.className = 'btn btn-primary smart-reorder-btn';
        reorderButton.innerHTML = '<i class="fas fa-magic"></i> Réapprovisionnement intelligent';
        reorderButton.onclick = () => this.performSmartReorder();

        const createListHeader = document.querySelector('.modal-header');
        if (createListHeader) {
            createListHeader.appendChild(reorderButton);
        }
    }

    async performSmartReorder() {
        try {
            const response = await fetch('/api/products/smart-reorder');
            const reorderData = await response.json();
            
            if (reorderData.success) {
                this.applySmartReorder(reorderData.products);
                if (typeof showNotification === 'function') {
                    showNotification(`${reorderData.products.length} produits ajoutés automatiquement`, 'success');
                }
            }
        } catch (error) {
            console.error('Erreur lors du réapprovisionnement intelligent:', error);
            if (typeof showNotification === 'function') {
                showNotification('Erreur lors du réapprovisionnement intelligent', 'error');
            }
        }
    }

    applySmartReorder(products) {
        products.forEach(product => {
            const checkbox = document.querySelector(`input[data-product-id="${product.id}"]`);
            if (checkbox && !checkbox.checked) {
                checkbox.checked = true;
                if (typeof updateProductSelection === 'function') {
                    updateProductSelection(checkbox);
                }
                
                // Définir la quantité suggérée
                const quantityInput = checkbox.closest('.product-item').querySelector('.quantity-input');
                if (quantityInput) {
                    quantityInput.value = product.suggested_quantity;
                }
            }
        });
    }

    // Raccourcis clavier
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'a':
                        e.preventDefault();
                        if (typeof selectAllProducts === 'function') {
                            selectAllProducts();
                        }
                        break;
                    case 'd':
                        e.preventDefault();
                        if (typeof clearAllProducts === 'function') {
                            clearAllProducts();
                        }
                        break;
                    case 's':
                        e.preventDefault();
                        const createForm = document.getElementById('createListForm');
                        if (createForm && createForm.style.display !== 'none') {
                            createForm.dispatchEvent(new Event('submit'));
                        }
                        break;
                }
            }
        });
    }

    // Drag and Drop
    setupDragAndDrop() {
        const productItems = document.querySelectorAll('.product-item');
        
        productItems.forEach(item => {
            item.draggable = true;
            
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', item.dataset.productId);
                item.classList.add('dragging');
            });
            
            item.addEventListener('dragend', (e) => {
                item.classList.remove('dragging');
            });
        });

        const dropZone = document.getElementById('selectedProductsList');
        if (dropZone) {
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('drag-over');
            });
            
            dropZone.addEventListener('dragleave', (e) => {
                if (!dropZone.contains(e.relatedTarget)) {
                    dropZone.classList.remove('drag-over');
                }
            });
            
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('drag-over');
                
                const productId = e.dataTransfer.getData('text/plain');
                const checkbox = document.querySelector(`input[data-product-id="${productId}"]`);
                
                if (checkbox && !checkbox.checked) {
                    checkbox.checked = true;
                    if (typeof updateProductSelection === 'function') {
                        updateProductSelection(checkbox);
                    }
                }
            });
        }
    }

    // Analytics et statistiques
    generateAnalytics() {
        const selectedProducts = Array.from(document.querySelectorAll('input[data-product-id]:checked'));
        const totalItems = selectedProducts.length;
        const urgentItems = selectedProducts.filter(cb => 
            cb.closest('.product-item').classList.contains('urgent')
        ).length;

        const analyticsContainer = document.getElementById('orderAnalytics');
        if (analyticsContainer) {
            analyticsContainer.innerHTML = `
                <div class="analytics-grid">
                    <div class="stat-card">
                        <div class="stat-label">Total produits</div>
                        <div class="stat-value">${totalItems}</div>
                    </div>
                    <div class="stat-card urgent">
                        <div class="stat-label">Produits urgents</div>
                        <div class="stat-value urgent">${urgentItems}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Sélectionnés</div>
                        <div class="stat-value">${selectedProducts.length}</div>
                    </div>
                </div>
            `;
        }
    }

    refreshSuggestions() {
        this.loadSmartSuggestions();
    }
}

// Fonctions utilitaires globales
function saveCurrentAsTemplate() {
    const selectedProducts = Array.from(document.querySelectorAll('input[data-product-id]:checked'));
    const templateName = prompt('Nom du modèle:');
    
    if (templateName && selectedProducts.length > 0) {
        const template = {
            name: templateName,
            products: selectedProducts.map(cb => ({
                id: cb.dataset.productId,
                quantity: cb.closest('.product-item').querySelector('.quantity-input')?.value || 1
            })),
            date: new Date().toISOString()
        };
        
        localStorage.setItem(`template_${templateName}`, JSON.stringify(template));
        if (typeof showNotification === 'function') {
            showNotification(`Modèle "${templateName}" sauvegardé`, 'success');
        }
    }
}

function loadTemplate() {
    const templateName = prompt('Nom du modèle à charger:');
    if (!templateName) return;
    
    const templateData = localStorage.getItem(`template_${templateName}`);
    if (templateData) {
        const template = JSON.parse(templateData);
        
        // Désélectionner tous les produits
        document.querySelectorAll('input[data-product-id]:checked').forEach(cb => {
            cb.checked = false;
            if (typeof updateProductSelection === 'function') {
                updateProductSelection(cb);
            }
        });
        
        // Sélectionner les produits du modèle
        template.products.forEach(product => {
            const checkbox = document.querySelector(`input[data-product-id="${product.id}"]`);
            if (checkbox) {
                checkbox.checked = true;
                if (typeof updateProductSelection === 'function') {
                    updateProductSelection(checkbox);
                }
                
                const quantityInput = checkbox.closest('.product-item').querySelector('.quantity-input');
                if (quantityInput) {
                    quantityInput.value = product.quantity;
                }
            }
        });
        
        if (typeof showNotification === 'function') {
            showNotification(`Modèle "${templateName}" chargé`, 'success');
        }
    } else {
        if (typeof showNotification === 'function') {
            showNotification(`Modèle "${templateName}" non trouvé`, 'error');
        }
    }
}

// Initialisation
let orderListManager;
document.addEventListener('DOMContentLoaded', () => {
    orderListManager = new OrderListManager();
});
