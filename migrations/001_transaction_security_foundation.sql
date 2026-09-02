ALTER TABLE orders ADD COLUMN IF NOT EXISTS public_token_hash TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS inventory_status TEXT NOT NULL DEFAULT 'unreserved';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS reservation_expires_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS confirmation_sent_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_public_token_hash
  ON orders(public_token_hash) WHERE public_token_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

CREATE TABLE IF NOT EXISTS order_number_sequences (
  year INTEGER PRIMARY KEY,
  next_value BIGINT NOT NULL CHECK (next_value > 0)
);

CREATE TABLE IF NOT EXISTS inventory_reservations (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0 AND quantity <= 25),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'committed', 'released', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(order_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_reservations_available
  ON inventory_reservations(product_id, status, expires_at);

CREATE TABLE IF NOT EXISTS coupon_reservations (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  coupon_id TEXT NOT NULL REFERENCES coupons(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'consumed', 'released', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupon_reservations_usage
  ON coupon_reservations(coupon_id, status, expires_at);

CREATE TABLE IF NOT EXISTS payment_webhook_events (
  id BIGSERIAL PRIMARY KEY,
  provider TEXT NOT NULL,
  event_key TEXT NOT NULL,
  external_id TEXT,
  event_type TEXT,
  payload_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'processed', 'ignored', 'failed')),
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  UNIQUE(provider, event_key)
);

CREATE INDEX IF NOT EXISTS idx_payment_webhook_external
  ON payment_webhook_events(provider, external_id);

CREATE TABLE IF NOT EXISTS admin_auth_events (
  id BIGSERIAL PRIMARY KEY,
  email TEXT,
  ip_hash TEXT,
  success BOOLEAN NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_auth_events_created
  ON admin_auth_events(created_at DESC);

