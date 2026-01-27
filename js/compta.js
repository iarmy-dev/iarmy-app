// Compta Module JavaScript
// Loaded dynamically when ?soldat=compta

// Module state
let comptaConfig = null;
let comptaKeywords = [];
let comptaRules = [];
let comptaSheetHeaders = {};
let comptaExportSettings = {};
let comptaProtectedColumns = [];
let comptaHasUnsavedChanges = false;
const comptaCols = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// Auto-save timeout
let comptaAutoSaveTimeout = null;

// Initialize compta module
// passedConfig: config déjà chargée en mode Telegram (évite requête RLS bloquée)
async function initComptaModule(userId, supabaseClient, isTelegramMode, telegramUserId, passedConfig) {
  console.log('[Compta] Initializing module for user:', userId, 'passedConfig:', !!passedConfig);

  let moduleConfig = null;

  // En mode Telegram avec config déjà passée, l'utiliser directement
  if (isTelegramMode && passedConfig && passedConfig.sheetId) {
    console.log('[Compta] Using passed config from telegram-auth');
    moduleConfig = {
      sheet_id: passedConfig.sheetId,
      config: passedConfig.config,
      created_at: passedConfig.createdAt
    };
  } else {
    // Mode web normal: charger depuis Supabase
    const { data } = await supabaseClient
      .from('module_configs')
      .select('sheet_id, config, created_at')
      .eq('user_id', userId)
      .eq('module_name', 'compta')
      .single();
    moduleConfig = data;
  }

  if (!moduleConfig || !moduleConfig.sheet_id) {
    // En mode Telegram, afficher un message au lieu de rediriger
    if (isTelegramMode) {
      const container = document.getElementById('module-content');
      if (container) {
        const setupUrl = 'https://app.iarmy.fr/setup/?module=compta';
        container.innerHTML = `
          <div style="text-align: center; padding: 60px 20px;">
            <div style="font-size: 48px; margin-bottom: 20px;">⚙️</div>
            <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 12px;">Configure Compta</h2>
            <p style="color: rgba(255,255,255,0.5); font-size: 14px; margin-bottom: 24px;">La configuration se fait sur le site web.</p>
            <button onclick="window.Telegram.WebApp.openLink('${setupUrl}')" style="display: inline-block; padding: 12px 24px; background: #22c55e; border: none; border-radius: 8px; color: white; font-weight: 600; cursor: pointer;">Configurer Compta →</button>
          </div>
        `;
      }
      return false;
    }
    // Redirect to setup
    window.location.href = '/setup/?module=compta';
    return false;
  }

  // Store config
  comptaConfig = {
    user_id: userId,
    sheet_id: moduleConfig.sheet_id,
    excel_config: moduleConfig.config,
    created_at: moduleConfig.created_at
  };
  comptaConfig.createdYear = moduleConfig.created_at ? new Date(moduleConfig.created_at).getFullYear() : new Date().getFullYear();

  // Parse sheet headers
  if (moduleConfig.config?.colonnes_detectees) {
    moduleConfig.config.colonnes_detectees.forEach(c => {
      if (c.colonne && c.nom) comptaSheetHeaders[c.colonne] = c.nom;
    });
  }

  // Parse keywords
  comptaKeywords = (moduleConfig.config?.colonnes_a_remplir || []).map(c => ({
    nom: c.nom,
    colonne: c.colonne || '',
    noteColumn: c.noteColumn || '',
    aliases: c.aliases || []
  }));

  // Parse rules (convert old format to new)
  comptaRules = (moduleConfig.config?.regles_calcul || []).map(r => {
    if (r.terms && Array.isArray(r.terms)) {
      return { terms: r.terms, target: r.target || '' };
    }
    if (r.sources && Array.isArray(r.sources)) {
      return {
        terms: r.sources.map((s, idx) => ({
          name: s,
          op: idx === 0 ? '+' : (r.operations && r.operations[idx - 1] ? r.operations[idx - 1] : '+')
        })),
        target: r.target || ''
      };
    }
    if (r.formula && typeof r.formula === 'string') {
      const parts = r.formula.split(/\s*([\+\-\*\/])\s*/);
      const terms = [];
      let currentOp = '+';
      for (const part of parts) {
        const p = part.trim();
        if (p === '+' || p === '-' || p === '*' || p === '/') {
          currentOp = p;
        } else if (p) {
          terms.push({ name: p, op: currentOp });
          currentOp = '+';
        }
      }
      if (terms.length > 0) terms[0].op = '+';
      return { terms: terms.length > 0 ? terms : [{ name: '', op: '+' }], target: r.target || '' };
    }
    return { terms: [{ name: '', op: '+' }], target: '' };
  });

  // Protected columns
  comptaProtectedColumns = moduleConfig.config?.colonnes_protegees || [];

  // Add TOTAL keyword if missing
  const hasTotalColumn = comptaKeywords.some(k => k.nom && k.nom.toLowerCase() === 'total');
  if (!hasTotalColumn && comptaKeywords.length > 0) {
    let totalCol = '';
    for (const [col, name] of Object.entries(comptaSheetHeaders)) {
      if (name && name.toLowerCase() === 'total') {
        totalCol = col;
        break;
      }
    }
    if (totalCol) {
      comptaKeywords.push({ nom: 'Total', colonne: totalCol, noteColumn: '', aliases: ['total'] });
    }
  }

  // Export settings
  comptaExportSettings = moduleConfig.config?.export_settings || {};

  // Render UI
  renderComptaUI();
  return true;
}

// Render the compta UI
function renderComptaUI() {
  renderComptaKw();
  renderComptaRules();
  updateComptaPreview();
  updateComptaCounts();
  loadComptaExportSettings();
  comptaLoadNotificationSettings();
  comptaRenderExportColumns();
}

