let selectedProductId = null;

// Variables globales pour la gestion des catégories
let categoryStates = {};
let categoryModifications = {};

document.addEventListener('DOMContentLoaded', () => {
    console.log('=== INITIALISATION DE LA PAGE ===');
    console.log('Page actuelle:', window.location.pathname);
    
    // Initialiser les sélections de produits
    const productItems = document.querySelectorAll('.product-item');
    console.log('Nombre de produits trouvés:', productItems.length);
    
    productItems.forEach((item, index) => {
        console.log(`Attachement gestionnaire pour produit ${index + 1}:`, item.getAttribute('data-name'));
        item.addEventListener('click', (e) => {
            e.stopPropagation(); // Empêcher la propagation vers le document
            console.log('=== CLIC SUR PRODUIT ===');
            console.log('Produit cliqué:', item.getAttribute('data-name'));
            console.log('ID produit:', item.getAttribute('data-id'));
            
            // Vérifier que l'ID n'est pas null
            const productId = item.getAttribute('data-id');
            const productName = item.getAttribute('data-name');
            if (!productId) {
                console.error('ERREUR: data-id manquant sur le produit');
                showNotification('Erreur: ID produit manquant', 'error');
                return;
            }
            
            document.querySelectorAll('.product-item').forEach(p => p.classList.remove('selected'));
            item.classList.add('selected');
            selectedProductId = productId;
            
            // Mettre à jour l'affichage du produit sélectionné
            updateSelectedProductDisplay(productName);
            
            console.log('Produit sélectionné avec ID:', selectedProductId);
            console.log('Classe selected ajoutée, appel showCompactActionBar...');
            // Afficher la barre d'actions rapides
            showCompactActionBar();
        });
    });
    
    // Vérifier que la barre d'action existe
    const actionBar = document.getElementById('action-bar');
    console.log('Barre d\'action trouvée:', !!actionBar);
    if (actionBar) {
        console.log('Styles initiaux de la barre d\'action:', actionBar.style.cssText);
        console.log('Classes de la barre d\'action:', actionBar.className);
    }
    
    // Masquer la barre d'actions quand on clique ailleurs
    document.addEventListener('click', (e) => {
        const actionBar = document.getElementById('action-bar');
        const isActionBarClick = actionBar && actionBar.contains(e.target);
        const isProductClick = e.target.closest('.product-item');
        
        if (!isActionBarClick && !isProductClick && selectedProductId) {
            console.log('Clic extérieur détecté, masquage de la barre d\'action');
            hideCompactActionBar();
        }
    });
    
    // Initialiser les états des catégories
    const categories = document.querySelectorAll('.category-section');
    categories.forEach(section => {
        const categoryName = section.getAttribute('data-category');
        categoryStates[categoryName] = 'expanded';
        categoryModifications[categoryName] = [];
    });
    
    // Ajouter des événements de clic aux en-têtes de catégorie
    document.querySelectorAll('.category-header').forEach(header => {
        header.addEventListener('click', (e) => {
            e.preventDefault();
            const categorySection = header.closest('.category-section');
            const categoryName = categorySection.getAttribute('data-category');
            
            toggleCategory(categoryName);
            
            // Fallback pour les styles inline si CSS ne fonctionne pas
            setTimeout(() => {
                const categoryProducts = categorySection.querySelector('.category-products');
                const isCollapsed = categorySection.classList.contains('collapsed');
                const computedMaxHeight = window.getComputedStyle(categoryProducts).maxHeight;
                
                if (isCollapsed && computedMaxHeight !== '0px') {
                    console.log('CSS styles not working, falling back to inline styles');
                    toggleCategoryWithInlineStyles(categoryName);
                }
            }, 500);
        });
    });
    
    // Vérifier les check marks stockés
    checkStoredCheckMarks();
    
    // Initialiser les fonctionnalités mobiles
    createMobileNavigation();
    initSwipeGestures();
});

// ===== GESTION DU STOCK =====

