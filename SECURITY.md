# 🔐 Configuration Sécurisée

## Variables d'environnement sensibles

Ce projet utilise des variables d'environnement pour stocker les informations sensibles comme les clés de base de données.

### Fichiers de configuration requis

1. **`.env.railway`** (non versionné) - Configuration pour Railway PostgreSQL
   - Copiez `.env.railway.template` vers `.env.railway`
   - Complétez avec vos vraies clés Railway

### Instructions de setup

```bash
# 1. Copier le template
cp .env.railway.template .env.railway

# 2. Éditer le fichier avec vos vraies clés
# Remplacez les valeurs dans .env.railway

# 3. Vérifier que le fichier est ignoré par git
git status  # .env.railway ne doit PAS apparaître
```

### ⚠️ IMPORTANT

- **JAMAIS** commiter les fichiers `.env.*` avec de vraies clés
- **TOUJOURS** utiliser les templates pour partager la structure
- Les clés de production sont dans Railway, pas dans le code

### Deployment

- **Local**: Utilise `.env.railway`
- **Production**: Utilise les variables d'environnement Railway automatiquement

### Récupération des clés

Si vous avez besoin des clés Railway:
1. Connectez-vous à railway.app
2. Sélectionnez le projet `gestion`
3. Onglet Variables > Database URL
4. Copiez l'URL externe dans votre `.env.railway` local
