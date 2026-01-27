# iArmy App - Guide pour Claude

## IMPORTANT - Lire en premier !

**iArmy appelle ses modules des "SOLDATS"** (pas "modules").

### Source unique de verite : Table Supabase `modules`

Tous les soldats sont stockes dans la table `modules` de Supabase.
- **Admin pour gerer les soldats** : `/admin/modules/`
- **Toutes les pages lisent depuis Supabase** = ajouter un soldat dans l'admin le fait apparaitre partout automatiquement

---

## Ou apparaissent les soldats ?

Quand tu ajoutes un soldat dans Supabase, il apparait automatiquement :

| Page | Fichier | Description |
|------|---------|-------------|
| **Catalogue soldats** | `/soldats/index.html` | Liste de tous les soldats disponibles |
| **Page compte** | `/index.html` | Dashboard avec les soldats installes de l'utilisateur |
| **Site marketing** | `iarmy-site/index.html` | Landing page avec presentation des soldats |

### Pages specifiques par soldat

Chaque soldat a ses propres pages :
- `/{soldat}/setup/` - Page de configuration initiale (ex: `/compta/setup/`)
- `/{soldat}/index.html` - Dashboard du soldat (ex: `/compta/index.html`)
- `/?soldat={soldat}` - Parametres du soldat dans la page compte

---

## Structure Supabase - Table `modules`

```sql
CREATE TABLE modules (
  id UUID PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,      -- ex: compta, stock, paie
  name TEXT NOT NULL,              -- ex: Compta, Stock, Paie
  description TEXT,                -- HTML avec mots en couleur
  color TEXT NOT NULL,             -- #22c55e
  status TEXT NOT NULL,            -- available, coming_soon, beta
  price TEXT,                      -- 9.99
  setup_url TEXT,                  -- /compta/setup/
  settings_url TEXT,               -- /?soldat=compta
  icon_type TEXT,                  -- telegram_sheets, bottles_count, people_pdf, calendar, reservation, star, custom
  icon_left TEXT,                  -- SVG (si custom)
  icon_right TEXT,                 -- SVG (si custom)
  categories TEXT[],               -- ['restaurant', 'bar']
  tags TEXT[],                     -- ['Restaurant', 'Commerce']
  sort_order INTEGER
);
```

### Types d'icones disponibles

| icon_type | Description | Utilise pour |
|-----------|-------------|--------------|
| `telegram_sheets` | Telegram → Sheets | Compta |
| `bottles_count` | Bouteilles → Compteur | Stock |
| `people_pdf` | Personnes → PDF | Paie |
| `calendar` | Calendrier + horloge | Planning |
| `reservation` | Check + liste | Reservations |
| `star` | Etoile + coeur | Fidelite |
| `custom` | SVG personnalise | Autres |

---

## Pour creer un nouveau soldat

### 1. Ajouter dans Supabase (via admin `/admin/modules/`)

Aller sur https://app.iarmy.fr/admin/modules/ et cliquer "Nouveau Module".

Ou via SQL :
```sql
INSERT INTO modules (slug, name, description, color, status, price, setup_url, icon_type, categories, tags)
VALUES (
  'nouveau_soldat',
  'Nom Affiche',
  'Description avec <strong style="color:#xxx;">mots</strong> en couleur',
  '#couleur_hex',
  'available',
  '9.99',
  '/nouveau_soldat/setup/',
  'telegram_sheets',
  ARRAY['restaurant', 'bar'],
  ARRAY['Tag1', 'Tag2']
);
```

### 2. Creer les pages du soldat

```
/iarmy-app/
└── nouveau_soldat/
    ├── index.html      # Dashboard du soldat
    └── setup/
        └── index.html  # Page de configuration
```

### 3. Ajouter la logique dans le bot (si besoin)

Dans `/iarmy-bot/bot.js` :
- Ajouter le handler dans le switch des modules
- Creer les fonctions specifiques au soldat

### 4. Creer le Stripe Price (si payant)