async function updateSelectedStock(amount) {
    console.log('=== MISE À JOUR DU STOCK ===');
    console.log('Amount demandé:', amount);
    console.log('selectedProductId:', selectedProductId);
    
    if (selectedProductId) {
        const productElement = document.querySelector(`.product-item[data-id="${selectedProductId}"]`);
        console.log('Élément produit trouvé:', !!productElement);
        
        if (!productElement) {
            console.error('Produit non trouvé avec l\'ID:', selectedProductId);
            showNotification('Erreur: Produit non trouvé', 'error');
            return;
        }
        
        const stockElement = productElement.querySelector('.product-stock');
        console.log('Élément stock trouvé:', !!stockElement);
        
        if (!stockElement) {
            console.error('Élément stock non trouvé dans le produit');
            showNotification('Erreur: Stock non trouvé', 'error');
            return;
        }
        
        const currentStock = parseInt(stockElement.textContent, 10);
        const newStock = currentStock + amount;
        console.log('Stock actuel:', currentStock, 'Nouveau stock:', newStock);

        if (newStock >= 0) {
            productElement.classList.add('processing');
            console.log('Début de la mise à jour...');

            try {
                // Si pas d'inventaire en cours, en créer un automatiquement
                if (!isInventoryMode()) {
                    console.log('Pas d\'inventaire en cours, création automatique...');
                    await autoCreateInventory();
                }

                console.log('Envoi de la requête de mise à jour...');
                const response = await fetch('/products/update-stock', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ id: selectedProductId, amount })
                });

                productElement.classList.remove('processing');
                console.log('Réponse reçue, status:', response.status);

                if (response.ok) {
                    console.log('Mise à jour réussie');
                    stockElement.textContent = newStock;
                    productElement.classList.add('product-updated');
                    setTimeout(() => productElement.classList.remove('product-updated'), 2000);
                    
                    // Enregistrer la modification pour le système de validation
                    trackProductModification(productElement);
                    
                    // Afficher notification de modification avec compteur
                    const modCount = Object.keys(inventoryModifications).length;
                    showNotification(`Stock modifié (${modCount} produits modifiés)`, 'success');
                } else {
                    const errorText = await response.text();
                    console.error('Échec de la mise à jour, réponse:', errorText);
                    showNotification('Erreur lors de la mise à jour du stock', 'error');
                }
            } catch (error) {
                productElement.classList.remove('processing');
                console.error('Erreur lors de la mise à jour du stock:', error);
                showNotification('Erreur de connexion', 'error');
            }
        } else {
            console.warn('Tentative de stock négatif');
            alert('Le stock ne peut pas être négatif.');
        }
    } else {
        console.warn('Aucun produit sélectionné');
        alert('Veuillez sélectionner un produit.');
    }
}

function updateSelectedStockCustom() {
    // Cette fonction n'est plus utilisée mais gardée pour compatibilité
    console.warn('updateSelectedStockCustom() est obsolète');
}

// Plus d'affichage du produit sélectionné - ergonomie maximale
function updateSelectedProductDisplay(productName) {
    // Fonction conservée pour compatibilité mais ne fait plus rien
    console.log('🎯 Interface simplifiée - pas d\'affichage central');
}

// Plus d'affichage du produit sélectionné
function resetSelectedProductDisplay() {
    // Fonction conservée pour compatibilité mais ne fait plus rien
    console.log('🎯 Interface simplifiée - reset non nécessaire');
}

// ===== FONCTION POUR MISE À JOUR RAPIDE DU STOCK =====
async function quickStockUpdate(productId, amount) {
    console.log(`🚀 Mise à jour rapide: Produit ${productId}, quantité ${amount}`);
    
    try {
        const response = await fetch('/products/update-stock', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: productId,
                amount: amount
            })
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Stock mis à jour:', result);
            
            // Mettre à jour l'affichage local
            const productElement = document.querySelector(`[data-id="${productId}"]`);
            if (productElement) {
                const stockElement = productElement.querySelector('.product-stock');
                if (stockElement) {
                    const currentStock = parseInt(stockElement.textContent.match(/\d+/)[0]);
                    const newStock = currentStock + amount;
                    stockElement.textContent = `Stock: ${newStock}`;
                    
                    // Ajouter feedback visuel
                    productElement.style.animation = 'pulse 0.3s ease';
                    setTimeout(() => {
                        productElement.style.animation = '';
                    }, 300);
                }
            }
        } else {
            console.error('❌ Erreur lors de la mise à jour');
            alert('Erreur lors de la mise à jour du stock');
        }
    } catch (error) {
        console.error('❌ Erreur réseau:', error);
        alert('Erreur de connexion');
    }
}

// ===== GESTION DES PRODUITS =====

