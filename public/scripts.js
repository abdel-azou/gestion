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
