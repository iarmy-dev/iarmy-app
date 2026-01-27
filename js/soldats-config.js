// Configuration centralisee de tous les soldats (modules) iArmy
// Ajouter un soldat ici = il apparait automatiquement dans le repertoire

// Categories disponibles
const SOLDAT_CATEGORIES = [
  { id: 'all', name: 'Tous', icon: '⚡' },
  { id: 'restaurant', name: 'Restaurant', icon: '🍽️' },
  { id: 'bar', name: 'Bar', icon: '🍸' }
];

const SOLDATS_CONFIG = [
  {
    id: 'compta',
    name: 'Compta',
    description: 'Enregistre ta caisse via Telegram, synchronise avec Google Sheets',
    icon: '📊',
    color: '#22c55e', // green
    colorLight: 'rgba(34,197,94,0.15)',
    price: '9.99',
    priceUnit: '€/mois',
    categories: ['restaurant', 'bar'], // disponible pour les deux
    features: [
      'Saisie vocale ou texte via Telegram',
      'Synchronisation Google Sheets automatique',
      'Export PDF mensuel',
      'Notifications et rappels'
    ],
    setupUrl: '/compta/setup/',
    settingsUrl: '/?soldat=compta',
    status: 'available', // available, coming_soon, beta
    configCheck: 'compta' // module_name in module_configs
  },
  {
    id: 'stock',
    name: 'Stock',
    description: 'Gere ton inventaire et recois des alertes de reapprovisionnement',
    icon: '📦',
    color: '#06b6d4', // cyan
    colorLight: 'rgba(6,182,212,0.15)',
    price: '9.99',
    priceUnit: '€/mois',
    categories: ['restaurant', 'bar'],
    features: [
      'Inventaire en temps reel',
      'Alertes stock bas',
      'Scan code-barres',
      'Historique des mouvements'
    ],
    setupUrl: '/stock/setup/',
    settingsUrl: '/?soldat=stock',
    status: 'available',
    configCheck: 'stock'
  },
  {
    id: 'paie',
    name: 'Paie',
    description: 'Calcule les salaires et genere les fiches de paie automatiquement',
    icon: '💰',
    color: '#f59e0b', // amber
    colorLight: 'rgba(245,158,11,0.15)',
    price: '14.99',
    priceUnit: '€/mois',
    categories: ['restaurant', 'bar'],
    features: [
      'Calcul automatique des salaires',
      'Generation fiches de paie PDF',
      'Gestion des conges et absences',
      'Declaration URSSAF simplifiee'
    ],
    setupUrl: '/setup/?module=paie',
    settingsUrl: '/?soldat=paie',
    status: 'available',
    configCheck: 'paie'
  },
  {
    id: 'planning',
    name: 'Planning',
    description: 'Planifie les horaires de ton equipe et gere les rotations',
    icon: '📅',
    color: '#8b5cf6', // violet
    colorLight: 'rgba(139,92,246,0.15)',
    price: '9.99',
    priceUnit: '€/mois',
    categories: ['restaurant', 'bar'],
    features: [
      'Planning hebdomadaire drag & drop',
      'Notifications aux employes',
      'Gestion des echanges de shifts',
      'Vue calendrier mensuelle'
    ],
    setupUrl: '/planning/setup/',
    settingsUrl: '/?soldat=planning',
    status: 'coming_soon',
    configCheck: 'planning'
  },
  {
    id: 'reservations',
    name: 'Reservations',
    description: 'Gere les reservations de ton restaurant en ligne',
    icon: '🍽️',
    color: '#ec4899', // pink
    colorLight: 'rgba(236,72,153,0.15)',
    price: '19.99',
    priceUnit: '€/mois',
    categories: ['restaurant'], // uniquement restaurant
    features: [
      'Widget de reservation pour ton site',
      'Confirmation automatique par SMS',
      'Gestion des tables et capacite',
      'Rappels clients automatiques'
    ],
    setupUrl: '/reservations/setup/',
    settingsUrl: '/?soldat=reservations',
    status: 'coming_soon',
    configCheck: 'reservations'
  },
  {
    id: 'fidelite',
    name: 'Fidelite',
    description: 'Programme de fidelite digital pour tes clients',
    icon: '⭐',
    color: '#eab308', // yellow
    colorLight: 'rgba(234,179,8,0.15)',
    price: '14.99',
    priceUnit: '€/mois',
    categories: ['restaurant', 'bar'],
    features: [
      'Carte de fidelite digitale',
      'Points et recompenses',
      'Campagnes SMS/Email',
      'Statistiques clients'
    ],
    setupUrl: '/fidelite/setup/',
    settingsUrl: '/?soldat=fidelite',
    status: 'coming_soon',
    configCheck: 'fidelite'
  }
];

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SOLDATS_CONFIG;
}