function deleteProduct(productId) {
    const productElement = document.querySelector(`.product-item[data-id="${productId}"]`);
    const productName = productElement ? productElement.getAttribute('data-name') : 'ce produit';
    
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${productName}" ?`)) {
        fetch(`/api/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                productElement.remove();
                showNotification('Produit supprimé avec succès', 'success');
            } else {
                showNotification('Erreur lors de la suppression du produit', 'error');
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            showNotification('Erreur de connexion', 'error');
        });
    } else {
        showNotification('Suppression annulée', 'info');
    }
}

// ===== SYSTÈME DE NOTIFICATIONS =====

function showNotification(message, type) {
    let notification = document.getElementById('notification');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        document.body.appendChild(notification);
    }
    
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// ===== FONCTIONNALITÉS MOBILES =====

function createMobileNavigation() {
    if (window.innerWidth < 768) {
        const nav = document.createElement('nav');
        nav.className = 'mobile-nav';
        nav.innerHTML = `
            <ul>
                <li><a href="/products">Produits</a></li>
                <li><a href="/categories">Catégories</a></li>
                <li><a href="/products-to-order">Produits à commander</a></li>
            </ul>
        `;
        document.body.appendChild(nav);
    }
}

function initSwipeGestures() {
    const productItems = document.querySelectorAll('.product-item');
    
    productItems.forEach(item => {
        let startX, moveX;
        
        item.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        });
        
        item.addEventListener('touchmove', (e) => {
            moveX = e.touches[0].clientX;
        });
        
        item.addEventListener('touchend', (e) => {
            const diff = startX - moveX;
            if (diff > 100) {
                updateSelectedStock(-1);
            } else if (diff < -100) {
                updateSelectedStock(1);
            }
        });
    });
}

// ===== SYSTÈME DE FILTRAGE =====

function filterCategories() {
    const searchValue = document.getElementById('category-search').value.toLowerCase();
    const categories = document.querySelectorAll('.category-section');

    categories.forEach(category => {
        const categoryName = category.getAttribute('data-category').toLowerCase();
        const shouldShow = categoryName.includes(searchValue);
        
        // Utiliser des classes si on est sur chef pâtissier, sinon style.display
        if (document.getElementById('chef_patissier-page')) {
            if (shouldShow) {
                category.classList.remove('filtered-hidden');
            } else {
                category.classList.add('filtered-hidden');
            }
        } else {
            category.style.display = shouldShow ? '' : 'none';
        }
    });
}

function filterProducts() {
    const searchValue = document.getElementById('product-search').value.toLowerCase();
    const categories = document.querySelectorAll('.category-section');
    
    console.log('Filtering products with search:', searchValue);

    // Déterminer quelle méthode utiliser selon la page
    const isChefPatissierPage = document.getElementById('chef_patissier-page');

    categories.forEach(category => {
        const products = category.querySelectorAll('.product-item');
        let visibleProductsInCategory = 0;
        
        products.forEach(product => {
            const productName = product.getAttribute('data-name').toLowerCase();
            const shouldShow = searchValue === '' || productName.includes(searchValue);
            
            if (isChefPatissierPage) {
                // Page chef pâtissier : utiliser des classes CSS
                if (shouldShow) {
                    product.classList.remove('filtered-hidden');
                    visibleProductsInCategory++;
                } else {
                    product.classList.add('filtered-hidden');
                }
            } else {
                // Page liste Abdelhamid : utiliser style.display
                product.style.display = shouldShow ? '' : 'none';
                if (shouldShow) visibleProductsInCategory++;
            }
        });
        
        // Cacher la catégorie entière si aucun produit n'est visible
        if (isChefPatissierPage) {
            if (visibleProductsInCategory > 0) {
                category.classList.remove('filtered-hidden');
            } else {
                category.classList.add('filtered-hidden');
            }
        } else {
            category.style.display = visibleProductsInCategory > 0 ? '' : 'none';
        }
    });
    
    console.log('Filter completed');
}

// ===== GESTION DES CATÉGORIES PLIABLES =====

function debugCategoryStyles(categoryName) {
    const categorySection = document.querySelector(`.category-section[data-category="${categoryName}"]`);
    const categoryProducts = categorySection.querySelector('.category-products');
    
    console.log('=== DEBUG STYLES ===');
    console.log('Category section classes:', categorySection.classList.toString());
    console.log('Category products computed styles:');
    const computedStyles = window.getComputedStyle(categoryProducts);
    console.log('max-height:', computedStyles.maxHeight);
    console.log('opacity:', computedStyles.opacity);
    console.log('overflow:', computedStyles.overflow);
    console.log('transition:', computedStyles.transition);
    console.log('==================');
}

function toggleCategory(categoryName) {
    console.log('Toggling category:', categoryName);
    const categorySection = document.querySelector(`.category-section[data-category="${categoryName}"]`);
    
    if (!categorySection) {
        console.error('Category section not found:', categoryName);
        return;
    }
    
    const isCollapsed = categorySection.classList.contains('collapsed');
    console.log('Is collapsed:', isCollapsed);
    
    if (isCollapsed) {
        categorySection.classList.remove('collapsed');
        categoryStates[categoryName] = 'expanded';
        console.log('Category expanded:', categoryName);
    } else {
        categorySection.classList.add('collapsed');
        categoryStates[categoryName] = 'collapsed';
        console.log('Category collapsed:', categoryName);
        
        if (categoryModifications[categoryName] && categoryModifications[categoryName].length > 0) {
            showCheckMark(categoryName);
        }
    }
    
    setTimeout(() => debugCategoryStyles(categoryName), 100);
}

function toggleCategoryWithInlineStyles(categoryName) {
    const categorySection = document.querySelector(`.category-section[data-category="${categoryName}"]`);
    const categoryProducts = categorySection.querySelector('.category-products');
    const toggleArrow = categorySection.querySelector('.toggle-arrow');
    
    if (!categorySection) {
        console.error('Category section not found:', categoryName);
        return;
    }
    
    const isCollapsed = categorySection.classList.contains('collapsed');
    
    if (isCollapsed) {
        categorySection.classList.remove('collapsed');
        categoryProducts.style.maxHeight = '2000px';
        categoryProducts.style.opacity = '1';
        categoryProducts.style.marginTop = '10px';
        categoryProducts.style.paddingTop = '';
        if (toggleArrow) toggleArrow.style.transform = 'rotate(0deg)';
        categoryStates[categoryName] = 'expanded';
        console.log('Category expanded with inline styles:', categoryName);
    } else {
        categorySection.classList.add('collapsed');
        categoryProducts.style.maxHeight = '0';
        categoryProducts.style.opacity = '0';
        categoryProducts.style.marginTop = '0';
        categoryProducts.style.paddingTop = '0';
        if (toggleArrow) toggleArrow.style.transform = 'rotate(-90deg)';
        categoryStates[categoryName] = 'collapsed';
        console.log('Category collapsed with inline styles:', categoryName);
        
        if (categoryModifications[categoryName] && categoryModifications[categoryName].length > 0) {
            showCheckMark(categoryName);
        }
    }
}

// ===== SYSTÈME DE VALIDATION =====

function showCheckMark(categoryName) {
    const checkMark = document.querySelector(`.category-section[data-category="${categoryName}"] .check-mark`);
    if (checkMark) {
        checkMark.style.display = 'flex';
        
        const showTime = Date.now();
        localStorage.setItem(`checkMark_${categoryName}`, showTime.toString());
        
        setTimeout(() => {
            checkMark.style.display = 'none';
            localStorage.removeItem(`checkMark_${categoryName}`);
            categoryModifications[categoryName] = [];
        }, 3600000); // 1 heure
    }
}

function checkStoredCheckMarks() {
    const categories = document.querySelectorAll('.category-section');
    
    categories.forEach(section => {
        const categoryName = section.getAttribute('data-category');
        const storedTime = localStorage.getItem(`checkMark_${categoryName}`);
        
        if (storedTime) {
            const showTime = parseInt(storedTime);
            const currentTime = Date.now();
            const elapsedTime = currentTime - showTime;
            
            if (elapsedTime < 3600000) {
                const checkMark = section.querySelector('.check-mark');
                if (checkMark) {
                    checkMark.style.display = 'flex';
                    
                    const remainingTime = 3600000 - elapsedTime;
                    setTimeout(() => {
                        checkMark.style.display = 'none';
                        localStorage.removeItem(`checkMark_${categoryName}`);
                        categoryModifications[categoryName] = [];
                    }, remainingTime);
                }
            } else {
                localStorage.removeItem(`checkMark_${categoryName}`);
            }
        }
    });
}

function trackProductModification(productElement) {
    const categorySection = productElement.closest('.category-section');
    const categoryName = categorySection.getAttribute('data-category');
    const productId = productElement.getAttribute('data-id');
    
    if (!categoryModifications[categoryName]) {
        categoryModifications[categoryName] = [];
    }
    
    if (!categoryModifications[categoryName].includes(productId)) {
        categoryModifications[categoryName].push(productId);
    }
    
    // Si on est en mode inventaire, suivre les modifications
    if (isInventoryMode()) {
        trackInventoryModification(productId, productElement);
    }
}

// === FONCTIONNALITÉS D'INVENTAIRE ===

let currentInventory = null;
let inventoryModifications = {};

// Vérifier si on est en mode inventaire
function isInventoryMode() {
    return currentInventory !== null;
}

// Créer automatiquement un inventaire lors de la première modification
async function autoCreateInventory() {
    const now = new Date();
    
    // Détecter si on est sur la page chef patissier
    const isChefPatissierPage = window.location.pathname === '/chef-patissier';
    const inventoryType = isChefPatissierPage ? 'Pâtisserie' : 'Général';
    const autoName = `Inventaire ${inventoryType} ${now.toLocaleDateString('fr-FR')} ${now.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}`;
    
    // Choisir l'endpoint approprié selon la page
    const endpoint = isChefPatissierPage ? '/api/inventory/create-patisserie' : '/api/inventory/create';
    
    try {
        showNotification(`Création d'un inventaire ${inventoryType.toLowerCase()} automatique...`, 'info');
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: autoName,
                notes: `Inventaire ${inventoryType.toLowerCase()} créé automatiquement lors de modifications de stock`
            })
        });

        const result = await response.json();

        if (result.success) {
            currentInventory = {
                id: result.inventoryId,
                name: autoName
            };
            inventoryModifications = {};
            
            showInventoryNotification();
            showNotification(`✨ Inventaire ${inventoryType.toLowerCase()} démarré automatiquement !`, 'success');
            
            // Masquer le bouton "Nouvel Inventaire" et afficher le bouton "Clôturer"
            updateInventoryButtonsState(true);
        } else {
            showNotification('Erreur lors de la création automatique', 'error');
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error auto-creating inventory:', error);
        showNotification('Impossible de créer l\'inventaire automatique', 'error');
        throw error;
    }
}

