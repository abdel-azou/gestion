# Fonctionnalités d'Inventaire - Guide d'Utilisation

## Vue d'ensemble

Le système d'inventaire permet de suivre et gérer les modifications de stock de manière organisée, puis de générer automatiquement des listes de commandes pour les produits sous leur stock minimum.

## Fonctionnalités Principales

### 1. Création d'Inventaire

**Depuis la page Liste des Produits :**
- Cliquez sur "Nouvel Inventaire" pour démarrer un inventaire
- Donnez un nom à votre inventaire (ex: "Inventaire Janvier 2025")
- Ajoutez des notes optionnelles
- L'inventaire capture automatiquement l'état actuel de tous les produits

**Depuis la page Gestion des Inventaires :**
- Accédez à `/inventory` 
- Cliquez sur "Nouveau Inventaire"
- Même processus que ci-dessus

### 2. Mode Inventaire

Une fois un inventaire créé depuis la liste des produits :
- Une barre de notification apparaît en haut de l'écran
- Vous pouvez modifier les stocks normalement (+/-1, +/-2, +/-5, ou quantité personnalisée)
- Les produits modifiés sont marqués visuellement avec un badge jaune
- Toutes les modifications sont suivies automatiquement

### 3. Finalisation d'Inventaire

**Options de finalisation :**
- **Finaliser** : Met à jour le stock réel de tous les produits selon les modifications
- **Annuler** : Abandon de l'inventaire sans sauvegarder les modifications

**Après finalisation :**
- Le système propose automatiquement de créer une liste de commandes
- Cette liste contient tous les produits qui sont maintenant sous leur stock minimum

### 4. Gestion des Inventaires

**Page de gestion (`/inventory`) :**
- Vue d'ensemble de tous les inventaires
- Statistiques : total, en cours, finalisés
- Actions disponibles par inventaire :
  - **Voir** : Détails complets avec tous les produits et modifications
  - **Finaliser** : Pour les inventaires en cours
  - **Liste de Commandes** : Génère une liste pour les produits sous stock minimum
  - **Supprimer** : Suppression complète de l'inventaire

### 5. Alertes et Stock Minimum

**Conservation des alertes :**
- Les alertes de stock minimum sont conservées et affichées
- Les produits sous le stock minimum sont marqués visuellement
- Les listes de commandes incluent automatiquement ces produits

**Calcul automatique :**
- Quantité nécessaire = Stock minimum - Stock actuel
- Affichage des différences positives/négatives
- Statut visuel pour chaque produit

## Structure des Données

### Tables créées :

1. **inventories**
   - id, name, notes, status, created_date, finalized_date

2. **inventory_items**
   - id, inventory_id, product_id, stock_before, stock_after, difference, notes

### Statuts d'inventaire :
- **draft** : En cours de modification
- **finalized** : Terminé et appliqué au stock

## API Endpoints

- `GET /inventory` - Page de gestion des inventaires
- `POST /api/inventory/create` - Créer un nouvel inventaire
- `GET /api/inventory/:id` - Détails d'un inventaire
- `POST /api/inventory/update-stock` - Modifier le stock d'un produit dans l'inventaire
- `POST /api/inventory/:id/finalize` - Finaliser un inventaire
- `POST /api/inventory/:id/create-order-list` - Créer une liste de commandes
- `DELETE /api/inventory/:id` - Supprimer un inventaire

## Workflow Recommandé

1. **Préparation**
   - Aller sur la page "Liste des Produits"
   - Cliquer sur "Nouvel Inventaire"
   - Nommer l'inventaire (ex: date du jour)

2. **Saisie**
   - Vérifier physiquement chaque produit
   - Modifier les stocks selon la réalité
   - Les produits modifiés sont marqués automatiquement

3. **Finalisation**
   - Cliquer sur "Finaliser" dans la barre de notification
   - Confirmer la finalisation
   - Accepter de créer une liste de commandes si proposé

4. **Commandes**
   - Réviser la liste de commandes générée
   - Ajuster les quantités si nécessaire
   - Finaliser la commande

## Avantages

- **Traçabilité** : Chaque modification est enregistrée
- **Efficacité** : Génération automatique des commandes
- **Sécurité** : Confirmation avant finalisation
- **Flexibilité** : Possibilité d'annuler ou de reprendre plus tard
- **Alertes** : Conservation des alertes de stock minimum

## Notes Techniques

- Les inventaires sont sauvegardés en base de données SQLite
- Les modifications sont suivies en temps réel côté client
- La finalisation est une transaction atomique
- Les listes de commandes sont liées aux inventaires pour traçabilité