// Render keywords
function renderComptaKw() {
  const kwGrid = document.getElementById('compta-kw-grid');
  if (!kwGrid) return;

  const kwCards = comptaKeywords.map((k, i) => {
    const incomplete = k.nom && !k.colonne;
    const colHeader = k.colonne && comptaSheetHeaders[k.colonne] ? comptaSheetHeaders[k.colonne] : null;
    const aliases = (k.aliases || []).filter(a => a && a.toLowerCase() !== k.nom.toLowerCase());

    return `
    <div class="kw-card ${incomplete ? 'incomplete' : ''}">
      <div class="kw-header">
        <div class="kw-name-wrap">
          <input class="kw-name-input" id="compta-kw-input-${i}" value="${k.nom}" onchange="comptaUpdKw(${i},'nom',this.value)" oninput="this.value=this.value.substring(0,20)" maxlength="20" placeholder="NOM">
          <button class="kw-confirm-btn" onclick="comptaConfirmKwInput(${i})" title="Valider">✓</button>
        </div>
        <button class="kw-del" onclick="comptaDelKw(${i})" title="Supprimer">×</button>
      </div>
      <div class="kw-mapping">
        <div class="kw-chip kw-chip-col ${!k.colonne ? 'empty' : ''}">
          <span class="kw-chip-icon">→</span>
          <select onchange="comptaUpdKw(${i},'colonne',this.value)">
            <option value="">Colonne</option>
            ${comptaCols.map(c => `<option value="${c}" ${k.colonne === c ? 'selected' : ''}>${c}${comptaSheetHeaders[c] ? ' · ' + comptaSheetHeaders[c] : ''}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="kw-aliases">
        <div class="kw-aliases-label">Mots-cles</div>
        <div class="kw-aliases-list">
          ${aliases.map((a, j) => `
            <span class="alias-tag">
              ${a}
              <button class="alias-tag-del" onclick="comptaDelAlias(${i},${j})" title="Supprimer">×</button>
            </span>
          `).join('')}
          <button class="alias-add" onclick="comptaShowAliasInput(${i})" id="compta-alias-add-${i}">+ Ajouter</button>
          <input type="text" class="alias-input" id="compta-alias-input-${i}" style="display:none" placeholder="ex: ticket resto" onkeydown="if(event.key==='Enter'){comptaAddAlias(${i});}" onblur="comptaAddAlias(${i})">
        </div>
      </div>
      ${colHeader ? `<div class="kw-footer">Colonne "${colHeader}"</div>` : ''}
    </div>
  `}).join('');

  const addCard = `<div class="kw-add-card" onclick="comptaAddKw()" title="Ajouter un mot-cle"><span>+</span></div>`;
  kwGrid.innerHTML = kwCards + addCard;
}

// Render rules
function renderComptaRules() {
  const rulesList = document.getElementById('compta-rules-list');
  if (!rulesList) return;

  const names = comptaKeywords.map(k => k.nom).filter(n => n);
  const allTargets = [...new Set([...names, ...comptaProtectedColumns])];

  rulesList.innerHTML = comptaRules.map((r, i) => {
    const termsHtml = r.terms.map((t, j) => {
      const opHtml = j > 0 ? `
        <select class="rule-op-select" onchange="comptaUpdRuleTerm(${i},${j},'op',this.value)">
          <option value="+" ${t.op === '+' ? 'selected' : ''}>+</option>
          <option value="-" ${t.op === '-' ? 'selected' : ''}>−</option>
        </select>
      ` : '';

      return `
        ${opHtml}
        <select class="rule-select" onchange="comptaUpdRuleTerm(${i},${j},'name',this.value)">
          <option value="">...</option>
          ${names.map(n => `<option value="${n}" ${t.name === n ? 'selected' : ''}>${n}</option>`).join('')}
        </select>
        ${r.terms.length > 2 ? `<button class="rule-del-term" onclick="comptaDelRuleTerm(${i},${j})">×</button>` : ''}
      `;
    }).join('');

    return `
      <div class="rule-card">
        <div class="rule-terms">
          ${termsHtml}
          <button class="rule-add-term" onclick="comptaAddRuleTerm(${i})">+</button>
        </div>
        <div class="rule-bottom">
          <span class="rule-arrow">=</span>
          <select class="rule-select" onchange="comptaUpdRuleTarget(${i},this.value)">
            <option value="">cible</option>
            ${allTargets.map(n => `<option value="${n}" ${r.target === n ? 'selected' : ''}>${n}</option>`).join('')}
          </select>
          <button class="rule-del-btn" onclick="comptaDelRule(${i})" title="Supprimer">×</button>
        </div>
      </div>
    `;
  }).join('');
}

// Update preview
function updateComptaPreview() {
  const tgEl = document.getElementById('compta-preview-tg');
  const sheetEl = document.getElementById('compta-preview-sheet');
  const rulesEl = document.getElementById('compta-preview-rules');

  if (!tgEl || !sheetEl) return;

  const activeKeywords = comptaKeywords.filter(k => k.nom && k.colonne);

  if (activeKeywords.length === 0) {
    tgEl.innerHTML = '<span class="empty-state">Configure tes mots-cles</span>';
    sheetEl.innerHTML = '<span class="empty-state">Configure tes mots-cles</span>';
    if (rulesEl) rulesEl.style.display = 'none';
    return;
  }

  // Example values
  const exampleValues = [200, 150, 100, 80, 60, 50];
  const keywordValues = {};
  activeKeywords.forEach((k, i) => {
    keywordValues[k.nom] = exampleValues[i] || 50;
  });

  // Calculate rule values
  const calculatedValues = {};
  comptaRules.forEach(r => {
    if (r.target && r.terms.some(t => t.name)) {
      let result = 0;
      r.terms.forEach(t => {
        if (t.name && keywordValues[t.name] !== undefined) {
          if (t.op === '-') {
            result -= keywordValues[t.name];
          } else {
            result += keywordValues[t.name];
          }
        }
      });
      if (result !== 0) {
        calculatedValues[r.target] = result;
        keywordValues[r.target] = result;
      }
    }
  });

  // Telegram bubble
  const examples = activeKeywords.slice(0, 3).map(k => ({
    nom: k.nom.toLowerCase(),
    val: exampleValues[activeKeywords.indexOf(k)] || 50
  }));
  const exampleMsg = examples.map(e => `${e.nom} ${e.val}`).join(' ');
  tgEl.innerHTML = `<div class="tg-bubble">${exampleMsg}</div>`;

  // Excel preview
  const allColumns = [...activeKeywords];
  Object.keys(calculatedValues).forEach(target => {
    const kw = comptaKeywords.find(k => k.nom === target);
    if (kw && kw.colonne && !allColumns.find(c => c.nom === target)) {
      allColumns.push(kw);
    }
  });

  const headerCells = allColumns.map(k => `<span>${k.colonne}</span>`).join('');
  const valueCells = allColumns.map(k => {
    const isCalculated = calculatedValues[k.nom] !== undefined;
    const val = isCalculated ? calculatedValues[k.nom] : (keywordValues[k.nom] || '-');
    const style = isCalculated ? 'class="calculated"' : '';
    return `<span ${style}>${val}</span>`;
  }).join('');

  sheetEl.innerHTML = `
    <div class="mini-excel-wrapper">
      <div class="mini-excel-container">
        <div class="mini-excel">
          <div class="mini-excel-header">${headerCells}</div>
          <div class="mini-excel-row">${valueCells}</div>
        </div>
      </div>
    </div>
  `;

  // Rules detail
  if (rulesEl) {
    const validRules = comptaRules.filter(r => r.target && r.terms.some(t => t.name));
    if (validRules.length > 0) {
      rulesEl.style.display = 'block';
      rulesEl.innerHTML = validRules.map(r => {
        const formula = r.terms.filter(t => t.name).map((t, i) =>
          (i > 0 ? ` ${t.op} ` : '') + t.name
        ).join('');
        const result = calculatedValues[r.target] || '?';
        return `<strong>${r.target}</strong> = ${formula} → <span style="color:#4ade80">${result}</span>`;
      }).join(' · ');
    } else {
      rulesEl.style.display = 'none';
    }
  }
}

// Update counts
function updateComptaCounts() {
  const validKw = comptaKeywords.filter(k => k.nom && k.colonne).length;
  const validRules = comptaRules.filter(r => r.terms.some(t => t.name) && r.target).length;

  const kwCount = document.getElementById('compta-kw-count');
  const rulesCount = document.getElementById('compta-rules-count');
  const kwSummary = document.getElementById('compta-kw-summary');
  const rulesSummary = document.getElementById('compta-rules-summary');

  if (kwCount) kwCount.textContent = validKw;
  if (rulesCount) rulesCount.textContent = validRules;

  if (kwSummary) {
    if (validKw > 0) {
      const names = comptaKeywords.filter(k => k.nom).map(k => k.nom).slice(0, 3).join(', ');
      kwSummary.textContent = names + (comptaKeywords.length > 3 ? '...' : '');
    } else {
      kwSummary.textContent = 'Configure tes colonnes';
    }
  }

  if (rulesSummary) {
    if (validRules > 0) {
      rulesSummary.textContent = validRules + ' regle' + (validRules > 1 ? 's' : '') + ' configuree' + (validRules > 1 ? 's' : '');
    } else {
      rulesSummary.textContent = 'Calculs automatiques';
    }
  }
}

// Keyword operations
function comptaAddKw() {
  const usedCols = comptaKeywords.map(k => k.colonne).filter(c => c);
  const sheetCols = Object.keys(comptaSheetHeaders);
  let nextCol = '';
  for (const col of comptaCols) {
    if (!usedCols.includes(col) && !sheetCols.includes(col) && col !== 'A') {
      nextCol = col;
      break;
    }
  }
  comptaKeywords.push({ nom: '', colonne: nextCol, noteColumn: '', aliases: [] });
  renderComptaUI();
  comptaMarkAsModified();
}

function comptaConfirmKwInput(i) {
  const input = document.getElementById('compta-kw-input-' + i);
  if (input) {
    input.blur();
    comptaToast('Mot-cle enregistre');
  }
}

function comptaUpdKw(i, f, v) {
  if (f === 'nom') {
    v = v.substring(0, 20).toUpperCase();
    const conflict = comptaCheckKeywordConflict(v, i);
    if (conflict) {
      if (conflict.type === 'keyword') {
        comptaToast(`"${v}" existe deja`, true);
      } else {
        comptaToast(`"${v}" est deja un alias de ${conflict.name}`, true);
      }
      renderComptaUI();
      return;
    }
    comptaKeywords[i].nom = v;
    comptaKeywords[i].aliases = comptaGetDefaultAliases(v);
  } else if (f === 'colonne') {
    comptaKeywords[i].colonne = v;
  } else {
    comptaKeywords[i][f] = v;
  }
  renderComptaUI();
  comptaMarkAsModified();
}

let comptaPendingDeleteIndex = null;

function comptaDelKw(i) {
  const kw = comptaKeywords[i];
  if (!kw?.nom || kw.nom.trim() === '') {
    comptaKeywords.splice(i, 1);
    renderComptaUI();
    comptaMarkAsModified();
    return;
  }
  comptaPendingDeleteIndex = i;
  document.getElementById('compta-delete-kw-name').textContent = kw.nom;
  document.getElementById('compta-delete-kw-modal').classList.add('active');
}

function comptaCloseDeleteModal() {
  document.getElementById('compta-delete-kw-modal').classList.remove('active');
  comptaPendingDeleteIndex = null;
}

function comptaConfirmDeleteKw() {
  if (comptaPendingDeleteIndex !== null) {
    comptaKeywords.splice(comptaPendingDeleteIndex, 1);
    renderComptaUI();
    comptaMarkAsModified();
  }
  comptaCloseDeleteModal();
}

// Aliases
function comptaShowAliasInput(i) {
  document.getElementById('compta-alias-add-' + i).style.display = 'none';
  const input = document.getElementById('compta-alias-input-' + i);
  input.style.display = 'inline-block';
  input.focus();
}

function comptaAddAlias(i) {
  const input = document.getElementById('compta-alias-input-' + i);
  const value = input.value.trim().toLowerCase();
  input.value = '';
  input.style.display = 'none';
  document.getElementById('compta-alias-add-' + i).style.display = 'inline-flex';

  if (value && value.length <= 20) {
    if (!comptaKeywords[i].aliases) comptaKeywords[i].aliases = [];
    if (value === comptaKeywords[i].nom.toLowerCase()) return;
    const existing = comptaKeywords[i].aliases.map(a => a.toLowerCase());
    if (existing.includes(value)) {
      comptaToast(`"${value}" est deja ajoute`, true);
      return;
    }
    const conflict = comptaCheckKeywordConflict(value, i);
    if (conflict) {
      comptaToast(`"${value}" est deja utilise par ${conflict.name}`, true);
      return;
    }
    comptaKeywords[i].aliases.push(value);
    renderComptaUI();
    comptaMarkAsModified();
  }
}

function comptaDelAlias(i, j) {
  const filteredAliases = (comptaKeywords[i].aliases || []).filter(a => a && a.toLowerCase() !== comptaKeywords[i].nom.toLowerCase());
  filteredAliases.splice(j, 1);
  comptaKeywords[i].aliases = filteredAliases;
  renderComptaUI();
  comptaMarkAsModified();
}

// Rules operations
function comptaAddRule() {
  comptaRules.push({ terms: [{ name: '', op: '+' }, { name: '', op: '+' }], target: '' });
  renderComptaUI();
  comptaMarkAsModified();
}

let comptaPendingDeleteRuleIndex = null;

function comptaDelRule(i) {
  const rule = comptaRules[i];
  if (!rule.target && rule.terms.every(t => !t.name)) {
    comptaRules.splice(i, 1);
    renderComptaUI();
    comptaMarkAsModified();
    return;
  }
  comptaPendingDeleteRuleIndex = i;
  document.getElementById('compta-delete-rule-modal').classList.add('active');
}

function comptaCloseDeleteRuleModal() {
  document.getElementById('compta-delete-rule-modal').classList.remove('active');
  comptaPendingDeleteRuleIndex = null;
}

function comptaConfirmDeleteRule() {
  if (comptaPendingDeleteRuleIndex !== null) {
    comptaRules.splice(comptaPendingDeleteRuleIndex, 1);
    renderComptaUI();
    comptaMarkAsModified();
  }
  comptaCloseDeleteRuleModal();
}

function comptaUpdRuleTerm(ri, ti, field, value) {
  comptaRules[ri].terms[ti][field] = value;
  renderComptaUI();
  comptaMarkAsModified();
}

function comptaUpdRuleTarget(ri, value) {
  comptaRules[ri].target = value;
  renderComptaUI();
  comptaMarkAsModified();
}

function comptaAddRuleTerm(ri) {
  comptaRules[ri].terms.push({ name: '', op: '+' });
  renderComptaUI();
  comptaMarkAsModified();
}

function comptaDelRuleTerm(ri, ti) {
  if (comptaRules[ri].terms.length > 2) {
    comptaRules[ri].terms.splice(ti, 1);
    if (comptaRules[ri].terms.length > 0) comptaRules[ri].terms[0].op = '+';
    renderComptaUI();
    comptaMarkAsModified();
  }
}

// Accordions
function comptaToggleKwSection() {
  const content = document.getElementById('compta-kw-content');
  const arrow = document.getElementById('compta-kw-arrow');
  content.classList.toggle('open');
  arrow.classList.toggle('open');
}

function comptaToggleRulesSection() {
  const content = document.getElementById('compta-rules-content');
  const arrow = document.getElementById('compta-rules-arrow');
  content.classList.toggle('open');
  arrow.classList.toggle('open');
}

function comptaToggleAutoExportAccordion() {
  const content = document.getElementById('compta-auto-export-content');
  const arrow = document.getElementById('compta-auto-export-arrow');
  const isOpen = content.style.display !== 'none';
  content.style.display = isOpen ? 'none' : 'block';
  arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
}

function comptaToggleExportManual() {
  const content = document.getElementById('compta-export-manual-content');
  const arrow = document.getElementById('compta-export-manual-arrow');
  const isOpen = content.style.display !== 'none';
  content.style.display = isOpen ? 'none' : 'block';
  arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
}

// Helpers
function comptaCheckKeywordConflict(value, excludeIndex = -1) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;

  for (let j = 0; j < comptaKeywords.length; j++) {
    if (j === excludeIndex) continue;
    const kw = comptaKeywords[j];
    if (kw.nom && kw.nom.toLowerCase() === normalized) {
      return { type: 'keyword', name: kw.nom };
    }
    if (kw.aliases) {
      for (const alias of kw.aliases) {
        if (alias.toLowerCase() === normalized) {
          return { type: 'alias', name: kw.nom, alias: alias };
        }
      }
    }
  }
  return null;
}

function comptaGetDefaultAliases(name) {
  const n = name.toLowerCase().trim();
  const base = [n];

  if (n === 'cb' || n === 'carte bancaire') {
    return [...new Set([...base, 'cb', 'carte', 'carte bancaire', 'carte bleue', 'visa', 'mastercard'])];
  }
  if (n === 'tr' || n === 'ticket' || n === 'ticket resto') {
    return [...new Set([...base, 'tr', 'ticket', 'tickets', 'ticket resto', 'ticket restaurant'])];
  }
  if (n === 'esp' || n === 'especes' || n === 'cash') {
    return [...new Set([...base, 'esp', 'especes', 'cash', 'liquide'])];
  }
  if (n === 'dep' || n === 'depenses') {
    return [...new Set([...base, 'dep', 'depense', 'depenses', 'frais'])];
  }
  if (n === 'raz' || n === 'caisse') {
    return [...new Set([...base, 'raz', 'caisse', 'z', 'recette'])];
  }
  if (n === 'total') {
    return [...new Set([...base, 'total', 'tot', 'somme'])];
  }

  return base;
}

// Auto-save
function comptaMarkAsModified() {
  comptaHasUnsavedChanges = true;
  if (comptaAutoSaveTimeout) clearTimeout(comptaAutoSaveTimeout);
  comptaAutoSaveTimeout = setTimeout(() => {
    comptaAutoSave();
  }, 1500);
}

async function comptaAutoSave() {
  const validKw = comptaKeywords.filter(k => k.nom.trim());
  const validRules = comptaRules.filter(r => r.terms.some(t => t.name) && r.target);

  const newCfg = {
    ...(comptaConfig?.excel_config || {}),
    colonnes_a_remplir: validKw.map(k => ({
      nom: k.nom,
      colonne: k.colonne || null,
      noteColumn: k.noteColumn || null,
      aliases: k.aliases.length ? k.aliases : [k.nom.toLowerCase()]
    })),
    regles_calcul: validRules.map(r => ({
      terms: r.terms.filter(t => t.name),
      target: r.target
    })),
    export_settings: comptaExportSettings
  };

  // Use global supabaseClient from index.html
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    comptaToast('Session expiree', true);
    return;
  }

  const { error } = await supabaseClient.from('module_configs').update({
    config: newCfg,
    updated_at: new Date().toISOString()
  }).eq('user_id', session.user.id).eq('module_name', 'compta');

  if (error) {
    comptaToast('Erreur sauvegarde: ' + error.message, true);
    return;
  }

  if (comptaConfig) comptaConfig.excel_config = newCfg;
  comptaHasUnsavedChanges = false;
  comptaToast('Sauvegarde');
}

// Export settings
function loadComptaExportSettings() {
  const toggle = document.getElementById('compta-auto-export-toggle');
  const emailInput = document.getElementById('compta-export-email');
  const daySelect = document.getElementById('compta-auto-export-day');
  const formatSelect = document.getElementById('compta-auto-export-format');

  if (!toggle) return;

  // Charger l'email
  if (comptaExportSettings.export_email && emailInput) {
    emailInput.value = comptaExportSettings.export_email;
  }

  // Charger le jour
  if (comptaExportSettings.auto_export_day && daySelect) {
    daySelect.value = comptaExportSettings.auto_export_day;
  }

  // Charger le format
  if (comptaExportSettings.auto_export_format && formatSelect) {
    formatSelect.value = comptaExportSettings.auto_export_format;
  }

  // Activer le toggle si necessaire
  if (comptaExportSettings.auto_export_enabled) {
    toggle.checked = true;
    const dot = document.getElementById('compta-toggle-dot');
    if (dot) {
      dot.style.left = '23px';
      dot.style.background = '#4ade80';
      dot.previousElementSibling.style.background = 'rgba(74,222,128,0.3)';
    }
    comptaUpdateAutoExportBadge(true);
  }

  // Init month/year selects
  initComptaExportSelects();

  // Mettre a jour l'apercu du mail
  comptaUpdateEmailPreview();
}

function initComptaExportSelects() {
  const yearSelect = document.getElementById('compta-export-year');
  const monthSelect = document.getElementById('compta-export-month');
  if (!yearSelect || !monthSelect) return;

  const currentYear = new Date().getFullYear();
  const createdYear = comptaConfig?.createdYear || currentYear;

  let yearsHtml = '';
  for (let y = currentYear; y >= createdYear; y--) {
    yearsHtml += `<option value="${y}">${y}</option>`;
  }
  yearSelect.innerHTML = yearsHtml;

  updateComptaMonthOptions();
}

function updateComptaMonthOptions() {
  const monthSelect = document.getElementById('compta-export-month');
  const yearSelect = document.getElementById('compta-export-year');
  if (!monthSelect || !yearSelect) return;

  const selectedYear = parseInt(yearSelect.value);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const monthNames = ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'];

  let options = '';
  const maxMonth = (selectedYear === currentYear) ? currentMonth : 11;

  for (let i = maxMonth; i >= 0; i--) {
    const value = String(i + 1).padStart(2, '0');
    const selected = (i === maxMonth) ? 'selected' : '';
    options += `<option value="${value}" ${selected}>${monthNames[i]}</option>`;
  }

  monthSelect.innerHTML = options;
}

// Save export settings
async function comptaSaveAutoExportSettings() {
  const checkedCols = [];
  document.querySelectorAll('.compta-export-col-checkbox:checked').forEach(cb => {
    checkedCols.push(cb.dataset.col);
  });

  comptaExportSettings = {
    auto_export_enabled: document.getElementById('compta-auto-export-toggle')?.checked || false,
    export_email: document.getElementById('compta-export-email')?.value || '',
    auto_export_day: document.getElementById('compta-auto-export-day')?.value || '1',
    auto_export_format: document.getElementById('compta-auto-export-format')?.value || 'pdf',
    export_columns: checkedCols
  };
  comptaMarkAsModified();
}

// Open Google Sheet
function comptaOpenGoogleSheet() {
  if (!comptaConfig?.sheet_id) {
    comptaToast('Aucun fichier configure', true);
    return;
  }
  const sheetId = comptaConfig.sheet_id;
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile) {
    window.location.href = 'https://docs.google.com/spreadsheets/d/' + sheetId + '/edit?usp=sharing';
  } else {
    window.open('https://docs.google.com/spreadsheets/d/' + sheetId + '/edit', '_blank');
  }
}

// Toast
function comptaToast(msg, err = false) {
  const t = document.getElementById('compta-toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'compta-toast show' + (err ? ' error' : '');
  setTimeout(() => t.className = 'compta-toast', 2500);
}

// Reconfigure
function comptaResetConfig() {
  const modal = document.createElement('div');
  modal.id = 'compta-reset-modal';
  modal.innerHTML = `
    <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; max-width: 320px; text-align: center;">
        <div style="font-size: 32px; margin-bottom: 12px;">🔄</div>
        <div style="font-size: 16px; font-weight: 600; color: white; margin-bottom: 8px;">Nouveau fichier ?</div>
        <div style="font-size: 13px; color: rgba(255,255,255,0.5); margin-bottom: 20px;">Ta config actuelle sera supprimee et tu pourras creer un nouveau fichier iArmy.</div>
        <div style="display: flex; gap: 10px;">
          <button onclick="document.getElementById('compta-reset-modal').remove()" style="flex: 1; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: rgba(255,255,255,0.7); font-size: 13px; cursor: pointer;">Annuler</button>
          <button onclick="comptaDoResetConfig()" style="flex: 1; padding: 12px; background: rgba(239,68,68,0.2); border: 1px solid rgba(239,68,68,0.3); border-radius: 10px; color: #f87171; font-size: 13px; font-weight: 600; cursor: pointer;">Supprimer</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

async function comptaDoResetConfig() {
  document.getElementById('compta-reset-modal')?.remove();

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return;

  await supabaseClient.from('module_configs').delete().eq('user_id', session.user.id).eq('module_name', 'compta');
  window.location.href = '/setup/?module=compta';
}

// Export data manually
async function comptaExportDataManual() {
  if (!comptaConfig?.sheet_id) { comptaToast('Aucun fichier configure', true); return; }

  const month = document.getElementById('compta-export-month')?.value;
  const format = document.getElementById('compta-export-format-manual')?.value || 'pdf';
  const year = document.getElementById('compta-export-year')?.value;
  const monthNames = ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'];
  const sheetName = monthNames[parseInt(month) - 1] + ' ' + year;
  const filename = `compta_${sheetName.replace(' ', '_')}`;

  comptaToast('Export en cours...');

  try {
    const { data: { session } } = await supabaseClient.auth.refreshSession();
    if (!session?.access_token) {
      comptaToast('Session expiree, reconnecte-toi', true);
      return;
    }

    if (format === 'pdf') {
      const pdfRes = await fetch(SUPABASE_URL + '/functions/v1/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + session.access_token, 'apikey': SUPABASE_ANON_KEY },
        body: JSON.stringify({
          sheetId: comptaConfig.sheet_id,
          sheetName: sheetName,
          title: `Compta - ${sheetName}`
        })
      });

      if (!pdfRes.ok) throw new Error('Impossible de generer le PDF');

      const blob = await pdfRes.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    }

    comptaToast('Export termine !');
  } catch (err) {
    console.error('Export error:', err);
    comptaToast('Erreur: ' + err.message, true);
  }
}

// Notification settings
async function comptaSaveNotificationSettings() {
  if (!comptaConfig?.user_id) return;

  const notifSettings = {
    weeklyRecap: document.getElementById('compta-notif-weekly-recap')?.checked || false,
    monthlyRecap: document.getElementById('compta-notif-monthly-recap')?.checked || false,
    records: document.getElementById('compta-notif-records')?.checked || false,
    objective: document.getElementById('compta-notif-objective')?.checked || false,
    monthlyObjective: parseFloat(document.getElementById('compta-monthly-objective')?.value) || 0
  };

  const updatedConfig = { ...comptaConfig.excel_config, notification_settings: notifSettings };

  try {
    await supabaseClient
      .from('module_configs')
      .update({ config: updatedConfig })
      .eq('user_id', comptaConfig.user_id)
      .eq('module_name', 'compta');

    comptaConfig.excel_config = updatedConfig;
    comptaToast('Notifications mises a jour');
  } catch (err) {
    console.error('Error saving notification settings:', err);
    comptaToast('Erreur de sauvegarde', true);
  }
}

function comptaToggleObjectiveInput() {
  const checkbox = document.getElementById('compta-notif-objective');
  const inputRow = document.getElementById('compta-objective-input-row');
  if (inputRow) {
    inputRow.style.display = checkbox?.checked ? 'block' : 'none';
  }
}

function comptaLoadNotificationSettings() {
  const notifSettings = comptaConfig?.excel_config?.notification_settings || {};

  const weeklyEl = document.getElementById('compta-notif-weekly-recap');
  const monthlyEl = document.getElementById('compta-notif-monthly-recap');
  const recordsEl = document.getElementById('compta-notif-records');
  const objectiveEl = document.getElementById('compta-notif-objective');
  const objectiveInputEl = document.getElementById('compta-monthly-objective');

  if (weeklyEl) weeklyEl.checked = notifSettings.weeklyRecap || false;
  if (monthlyEl) monthlyEl.checked = notifSettings.monthlyRecap || false;
  if (recordsEl) recordsEl.checked = notifSettings.records || false;
  if (objectiveEl) objectiveEl.checked = notifSettings.objective || false;
  if (objectiveInputEl && notifSettings.monthlyObjective) {
    objectiveInputEl.value = notifSettings.monthlyObjective;
  }

  comptaToggleObjectiveInput();
}

// Preview export - generates real PDF like original
async function comptaPreviewExport() {
  if (!comptaConfig?.sheet_id) { comptaToast('Aucun fichier configure', true); return; }

  const month = document.getElementById('compta-export-month')?.value;
  const year = document.getElementById('compta-export-year')?.value;
  const monthNames = ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'];
  const sheetName = monthNames[parseInt(month) - 1] + ' ' + year;

  comptaToast('Chargement de la previsualisation...');

  try {
    // Refresh session to get fresh token
    const { data: { session }, error: sessionError } = await supabaseClient.auth.refreshSession();

    if (sessionError || !session?.access_token) {
      console.error('[Compta] Session error:', sessionError);
      comptaToast('Session expiree, reconnecte-toi', true);
      setTimeout(() => location.href = 'https://iarmy.fr', 1500);
      return;
    }

    console.log('[Compta] Calling generate-pdf with:', { sheetId: comptaConfig.sheet_id, sheetName });

    const SUPABASE_URL = 'https://byqfnpdcnifauhwgetcq.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_8mpFx9ubrV29KfKtgAb3eg_dyazidfT';

    const pdfRes = await fetch(SUPABASE_URL + '/functions/v1/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + session.access_token,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        sheetId: comptaConfig.sheet_id,
        sheetName: sheetName,
        title: `Compta - ${sheetName}`
      })
    });

    console.log('[Compta] Response status:', pdfRes.status);

    if (!pdfRes.ok) {
      const errText = await pdfRes.text();
      console.error('[Compta] PDF error response:', errText);
      try {
        const err = JSON.parse(errText);
        throw new Error(err.error || 'Impossible de generer le PDF');
      } catch {
        throw new Error(errText || 'Impossible de generer le PDF');
      }
    }

    const blob = await pdfRes.blob();
    const url = URL.createObjectURL(blob);

    // Ouvrir dans un nouvel onglet
    window.open(url, '_blank');

    comptaToast('PDF ouvert dans un nouvel onglet');
  } catch (err) {
    console.error('[Compta] Preview error:', err);
    comptaToast('Erreur: ' + err.message, true);
  }
}

