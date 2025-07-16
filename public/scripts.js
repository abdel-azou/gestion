let selectedProductId = null;

document.addEventListener('DOMContentLoaded', () => {
    // Initialiser les sélections de produits
    document.querySelectorAll('.product-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.product-item').forEach(p => p.classList.remove('selected'));
            item.classList.add('selected');
            selectedProductId = item.getAttribute('data-id');
        });
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
            
            // Essayer d'abord avec les styles CSS, puis fallback vers les styles inline
            toggleCategory(categoryName);
            
            // Si après 500ms les styles ne sont pas appliqués, utiliser les styles inline
            setTimeout(() => {
                const categoryProducts = categorySection.querySelector('.category-products');
                const isCollapsed = categorySection.classList.contains('collapsed');
                const computedMaxHeight = window.getComputedStyle(categoryProducts).maxHeight;
                
                // Si la catégorie est supposée être pliée mais max-height n'est pas 0px
                if (isCollapsed && computedMaxHeight !== '0px') {
                    console.log('CSS styles not working, falling back to inline styles');
                    toggleCategoryWithInlineStyles(categoryName);
                }
            }, 500);
        });
    });
    
    // Vérifier les check marks stockés
    checkStoredCheckMarks();
});

async function updateSelectedStock(amount) {
    if (selectedProductId) {
        const productElement = document.querySelector(`.product-item[data-id="${selectedProductId}"]`);
        const stockElement = productElement.querySelector('.product-stock');
        const currentStock = parseInt(stockElement.textContent, 10);
        const newStock = currentStock + amount;

        if (newStock >= 0) {
            productElement.classList.add('processing'); // Ajouter la classe processing

            const response = await fetch('/products/update-stock', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: selectedProductId, amount })
            });

            productElement.classList.remove('processing'); // Supprimer la classe processing

            if (response.ok) {
                stockElement.textContent = newStock;
                productElement.classList.add('product-updated');
                setTimeout(() => productElement.classList.remove('product-updated'), 2000); // Retirer la couleur de mise à jour après 2 secondes
                
                // Enregistrer la modification pour le système de validation
                trackProductModification(productElement);
            } else {
                console.error('Failed to update stock');
            }
        } else {
            alert('Le stock ne peut pas être négatif.');
        }
    } else {
        alert('Veuillez sélectionner un produit.');
    }
}

