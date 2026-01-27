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
    description: 'Envoie ta caisse sur <strong style="color:#0088cc;">Telegram</strong><br>Elle arrive dans <strong style="color:#22c55e;">Sheets</strong>',
    color: '#22c55e',
    colorLight: 'rgba(34,197,94,0.15)',
    price: '9.99',
    priceUnit: '€/mois',
    categories: ['restaurant', 'bar'],
    tags: ['Restaurant', 'Commerce'],
    setupUrl: '/compta/setup/',
    settingsUrl: '/?soldat=compta',
    status: 'available',
    configCheck: 'compta',
    // Icone gauche: Telegram
    iconLeft: `<div class="logo-icon-xl"><svg width="44" height="44" viewBox="0 0 240 240"><defs><linearGradient id="tg-grad" x1="50%" x2="50%" y1="0%" y2="100%"><stop offset="0%" stop-color="#2AABEE"/><stop offset="100%" stop-color="#229ED9"/></linearGradient></defs><circle cx="120" cy="120" r="120" fill="url(#tg-grad)"/><path fill="#fff" d="M81.229 128.772l14.237 39.406s1.78 3.687 3.686 3.687 30.255-29.492 30.255-29.492l31.525-60.89L81.737 118.6z"/><path fill="#d5e6f3" d="M100.106 138.878l-2.733 29.046s-1.144 8.9 7.754 0 17.415-15.763 17.415-15.763"/><path fill="#b5cfe4" d="M81.486 130.178l-17.8-5.467s-2.006-.808-1.366-2.671c.143-.42.522-.72 1.773-1.5 5.912-3.686 108.297-41.223 108.297-41.223s1.928-.6 3.277-.138a1.7 1.7 0 011.377 1.152c.118.58.138 1.368.138 2.14 0 .663-.06 1.41-.06 2.292-.469 8.312-14.237 90.178-14.237 90.178s-.803 3.262-3.686 3.372c-1.99.067-5.104-1.29-6.897-2.352-1.467-.874-27.523-17.598-37.06-25.67-.832-.704-1.68-2.026-.06-3.63 3.673-3.64 8.047-8.047 17.05-16.5 2.006-1.89 4.032-6.297-4.365-1.072l-23.27 15.555s-2.667 1.654-7.617.18c-1.69-.505-3.57-1.06-6.347-1.965-2.37-.77-4.902-1.654-4.16-3.464.488-1.222 1.41-2.24 4.838-3.532z"/></svg></div>`,
    // Icone droite: Sheets
    iconRight: `<div class="logo-icon-xl"><svg width="44" height="44" viewBox="0 0 240 240"><defs><linearGradient id="sheet-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#22c55e"/><stop offset="100%" stop-color="#16a34a"/></linearGradient></defs><circle cx="120" cy="120" r="120" fill="url(#sheet-grad)"/><rect x="55" y="55" width="130" height="130" rx="12" fill="rgba(255,255,255,0.15)"/><line x1="55" y1="95" x2="185" y2="95" stroke="rgba(255,255,255,0.4)" stroke-width="3"/><line x1="55" y1="135" x2="185" y2="135" stroke="rgba(255,255,255,0.4)" stroke-width="3"/><line x1="100" y1="55" x2="100" y2="185" stroke="rgba(255,255,255,0.4)" stroke-width="3"/><line x1="145" y1="55" x2="145" y2="185" stroke="rgba(255,255,255,0.4)" stroke-width="3"/><rect class="cell-fill cell-fill-1" x="56" y="96" width="43" height="38" fill="#86efac" opacity="0"/><rect class="cell-fill cell-fill-2" x="101" y="96" width="43" height="38" fill="#86efac" opacity="0"/><rect class="cell-fill cell-fill-3" x="146" y="96" width="38" height="38" fill="#86efac" opacity="0"/></svg></div>`
  },
  {
    id: 'stock',
    name: 'Stock',
    description: 'Compte tes <strong style="color:#22d3ee;">bouteilles</strong><br>L\'inventaire se met a jour',
    color: '#06b6d4',
    colorLight: 'rgba(6,182,212,0.15)',
    price: '9.99',
    priceUnit: '€/mois',
    categories: ['restaurant', 'bar'],
    tags: ['Bar', 'Inventaire'],
    setupUrl: '/stock/setup/',
    settingsUrl: '/?soldat=stock',
    status: 'available',
    configCheck: 'stock',
    // Icone gauche: Bouteilles
    iconLeft: `<div class="logo-icon-xl" style="background:linear-gradient(180deg, #22D3EE, #06B6D4);">
      <div class="mini-stock-xl">
        <div class="mini-bottle-xl mini-bottle-xl-1">
          <div class="mini-bottle-cap-xl"></div>
          <div class="mini-bottle-neck-xl"></div>
          <div class="mini-bottle-body-xl"><div class="mini-bottle-fill-xl"></div></div>
        </div>
        <div class="mini-bottle-xl mini-bottle-xl-2">
          <div class="mini-bottle-cap-xl"></div>
          <div class="mini-bottle-neck-xl"></div>
          <div class="mini-bottle-body-xl"><div class="mini-bottle-fill-xl"></div></div>
        </div>
      </div>
    </div>`,
    // Icone droite: Compteur
    iconRight: `<div class="logo-icon-xl" style="background:linear-gradient(180deg, #22D3EE, #06B6D4);"><span class="stock-counter">12</span></div>`
  },
  {
    id: 'paie',
    name: 'Paie',
    description: 'Dis qui est <strong style="color:#fbbf24;">absent</strong> sur Telegram<br>Recois le recap PDF en fin de mois',
    color: '#f59e0b',
    colorLight: 'rgba(245,158,11,0.15)',
    price: '14.99',
    priceUnit: '€/mois',
    categories: ['restaurant', 'bar'],
    tags: ['Absences', 'Recap'],
    setupUrl: '/setup/?module=paie',
    settingsUrl: '/?soldat=paie',
    status: 'available',
    configCheck: 'paie',
    // Icone gauche: Personnes
    iconLeft: `<div class="logo-icon-xl" style="background:linear-gradient(180deg, #fbbf24, #f59e0b);">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="7" r="3" fill="white"/>
        <circle cx="17" cy="7" r="2.5" fill="rgba(255,255,255,0.7)"/>
        <path d="M3 19c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <path d="M15 13c2.2 0 4 1.8 4 4v2" stroke="rgba(255,255,255,0.7)" stroke-width="2" fill="none" stroke-linecap="round"/>
      </svg>
    </div>`,
    // Icone droite: PDF
    iconRight: `<div class="logo-icon-xl">
      <svg width="44" height="44" viewBox="0 0 240 240">
        <circle cx="120" cy="120" r="120" fill="#ef4444"/>
        <rect x="70" y="50" width="100" height="130" rx="8" fill="white"/>
        <text x="120" y="130" font-family="Arial, sans-serif" font-size="36" font-weight="800" fill="#ef4444" text-anchor="middle">PDF</text>
      </svg>
    </div>`
  },
  {
    id: 'planning',
    name: 'Planning',
    description: 'Planifie les <strong style="color:#8b5cf6;">horaires</strong> de ton equipe<br>Gere les rotations',
    color: '#8b5cf6',
    colorLight: 'rgba(139,92,246,0.15)',
    price: '9.99',
    priceUnit: '€/mois',
    categories: ['restaurant', 'bar'],
    tags: ['Horaires', 'Equipe'],
    setupUrl: '/planning/setup/',
    settingsUrl: '/?soldat=planning',
    status: 'coming_soon',
    configCheck: 'planning',
    iconLeft: `<div class="logo-icon-xl" style="background:linear-gradient(180deg, #a78bfa, #8b5cf6);">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    </div>`,
    iconRight: `<div class="logo-icon-xl" style="background:linear-gradient(180deg, #a78bfa, #8b5cf6);">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    </div>`
  },
  {
    id: 'reservations',
    name: 'Reservations',
    description: 'Gere les <strong style="color:#ec4899;">reservations</strong> en ligne<br>Confirmations automatiques',
    color: '#ec4899',
    colorLight: 'rgba(236,72,153,0.15)',
    price: '19.99',
    priceUnit: '€/mois',
    categories: ['restaurant'],
    tags: ['Restaurant', 'Tables'],
    setupUrl: '/reservations/setup/',
    settingsUrl: '/?soldat=reservations',
    status: 'coming_soon',
    configCheck: 'reservations',
    iconLeft: `<div class="logo-icon-xl" style="background:linear-gradient(180deg, #f472b6, #ec4899);">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
    </div>`,
    iconRight: `<div class="logo-icon-xl" style="background:linear-gradient(180deg, #f472b6, #ec4899);">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="9" y1="9" x2="15" y2="9"/>
        <line x1="9" y1="13" x2="15" y2="13"/>
        <line x1="9" y1="17" x2="12" y2="17"/>
      </svg>
    </div>`
  },
  {
    id: 'fidelite',
    name: 'Fidelite',
    description: 'Programme de <strong style="color:#eab308;">fidelite</strong> digital<br>Points et recompenses',
    color: '#eab308',
    colorLight: 'rgba(234,179,8,0.15)',
    price: '14.99',
    priceUnit: '€/mois',
    categories: ['restaurant', 'bar'],
    tags: ['Clients', 'Points'],
    setupUrl: '/fidelite/setup/',
    settingsUrl: '/?soldat=fidelite',
    status: 'coming_soon',
    configCheck: 'fidelite',
    iconLeft: `<div class="logo-icon-xl" style="background:linear-gradient(180deg, #fde047, #eab308);">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
      </svg>
    </div>`,
    iconRight: `<div class="logo-icon-xl" style="background:linear-gradient(180deg, #fde047, #eab308);">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    </div>`
  }
];

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SOLDATS_CONFIG;
}
