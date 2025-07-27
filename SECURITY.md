# Sécurité - Système de Gestion Boulangerie

## ⚠️ IMPORTANT - Informations Sensibles

Ce repository a été nettoyé des informations sensibles suivantes :
- Clés de base de données Railway
- Mots de passe
- URLs de connexion avec identifiants

## 🔒 Configuration Sécurisée

### Variables d'Environnement
1. Copiez `.env.railway.template` vers `.env.railway`
2. Remplissez avec vos vraies valeurs de connexion
3. **JAMAIS** commiter les fichiers `.env*` réels

### Fichiers Protégés
- `.env.railway` - Configuration Railway
- `.env.local` - Configuration locale
- `data/` - Base de données locale
- `railway-connection.js` - Scripts de connexion
- `import-railway.js` - Scripts d'import
- `clean-categories.js` - Scripts de nettoyage

### Checklist Sécurité
- [ ] Variables sensibles dans .env (non commitées)
- [ ] .gitignore à jour
- [ ] Mots de passe forts
- [ ] Accès Railway sécurisé
- [ ] Scripts temporaires supprimés

## 🚨 En cas de Compromission

Si des clés ont été exposées :
1. Changer immédiatement les mots de passe Railway
2. Regénérer les URLs de connexion
3. Mettre à jour les variables d'environnement
4. Nettoyer l'historique Git si nécessaire

## 📝 Bonnes Pratiques

1. **Jamais** hardcoder d'identifiants dans le code
2. Utiliser des variables d'environnement
3. Rotation régulière des mots de passe
4. Monitoring des accès
5. Logs sécurisés (sans mots de passe)

## 🔧 Configuration Développement

```bash
# Copier le template
cp .env.railway.template .env.railway

# Éditer avec vos valeurs
nano .env.railway

# Vérifier que .env.railway est dans .gitignore
git check-ignore .env.railway
```

## 📞 Contact Sécurité

En cas de problème de sécurité, contactez immédiatement l'administrateur système.