// Export full year
async function comptaExportFullYear() {
  if (!comptaConfig?.sheet_id) { comptaToast('Aucun fichier configure', true); return; }

  const year = document.getElementById('compta-export-year')?.value || new Date().getFullYear();
  const filename = `compta_${year}_complet`;

  comptaToast('Export annuel en cours...');

  try {
    const { data: { session } } = await supabaseClient.auth.refreshSession();
    if (!session?.access_token) {
      comptaToast('Session expiree, reconnecte-toi', true);
      return;
    }

    // For now, just open the Google Sheet
    const url = `https://docs.google.com/spreadsheets/d/${comptaConfig.sheet_id}/export?format=xlsx`;
    window.open(url, '_blank');

    comptaToast('Export lance !');
  } catch (err) {
    console.error('Export year error:', err);
    comptaToast('Erreur: ' + err.message, true);
  }
}

// Update month options based on year
function comptaUpdateMonthOptions() {
  const yearSelect = document.getElementById('compta-export-year');
  const monthSelect = document.getElementById('compta-export-month');
  if (!yearSelect || !monthSelect) return;

  const selectedYear = parseInt(yearSelect.value);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const monthNames = ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'];

  monthSelect.innerHTML = '';

  const maxMonth = selectedYear === currentYear ? currentMonth : 12;
  for (let m = 1; m <= maxMonth; m++) {
    const opt = document.createElement('option');
    opt.value = String(m).padStart(2, '0');
    opt.textContent = monthNames[m - 1];
    monthSelect.appendChild(opt);
  }

  // Enable/disable full year export button
  const fullYearBtn = document.getElementById('compta-export-year-btn');
  if (fullYearBtn) {
    if (currentMonth === 12 && selectedYear === currentYear) {
      fullYearBtn.disabled = false;
      fullYearBtn.style.cursor = 'pointer';
      fullYearBtn.style.color = '#FF8B5E';
      fullYearBtn.style.borderColor = 'rgba(255,107,53,0.3)';
      fullYearBtn.style.background = 'linear-gradient(135deg, rgba(255,107,53,0.1) 0%, rgba(255,107,53,0.05) 100%)';
    } else {
      fullYearBtn.disabled = true;
      fullYearBtn.style.cursor = 'not-allowed';
      fullYearBtn.style.color = 'rgba(255,255,255,0.3)';
      fullYearBtn.style.borderColor = 'rgba(255,255,255,0.05)';
      fullYearBtn.style.background = 'rgba(255,255,255,0.02)';
    }
  }
}

