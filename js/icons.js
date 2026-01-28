/**
 * Templates d'icônes animées pour les modules iArmy
 * Utilisé par toutes les pages (home, soldats, subscribe, admin)
 */

// Mini icons pour les cartes (petites)
const MINI_ICON_TEMPLATES = {
  telegram_sheets: (color = '#22c55e') => `
    <div class="mini-sheet">
      <div class="mini-sheet-row"><div class="mini-sheet-cell fill fill-1"></div><div class="mini-sheet-cell fill fill-2"></div></div>
      <div class="mini-sheet-row"><div class="mini-sheet-cell fill fill-3"></div><div class="mini-sheet-cell fill fill-4"></div></div>
      <div class="mini-sheet-row"><div class="mini-sheet-cell fill fill-5"></div><div class="mini-sheet-cell fill fill-6"></div></div>
    </div>`,

  bottles_count: (color = '#06b6d4') => `
    <div class="mini-stock">
      <div class="mini-bottle mini-bottle-1">
        <div class="mini-bottle-cap"></div>
        <div class="mini-bottle-neck"></div>
        <div class="mini-bottle-body"><div class="mini-bottle-fill"></div></div>
      </div>
      <div class="mini-bottle mini-bottle-2">
        <div class="mini-bottle-cap"></div>
        <div class="mini-bottle-neck"></div>
        <div class="mini-bottle-body"><div class="mini-bottle-fill"></div></div>
      </div>
      <div class="mini-stock-count">12</div>
    </div>`,

  people_pdf: (color = '#f59e0b') => `
    <div class="mini-paie">
      <div class="mini-paie-people">
        <div class="mini-paie-person"><div class="mini-paie-head"></div><div class="mini-paie-body"></div></div>
        <div class="mini-paie-person"><div class="mini-paie-head"></div><div class="mini-paie-body"></div></div>
        <div class="mini-paie-person"><div class="mini-paie-head"></div><div class="mini-paie-body"></div></div>
      </div>
      <div class="mini-paie-euro">€</div>
    </div>`,

  calendar: (color = '#8b5cf6') => `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>`,

  reservation: (color = '#ec4899') => `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
      <path d="M9 11l3 3L22 4"/>
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
    </svg>`,

  star: (color = '#eab308') => `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>`,

  custom: (color = '#6b7280') => `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
    </svg>`
};

