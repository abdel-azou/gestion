# MIGRATION POSTGRESQL SIMPLE

## Si vous préférez une solution 100% fiable :

1. **Ajouter PostgreSQL sur Railway :**
   - Dashboard → Add Database → PostgreSQL
   
2. **Installer pg au lieu de better-sqlite3 :**
   ```bash
   npm uninstall better-sqlite3
   npm install pg
   ```

3. **Adapter db_config.js pour PostgreSQL :**
   ```javascript
   const { Pool } = require('pg');
   const pool = new Pool({
     connectionString: process.env.DATABASE_URL
   });
   ```

## Avantages PostgreSQL :
- ✅ Persistance garantie à 100%
- ✅ Aucune configuration de volume
- ✅ Plus performant à long terme
- ✅ Support natif Railway

Le voulez-vous ?