// Render export columns checkboxes
function comptaRenderExportColumns() {
  const container = document.getElementById('compta-export-columns-list');
  if (!container) return;

  // Colonnes de base toujours presentes
  const baseColumns = [
    { id: 'date', nom: 'Date', checked: true }
  ];

  // Colonnes des mots-cles configures
  const kwColumns = comptaKeywords.filter(k => k.nom && k.colonne).map(k => ({
    id: k.nom.toLowerCase(),
    nom: k.nom,
    checked: comptaExportSettings.export_columns ? comptaExportSettings.export_columns.includes(k.nom) : true
  }));

  // Colonnes calculees
  const calcColumns = [
    { id: 'total', nom: 'TOTAL', checked: comptaExportSettings.export_columns ? comptaExportSettings.export_columns.includes('TOTAL') : true },
    { id: 'tva', nom: 'TVA', checked: comptaExportSettings.export_columns ? comptaExportSettings.export_columns.includes('TVA') : true }
  ];

  const allColumns = [...baseColumns, ...kwColumns, ...calcColumns];

  // Si pas de settings sauvegardes, tout coche par defaut
  if (!comptaExportSettings.export_columns) {
    allColumns.forEach(c => c.checked = true);
  }

  container.innerHTML = allColumns.map(col => `
    <label style="display: flex; align-items: center; gap: 6px; padding: 6px 10px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; cursor: pointer; font-size: 12px;">
      <input type="checkbox" class="compta-export-col-checkbox" data-col="${col.nom}" ${col.checked ? 'checked' : ''} onchange="comptaSaveAutoExportSettings(); comptaUpdateEmailPreview();" style="accent-color: #FF6B35;">
      <span>${col.nom}</span>
    </label>
  `).join('');

  // Update preview after rendering
  comptaUpdateEmailPreview();
}

