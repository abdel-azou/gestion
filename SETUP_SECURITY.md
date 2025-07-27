# ⚠️ IMPORTANT - Configuration Sécurisée

## Configuration Initiale

1. **Copiez le template d'environnement :**
   ```bash
   cp .env.railway.template .env.railway
   ```

2. **Remplissez vos vraies valeurs dans `.env.railway` :**
   - DATABASE_URL avec vos identifiants Railway
   - SESSION_SECRET avec une clé secrète forte
   - ADMIN_PASSWORD avec un mot de passe fort

3. **Vérifiez que `.env.railway` n'est PAS committé :**
   ```bash
   git check-ignore .env.railway
   # Doit retourner: .env.railway
   ```

## ✅ Sécurité Validée

- [x] Clés sensibles supprimées de l'historique Git
- [x] `.gitignore` complet et sécurisé
- [x] Template `.env.railway.template` créé
- [x] Documentation sécurité `SECURITY.md`
- [x] Fichiers sensibles dans `.gitignore`

## 🔒 Ne JAMAIS Committer

- Fichiers `.env*` avec vraies valeurs
- Scripts avec clés hardcodées
- Dumps de base de données
- Fichiers de configuration avec mots de passe

## 📋 Checklist Déploiement

Avant chaque déploiement :
- [ ] Vérifier que `.env.railway` est ignoré
- [ ] Tester avec variables d'environnement
- [ ] Confirmer aucune clé hardcodée
- [ ] Mots de passe forts utilisés
