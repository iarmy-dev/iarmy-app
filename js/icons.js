/**
 * icons.js - Source UNIQUE pour les icônes de modules iArmy
 *
 * Ce fichier est la SEULE source de vérité pour les icônes des modules.
 * Toutes les pages utilisent getModuleIcon() ou getModuleIconWithBg().
 *
 * Usage:
 *   const iconHtml = getModuleIcon('telegram_sheets', '#22c55e');
 *   const iconWithBg = getModuleIconWithBg('bottles_count', '#06b6d4', 44);
 */

// Types d'icônes disponibles (correspondant à icon_type dans la table modules)
const MODULE_ICON_TYPES = [
  { id: 'telegram_sheets', name: 'Tableau' },
  { id: 'bottles_count', name: 'Stock' },
  { id: 'people_pdf', name: 'Equipe' },
  { id: 'calendar', name: 'Calendrier' },
  { id: 'reservation', name: 'Reservation' },
  { id: 'star', name: 'Etoile' },
  { id: 'custom', name: 'Defaut' }
];

/**
 * Templates d'icônes - UN SEUL template par icon_type
 * Utilisé partout: cards, admin, facturation, etc.
 */
const MODULE_ICON_TEMPLATES = {
  // Compta - Tableau/Spreadsheet
  telegram_sheets: (color) => `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <line x1="3" y1="9" x2="21" y2="9"/>
      <line x1="9" y1="21" x2="9" y2="9"/>
    </svg>`,

  // Stock - Boîte/Cube
  bottles_count: (color) => `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>`,

  // Paie - Personnes/Equipe
  people_pdf: (color) => `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>`,

  // Planning - Calendrier
  calendar: (color) => `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>`,

  // Réservations - Check/Liste
  reservation: (color) => `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>`,

  // Fidélité - Etoile
  star: (color) => `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>`,

  // Défaut - Cercle avec point
  custom: (color) => `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>`
};

/**
 * Obtenir l'icône SVG pour un module
 * @param {string} iconType - Le type d'icône (telegram_sheets, bottles_count, etc.)
 * @param {string} color - La couleur hex (#22c55e, #06b6d4, etc.)
 * @param {number} size - Taille optionnelle (défaut: 24)
 * @returns {string} HTML de l'icône SVG
 */
function getModuleIcon(iconType, color = '#FF6B35', size = 24) {
  const template = MODULE_ICON_TEMPLATES[iconType] || MODULE_ICON_TEMPLATES.custom;
  let svg = template(color);

  // Ajuster la taille si différente de 24
  if (size !== 24) {
    svg = svg.replace(/width="24"/g, `width="${size}"`);
    svg = svg.replace(/height="24"/g, `height="${size}"`);
  }

  return svg;
}

/**
 * Obtenir l'icône avec un conteneur rond coloré (fond)
 * @param {string} iconType - Le type d'icône
 * @param {string} color - La couleur hex
 * @param {number} size - Taille du conteneur (défaut: 44)
 * @returns {string} HTML avec conteneur et icône
 */
function getModuleIconWithBg(iconType, color = '#FF6B35', size = 44) {
  const iconSize = Math.round(size * 0.55);
  const icon = getModuleIcon(iconType, color, iconSize);
  const bgColor = hexToRgba(color, 0.15);

  return `
    <div style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: ${bgColor};
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      ${icon}
    </div>
  `;
}

/**
 * Convertir hex en rgba
 */
