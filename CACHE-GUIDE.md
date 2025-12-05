# 🚫 Guide Anti-Cache - Idle Rift Slayers

Ce document explique comment éviter les problèmes de cache pour tous les utilisateurs.

## 🎯 Solutions Implémentées

### 1. **Meta Tags HTTP** (index.html)
```html
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
<meta http-equiv="Pragma" content="no-cache">
<meta http-equiv="Expires" content="0">
```
✅ Désactive le cache navigateur pour la page HTML

### 2. **Versioning des Ressources** (index.html)
```html
<link rel="stylesheet" href="style.css?v=2.0">
<script src="game.js?v=2.0"></script>
```
✅ Force le rechargement quand la version change

**À faire à chaque mise à jour :**
- Incrémenter `?v=2.0` → `?v=2.1` → `?v=3.0`, etc.

### 3. **Service Worker Intelligent** (sw.js)
- **Stratégie Network First** : Essaie toujours le réseau en premier
- **Nettoyage automatique** des anciens caches
- **Versioning** : `CACHE_VERSION = 'rift_slayers-v2'`

**À faire à chaque mise à jour :**
- Changer `v2` → `v3` dans `sw.js`

### 4. **Serveur Python Anti-Cache** (server.py)
Serveur personnalisé qui envoie automatiquement les headers anti-cache.

**Utilisation :**
```bash
python3 server.py 8000
```

### 5. **Configuration Apache** (.htaccess)
Pour les serveurs Apache en production.

## 📋 Checklist de Déploiement

Avant chaque mise à jour :

- [ ] Incrémenter la version dans `index.html` :
  ```html
  <link rel="stylesheet" href="style.css?v=X.X">
  <script src="game.js?v=X.X"></script>
  ```

- [ ] Incrémenter la version dans `sw.js` :
  ```javascript
  const CACHE_VERSION = 'rift_slayers-vX';
  ```

- [ ] Tester sur navigateur avec cache vidé

- [ ] Tester sur mobile

## 🚀 Utilisation en Développement

### Option 1 : Serveur Python Anti-Cache (Recommandé)
```bash
python3 server.py 8000
```

### Option 2 : Serveur Python Standard
```bash
python3 -m http.server 8000
```
⚠️ Nécessite de vider le cache manuellement

## 🌐 Utilisation en Production

### Avec Apache
Le fichier `.htaccess` est déjà configuré.

### Avec Nginx
Ajouter dans la configuration :
```nginx
location ~* \.(html|htm)$ {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    add_header Expires "0";
}

location ~* \.(css|js)$ {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

### Avec Node.js / Express
```javascript
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});
```

## 📱 Pour les Utilisateurs Finaux

Si un utilisateur voit toujours l'ancienne version :

### Sur Desktop
1. **Chrome/Edge** : `Ctrl + Shift + R` (Windows) ou `Cmd + Shift + R` (Mac)
2. **Firefox** : `Ctrl + Shift + R` (Windows) ou `Cmd + Shift + R` (Mac)
3. **Safari** : `Cmd + Option + R`

### Sur Mobile
1. **Chrome Android** : Menu → Paramètres → Confidentialité → Effacer les données de navigation → Cache
2. **Safari iOS** : Réglages → Safari → Effacer historique et données de sites

### PWA Installée
1. Désinstaller l'application
2. Vider le cache du navigateur
3. Réinstaller l'application

## 🔧 Dépannage

### Le cache persiste toujours ?

1. **Vérifier les versions** :
   - Ouvrir la console (F12)
   - Regarder les requêtes réseau
   - Vérifier que `?v=X.X` est présent

2. **Forcer la mise à jour du Service Worker** :
   - F12 → Application → Service Workers
   - Cliquer sur "Unregister"
   - Rafraîchir la page

3. **Mode développement** :
   - F12 → Network → Cocher "Disable cache"
   - Garder les DevTools ouverts

## 📊 Stratégie de Cache Recommandée

### Développement
- **HTML/CSS/JS** : NO CACHE
- **Images** : Cache court (1h)

### Production
- **HTML** : NO CACHE (toujours frais)
- **CSS/JS** : Versioning (cache long avec `?v=X.X`)
- **Images/Icônes** : Cache long (1 semaine)
- **Service Worker** : NO CACHE

## 🎯 Résumé

✅ **Meta tags** : Désactive le cache navigateur  
✅ **Versioning** : Force le rechargement des ressources  
✅ **Service Worker** : Gestion intelligente du cache  
✅ **Serveur custom** : Headers anti-cache automatiques  
✅ **.htaccess** : Configuration Apache  

**Plus de problèmes de cache !** 🎉