// Large icons pour la page soldats (grandes animations)
const LARGE_ICON_TEMPLATES = {
  telegram_sheets: {
    left: `<div class="logo-icon-xl telegram-icon">
      <svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg">
        <defs><linearGradient id="tg" x1="50%" y1="0%" x2="50%" y2="100%"><stop offset="0%" stop-color="#37AEE2"/><stop offset="100%" stop-color="#1E96C8"/></linearGradient></defs>
        <circle fill="url(#tg)" cx="120" cy="120" r="120"/>
        <path fill="#FFF" d="M98 175c-3.9 0-3.2-1.5-4.6-5.2L82 132.2l88-52.2"/>
        <path fill="#D2E5F1" d="M98 175c3 0 4.3-1.4 6-3l16-15.5-20-12"/>
        <path fill="#FFF" d="M100 144.5l48.4 35.7c5.5 3 9.5 1.5 10.9-5.1l19.7-93c2-8.1-3.1-11.7-8.4-9.3l-116 44.7c-7.9 3.2-7.8 7.6-1.4 9.6l29.7 9.3 68.9-43.4c3.2-2 6.2-.9 3.8 1.3"/>
      </svg>
    </div>`,
    right: `<div class="logo-icon-xl sheets-icon">
      <svg viewBox="0 0 48 48" width="52" height="52">
        <path fill="#43A047" d="M37,45H11c-1.657,0-3-1.343-3-3V6c0-1.657,1.343-3,3-3h19l10,10v29C40,43.657,38.657,45,37,45z"/>
        <path fill="#C8E6C9" d="M40 13L30 13 30 3z"/>
        <path fill="#2E7D32" d="M30 13L40 23 40 13z"/>
        <path fill="#E8F5E9" d="M31,23H17h-4v18h18V23H31z M17,25h4v4h-4V25z M17,31h4v4h-4V31z M31,35h-8v-4h8V35z M31,29h-8v-4h8V29z"/>
      </svg>
    </div>`
  },

  bottles_count: {
    left: `<div class="logo-icon-xl" style="background:linear-gradient(180deg, #22D3EE, #06B6D4); border-radius:12px; display:flex; align-items:center; justify-content:center; width:52px; height:52px;">
      <svg viewBox="0 0 24 24" width="28" height="28" fill="white">
        <path d="M5 22V7.5L7 6V4h4v2l2 1.5V22H5zm12-9.5V7l2-1.5V4h4v1.5L21 7v5.5a3.5 3.5 0 11-7 0h3z"/>
      </svg>
    </div>`,
    right: `<div class="logo-icon-xl stock-counter" style="background:linear-gradient(180deg, #22D3EE, #06B6D4); border-radius:50%; width:52px; height:52px; display:flex; align-items:center; justify-content:center;">
      <span style="font-size:20px; font-weight:800; color:white;">12</span>
    </div>`
  },

  people_pdf: {
    left: `<div class="logo-icon-xl" style="background:linear-gradient(180deg, #FBBF24, #F59E0B); border-radius:12px; display:flex; align-items:center; justify-content:center; width:52px; height:52px;">
      <svg viewBox="0 0 24 24" width="28" height="28" fill="white">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
      </svg>
    </div>`,
    right: `<div class="logo-icon-xl" style="background:linear-gradient(180deg, #FBBF24, #F59E0B); border-radius:12px; display:flex; align-items:center; justify-content:center; width:52px; height:52px;">
      <span style="font-size:24px; font-weight:800; color:white;">€</span>
    </div>`
  },

  calendar: {
    left: `<div class="logo-icon-xl" style="background:linear-gradient(180deg, #A78BFA, #8B5CF6); border-radius:12px; display:flex; align-items:center; justify-content:center; width:52px; height:52px;">
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="white" stroke-width="2">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    </div>`,
    right: `<div class="logo-icon-xl" style="background:linear-gradient(180deg, #A78BFA, #8B5CF6); border-radius:12px; display:flex; align-items:center; justify-content:center; width:52px; height:52px;">
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="white" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    </div>`
  },

  reservation: {
    left: `<div class="logo-icon-xl" style="background:linear-gradient(180deg, #F472B6, #EC4899); border-radius:12px; display:flex; align-items:center; justify-content:center; width:52px; height:52px;">
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="white" stroke-width="2">
        <path d="M9 11l3 3L22 4"/>
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
      </svg>
    </div>`,
    right: `<div class="logo-icon-xl" style="background:linear-gradient(180deg, #F472B6, #EC4899); border-radius:12px; display:flex; align-items:center; justify-content:center; width:52px; height:52px;">
      <svg viewBox="0 0 24 24" width="28" height="28" fill="white">
        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
      </svg>
    </div>`
  },

  star: {
    left: `<div class="logo-icon-xl" style="background:linear-gradient(180deg, #FDE047, #EAB308); border-radius:12px; display:flex; align-items:center; justify-content:center; width:52px; height:52px;">
      <svg viewBox="0 0 24 24" width="28" height="28" fill="white">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    </div>`,
    right: `<div class="logo-icon-xl" style="background:linear-gradient(180deg, #FDE047, #EAB308); border-radius:12px; display:flex; align-items:center; justify-content:center; width:52px; height:52px;">
      <svg viewBox="0 0 24 24" width="28" height="28" fill="white">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
    </div>`
  }
};

// Helper pour obtenir l'icône d'un module
function getModuleIcon(iconType, size = 'mini') {
  const templates = size === 'mini' ? MINI_ICON_TEMPLATES : LARGE_ICON_TEMPLATES;
  return templates[iconType] || templates.custom;
}

// Helper pour assombrir une couleur
function darkenColor(hex, percent = 20) {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - percent);
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - percent);
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - percent);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

// Helper pour convertir hex en rgba
function hexToRgba(hex, alpha = 1) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Export pour modules ES6
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MINI_ICON_TEMPLATES, LARGE_ICON_TEMPLATES, getModuleIcon, darkenColor, hexToRgba };
}