function hexToRgba(hex, alpha = 1) {
  if (!hex || hex.length < 7) return `rgba(255,107,53,${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Helper pour assombrir une couleur
 */
function darkenColor(hex, percent = 20) {
  if (!hex || hex.length < 7) return hex;
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - percent);
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - percent);
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - percent);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

// Compatibilité avec l'ancien code (MINI_ICON_TEMPLATES)
// Redirige vers le nouveau système
const MINI_ICON_TEMPLATES = MODULE_ICON_TEMPLATES;

/**
 * Icônes ANIMÉES - HTML+CSS
 * Utilisées sur la homepage et dans l'admin preview
 */
const ANIMATED_ICON_TEMPLATES = {
  // Compta - Mini spreadsheet qui se remplit
  telegram_sheets: (color) => `
    <div class="mini-sheet">
      <div class="mini-sheet-row">
        <div class="mini-sheet-cell fill fill-1" style="--fill-color:${color}"></div>
        <div class="mini-sheet-cell fill fill-2" style="--fill-color:${color}"></div>
      </div>
      <div class="mini-sheet-row">
        <div class="mini-sheet-cell fill fill-3" style="--fill-color:${color}"></div>
        <div class="mini-sheet-cell fill fill-4" style="--fill-color:${color}"></div>
      </div>
      <div class="mini-sheet-row">
        <div class="mini-sheet-cell fill fill-5" style="--fill-color:${color}"></div>
        <div class="mini-sheet-cell fill fill-6" style="--fill-color:${color}"></div>
      </div>
    </div>`,

  // Stock - Bouteilles qui se remplissent
  bottles_count: (color) => `
    <div class="mini-stock">
      <div class="mini-bottle mini-bottle-1">
        <div class="mini-bottle-cap" style="background:${color}"></div>
        <div class="mini-bottle-neck" style="border-color:${color}"></div>
        <div class="mini-bottle-body" style="border-color:${color}">
          <div class="mini-bottle-fill" style="background:linear-gradient(180deg, ${lightenColor(color)}, ${color})"></div>
        </div>
      </div>
      <div class="mini-bottle mini-bottle-2">
        <div class="mini-bottle-cap" style="background:${color}"></div>
        <div class="mini-bottle-neck" style="border-color:${color}"></div>
        <div class="mini-bottle-body" style="border-color:${color}">
          <div class="mini-bottle-fill" style="background:linear-gradient(180deg, ${lightenColor(color)}, ${color})"></div>
        </div>
      </div>
      <div class="mini-stock-count" style="background:${color}">3</div>
    </div>`,

  // Equipe - Personnes qui deviennent €
  people_pdf: (color) => `
    <div class="mini-paie">
      <div class="mini-paie-people">
        <div class="mini-paie-person mini-paie-person-1">
          <div class="mini-paie-head"></div>
          <div class="mini-paie-body"></div>
        </div>
        <div class="mini-paie-person mini-paie-person-2">
          <div class="mini-paie-head"></div>
          <div class="mini-paie-body"></div>
        </div>
        <div class="mini-paie-person mini-paie-person-3">
          <div class="mini-paie-head"></div>
          <div class="mini-paie-body"></div>
        </div>
      </div>
      <div class="mini-paie-euro">€</div>
    </div>`,

  // Calendrier - Jours qui passent
  calendar: (color) => `
    <div class="mini-calendar">
      <div class="mini-calendar-header" style="background:${color}"></div>
      <div class="mini-calendar-days">
        <div class="mini-calendar-day"></div>
        <div class="mini-calendar-day active" style="background:${color}"></div>
        <div class="mini-calendar-day"></div>
        <div class="mini-calendar-day"></div>
      </div>
    </div>`,

  // Check animé
  reservation: (color) => `
    <div class="mini-check">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="${color}" stroke-width="2" class="mini-check-circle"/>
        <polyline points="8 12 11 15 16 9" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mini-check-mark"/>
      </svg>
    </div>`,

  // Etoile qui pulse
  star: (color) => `
    <div class="mini-star">
      <svg width="24" height="24" viewBox="0 0 24 24" class="mini-star-svg">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="${color}" opacity="0.3"/>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke="${color}" stroke-width="2" fill="none"/>
      </svg>
    </div>`,

  // Defaut - cercle pulse
  custom: (color) => `
    <div class="mini-pulse">
      <div class="mini-pulse-dot" style="background:${color}"></div>
      <div class="mini-pulse-ring" style="border-color:${color}"></div>
    </div>`
};

/**
 * CSS pour les icônes animées - à injecter une fois dans la page
 */
const ANIMATED_ICONS_CSS = `
  /* Mini Sheet (Compta) */
  .mini-sheet { width: 32px; height: 32px; background: rgba(0,0,0,0.2); border-radius: 4px; overflow: hidden; }
  .mini-sheet-row { display: flex; height: 8px; }
  .mini-sheet-cell { flex: 1; background: rgba(255,255,255,0.1); margin: 1px; border-radius: 1px; }
  .mini-sheet-cell.fill { animation: cellFill 2s ease-in-out infinite; }
  .mini-sheet-cell.fill-1 { animation-delay: 0s; }
  .mini-sheet-cell.fill-2 { animation-delay: 0.3s; }
  .mini-sheet-cell.fill-3 { animation-delay: 0.6s; }
  .mini-sheet-cell.fill-4 { animation-delay: 0.9s; }
  .mini-sheet-cell.fill-5 { animation-delay: 1.2s; }
  .mini-sheet-cell.fill-6 { animation-delay: 1.5s; }
  @keyframes cellFill { 0%, 40% { background: rgba(255,255,255,0.1); } 50%, 90% { background: var(--fill-color, #4ade80); } 100% { background: rgba(255,255,255,0.1); } }

  /* Mini Stock (Bouteilles) */
  .mini-stock { width: 36px; height: 28px; display: flex; align-items: flex-end; justify-content: center; gap: 3px; position: relative; }
  .mini-bottle { position: relative; width: 12px; height: 24px; }
  .mini-bottle-body { position: absolute; bottom: 0; width: 12px; height: 16px; background: rgba(255,255,255,0.1); border: 1.5px solid currentColor; border-radius: 2px 2px 3px 3px; overflow: hidden; }
  .mini-bottle-neck { position: absolute; bottom: 15px; left: 3px; width: 6px; height: 6px; background: rgba(255,255,255,0.1); border: 1.5px solid currentColor; border-bottom: none; border-radius: 2px 2px 0 0; }
  .mini-bottle-cap { position: absolute; bottom: 20px; left: 2px; width: 8px; height: 3px; border-radius: 1px; }
  .mini-bottle-fill { position: absolute; bottom: 0; left: 0; right: 0; border-radius: 0 0 2px 2px; }
  .mini-bottle-1 .mini-bottle-fill { animation: bottleEmpty 3s ease-in-out infinite; }
  .mini-bottle-2 .mini-bottle-fill { animation: bottleFill 3s ease-in-out infinite; }
  @keyframes bottleEmpty { 0%, 10% { height: 75%; } 45%, 55% { height: 15%; } 90%, 100% { height: 75%; } }
  @keyframes bottleFill { 0%, 10% { height: 15%; } 45%, 55% { height: 75%; } 90%, 100% { height: 15%; } }
  .mini-stock-count { position: absolute; top: 0; right: -2px; width: 12px; height: 12px; border-radius: 50%; font-size: 7px; font-weight: 700; color: #083344; display: flex; align-items: center; justify-content: center; animation: countPop 3s ease-in-out infinite; }
  @keyframes countPop { 0%, 35% { opacity: 0; transform: scale(0.5); } 50% { opacity: 1; transform: scale(1.2); } 60%, 80% { opacity: 1; transform: scale(1); } 90%, 100% { opacity: 0; transform: scale(0.8); } }

  /* Mini Paie (Personnes → Euro) */
  .mini-paie { width: 32px; height: 28px; display: flex; align-items: center; justify-content: center; position: relative; }
  .mini-paie-people { display: flex; align-items: flex-end; gap: 1px; position: absolute; animation: paiePeopleToEuro 3.5s ease-in-out infinite; }
  .mini-paie-person { display: flex; flex-direction: column; align-items: center; }
  .mini-paie-head { width: 5px; height: 5px; border-radius: 50%; background: white; margin-bottom: 1px; }
  .mini-paie-body { width: 7px; height: 7px; background: white; border-radius: 2px 2px 1px 1px; }
  .mini-paie-person-1 { animation: paiePerson1 3.5s ease-in-out infinite; }
  .mini-paie-person-2 { animation: paiePerson2 3.5s ease-in-out infinite; }
  .mini-paie-person-3 { animation: paiePerson3 3.5s ease-in-out infinite; }
  @keyframes paiePeopleToEuro { 0%, 50% { opacity: 1; } 60%, 90% { opacity: 0; } 100% { opacity: 1; } }
  @keyframes paiePerson1 { 0%, 40% { transform: translateX(0); } 55%, 90% { transform: translateX(10px); } 100% { transform: translateX(0); } }
  @keyframes paiePerson2 { 0%, 40% { transform: translateX(0); } 55%, 90% { transform: translateX(0); } 100% { transform: translateX(0); } }
  @keyframes paiePerson3 { 0%, 40% { transform: translateX(0); } 55%, 90% { transform: translateX(-10px); } 100% { transform: translateX(0); } }
  .mini-paie-euro { position: absolute; font-size: 18px; font-weight: 800; color: white; opacity: 0; animation: paieEuroAppear 3.5s ease-in-out infinite; }
  @keyframes paieEuroAppear { 0%, 50% { opacity: 0; transform: scale(0.5); } 65% { opacity: 1; transform: scale(1.1); } 75%, 85% { opacity: 1; transform: scale(1); } 95%, 100% { opacity: 0; transform: scale(0.8); } }

  /* Mini Calendar */
  .mini-calendar { width: 28px; height: 28px; background: rgba(0,0,0,0.2); border-radius: 4px; overflow: hidden; }
  .mini-calendar-header { height: 8px; }
  .mini-calendar-days { display: grid; grid-template-columns: repeat(2, 1fr); gap: 2px; padding: 3px; }
  .mini-calendar-day { width: 8px; height: 6px; background: rgba(255,255,255,0.15); border-radius: 1px; }
  .mini-calendar-day.active { animation: calendarPulse 2s ease-in-out infinite; }
  @keyframes calendarPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

  /* Mini Check */
  .mini-check { width: 28px; height: 28px; }
  .mini-check-circle { stroke-dasharray: 63; stroke-dashoffset: 63; animation: checkCircle 2s ease-out infinite; }
  .mini-check-mark { stroke-dasharray: 20; stroke-dashoffset: 20; animation: checkMark 2s ease-out infinite; }
  @keyframes checkCircle { 0% { stroke-dashoffset: 63; } 40%, 100% { stroke-dashoffset: 0; } }
  @keyframes checkMark { 0%, 40% { stroke-dashoffset: 20; } 60%, 100% { stroke-dashoffset: 0; } }

  /* Mini Star */
  .mini-star { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; }
  .mini-star-svg { animation: starPulse 2s ease-in-out infinite; }
  @keyframes starPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }

  /* Mini Pulse (Default) */
  .mini-pulse { width: 28px; height: 28px; position: relative; display: flex; align-items: center; justify-content: center; }
  .mini-pulse-dot { width: 10px; height: 10px; border-radius: 50%; }
  .mini-pulse-ring { position: absolute; width: 20px; height: 20px; border-radius: 50%; border: 2px solid; opacity: 0; animation: pulseRing 2s ease-out infinite; }
  @keyframes pulseRing { 0% { transform: scale(0.5); opacity: 1; } 100% { transform: scale(1.5); opacity: 0; } }
`;

/**
 * Obtenir une icône ANIMÉE pour un module
 */
function getAnimatedIcon(iconType, color = '#FF6B35') {
  const template = ANIMATED_ICON_TEMPLATES[iconType] || ANIMATED_ICON_TEMPLATES.custom;
  return template(color);
}

/**
 * Injecter le CSS des icônes animées (appeler une fois)
 */
function injectAnimatedIconsCSS() {
  if (document.getElementById('animated-icons-css')) return;
  const style = document.createElement('style');
  style.id = 'animated-icons-css';
  style.textContent = ANIMATED_ICONS_CSS;
  document.head.appendChild(style);
}

/**
 * Helper pour éclaircir une couleur
 */
function lightenColor(hex, percent = 30) {
  if (!hex || hex.length < 7) return hex;
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + percent);
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + percent);
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + percent);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

// Export pour modules ES6
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MODULE_ICON_TYPES,
    MODULE_ICON_TEMPLATES,
    MINI_ICON_TEMPLATES,
    ANIMATED_ICON_TEMPLATES,
    ANIMATED_ICONS_CSS,
    getModuleIcon,
    getModuleIconWithBg,
    getAnimatedIcon,
    injectAnimatedIconsCSS,
    hexToRgba,
    darkenColor,
    lightenColor
  };
}