// Update email preview in auto-export section
function comptaUpdateEmailPreview() {
  const emailInput = document.getElementById('compta-export-email');
  const previewTo = document.getElementById('compta-preview-to');
  const previewCc = document.getElementById('compta-preview-cc');
  const previewTable = document.getElementById('compta-preview-table');

  if (!previewTo || !previewTable) return;

  // Update recipient
  const email = emailInput?.value || '';
  previewTo.textContent = email || 'comptable@...';

  // Update CC with user's email (get from DOM or global currentUser)
  if (previewCc) {
    const userEmailEl = document.getElementById('user-email');
    const userEmail = userEmailEl?.textContent || window.currentUser?.email || 'ton email';
    previewCc.textContent = userEmail;
  }

  // Get checked columns
  const checkedCols = [];
  document.querySelectorAll('.compta-export-col-checkbox:checked').forEach(cb => {
    checkedCols.push(cb.dataset.col);
  });

  if (checkedCols.length === 0) {
    previewTable.innerHTML = '<div style="color: #999; font-style: italic;">Selectionne des colonnes</div>';
    return;
  }

  // Generate mini table preview with example data
  const exampleData = {
    'Date': '15/01',
    'CB': '245',
    'ESP': '180',
    'TR': '95',
    'DEP': '45',
    'RAZ': '520',
    'TOTAL': '520',
    'TVA': '52'
  };

  // Fill missing columns with random values
  checkedCols.forEach(col => {
    if (!exampleData[col]) {
      exampleData[col] = String(Math.floor(Math.random() * 200) + 50);
    }
  });

  const headerRow = checkedCols.map(c => `<th style="padding: 4px 8px; background: #0f9d58; color: white; font-size: 9px; white-space: nowrap;">${c}</th>`).join('');
  const dataRow = checkedCols.map(c => `<td style="padding: 4px 8px; border: 1px solid #e0e0e0; font-size: 9px; text-align: center;">${exampleData[c] || '-'}</td>`).join('');

  previewTable.innerHTML = `
    <table style="border-collapse: collapse; width: 100%; margin-top: 4px;">
      <tr>${headerRow}</tr>
      <tr>${dataRow}</tr>
      <tr style="color: #999;">${checkedCols.map(() => '<td style="padding: 2px 8px; font-size: 8px; text-align: center;">...</td>').join('')}</tr>
    </table>
  `;
}