// Démarrer un nouvel inventaire manuellement (optionnel)
function startNewInventory() {
    if (isInventoryMode()) {
        showNotification('Un inventaire est déjà en cours !', 'warning');
        return;
    }
    
    const modal = document.getElementById('startInventoryModal');
    const now = new Date();
    const defaultName = `Inventaire ${now.toLocaleDateString('fr-FR')}`;
    document.getElementById('newInventoryName').value = defaultName;
    modal.style.display = 'block';
    
    // Animation d'ouverture de modal
    setTimeout(() => {
        modal.querySelector('.modal-content').style.transform = 'scale(1)';
        modal.querySelector('.modal-content').style.opacity = '1';
    }, 10);
}

// Fermer la modal d'inventaire
function closeInventoryModal() {
    const modal = document.getElementById('startInventoryModal');
    const modalContent = modal.querySelector('.modal-content');
    
    // Animation de fermeture
    modalContent.style.transform = 'scale(0.9)';
    modalContent.style.opacity = '0';
    
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

// Gérer le formulaire de création d'inventaire
document.addEventListener('DOMContentLoaded', () => {
    const startInventoryForm = document.getElementById('startInventoryForm');
    if (startInventoryForm) {
        startInventoryForm.addEventListener('submit', async (event) => {
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
                    currentInventory = {
                        id: result.inventoryId,
                        name: data.name
                    };
                    inventoryModifications = {};
                    
                    showInventoryNotification();
                    closeInventoryModal();
                    showNotification('Inventaire démarré! Vous pouvez maintenant modifier les stocks.', 'success');
                } else {
                    showNotification(result.error || 'Erreur lors de la création', 'error');
                }
            } catch (error) {
                console.error('Error creating inventory:', error);
                showNotification('Erreur de connexion', 'error');
            }
        });
    }
});

