CREATE TABLE IF NOT EXISTS marketplace_connections (
  provider TEXT PRIMARY KEY CHECK (provider IN ('amazon')),
  display_name TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'not_connected' CHECK (status IN ('not_connected', 'configured', 'connected', 'error')),
  seller_external_id TEXT,
  region TEXT,
  marketplace_ids JSONB NOT NULL DEFAULT '[]',
  capabilities JSONB NOT NULL DEFAULT '[]',
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketplace_listings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  provider TEXT NOT NULL REFERENCES marketplace_connections(provider) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id TEXT REFERENCES product_variants(id) ON DELETE CASCADE,
  marketplace_id TEXT NOT NULL,
  external_sku TEXT NOT NULL,
  external_product_id TEXT,
  asin TEXT,
  fulfillment_channel TEXT NOT NULL DEFAULT 'merchant' CHECK (fulfillment_channel IN ('merchant', 'amazon')),
  status TEXT NOT NULL DEFAULT 'review' CHECK (status IN ('review', 'active', 'inactive', 'sync_error', 'out_of_stock', 'suppressed', 'price_error', 'archived')),
  price_minor BIGINT CHECK (price_minor IS NULL OR price_minor >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  inventory_quantity INTEGER CHECK (inventory_quantity IS NULL OR inventory_quantity >= 0),
  attributes JSONB NOT NULL DEFAULT '{}',
  issues_count INTEGER NOT NULL DEFAULT 0 CHECK (issues_count >= 0),
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, marketplace_id, external_sku)
);

CREATE TABLE IF NOT EXISTS marketplace_listing_issues (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  listing_id TEXT NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'error' CHECK (severity IN ('warning', 'error')),
  message TEXT NOT NULL,
  attribute_names JSONB NOT NULL DEFAULT '[]',
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketplace_orders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  provider TEXT NOT NULL REFERENCES marketplace_connections(provider) ON DELETE CASCADE,
  external_order_id TEXT NOT NULL,
  marketplace_id TEXT NOT NULL,
  status TEXT NOT NULL,
  fulfillment_channel TEXT,
  currency CHAR(3) NOT NULL,
  subtotal_minor BIGINT NOT NULL DEFAULT 0 CHECK (subtotal_minor >= 0),
  fees_minor BIGINT CHECK (fees_minor IS NULL OR fees_minor >= 0),
  total_minor BIGINT NOT NULL DEFAULT 0 CHECK (total_minor >= 0),
  purchase_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, external_order_id)
);

CREATE TABLE IF NOT EXISTS marketplace_order_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  marketplace_order_id TEXT NOT NULL REFERENCES marketplace_orders(id) ON DELETE CASCADE,
  external_order_item_id TEXT NOT NULL,
  listing_id TEXT REFERENCES marketplace_listings(id) ON DELETE SET NULL,
  external_sku TEXT,
  title TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  item_price_minor BIGINT NOT NULL DEFAULT 0 CHECK (item_price_minor >= 0),
  currency CHAR(3) NOT NULL,
  UNIQUE(marketplace_order_id, external_order_item_id)
);

CREATE TABLE IF NOT EXISTS marketplace_sync_runs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  provider TEXT NOT NULL REFERENCES marketplace_connections(provider) ON DELETE CASCADE,
  operation TEXT NOT NULL CHECK (operation IN ('listings', 'inventory', 'orders', 'pricing')),
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'partial', 'failed')),
  records_read INTEGER NOT NULL DEFAULT 0 CHECK (records_read >= 0),
  records_written INTEGER NOT NULL DEFAULT 0 CHECK (records_written >= 0),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS marketplace_jobs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  provider TEXT NOT NULL REFERENCES marketplace_connections(provider) ON DELETE CASCADE,
  listing_id TEXT REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('create_listing', 'update_listing', 'sync_inventory', 'sync_price', 'archive_listing')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'running', 'completed', 'failed', 'cancelled')),
  payload JSONB NOT NULL DEFAULT '{}',
  approved_by TEXT REFERENCES admin_users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO marketplace_connections (provider, display_name, capabilities) VALUES
  ('amazon', 'Amazon Seller Central', '["listings","inventory","orders","pricing"]')
ON CONFLICT (provider) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_marketplace_listings_product ON marketplace_listings(product_id, variant_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_status ON marketplace_listings(provider, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_issues_open ON marketplace_listing_issues(listing_id, severity) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_purchase ON marketplace_orders(provider, purchase_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_sync_runs_date ON marketplace_sync_runs(provider, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_jobs_status ON marketplace_jobs(provider, status, created_at);