// Validate export email
function comptaValidateExportEmail() {
  const emailInput = document.getElementById('compta-export-email');
  const errorDiv = document.getElementById('compta-email-error');
  const email = emailInput?.value?.trim() || '';

  if (!email) {
    if (errorDiv) errorDiv.style.display = 'none';
    if (emailInput) emailInput.style.borderColor = 'rgba(255,255,255,0.08)';
    return true; // Vide = OK (pas encore rempli)
  }

  // Regex simple pour validation email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email);

  if (!isValid) {
    if (errorDiv) errorDiv.style.display = 'block';
    if (emailInput) emailInput.style.borderColor = 'rgba(248,113,113,0.5)';
  } else {
    if (errorDiv) errorDiv.style.display = 'none';
    if (emailInput) emailInput.style.borderColor = 'rgba(74,222,128,0.3)';
  }

  return isValid;
}

// Update auto export badge
function comptaUpdateAutoExportBadge(isActive) {
  const badge = document.getElementById('compta-auto-export-status-badge');
  const subtitle = document.getElementById('compta-auto-export-subtitle');
  const email = document.getElementById('compta-export-email')?.value || '';

  if (isActive && email) {
    if (badge) badge.style.display = 'inline';
    if (subtitle) subtitle.textContent = email;
  } else {
    if (badge) badge.style.display = 'none';
    if (subtitle) subtitle.textContent = 'Envoie le PDF a ta comptable chaque mois';
  }
}