function updateSelectedStockCustom() {
    const customAmount = parseInt(document.getElementById('custom-amount').value, 10);
    if (!isNaN(customAmount)) {
        updateSelectedStock(customAmount);
        // Réinitialiser le champ après utilisation
        document.getElementById('custom-amount').value = '';
    }
}
function deleteProduct(productId) {
    // Récupérer le nom du produit pour l'afficher dans la confirmation
    const productElement = document.querySelector(`.product-item[data-id="${productId}"]`);
    const productName = productElement ? productElement.getAttribute('data-name') : 'ce produit';
    
    // Afficher la boîte de dialogue de confirmation
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${productName}" ?`)) {
        // Si l'utilisateur confirme, procéder à la suppression
        fetch(`/api/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                // Suppression réussie, actualiser ou modifier l'interface utilisateur
                productElement.remove();
                showNotification('Produit supprimé avec succès', 'success');
            } else {
                // Gérer les erreurs
                showNotification('Erreur lors de la suppression du produit', 'error');
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            showNotification('Erreur de connexion', 'error');
        });
    } else {
        // L'utilisateur a annulé, ne rien faire
        showNotification('Suppression annulée', 'info');
    }
}

// Fonction utilitaire pour afficher des notifications
function showNotification(message, type) {
    // Vérifier si un élément de notification existe déjà
    let notification = document.getElementById('notification');
    
    // S'il n'existe pas, le créer
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        document.body.appendChild(notification);
    }
    
    // Définir la classe selon le type
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Afficher la notification
    notification.style.display = 'block';
    
    // La faire disparaître après 3 secondes
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

function createMobileNavigation() {
  if (window.innerWidth < 768) {
    // Create compact bottom navigation
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
      if (diff > 100) { // Right to left swipe
        updateSelectedStock(-1); // Decrease stock
      } else if (diff < -100) { // Left to right swipe
        updateSelectedStock(1); // Increase stock
      }
    });
  });
}


function filterCategories() {
    const searchValue = document.getElementById('category-search').value.toLowerCase();
    const categories = document.querySelectorAll('.category-section');

    categories.forEach(category => {
        const categoryName = category.getAttribute('data-category').toLowerCase();
        category.style.display = categoryName.includes(searchValue) ? '' : 'none';
    });
}

function filterProducts() {
    const searchValue = document.getElementById('product-search').value.toLowerCase();
    const products = document.querySelectorAll('.product-item');

    products.forEach(product => {
        const productName = product.getAttribute('data-name').toLowerCase();
        product.style.display = productName.includes(searchValue) ? '' : 'none';
    });
}

// Gestion des catégories pliables et système de validation
let categoryStates = {};
let categoryModifications = {};

// Fonction de débogage pour vérifier les styles CSS
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

// Fonction pour basculer l'affichage d'une catégorie
function toggleCategory(categoryName) {
    console.log('Toggling category:', categoryName); // Debug
    const categorySection = document.querySelector(`.category-section[data-category="${categoryName}"]`);
    
    if (!categorySection) {
        console.error('Category section not found:', categoryName);
        return;
    }
    
    const isCollapsed = categorySection.classList.contains('collapsed');
    console.log('Is collapsed:', isCollapsed); // Debug
    
    if (isCollapsed) {
        // Déplier la catégorie
        categorySection.classList.remove('collapsed');
        categoryStates[categoryName] = 'expanded';
        console.log('Category expanded:', categoryName);
    } else {
        // Plier la catégorie
        categorySection.classList.add('collapsed');
        categoryStates[categoryName] = 'collapsed';
        console.log('Category collapsed:', categoryName);
        
        // Vérifier s'il y a eu des modifications dans cette catégorie
        if (categoryModifications[categoryName] && categoryModifications[categoryName].length > 0) {
            showCheckMark(categoryName);
        }
    }
    
    // Debug des styles après changement
    setTimeout(() => debugCategoryStyles(categoryName), 100);
}

// Version alternative avec styles inline si le CSS ne fonctionne pas
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
        // Déplier la catégorie
        categorySection.classList.remove('collapsed');
        categoryProducts.style.maxHeight = '2000px';
        categoryProducts.style.opacity = '1';
        categoryProducts.style.marginTop = '10px';
        categoryProducts.style.paddingTop = '';
        toggleArrow.style.transform = 'rotate(0deg)';
        categoryStates[categoryName] = 'expanded';
        console.log('Category expanded with inline styles:', categoryName);
    } else {
        // Plier la catégorie
        categorySection.classList.add('collapsed');
        categoryProducts.style.maxHeight = '0';
        categoryProducts.style.opacity = '0';
        categoryProducts.style.marginTop = '0';
        categoryProducts.style.paddingTop = '0';
        toggleArrow.style.transform = 'rotate(-90deg)';
        categoryStates[categoryName] = 'collapsed';
        console.log('Category collapsed with inline styles:', categoryName);
        
        // Vérifier s'il y a eu des modifications dans cette catégorie
        if (categoryModifications[categoryName] && categoryModifications[categoryName].length > 0) {
            showCheckMark(categoryName);
        }
    }
}

// Fonction pour afficher le check mark pendant 1 heure
function showCheckMark(categoryName) {
    const checkMark = document.querySelector(`.category-section[data-category="${categoryName}"] .check-mark`);
    if (checkMark) {
        checkMark.style.display = 'flex';
        
        // Sauvegarder l'heure d'affichage
        const showTime = Date.now();
        localStorage.setItem(`checkMark_${categoryName}`, showTime.toString());
        
        // Masquer après 1 heure (3600000 millisecondes)
        setTimeout(() => {
            checkMark.style.display = 'none';
            localStorage.removeItem(`checkMark_${categoryName}`);
            // Réinitialiser les modifications pour cette catégorie
            categoryModifications[categoryName] = [];
        }, 3600000);
    }
}

// Fonction pour vérifier les check marks au chargement de la page
function checkStoredCheckMarks() {
    const categories = document.querySelectorAll('.category-section');
    
    categories.forEach(section => {
        const categoryName = section.getAttribute('data-category');
        const storedTime = localStorage.getItem(`checkMark_${categoryName}`);
        
        if (storedTime) {
            const showTime = parseInt(storedTime);
            const currentTime = Date.now();
            const elapsedTime = currentTime - showTime;
            
            // Si moins d'1 heure s'est écoulée, afficher le check mark
            if (elapsedTime < 3600000) {
                const checkMark = section.querySelector('.check-mark');
                if (checkMark) {
                    checkMark.style.display = 'flex';
                    
                    // Programmer la disparition pour le temps restant
                    const remainingTime = 3600000 - elapsedTime;
                    setTimeout(() => {
                        checkMark.style.display = 'none';
                        localStorage.removeItem(`checkMark_${categoryName}`);
                        categoryModifications[categoryName] = [];
                    }, remainingTime);
                }
            } else {
                // Plus d'1 heure s'est écoulée, supprimer de localStorage
                localStorage.removeItem(`checkMark_${categoryName}`);
            }
        }
    });
}

// Fonction pour enregistrer les modifications de produits
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
}
