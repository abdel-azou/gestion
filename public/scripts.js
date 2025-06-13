let selectedProductId = null;

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.product-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.product-item').forEach(p => p.classList.remove('selected'));
            item.classList.add('selected');
            selectedProductId = item.getAttribute('data-id');
        });
    });
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