// Afficher la notification d'inventaire en cours
function showInventoryNotification() {
    const notification = document.getElementById('inventory-notification');
    const nameSpan = document.getElementById('inventory-name');
    
    if (currentInventory) {
        nameSpan.textContent = currentInventory.name;
        notification.style.display = 'block';
        
        // Animation d'apparition
        setTimeout(() => {
            notification.style.transform = 'translateY(0)';
            notification.style.opacity = '1';
        }, 10);
        
        // Mettre à jour les boutons
        updateInventoryButtonsState(true);
        
        // Mettre à jour le compteur de modifications
        updateModificationCounter();
    } else {
        // Animation de disparition
        notification.style.transform = 'translateY(-100%)';
        notification.style.opacity = '0';
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, 300);
        
        // Mettre à jour les boutons
        updateInventoryButtonsState(false);
    }
}

// Mettre à jour le compteur de modifications dans la notification
function updateModificationCounter() {
    const notification = document.getElementById('inventory-notification');
    if (!notification || !currentInventory) return;
    
    const modCount = Object.keys(inventoryModifications).length;
    const counterElement = notification.querySelector('.modification-counter');
    
    if (counterElement) {
        counterElement.textContent = `${modCount} produits modifiés`;
    } else {
        // Ajouter le compteur s'il n'existe pas
        const nameSpan = document.getElementById('inventory-name');
        if (nameSpan && nameSpan.parentNode) {
            const counter = document.createElement('div');
            counter.className = 'modification-counter';
            counter.style.cssText = 'font-size: 12px; opacity: 0.8; margin-top: 4px;';
            counter.textContent = `${modCount} produits modifiés`;
            nameSpan.parentNode.appendChild(counter);
        }
    }
}

