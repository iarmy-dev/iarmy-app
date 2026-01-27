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
async function initComptaModule(userId, supabaseClient, isTelegramMode, telegramUserId) {
  console.log('[Compta] Initializing module for user:', userId);

  // Load config from Supabase
  const { data: moduleConfig } = await supabaseClient
    .from('module_configs')
    .select('sheet_id, config, created_at')
    .eq('user_id', userId)
    .eq('module_name', 'compta')
    .single();

  if (!moduleConfig || !moduleConfig.sheet_id) {
    // Redirect to setup
    const tgParams = isTelegramMode ? `?tg=1&tguid=${telegramUserId}` : '';
    window.location.href = '/compta/setup/' + tgParams;
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

  if (comptaExportSettings.auto_export_enabled) {
    toggle.checked = true;
    const dot = document.getElementById('compta-toggle-dot');
    if (dot) {
      dot.classList.add('toggle-dot-active');
      dot.previousElementSibling.classList.add('toggle-active');
    }
  }
  if (comptaExportSettings.export_email && emailInput) {
    emailInput.value = comptaExportSettings.export_email;
  }
  if (comptaExportSettings.auto_export_day && daySelect) {
    daySelect.value = comptaExportSettings.auto_export_day;
  }
  if (comptaExportSettings.auto_export_format && formatSelect) {
    formatSelect.value = comptaExportSettings.auto_export_format;
  }

  // Init month/year selects
  initComptaExportSelects();
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
  window.location.href = '/compta/setup/';
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
window.updateComptaMonthOptions = updateComptaMonthOptions;
window.initComptaModule = initComptaModule;
