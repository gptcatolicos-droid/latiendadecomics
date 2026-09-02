ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS folder TEXT NOT NULL DEFAULT 'General';
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS tags JSONB NOT NULL DEFAULT '[]';
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  seo_title TEXT,
  seo_description TEXT,
  featured_media_id TEXT REFERENCES media_assets(id) ON DELETE SET NULL,
  banner_media_id TEXT REFERENCES media_assets(id) ON DELETE SET NULL,
  video_media_id TEXT REFERENCES media_assets(id) ON DELETE SET NULL,
  parent_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  merchandising_mode TEXT NOT NULL DEFAULT 'manual' CHECK (merchandising_mode IN ('manual', 'newest', 'best_sellers', 'highest_margin', 'trending')),
  filters JSONB NOT NULL DEFAULT '[]',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  collection_type TEXT NOT NULL DEFAULT 'manual' CHECK (collection_type IN ('manual', 'automatic')),
  rules JSONB NOT NULL DEFAULT '[]',
  featured_media_id TEXT REFERENCES media_assets(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS collection_products (
  collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (collection_id, product_id)
);

CREATE TABLE IF NOT EXISTS store_sections (
  id TEXT PRIMARY KEY,
  page_key TEXT NOT NULL DEFAULT 'homepage',
  section_type TEXT NOT NULL CHECK (section_type IN ('hero', 'featured_products', 'product_carousel', 'categories', 'image_grid', 'video', 'audio', 'testimonials', 'faq', 'newsletter', 'banner', 'text', 'promo', 'brands', 'reviews', 'custom')),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'hidden')),
  position INTEGER NOT NULL DEFAULT 0,
  config JSONB NOT NULL DEFAULT '{}',
  scheduled_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sku TEXT UNIQUE,
  option_values JSONB NOT NULL DEFAULT '{}',
  price_usd DECIMAL(10,2) CHECK (price_usd IS NULL OR price_usd >= 0),
  price_cop INTEGER CHECK (price_cop IS NULL OR price_cop >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= -1),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_id TEXT REFERENCES product_variants(id) ON DELETE SET NULL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_title TEXT;
ALTER TABLE inventory_reservations ADD COLUMN IF NOT EXISTS variant_id TEXT REFERENCES product_variants(id) ON DELETE RESTRICT;
ALTER TABLE inventory_reservations DROP CONSTRAINT IF EXISTS inventory_reservations_order_id_product_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_reservations_order_product_variant
  ON inventory_reservations(order_id, product_id, COALESCE(variant_id, ''));

CREATE TABLE IF NOT EXISTS media_usages (
  id TEXT PRIMARY KEY,
  asset_id TEXT NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('product', 'category', 'collection', 'section')),
  entity_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('gallery', 'featured', 'banner', 'video', 'audio', 'embed', 'document')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(asset_id, entity_type, entity_id, role)
);

CREATE TABLE IF NOT EXISTS payment_connections (
  provider TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'not_connected' CHECK (status IN ('not_connected', 'configured', 'connected', 'error')),
  mode TEXT NOT NULL DEFAULT 'live' CHECK (mode IN ('sandbox', 'live')),
  last_connected_at TIMESTAMPTZ,
  last_error TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_transactions (
  id TEXT PRIMARY KEY,
  order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  external_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'refunded', 'failed', 'needs_review')),
  provider_status TEXT,
  amount_minor BIGINT NOT NULL CHECK (amount_minor >= 0),
  fee_minor BIGINT CHECK (fee_minor IS NULL OR fee_minor >= 0),
  net_minor BIGINT CHECK (net_minor IS NULL OR net_minor >= 0),
  currency CHAR(3) NOT NULL,
  payment_method TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, external_id)
);

CREATE TABLE IF NOT EXISTS payment_refunds (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL REFERENCES payment_transactions(id) ON DELETE RESTRICT,
  external_id TEXT,
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  currency CHAR(3) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'failed')),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(transaction_id, external_id)
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id TEXT REFERENCES categories(id) ON DELETE SET NULL;

INSERT INTO categories (id, name, slug, status, sort_order) VALUES
  ('cat-comics', 'Cómics', 'comics', 'published', 10),
  ('cat-manga', 'Manga', 'manga', 'published', 20),
  ('cat-figuras', 'Figuras', 'figuras', 'published', 30),
  ('cat-accesorios', 'Accesorios', 'accesorios', 'published', 40)
ON CONFLICT (slug) DO NOTHING;

UPDATE products p SET category_id = c.id FROM categories c
WHERE p.category = c.slug AND p.category_id IS NULL;

INSERT INTO payment_connections (provider, display_name, enabled, status) VALUES
  ('mercadopago', 'Mercado Pago', true, 'configured'),
  ('paypal', 'PayPal', false, 'not_connected'),
  ('stripe', 'Stripe', false, 'not_connected'),
  ('wompi', 'Wompi', false, 'not_connected')
ON CONFLICT (provider) DO NOTHING;

INSERT INTO payment_transactions (id, order_id, provider, external_id, status, provider_status, amount_minor, currency, payment_method, occurred_at)
SELECT 'legacy-' || id, id, 'mercadopago', payment_id, payment_status, payment_status,
       GREATEST(0, COALESCE(total_cop, 0)), 'COP', payment_method, updated_at
FROM orders
WHERE payment_id IS NOT NULL
ON CONFLICT (provider, external_id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_categories_status_sort ON categories(status, sort_order);
CREATE INDEX IF NOT EXISTS idx_collections_status_sort ON collections(status, sort_order);
CREATE INDEX IF NOT EXISTS idx_collection_products_product ON collection_products(product_id);
CREATE INDEX IF NOT EXISTS idx_store_sections_page_position ON store_sections(page_key, position);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_variant_available ON inventory_reservations(variant_id, status, expires_at) WHERE variant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_media_usages_entity ON media_usages(entity_type, entity_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_media_assets_folder ON media_assets(folder, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order ON payment_transactions(order_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status_date ON payment_transactions(status, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_transaction ON payment_refunds(transaction_id, created_at DESC);