// Mettre à jour l'état visuel des boutons d'inventaire
function updateInventoryButtonsState(isActiveInventory) {
    const inventoryBtn = document.querySelector('.inventory-btn');
    const startInventoryBtn = document.querySelector('.start-inventory-btn');
    
    if (inventoryBtn) {
        if (isActiveInventory) {
            inventoryBtn.classList.add('active');
            inventoryBtn.innerHTML = '<i class="fas fa-eye"></i> Voir Inventaire Actif';
            inventoryBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        } else {
            inventoryBtn.classList.remove('active');
            inventoryBtn.innerHTML = '<i class="fas fa-clipboard-list"></i> Gestion Inventaires';
            inventoryBtn.style.background = 'linear-gradient(135deg, #06b6d4, #0891b2)';
        }
    }
    
    if (startInventoryBtn) {
        if (isActiveInventory) {
            // Transformer en bouton "Clôturer Inventaire"
            startInventoryBtn.innerHTML = '<i class="fas fa-check-circle"></i> Clôturer Inventaire';
            startInventoryBtn.style.background = 'linear-gradient(135deg, #dc2626, #b91c1c)';
            startInventoryBtn.style.color = 'white';
            startInventoryBtn.onclick = showCloseInventoryConfirmation;
            startInventoryBtn.classList.add('close-inventory-btn');
            startInventoryBtn.classList.remove('start-inventory-btn');
        } else {
            // Retour au bouton "Nouvel Inventaire"
            startInventoryBtn.innerHTML = '<i class="fas fa-plus"></i> Nouvel Inventaire';
            startInventoryBtn.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)';
            startInventoryBtn.style.color = 'white';
            startInventoryBtn.onclick = startNewInventory;
            startInventoryBtn.classList.remove('close-inventory-btn');
            startInventoryBtn.classList.add('start-inventory-btn');
        }
    }
}

// Afficher une confirmation stylée pour clôturer l'inventaire
function showCloseInventoryConfirmation() {
    console.log('showCloseInventoryConfirmation called');
    console.log('currentInventory:', currentInventory);
    console.log('inventoryModifications:', inventoryModifications);
    
    const modCount = Object.keys(inventoryModifications).length;
    
    if (modCount === 0) {
        if (confirm('Aucune modification n\'a été effectuée. Voulez-vous quand même clôturer cet inventaire ?')) {
            finalizeCurrentInventory();
        }
        return;
    }
    
    const confirmMessage = `
🔚 Clôturer l'inventaire "${currentInventory.name}" ?

📊 Résumé:
• ${modCount} produits modifiés
• Stocks mis à jour automatiquement
• Liste de commandes générée si nécessaire

⚠️ Cette action est définitive !
    `.trim();
    
    console.log('Showing confirmation dialog');
    if (confirm(confirmMessage)) {
        console.log('User confirmed, calling finalizeCurrentInventory');
        finalizeCurrentInventory();
    } else {
        console.log('User cancelled');
    }
}

// Ajouter des effets visuels aux boutons
function addButtonEffects() {
    const buttons = document.querySelectorAll('.view-products-to-order-btn, .inventory-btn, .start-inventory-btn');
    
    buttons.forEach(button => {
        // Effet de clic
        button.addEventListener('mousedown', function() {
            this.style.transform = 'translateY(-1px) scale(0.98)';
        });
        
        button.addEventListener('mouseup', function() {
            this.style.transform = 'translateY(-3px) scale(1)';
        });
        
        // Effet de survol avec son (optionnel)
        button.addEventListener('mouseenter', function() {
            this.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        });
        
        // Ajout d'une indication de loading pendant les actions
        if (button.classList.contains('start-inventory-btn')) {
            button.addEventListener('click', function() {
                const originalHTML = this.innerHTML;
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Création...';
                this.disabled = true;
                
                // Restaurer après 2 secondes (le temps de la création)
                setTimeout(() => {
                    if (!isInventoryMode()) {
                        this.innerHTML = originalHTML;
                        this.disabled = false;
                    }
                }, 2000);
            });
        }
    });
}