// Toggle auto export
function comptaToggleAutoExport() {
  const toggle = document.getElementById('compta-auto-export-toggle');
  const dot = document.getElementById('compta-toggle-dot');
  const email = document.getElementById('compta-export-email')?.value?.trim() || '';

  // Si on essaie d'activer, verifier l'email
  if (toggle?.checked) {
    if (!email) {
      comptaToast('Entre l\'email de ta comptable', true);
      toggle.checked = false;
      return;
    }
    if (!comptaValidateExportEmail()) {
      comptaToast('Email invalide', true);
      toggle.checked = false;
      return;
    }
    if (dot) {
      dot.style.left = '23px';
      dot.style.background = '#4ade80';
      dot.previousElementSibling.style.background = 'rgba(74,222,128,0.3)';
    }
  } else {
    if (dot) {
      dot.style.left = '3px';
      dot.style.background = 'rgba(255,255,255,0.4)';
      dot.previousElementSibling.style.background = 'rgba(255,255,255,0.1)';
    }
  }

  comptaUpdateAutoExportBadge(toggle?.checked);
  comptaSaveAutoExportSettings();
}

// Make functions globally available
window.comptaToggleKwSection = comptaToggleKwSection;
window.comptaToggleRulesSection = comptaToggleRulesSection;
window.comptaToggleAutoExportAccordion = comptaToggleAutoExportAccordion;
window.comptaToggleExportManual = comptaToggleExportManual;
window.comptaAddKw = comptaAddKw;
window.comptaConfirmKwInput = comptaConfirmKwInput;
window.comptaUpdKw = comptaUpdKw;
window.comptaDelKw = comptaDelKw;
window.comptaCloseDeleteModal = comptaCloseDeleteModal;
window.comptaConfirmDeleteKw = comptaConfirmDeleteKw;
window.comptaShowAliasInput = comptaShowAliasInput;
window.comptaAddAlias = comptaAddAlias;
window.comptaDelAlias = comptaDelAlias;
window.comptaAddRule = comptaAddRule;
window.comptaDelRule = comptaDelRule;
window.comptaCloseDeleteRuleModal = comptaCloseDeleteRuleModal;
window.comptaConfirmDeleteRule = comptaConfirmDeleteRule;
window.comptaUpdRuleTerm = comptaUpdRuleTerm;
window.comptaUpdRuleTarget = comptaUpdRuleTarget;
window.comptaAddRuleTerm = comptaAddRuleTerm;
window.comptaDelRuleTerm = comptaDelRuleTerm;
window.comptaOpenGoogleSheet = comptaOpenGoogleSheet;
window.comptaResetConfig = comptaResetConfig;
window.comptaDoResetConfig = comptaDoResetConfig;
window.comptaSaveAutoExportSettings = comptaSaveAutoExportSettings;
window.comptaExportDataManual = comptaExportDataManual;
window.comptaUpdateMonthOptions = comptaUpdateMonthOptions;
window.comptaSaveNotificationSettings = comptaSaveNotificationSettings;
window.comptaToggleObjectiveInput = comptaToggleObjectiveInput;
window.comptaPreviewExport = comptaPreviewExport;
window.comptaExportFullYear = comptaExportFullYear;
window.comptaLoadNotificationSettings = comptaLoadNotificationSettings;
window.comptaRenderExportColumns = comptaRenderExportColumns;
window.comptaUpdateEmailPreview = comptaUpdateEmailPreview;
window.comptaValidateExportEmail = comptaValidateExportEmail;
window.comptaUpdateAutoExportBadge = comptaUpdateAutoExportBadge;
window.comptaToggleAutoExport = comptaToggleAutoExport;
window.initComptaModule = initComptaModule;
