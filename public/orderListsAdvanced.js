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
            updateProductSelection(productCheckbox);
            
            // Animer l'élément pour montrer qu'il a été ajouté
            const productItem = productCheckbox.closest('.product-item');
            productItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
            productItem.classList.add('highlighted');
            
            setTimeout(() => {
                productItem.classList.remove('highlighted');
            }, 2000);
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
                showNotification(`${reorderData.products.length} produits ajoutés automatiquement`, 'success');
            }
        } catch (error) {
            console.error('Erreur lors du réapprovisionnement intelligent:', error);
            showNotification('Erreur lors du réapprovisionnement intelligent', 'error');
        }
    }

    applySmartReorder(products) {
        products.forEach(product => {
            const checkbox = document.querySelector(`input[data-product-id="${product.id}"]`);
            if (checkbox && !checkbox.checked) {
                checkbox.checked = true;
                updateProductSelection(checkbox);
                
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
                        selectAllProducts();
                        break;
                    case 'd':
                        e.preventDefault();
                        clearAllProducts();
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

    // Drag and Drop pour réorganiser
    setupDragAndDrop() {
        const productItems = document.querySelectorAll('.product-item');
        
        productItems.forEach(item => {
            item.draggable = true;
            
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', item.dataset.productId);
                item.classList.add('dragging');
            });
            
            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
            });
            
            item.addEventListener('dragover', (e) => {
                e.preventDefault();
            });
            
            item.addEventListener('drop', (e) => {
                e.preventDefault();
                const draggedId = e.dataTransfer.getData('text/plain');
                const draggedItem = document.querySelector(`[data-product-id="${draggedId}"]`).closest('.product-item');
                
                if (draggedItem !== item) {
                    const container = item.parentNode;
                    const draggedIndex = Array.from(container.children).indexOf(draggedItem);
                    const targetIndex = Array.from(container.children).indexOf(item);
                    
                    if (draggedIndex < targetIndex) {
                        container.insertBefore(draggedItem, item.nextSibling);
                    } else {
                        container.insertBefore(draggedItem, item);
                    }
                }
            });
        });
    }

    // Fonctionnalités de template et favoris
    saveAsTemplate(listName) {
        const selectedProducts = this.getSelectedProducts();
        const template = {
            name: listName,
            products: selectedProducts,
            created_at: new Date().toISOString()
        };

        const templates = this.getTemplates();
        templates.push(template);
        localStorage.setItem('orderListTemplates', JSON.stringify(templates));
        
        showNotification('Template sauvegardé avec succès', 'success');
    }

    getTemplates() {
        const templates = localStorage.getItem('orderListTemplates');
        return templates ? JSON.parse(templates) : [];
    }

    applyTemplate(templateName) {
        const templates = this.getTemplates();
        const template = templates.find(t => t.name === templateName);
        
        if (template) {
            clearAllProducts();
            template.products.forEach(product => {
                const checkbox = document.querySelector(`input[data-product-id="${product.id}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                    updateProductSelection(checkbox);
                    
                    const quantityInput = checkbox.closest('.product-item').querySelector('.quantity-input');
                    if (quantityInput) {
                        quantityInput.value = product.quantity;
                    }
                }
            });
            
            showNotification(`Template "${templateName}" appliqué`, 'success');
        }
    }

    getSelectedProducts() {
        const selected = [];
        document.querySelectorAll('.product-checkbox:checked').forEach(checkbox => {
            const productItem = checkbox.closest('.product-item');
            const quantityInput = productItem.querySelector('.quantity-input');
            const prioritySelect = productItem.querySelector('.priority-select');
            
            selected.push({
                id: parseInt(checkbox.dataset.productId),
                quantity: parseInt(quantityInput.value),
                priority: prioritySelect.value
            });
        });
        return selected;
    }

    // Statistiques en temps réel
    updateRealTimeStats() {
        const selectedProducts = this.getSelectedProducts();
        const totalItems = selectedProducts.reduce((sum, p) => sum + p.quantity, 0);
        const urgentItems = selectedProducts.filter(p => p.priority === 'urgent').length;
        
        const statsContainer = document.getElementById('realTimeStats');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="stat-item">
                    <span class="stat-label">Total articles:</span>
                    <span class="stat-value">${totalItems}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Urgents:</span>
                    <span class="stat-value urgent">${urgentItems}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Produits:</span>
                    <span class="stat-value">${selectedProducts.length}</span>
                </div>
            `;
        }
    }

    refreshSuggestions() {
        showNotification('Actualisation des suggestions...', 'info');
        this.loadSmartSuggestions();
    }
}

// Initialiser le gestionnaire au chargement de la page
let orderListManager;
document.addEventListener('DOMContentLoaded', () => {
    orderListManager = new OrderListManager();
});

// Fonction pour sauvegarder comme template
function saveCurrentAsTemplate() {
    const templateName = prompt('Nom du template:');
    if (templateName) {
        orderListManager.saveAsTemplate(templateName);
    }
}

// Fonction pour charger un template
function loadTemplate() {
    const templates = orderListManager.getTemplates();
    if (templates.length === 0) {
        showNotification('Aucun template disponible', 'warning');
        return;
    }
    
    const templateNames = templates.map(t => t.name);
    const selectedTemplate = prompt('Sélectionner un template:\n' + templateNames.join('\n'));
    
    if (selectedTemplate && templateNames.includes(selectedTemplate)) {
        orderListManager.applyTemplate(selectedTemplate);
    }
}