// Suivre les modifications de produits dans l'inventaire
function trackInventoryModification(productId, productElement) {
    if (!currentInventory) return;
    
    const stockElement = productElement.querySelector('.product-stock');
    const currentStock = parseInt(stockElement.textContent);
    
    inventoryModifications[productId] = currentStock;
    
    // Marquer visuellement le produit comme modifié
    productElement.classList.add('inventory-modified');
    
    // Mettre à jour le compteur en temps réel
    updateModificationCounter();
    
    // Mettre à jour le FAB si nécessaire
    const fab = document.getElementById('quick-fab');
    if (fab && Object.keys(inventoryModifications).length > 0) {
        fab.innerHTML = `<i class="fas fa-check-circle"></i>`;
        fab.style.background = 'linear-gradient(135deg, #dc2626, #b91c1c)';
        fab.onclick = showCloseInventoryConfirmation;
        
        // Ajouter un badge avec le nombre de modifications
        const badge = fab.querySelector('.mod-badge') || document.createElement('div');
        if (!fab.querySelector('.mod-badge')) {
            badge.className = 'mod-badge';
            badge.style.cssText = `
                position: absolute;
                top: -8px;
                right: -8px;
                background: #fbbf24;
                color: #92400e;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: bold;
                border: 2px solid white;
            `;
            fab.appendChild(badge);
        }
        badge.textContent = Object.keys(inventoryModifications).length;
    }
}

