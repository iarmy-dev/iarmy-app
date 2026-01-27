# iArmy App - Guide pour Claude

## Structure du projet

```
/iarmy-app/
├── index.html          # Page compte (/compte) - dashboard principal
├── auth/
│   └── callback.html   # Callback OAuth Google
├── compta/
│   ├── index.html      # Ancienne page compta (redirige vers setup si pas config)
│   └── setup/          # Setup compta
├── stock/
│   ├── index.html      # Page stock
│   └── setup/          # Setup stock
├── paie/
│   └── index.html      # Page paie
├── soldats/
│   └── index.html      # Catalogue/repertoire de tous les modules
├── js/
│   ├── soldats-config.js  # CONFIG CENTRALISEE DES MODULES
│   ├── compta.js          # JS du module compta (charge dynamiquement)
│   └── analytics.js
├── css/
│   ├── header.css      # Header + logo CSS
│   └── compta.css      # Styles module compta
└── img/
```

## Ajouter un nouveau Soldat (Module)

Pour ajouter un nouveau module a iArmy, modifier `/js/soldats-config.js` :

```javascript
{
  id: 'nouveau_module',           // ID unique
  name: 'Nom du Module',          // Nom affiche
  description: 'Description...',  // Description courte
  icon: '📊',                     // Emoji icone
  color: '#22c55e',               // Couleur principale (hex)
  colorLight: 'rgba(34,197,94,0.15)', // Couleur claire pour fond
  price: '9.99',                  // Prix sans le symbole
  priceUnit: '€/mois',            // Unite de prix
  features: [                     // Liste des fonctionnalites
    'Feature 1',
    'Feature 2',
    'Feature 3'
  ],
  setupUrl: '/nouveau_module/setup/',  // URL de configuration
  settingsUrl: '/?soldat=nouveau_module', // URL parametres (page unifiee)
  status: 'available',            // available | coming_soon | beta
  configCheck: 'nouveau_module'   // module_name dans module_configs (Supabase)
}
```

Le module apparaitra automatiquement :
- Dans `/soldats/` (catalogue)
- Avec le bon statut (installe/disponible/bientot)

## Page Compte Unifiee

La page `/compte` (index.html) utilise le parametre `?soldat=xxx` pour afficher les parametres d'un module :
- `/?soldat=compta` → Parametres Compta
- `/?soldat=stock` → Parametres Stock
- `/?soldat=paie` → Parametres Paie

Le JS du module est charge dynamiquement depuis `/js/{module}.js` et le CSS depuis `/css/{module}.css`.

## Cache SessionStorage

Pour eviter le loading entre les navigations de modules, on utilise `sessionStorage` :
- `compte_loaded` : boolean si la page a deja ete chargee
- `compte_cache` : JSON avec les donnees UI et variables (moduleConfig, counts)

## Telegram Mini-App

L'app fonctionne aussi en mode Telegram :
- Detecte via `window.Telegram?.WebApp`
- Parametre URL `?tg=1&tguid={telegram_user_id}`
- Force le theme sombre avec `tg.setBackgroundColor('#0f0f0f')`
- Bouton retour Telegram configure

## Supabase

- URL: `https://byqfnpdcnifauhwgetcq.supabase.co`
- Tables principales:
  - `profiles` - Profils utilisateurs
  - `module_configs` - Config des modules (sheet_id, etc.)
  - `subscriptions` - Abonnements
  - `telegram_links` - Liens comptes Telegram
  - `stock_products` - Produits stock
  - `employees` - Employes paie

## Design System

- Couleurs:
  - Orange principal: `#FF6B35`
  - Fond sombre: `#0f0f0f` ou `#030303`
  - Vert (compta): `#22c55e`
  - Cyan (stock): `#06b6d4`
  - Amber (paie): `#f59e0b`
  - Violet (planning): `#8b5cf6`

- Composants:
  - Cards avec `background: rgba(255,255,255,0.02)` et `border: 1px solid rgba(255,255,255,0.06)`
  - Border radius: 16-20px
  - Orbs animes en background (blur 100px)
  - Dot grid pattern

## Deploiement

- GitHub Pages depuis la branche `main`
- Domaine: `app.iarmy.fr`
- Push sur main = deploy automatique