1. Aller sur https://dashboard.stripe.com/products
2. Creer un produit avec le nom du soldat
3. Ajouter un prix recurrent mensuel
4. Copier l'ID du prix (price_xxx)
5. L'ajouter dans l'edge function stripe-checkout

---

## Structure du projet

```
/iarmy-app/
├── index.html              # Page compte - dashboard principal
├── soldats/
│   └── index.html          # Catalogue de tous les soldats (lit depuis Supabase)
├── admin/
│   └── modules/
│       └── index.html      # Admin pour gerer les soldats
├── compta/
│   ├── index.html          # Dashboard Compta
│   └── setup/              # Setup Compta
├── stock/
│   ├── index.html          # Dashboard Stock
│   └── setup/              # Setup Stock
├── paie/
│   └── index.html          # Dashboard Paie
├── js/
│   ├── soldats-config.js   # DEPRECATED - utiliser table Supabase modules
│   └── compta.js           # JS specifique compta
├── css/
│   ├── header.css          # Header + logo anime
│   └── compta.css          # Styles compta
└── img/
```

---

## Supabase

- **URL**: `https://byqfnpdcnifauhwgetcq.supabase.co`
- **Dashboard**: https://supabase.com/dashboard/project/byqfnpdcnifauhwgetcq

### Tables principales

| Table | Description |
|-------|-------------|
| `modules` | **CONFIG DES SOLDATS** - source unique de verite |
| `profiles` | Profils utilisateurs |
| `module_configs` | Config user par soldat (sheet_id, etc.) |
| `subscriptions` | Abonnements Stripe |
| `telegram_links` | Liens comptes Telegram |
| `stock_products` | Produits pour Stock |
| `employees` | Employes pour Paie |

---

## Design System

### Couleurs des soldats

| Soldat | Couleur | Hex |
|--------|---------|-----|
| Compta | Vert | `#22c55e` |
| Stock | Cyan | `#06b6d4` |
| Paie | Amber | `#f59e0b` |
| Planning | Violet | `#8b5cf6` |
| Reservations | Rose | `#ec4899` |
| Fidelite | Jaune | `#eab308` |

### Couleurs generales

- Orange iArmy: `#FF6B35`
- Fond sombre: `#0f0f0f` ou `#030303`

### Composants

- Cards: `background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06);`
- Border radius: 16-24px
- Animations: Orbs flous, dot grid, pulse waves

---

## Header uniforme

Le header est defini dans `/css/header.css` et doit etre inclus sur toutes les pages.

Structure HTML :
```html
<nav>
  <div class="nav-inner">
    <a id="logo-link" href="/" style="text-decoration: none; color: white; display: flex; align-items: center; gap: 10px;">
      <div class="logo-i">
        <div class="logo-i-new">
          <div class="logo-i-helmet"></div>
          <div class="logo-i-head"></div>
          <div class="logo-i-stem"></div>
        </div>
      </div>
      <span style="font-weight: 600;">iArmy</span>
    </a>
    <div class="nav-right">
      <!-- Boutons navigation -->
    </div>
  </div>
</nav>
```

---

## Telegram Mini-App

L'app fonctionne en mode Telegram :
- Detection: `window.Telegram?.WebApp`
- Parametres URL: `?tg=1&tguid={telegram_user_id}`
- Theme: `tg.setBackgroundColor('#0f0f0f')`
- Bouton retour: `tg.BackButton.show()`

---

## Deploiement

- **Frontend (iarmy-app)**: GitHub Pages - push sur main = deploy auto
- **Bot (iarmy-bot)**: Render - push sur main = deploy auto
- **Edge Functions**: `supabase functions deploy <function-name>`

---

## Checklist nouveau soldat

- [ ] Ajouter dans table `modules` (via admin ou SQL)
- [ ] Creer dossier `/{soldat}/` avec setup et dashboard
- [ ] Ajouter logique dans bot.js (si interaction Telegram)
- [ ] Creer Stripe Price (si payant)
- [ ] Tester sur `/soldats/` qu'il apparait
- [ ] Tester le flow setup complet
