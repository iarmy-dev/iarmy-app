-- =============================================
-- MODULE STOCK - Tables Supabase
-- A executer dans Supabase SQL Editor
-- =============================================

-- 1. FOURNISSEURS (en premier car reference par products)
CREATE TABLE IF NOT EXISTS stock_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PRODUITS (bouteilles, ingredients)
CREATE TABLE IF NOT EXISTS stock_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'other', -- spirit, liqueur, wine, beer, soft, other
  volume_cl INTEGER NOT NULL DEFAULT 70,
  purchase_price DECIMAL(10,2),
  stock_current DECIMAL(10,2), -- peut etre decimal pour les bouteilles partielles
  supplier_id UUID REFERENCES stock_suppliers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. COCKTAILS (carte)
CREATE TABLE IF NOT EXISTS stock_cocktails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  category TEXT, -- classique, signature, shot, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RECETTES / FICHES TECHNIQUES (cocktail -> ingredients)
CREATE TABLE IF NOT EXISTS stock_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cocktail_id UUID NOT NULL REFERENCES stock_cocktails(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES stock_products(id) ON DELETE CASCADE,
  quantity_cl DECIMAL(10,2) NOT NULL, -- quantite en cl
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cocktail_id, product_id) -- un ingredient par cocktail
);

-- 5. PARAMETRES STOCK
CREATE TABLE IF NOT EXISTS stock_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  margin_target INTEGER DEFAULT 70, -- pourcentage cible
  stock_low_threshold INTEGER DEFAULT 2, -- alerte si < X bouteilles
  variance_tolerance INTEGER DEFAULT 10, -- alerte si ecart > X%
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id) -- un seul settings par user
);

-- 6. MOUVEMENTS DE STOCK (historique)
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES stock_products(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'sale', 'delivery', 'inventory', 'loss', 'adjustment'
  quantity DECIMAL(10,2) NOT NULL, -- positif = entree, negatif = sortie
  reference TEXT, -- numero facture, Z ticket, etc.
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. INVENTAIRES
CREATE TABLE IF NOT EXISTS stock_inventories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'draft', -- draft, completed
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 8. LIGNES D'INVENTAIRE
CREATE TABLE IF NOT EXISTS stock_inventory_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID NOT NULL REFERENCES stock_inventories(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES stock_products(id) ON DELETE CASCADE,
  expected_quantity DECIMAL(10,2), -- stock theorique
  actual_quantity DECIMAL(10,2) NOT NULL, -- stock compte
  variance DECIMAL(10,2), -- ecart (actual - expected)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(inventory_id, product_id)
);

-- =============================================
-- INDEX pour performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_stock_products_user ON stock_products(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_cocktails_user ON stock_cocktails(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_recipes_cocktail ON stock_recipes(cocktail_id);
CREATE INDEX IF NOT EXISTS idx_stock_recipes_product ON stock_recipes(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_suppliers_user ON stock_suppliers(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_user ON stock_movements(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_inventories_user ON stock_inventories(user_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Activer RLS sur toutes les tables
ALTER TABLE stock_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_cocktails ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_inventories ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_inventory_lines ENABLE ROW LEVEL SECURITY;

-- Policies: chaque user voit uniquement ses donnees
CREATE POLICY "Users can manage their own suppliers" ON stock_suppliers
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own products" ON stock_products
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own cocktails" ON stock_cocktails
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own recipes" ON stock_recipes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own settings" ON stock_settings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own movements" ON stock_movements
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own inventories" ON stock_inventories
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view inventory lines for their inventories" ON stock_inventory_lines
  FOR ALL USING (
    inventory_id IN (
      SELECT id FROM stock_inventories WHERE user_id = auth.uid()
    )
  );

-- =============================================
-- FONCTION: Mettre a jour updated_at automatiquement
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_stock_suppliers_updated_at
  BEFORE UPDATE ON stock_suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_stock_products_updated_at
  BEFORE UPDATE ON stock_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_stock_cocktails_updated_at
  BEFORE UPDATE ON stock_cocktails
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_stock_settings_updated_at
  BEFORE UPDATE ON stock_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
