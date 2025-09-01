/**
 * Long Press Modal pour la modification rapide du stock
 */
class LongPressStockModal {
    constructor() {
        this.longPressTimer = null;
        this.longPressDuration = 500; // 500ms pour déclencher le long press
        this.isLongPressing = false;
        this.currentProduct = null;
        
        this.init();
    }
    
    init() {
        this.createModal();
        this.attachEventListeners();
    }
    
    createModal() {
        // Créer la structure HTML de la modal - Version sobre et efficace
        const modalHTML = `
            <div id="stockModal" class="stock-modal">
                <div class="stock-modal-content">
                    <div class="stock-modal-header">
                        <h3 id="modalProductName">Modifier le stock</h3>
                        <button class="stock-modal-close" onclick="stockModal.closeModal()">&times;</button>
                    </div>
                    <div class="stock-modal-body">
                        <div class="current-stock-display">
                            <span class="stock-label">Stock actuel :</span>
                            <span id="currentStockValue" class="current-stock-value">0</span>
                        </div>
                        
                        <div class="stock-input-section">
                            <label for="newStockInput">Nouveau stock :</label>
                            <div class="stock-input-container">
                                <button type="button" class="stock-btn minus-btn" onclick="stockModal.decrementStock()">-</button>
                                <input type="number" id="newStockInput" class="stock-input" min="0" value="0">
                                <button type="button" class="stock-btn plus-btn" onclick="stockModal.incrementStock()">+</button>
                            </div>
                        </div>
                        
                        <div class="quick-actions">
                            <div class="quick-action-buttons">
                                <button class="quick-btn add-btn" onclick="stockModal.quickAdjust(1)">+1</button>
                                <button class="quick-btn add-btn" onclick="stockModal.quickAdjust(5)">+5</button>
                                <button class="quick-btn add-btn" onclick="stockModal.quickAdjust(10)">+10</button>
                                <button class="quick-btn sub-btn" onclick="stockModal.quickAdjust(-1)">-1</button>
                                <button class="quick-btn sub-btn" onclick="stockModal.quickAdjust(-5)">-5</button>
                                <button class="quick-btn sub-btn" onclick="stockModal.quickAdjust(-10)">-10</button>
                            </div>
                        </div>
                    </div>
                    <div class="stock-modal-footer">
                        <button class="btn-cancel" onclick="stockModal.closeModal()">Annuler</button>
                        <button class="btn-confirm" onclick="stockModal.updateStock()">Confirmer</button>
                    </div>
                </div>
            </div>
        `;
        
        // Ajouter la modal au body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Ajouter les styles CSS
        this.addStyles();
    }
    
