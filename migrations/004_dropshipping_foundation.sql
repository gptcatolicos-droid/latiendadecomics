CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL CHECK (provider IN ('manual', 'printful', 'printify')),
  name TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'not_connected'
    CHECK (status IN ('not_connected', 'configured', 'connected', 'syncing', 'error', 'paused')),
  external_store_id TEXT,
  capabilities JSONB NOT NULL DEFAULT '[]',
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, external_store_id)
);

CREATE TABLE IF NOT EXISTS supplier_products (
  id TEXT PRIMARY KEY,
  supplier_id TEXT NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  external_sku TEXT,
  image_url TEXT,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  cost_minor BIGINT CHECK (cost_minor IS NULL OR cost_minor >= 0),
  retail_minor BIGINT CHECK (retail_minor IS NULL OR retail_minor >= 0),
  inventory_quantity INTEGER,
  availability TEXT NOT NULL DEFAULT 'unknown'
    CHECK (availability IN ('available', 'limited', 'out_of_stock', 'unknown')),
  raw_data JSONB NOT NULL DEFAULT '{}',
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(supplier_id, external_id)
);

CREATE TABLE IF NOT EXISTS supplier_product_variants (
  id TEXT PRIMARY KEY,
  supplier_product_id TEXT NOT NULL REFERENCES supplier_products(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  sku TEXT,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  cost_minor BIGINT CHECK (cost_minor IS NULL OR cost_minor >= 0),
  retail_minor BIGINT CHECK (retail_minor IS NULL OR retail_minor >= 0),
  inventory_quantity INTEGER,
  available BOOLEAN NOT NULL DEFAULT true,
  option_values JSONB NOT NULL DEFAULT '{}',
  raw_data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(supplier_product_id, external_id)
);

CREATE TABLE IF NOT EXISTS supplier_import_queue (
  id TEXT PRIMARY KEY,
  supplier_product_id TEXT NOT NULL REFERENCES supplier_products(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'review'
    CHECK (status IN ('review', 'approved', 'importing', 'imported', 'failed', 'rejected')),
  draft JSONB NOT NULL DEFAULT '{}',
  imported_product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(supplier_product_id)
);

CREATE TABLE IF NOT EXISTS supplier_pricing_rules (
  id TEXT PRIMARY KEY,
  supplier_id TEXT REFERENCES suppliers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  strategy TEXT NOT NULL CHECK (strategy IN ('fixed_margin', 'multiplier', 'fixed_profit')),
  value NUMERIC(12,4) NOT NULL CHECK (value >= 0),
  minimum_margin_percent NUMERIC(7,2) NOT NULL DEFAULT 15 CHECK (minimum_margin_percent >= 0),
  rounding TEXT NOT NULL DEFAULT 'none' CHECK (rounding IN ('none', 'ninety_nine', 'whole')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_sync_runs (
  id TEXT PRIMARY KEY,
  supplier_id TEXT NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'partial', 'failed')),
  trigger_type TEXT NOT NULL DEFAULT 'manual' CHECK (trigger_type IN ('manual', 'scheduled', 'webhook')),
  products_seen INTEGER NOT NULL DEFAULT 0,
  products_updated INTEGER NOT NULL DEFAULT 0,
  variants_updated INTEGER NOT NULL DEFAULT 0,
  discrepancies INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS fulfillment_orders (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  supplier_id TEXT NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  external_order_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'review', 'submitted', 'accepted', 'in_production', 'shipped', 'delivered', 'cancelled', 'failed')),
  shipping_cost_minor BIGINT CHECK (shipping_cost_minor IS NULL OR shipping_cost_minor >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  tracking_number TEXT,
  tracking_url TEXT,
  last_error TEXT,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(supplier_id, external_order_id)
);

CREATE TABLE IF NOT EXISTS fulfillment_events (
  id TEXT PRIMARY KEY,
  fulfillment_order_id TEXT NOT NULL REFERENCES fulfillment_orders(id) ON DELETE CASCADE,
  provider_event_id TEXT,
  event_type TEXT NOT NULL,
  status TEXT,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(fulfillment_order_id, provider_event_id)
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_id TEXT REFERENCES suppliers(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_product_id TEXT REFERENCES supplier_products(id) ON DELETE SET NULL;

INSERT INTO suppliers (id, provider, name, enabled, status, capabilities) VALUES
  ('supplier-printful', 'printful', 'Printful', false, 'not_connected', '["products","variants","orders","tracking","webhooks"]'),
  ('supplier-printify', 'printify', 'Printify', false, 'not_connected', '["products","variants","inventory","orders","tracking","webhooks"]')
ON CONFLICT (id) DO NOTHING;

INSERT INTO supplier_pricing_rules (id, supplier_id, name, strategy, value, minimum_margin_percent, rounding) VALUES
  ('pricing-printful-default', 'supplier-printful', 'Printful · margen seguro', 'multiplier', 2, 20, 'ninety_nine'),
  ('pricing-printify-default', 'supplier-printify', 'Printify · margen seguro', 'multiplier', 2, 20, 'ninety_nine')
ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(enabled, status);
CREATE INDEX IF NOT EXISTS idx_supplier_products_supplier_sync ON supplier_products(supplier_id, last_synced_at DESC);
CREATE INDEX IF NOT EXISTS idx_supplier_products_availability ON supplier_products(supplier_id, availability);
CREATE INDEX IF NOT EXISTS idx_supplier_variants_product ON supplier_product_variants(supplier_product_id, available);
CREATE INDEX IF NOT EXISTS idx_supplier_import_queue_status ON supplier_import_queue(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_sync_runs_supplier ON inventory_sync_runs(supplier_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_fulfillment_orders_order ON fulfillment_orders(order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fulfillment_orders_status ON fulfillment_orders(status, updated_at DESC);
