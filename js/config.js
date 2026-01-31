/**
 * Configuration centralisée iArmy
 * Utilisé par toutes les pages pour éviter les duplications
 */

const IARMY_CONFIG = {
  // Supabase
  SUPABASE_URL: 'https://byqfnpdcnifauhwgetcq.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5cWZucGRjbmlmYXVod2dldGNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4ODY1MTIsImV4cCI6MjA4MzQ2MjUxMn0.1W2OaRb0sApMvrG_28AoV2zUFAzrptzpwbR1c65tOPo',

  // Stripe
  STRIPE_PK: 'pk_test_51SnhCpQnTQdmBOkyvcPgFDg8LQbPZzwAdBv9X1LeLhy8WKtlAorKQeqdiZKC2l994bjKJXxndPYal8G6izNilG15002j0OaFcP',

  // URLs
  APP_URL: 'https://app.iarmy.fr',
  SITE_URL: 'https://iarmy.fr',
  BOT_URL: 'https://t.me/IArmyBOT',

  // Couleurs (pour référence - les vraies viennent de la BDD)
  COLORS: {
    primary: '#FF6B35',
    primaryLight: '#FF8B5E',
    background: '#0f0f0f',
    backgroundDark: '#0a0a0a',
  }
};

// Helper pour initialiser Supabase
function initSupabase() {
  if (typeof window.supabase === 'undefined') {
    console.error('Supabase SDK not loaded');
    return null;
  }
  return window.supabase.createClient(IARMY_CONFIG.SUPABASE_URL, IARMY_CONFIG.SUPABASE_ANON_KEY);
}

// Helper pour vérifier si admin (depuis la BDD)
async function checkIsAdmin(supabaseClient) {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return false;

    const { data, error } = await supabaseClient
      .from('admin_users')
      .select('role')
      .eq('email', session.user.email)
      .single();

    return data ? { isAdmin: true, role: data.role } : { isAdmin: false, role: null };
  } catch (e) {
    console.error('Error checking admin status:', e);
    return { isAdmin: false, role: null };
  }
}

// Helper pour obtenir un module depuis la BDD
async function getModuleBySlug(supabaseClient, slug) {
  const { data, error } = await supabaseClient
    .from('modules')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error loading module:', error);
    return null;
  }
  return data;
}

// Helper pour obtenir tous les modules
async function getAllModules(supabaseClient, options = {}) {
  let query = supabaseClient
    .from('modules')
    .select('*')
    .order('sort_order', { ascending: true });

  // Filtrer par visibilité si demandé
  if (options.visibility) {
    query = query.eq('visibility', options.visibility);
  }

  // Inclure tous si admin
  if (!options.includeAll) {
    query = query.in('visibility', ['public', 'beta']);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error loading modules:', error);
    return [];
  }
  return data || [];
}

// Helper pour le badge d'un module
function getModuleBadge(mod) {
  if (mod.badge === 'none') return null;
  if (mod.badge === 'nouveau') return { class: 'nouveau', text: '🆕 Nouveau' };
  if (mod.badge === 'populaire') return { class: 'populaire', text: '🔥 Populaire' };
  if (mod.badge === 'promo') return { class: 'promo', text: '💰 Promo' };

  // Auto: nouveau si < 14 jours
  if (!mod.badge && mod.created_at) {
    const daysSince = (Date.now() - new Date(mod.created_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 14) return { class: 'nouveau', text: '🆕 Nouveau' };
  }
  return null;
}

// Export pour modules ES6
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { IARMY_CONFIG, initSupabase, checkIsAdmin, getModuleBySlug, getAllModules, getModuleBadge };
}