    addStyles() {
        const styles = `
            <style>
                .stock-modal {
                    display: none;
                    position: fixed;
                    z-index: 10000;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.5);
                    backdrop-filter: blur(3px);
                }
                
                .stock-modal-content {
                    background-color: #fff;
                    margin: 15% auto;
                    padding: 0;
                    border-radius: 8px;
                    width: 90%;
                    max-width: 400px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                    animation: modalSlideIn 0.2s ease-out;
                }
                
                @keyframes modalSlideIn {
                    from {
                        transform: translateY(-30px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                
                .stock-modal-header {
                    background: #007bff;
                    color: white;
                    padding: 15px 20px;
                    border-radius: 8px 8px 0 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .stock-modal-header h3 {
                    margin: 0;
                    font-size: 1.1em;
                    font-weight: 600;
                }
                
                .stock-modal-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 20px;
                    cursor: pointer;
                    padding: 0;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: background-color 0.2s;
                }
                
                .stock-modal-close:hover {
                    background-color: rgba(255, 255, 255, 0.2);
                }
                
                .stock-modal-body {
                    padding: 20px;
                }
                
                .current-stock-display {
                    background: #f8f9fa;
                    padding: 12px;
                    border-radius: 6px;
                    margin-bottom: 15px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .stock-label {
                    font-weight: 500;
                    color: #495057;
                }
                
                .current-stock-value {
                    font-size: 1.3em;
                    font-weight: bold;
                    color: #007bff;
                }
                
                .stock-input-section {
                    margin-bottom: 20px;
                }
                
                .stock-input-section label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 500;
                    color: #495057;
                }
                
                .stock-input-container {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .stock-btn {
                    background: #007bff;
                    color: white;
                    border: none;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    font-size: 18px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background-color 0.2s;
                }
                
                .stock-btn:hover {
                    background: #0056b3;
                }
                
                .stock-input {
                    flex: 1;
                    padding: 10px;
                    border: 1px solid #ced4da;
                    border-radius: 6px;
                    font-size: 16px;
                    text-align: center;
                    font-weight: 600;
                }
                
                .stock-input:focus {
                    outline: none;
                    border-color: #007bff;
                    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
                }
                
                .quick-action-buttons {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 8px;
                }
                
                .quick-btn {
                    padding: 10px;
                    border: none;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 13px;
                }
                
                .add-btn {
                    background: #28a745;
                    color: white;
                }
                
                .add-btn:hover {
                    background: #218838;
                }
                
                .sub-btn {
                    background: #dc3545;
                    color: white;
                }
                
                .sub-btn:hover {
                    background: #c82333;
                }
                
                .stock-modal-footer {
                    padding: 15px 20px;
                    background: #f8f9fa;
                    border-radius: 0 0 8px 8px;
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                }
                
                .btn-cancel, .btn-confirm {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    min-width: 80px;
                }
                
                .btn-cancel {
                    background: #6c757d;
                    color: white;
                }
                
                .btn-cancel:hover {
                    background: #5a6268;
                }
                
                .btn-confirm {
                    background: #007bff;
                    color: white;
                }
                
                .btn-confirm:hover {
                    background: #0056b3;
                }
                
                /* Responsive pour mobile */
                @media (max-width: 768px) {
                    .stock-modal-content {
                        margin: 5% auto;
                        width: 95%;
                    }
                    
                    .quick-action-buttons {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    
                    .stock-modal-footer {
                        flex-direction: column;
                    }
                    
                    .btn-cancel, .btn-confirm {
                        width: 100%;
                    }
                }
                
                /* Animation de vibration pour le long press */
                .product-item.long-pressing {
                    animation: vibrate 0.1s infinite;
                    background: rgba(0, 123, 255, 0.1) !important;
                }
                
                /* Style pour les produits sélectionnés */
                .product-item {
                    position: relative !important;
                }
                
                .product-item.selected {
                    background: linear-gradient(145deg, #e3f2fd, #bbdefb) !important;
                    border: 2px solid #2196f3 !important;
                    transform: scale(1.02);
                    box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3) !important;
                    transition: all 0.2s ease !important;
                }
                
                @keyframes vibrate {
                    0%, 100% { transform: translate(0); }
                    25% { transform: translate(-1px, -1px); }
                    50% { transform: translate(1px, -1px); }
                    75% { transform: translate(-1px, 1px); }
                }
                
                /* Indicateur de sélection plus visible */
                .product-item.selected::before {
                    content: '✓';
                    position: absolute;
                    top: 5px;
                    right: 5px;
                    background: #2196f3;
                    color: white;
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    font-weight: bold;
                    z-index: 10;
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }
    
    attachEventListeners() {
        // Attacher les événements aux produits existants et futurs
        document.addEventListener('DOMContentLoaded', () => {
            this.attachProductListeners();
        });
        
        // Si le DOM est déjà chargé
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.attachProductListeners();
            });
        } else {
            this.attachProductListeners();
        }
        
        // Fermer la modal en cliquant en dehors
        document.addEventListener('click', (e) => {
            const modal = document.getElementById('stockModal');
            if (e.target === modal) {
                this.closeModal();
            }
        });
        
        // Gérer la touche Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }
    
    attachProductListeners() {
        const productItems = document.querySelectorAll('.product-item');
        
        productItems.forEach(item => {
            // Retirer les anciens listeners s'ils existent
            item.removeEventListener('touchstart', this.handleTouchStart);
            item.removeEventListener('touchend', this.handleTouchEnd);
            item.removeEventListener('mousedown', this.handleMouseDown);
            item.removeEventListener('mouseup', this.handleMouseUp);
            item.removeEventListener('mouseleave', this.handleMouseLeave);
            
            // Ajouter les nouveaux listeners
            item.addEventListener('touchstart', (e) => this.handleTouchStart(e, item), { passive: false });
            item.addEventListener('touchend', (e) => this.handleTouchEnd(e, item), { passive: false });
            item.addEventListener('mousedown', (e) => this.handleMouseDown(e, item));
            item.addEventListener('mouseup', (e) => this.handleMouseUp(e, item));
            item.addEventListener('mouseleave', (e) => this.handleMouseLeave(e, item));
        });
    }
    
    handleTouchStart(e, item) {
        // Ne pas empêcher le comportement par défaut immédiatement
        this.startLongPress(item);
    }
    
    handleTouchEnd(e, item) {
        // Si ce n'était pas un long press, laisser le click normal se produire
        if (!this.isLongPressing) {
            // Laisser le click normal se produire pour la sélection
        }
        this.endLongPress();
    }
    
    handleMouseDown(e, item) {
        // Ne pas empêcher le comportement par défaut pour permettre la sélection
        this.startLongPress(item);
    }
    
    handleMouseUp(e, item) {
        if (!this.isLongPressing) {
            // Laisser le click normal se produire pour la sélection
        }
        this.endLongPress();
    }
    
    handleMouseLeave(e, item) {
        this.endLongPress();
    }
    
    startLongPress(item) {
        this.currentProduct = item;
        
        // Sélectionner automatiquement le produit pour le long press
        document.querySelectorAll('.product-item').forEach(p => p.classList.remove('selected'));
        item.classList.add('selected');
        
        // Mettre à jour la variable globale si elle existe
        if (typeof selectedProductId !== 'undefined') {
            window.selectedProductId = item.getAttribute('data-id');
        }
        
        item.classList.add('long-pressing');
        
        this.longPressTimer = setTimeout(() => {
            this.isLongPressing = true;
            this.openModal(item);
            item.classList.remove('long-pressing');
        }, this.longPressDuration);
    }
    
    endLongPress() {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        
        if (this.currentProduct) {
            this.currentProduct.classList.remove('long-pressing');
        }
        
        this.isLongPressing = false;
    }
    
    openModal(productItem) {
        const productId = productItem.getAttribute('data-id');
        const productName = productItem.getAttribute('data-name');
        const stockElement = productItem.querySelector('.product-stock');
        const currentStock = parseInt(stockElement.textContent) || 0;
        
        this.currentProduct = {
            id: productId,
            name: productName,
            element: productItem,
            stockElement: stockElement,
            currentStock: currentStock
        };
        
        // Remplir la modal avec les informations du produit
        document.getElementById('modalProductName').textContent = productName;
        document.getElementById('currentStockValue').textContent = currentStock;
        document.getElementById('newStockInput').value = currentStock;
        
        // Afficher la modal
        document.getElementById('stockModal').style.display = 'block';
        
        // Focus sur l'input
        setTimeout(() => {
            document.getElementById('newStockInput').select();
        }, 100);
    }
    
    closeModal() {
        document.getElementById('stockModal').style.display = 'none';
        this.currentProduct = null;
    }
    
    incrementStock() {
        const input = document.getElementById('newStockInput');
        input.value = parseInt(input.value) + 1;
    }
    
    decrementStock() {
        const input = document.getElementById('newStockInput');
        const newValue = parseInt(input.value) - 1;
        input.value = Math.max(0, newValue);
    }
    
    quickAdjust(amount) {
        const input = document.getElementById('newStockInput');
        const newValue = parseInt(input.value) + amount;
        input.value = Math.max(0, newValue);
    }
    
    async updateStock() {
        if (!this.currentProduct) return;
        
        const newStock = parseInt(document.getElementById('newStockInput').value);
        const amount = newStock - this.currentProduct.currentStock;
        
        if (amount === 0) {
            this.closeModal();
            return;
        }
        
        try {
            // Démarrer un inventaire automatiquement si pas déjà en cours
            if (typeof isInventoryMode === 'function' && !isInventoryMode()) {
                if (typeof autoCreateInventory === 'function') {
                    await autoCreateInventory();
                }
            }
            
            const response = await fetch('/products/update-stock', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    id: this.currentProduct.id, 
                    amount: amount 
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('Stock updated successfully:', data);
                
                // Mettre à jour l'affichage
                this.currentProduct.stockElement.textContent = newStock;
                
                // Ajouter la classe de mise à jour visuelle
                this.currentProduct.element.classList.add('product-updated');
                setTimeout(() => this.currentProduct.element.classList.remove('product-updated'), 2000);
                
                // IMPORTANT: Suivre la modification pour le système d'inventaire
                if (typeof trackProductModification === 'function') {
                    trackProductModification(this.currentProduct.element);
                }
                
                // Afficher notification avec compteur si les fonctions existent
                if (typeof inventoryModifications !== 'undefined') {
                    const modCount = Object.keys(inventoryModifications).length;
                    if (typeof showNotification === 'function') {
                        showNotification(`Stock modifié (${modCount} produits modifiés)`, 'success');
                    }
                }
                
                // Animation de succès
                this.currentProduct.element.style.background = 'linear-gradient(145deg, #d4edda, #c3e6cb)';
                setTimeout(() => {
                    this.currentProduct.element.style.background = '';
                }, 1500);
                
                this.closeModal();
            } else {
                const errorData = await response.json();
                console.error('Error updating stock:', errorData);
                alert('Erreur lors de la mise à jour: ' + errorData.error);
            }
        } catch (error) {
            console.error('Error updating stock:', error);
            alert('Erreur de connexion');
        }
}
}

// Initialiser le système de long press dès que le script est chargé
let stockModal;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        stockModal = new LongPressStockModal();
    });
} else {
    stockModal = new LongPressStockModal();
}
