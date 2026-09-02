CREATE TABLE IF NOT EXISTS growth_connections (
  provider TEXT PRIMARY KEY CHECK (provider IN ('meta', 'google_ads', 'tiktok_ads', 'ga4')),
  display_name TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'not_connected' CHECK (status IN ('not_connected', 'configured', 'connected', 'error')),
  account_external_id TEXT,
  account_name TEXT,
  capabilities JSONB NOT NULL DEFAULT '[]',
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ad_campaigns (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  provider TEXT NOT NULL REFERENCES growth_connections(provider) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unknown' CHECK (status IN ('active', 'paused', 'completed', 'draft', 'unknown')),
  objective TEXT,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  spend_minor BIGINT NOT NULL DEFAULT 0 CHECK (spend_minor >= 0),
  impressions BIGINT NOT NULL DEFAULT 0 CHECK (impressions >= 0),
  clicks BIGINT NOT NULL DEFAULT 0 CHECK (clicks >= 0),
  conversions NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (conversions >= 0),
  revenue_minor BIGINT NOT NULL DEFAULT 0 CHECK (revenue_minor >= 0),
  date_start DATE,
  date_end DATE,
  provider_payload JSONB NOT NULL DEFAULT '{}',
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, external_id)
);

CREATE TABLE IF NOT EXISTS marketing_sync_runs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  provider TEXT NOT NULL REFERENCES growth_connections(provider) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'partial', 'failed')),
  campaigns_updated INTEGER NOT NULL DEFAULT 0 CHECK (campaigns_updated >= 0),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS abandoned_carts (
  id TEXT PRIMARY KEY,
  email_hash TEXT NOT NULL,
  email_ciphertext TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  item_count INTEGER NOT NULL DEFAULT 0 CHECK (item_count >= 0 AND item_count <= 100),
  subtotal_usd NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (subtotal_usd >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'abandoned', 'recovery_queued', 'recovered', 'converted', 'unsubscribed', 'expired')),
  marketing_consent_at TIMESTAMPTZ NOT NULL,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  abandoned_at TIMESTAMPTZ,
  recovered_at TIMESTAMPTZ,
  converted_order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
  unsubscribe_token_hash TEXT NOT NULL UNIQUE,
  source JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS abandoned_cart_events (
  id BIGSERIAL PRIMARY KEY,
  cart_id TEXT NOT NULL REFERENCES abandoned_carts(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('captured', 'updated', 'abandoned', 'recovery_queued', 'recovered', 'converted', 'unsubscribed', 'expired')),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketing_outbox (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  cart_id TEXT REFERENCES abandoned_carts(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp')),
  template_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'sending', 'sent', 'failed', 'cancelled')),
  deduplication_key TEXT NOT NULL UNIQUE,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  provider_message_id TEXT,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketing_attributions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  order_id TEXT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  cart_id TEXT REFERENCES abandoned_carts(id) ON DELETE SET NULL,
  source TEXT,
  medium TEXT,
  campaign TEXT,
  content TEXT,
  term TEXT,
  click_id TEXT,
  first_touch JSONB NOT NULL DEFAULT '{}',
  last_touch JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO growth_connections (provider, display_name, capabilities) VALUES
  ('meta', 'Meta Ads', '["campaign_read","insights_read"]'),
  ('google_ads', 'Google Ads', '["campaign_read","reporting_read"]'),
  ('tiktok_ads', 'TikTok Ads', '["campaign_read","reporting_read"]'),
  ('ga4', 'Google Analytics 4', '["ecommerce_events","reporting_read"]')
ON CONFLICT (provider) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_ad_campaigns_provider_status ON ad_campaigns(provider, status, synced_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_sync_runs_provider_date ON marketing_sync_runs(provider, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_status_activity ON abandoned_carts(status, last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_email_hash ON abandoned_carts(email_hash);
CREATE INDEX IF NOT EXISTS idx_abandoned_cart_events_cart_date ON abandoned_cart_events(cart_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_outbox_status_schedule ON marketing_outbox(status, scheduled_at);