// Finaliser l'inventaire en cours
async function finalizeCurrentInventory() {
    console.log('finalizeCurrentInventory called');
    console.log('currentInventory:', currentInventory);
    console.log('inventoryModifications:', inventoryModifications);
    
    if (!currentInventory) {
        console.error('No current inventory!');
        showNotification('Aucun inventaire en cours', 'error');
        return;
    }

    try {
        console.log('Starting finalization process...');
        
        // Mettre à jour tous les stocks modifiés dans l'inventaire
        for (const [productId, newStock] of Object.entries(inventoryModifications)) {
            console.log(`Updating product ${productId} to stock ${newStock}`);
            
            const updateResponse = await fetch('/api/inventory/update-stock', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inventoryId: currentInventory.id,
                    productId: parseInt(productId),
                    newStock: newStock
                })
            });
            
            if (!updateResponse.ok) {
                const errorText = await updateResponse.text();
                console.error(`Failed to update product ${productId}:`, errorText);
            }
        }

        console.log('Finalizing inventory...');
        
        // Finaliser l'inventaire
        const response = await fetch(`/api/inventory/${currentInventory.id}/finalize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                notes: `Inventaire finalisé depuis la page liste avec ${Object.keys(inventoryModifications).length} modifications`
            })
        });

        const result = await response.json();
        console.log('Finalization result:', result);

        if (result.success) {
            // Transformer le bouton en bouton "Voir l'inventaire" avec date/heure
            const completedDate = new Date().toLocaleDateString('fr-FR');
            const completedTime = new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'});
            
            transformToViewInventoryButton(currentInventory.id, currentInventory.name, completedDate, completedTime);
            
            resetInventoryMode();
            showNotification('✅ Inventaire finalisé avec succès !', 'success');
            
            // Recharger la page pour voir les nouveaux stocks après un délai
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } else {
            showNotification(result.error || 'Erreur lors de la finalisation', 'error');
        }
    } catch (error) {
        console.error('Error finalizing inventory:', error);
        showNotification('Erreur lors de la finalisation', 'error');
    }
}

// Annuler l'inventaire en cours
function cancelCurrentInventory() {
    if (!confirm('Annuler cet inventaire? Toutes les modifications seront perdues.')) {
        return;
    }
    
    resetInventoryMode();
    showNotification('Inventaire annulé', 'info');
    
    // Recharger la page pour restaurer les stocks originaux
    window.location.reload();
}

// Réinitialiser le mode inventaire
function resetInventoryMode() {
    currentInventory = null;
    inventoryModifications = {};
    showInventoryNotification();
    
    // Retirer les marqueurs visuels
    document.querySelectorAll('.inventory-modified').forEach(element => {
        element.classList.remove('inventory-modified');
    });
    
    // Réinitialiser le FAB
    const fab = document.getElementById('quick-fab');
    if (fab) {
        fab.innerHTML = '<i class="fas fa-magic"></i>';
        fab.style.background = 'linear-gradient(135deg, var(--primary-color), var(--primary-hover))';
        fab.onclick = showQuickActions;
        
        // Retirer le badge s'il existe
        const badge = fab.querySelector('.mod-badge');
        if (badge) {
            badge.remove();
        }
    }
}

// Initialiser l'amélioration au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    // Initialiser les effets des boutons
    setTimeout(() => {
        addButtonEffects();
        updateInventoryButtonsState(isInventoryMode());
    }, 100);
    
    // Vérifier périodiquement l'état de l'inventaire
    setInterval(() => {
        updateInventoryButtonsState(isInventoryMode());
    }, 2000);
});

// Afficher une notification
function showNotification(message, type = 'info') {
    // Créer l'élément de notification s'il n'existe pas
    let notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
        `;
        document.body.appendChild(notificationContainer);
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        padding: 15px 20px;
        margin-bottom: 10px;
        border-radius: 4px;
        color: white;
        font-weight: 500;
        animation: slideIn 0.3s ease-out;
        ${type === 'success' ? 'background-color: #28a745;' : ''}
        ${type === 'error' ? 'background-color: #dc3545;' : ''}
        ${type === 'info' ? 'background-color: #17a2b8;' : ''}
        ${type === 'warning' ? 'background-color: #ffc107; color: #212529;' : ''}
    `;
    
    notificationContainer.appendChild(notification);
    
    // Supprimer après 3 secondes
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// ===== GESTION DE LA BARRE D'ACTIONS RAPIDES =====

function showCompactActionBar() {
    const actionBar = document.getElementById('action-bar');
    
    if (actionBar) {
        console.log('Affichage de la barre d\'actions'); // Debug log
        
        // Forcer tous les styles nécessaires
        actionBar.style.display = 'flex';
        actionBar.style.transform = 'translateY(0)';
        actionBar.style.opacity = '1';
        actionBar.style.visibility = 'visible';
        actionBar.style.zIndex = '1000';
        actionBar.style.animation = 'slideUpActionBar 0.3s ease-out';
        
        // Force l'affichage même si le CSS tente de le masquer
        actionBar.classList.add('action-bar-visible');
        
        // Vérification après animation
        setTimeout(() => {
            const computedStyle = window.getComputedStyle(actionBar);
            console.log('Barre d\'action - Display:', computedStyle.display, 'Transform:', computedStyle.transform);
            
            if (computedStyle.display === 'none') {
                console.warn('Barre d\'action masquée par CSS, correction...');
                actionBar.style.setProperty('display', 'flex', 'important');
                actionBar.style.setProperty('transform', 'translateY(0)', 'important');
            }
        }, 350);
    } else {
        console.error('Element action-bar non trouvé'); // Debug log
    }
}

function hideCompactActionBar() {
    const actionBar = document.getElementById('action-bar');
    if (actionBar) {
        console.log('Masquage de la barre d\'actions'); // Debug log
        actionBar.style.transform = 'translateY(100%)';
        actionBar.classList.remove('action-bar-visible');
        
        setTimeout(() => {
            actionBar.style.display = 'none';
        }, 300);
    }
    
    // Désélectionner le produit et réinitialiser l'affichage
    document.querySelectorAll('.product-item').forEach(p => p.classList.remove('selected'));
    selectedProductId = null;
    resetSelectedProductDisplay();
}

// ===== TRANSFORMATION DU BOUTON INVENTAIRE =====

function transformToViewInventoryButton(inventoryId, inventoryName, date, time) {
    const button = document.getElementById('inventory-main-action');
    const inventoryNotification = document.getElementById('inventory-notification');
    
    if (button && inventoryNotification) {
        // Transformer le bouton
        button.innerHTML = `
            <i class="fas fa-eye"></i> 
            <span>Voir l'inventaire du ${date} à ${time}</span>
        `;
        button.className = 'btn-view-inventory';
        button.onclick = () => {
            window.open(`/inventory/${inventoryId}`, '_blank');
        };
        
        // Changer le titre de la notification
        const inventoryInfo = inventoryNotification.querySelector('.inventory-info strong');
        if (inventoryInfo) {
            inventoryInfo.innerHTML = '✅ Inventaire terminé';
        }
        
        // Changer la couleur de la notification
        inventoryNotification.style.background = 'linear-gradient(135deg, #d4edda, #c3e6cb)';
        inventoryNotification.style.borderLeft = '4px solid #28a745';
        
        // Masquer la notification après 8 secondes
        setTimeout(() => {
            if (inventoryNotification.style.display !== 'none') {
                inventoryNotification.style.animation = 'fadeOut 0.5s ease-out';
                setTimeout(() => {
                    inventoryNotification.style.display = 'none';
                }, 500);
            }
        }, 8000);
    }
}

// Fonction pour la compatibilité avec l'ancien code
function showQuickActionBar(productName) {
    showCompactActionBar();
}

function hideQuickActionBar() {
    hideCompactActionBar();
}
