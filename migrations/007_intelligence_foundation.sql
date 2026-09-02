CREATE TABLE IF NOT EXISTS commerce_events (
  id BIGSERIAL PRIMARY KEY,
  event_name TEXT NOT NULL CHECK (event_name IN (
    'product_viewed','product_added_to_cart','checkout_started','purchase_created','purchase_completed',
    'cart_abandoned','cart_recovered','product_imported','supplier_synced','inventory_changed',
    'payment_completed','payment_failed','campaign_synced','amazon_listing_prepared','amazon_listing_updated'
  )),
  source TEXT NOT NULL DEFAULT 'store',
  entity_type TEXT,
  entity_id TEXT,
  session_hash TEXT,
  properties JSONB NOT NULL DEFAULT '{}',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kpi_definitions (
  key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  description TEXT NOT NULL,
  formula TEXT NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('currency', 'count', 'percentage', 'ratio', 'days')),
  data_quality TEXT NOT NULL DEFAULT 'available' CHECK (data_quality IN ('available', 'estimated', 'unavailable')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS business_metric_snapshots (
  id BIGSERIAL PRIMARY KEY,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  dimensions JSONB NOT NULL DEFAULT '{}',
  metrics JSONB NOT NULL DEFAULT '{}',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(period_start, period_end, dimensions)
);

CREATE TABLE IF NOT EXISTS ai_insights (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  fingerprint TEXT NOT NULL UNIQUE,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('sales','inventory','marketing','abandoned_cart','marketplace','profit','data_quality')),
  severity TEXT NOT NULL CHECK (severity IN ('info','opportunity','warning','critical')),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  evidence JSONB NOT NULL DEFAULT '{}',
  confidence NUMERIC(4,3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','acknowledged','dismissed','resolved')),
  generated_by TEXT NOT NULL DEFAULT 'rules-v1',
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS merchandising_recommendations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('feature','restock','discount_review','content_review','archive_review')),
  score NUMERIC(6,3) NOT NULL,
  reason TEXT NOT NULL,
  evidence JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed','approved','rejected','applied','expired')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, recommendation_type)
);

CREATE TABLE IF NOT EXISTS automation_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  trigger_event TEXT NOT NULL,
  conditions JSONB NOT NULL DEFAULT '[]',
  actions JSONB NOT NULL DEFAULT '[]',
  requires_approval BOOLEAN NOT NULL DEFAULT true,
  cooldown_minutes INTEGER NOT NULL DEFAULT 60 CHECK (cooldown_minutes >= 0),
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS automation_runs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  rule_id TEXT NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  trigger_event_id BIGINT REFERENCES commerce_events(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed','approved','running','completed','failed','rejected','cancelled')),
  input JSONB NOT NULL DEFAULT '{}',
  output JSONB NOT NULL DEFAULT '{}',
  approved_by TEXT REFERENCES admin_users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO kpi_definitions (key, display_name, description, formula, unit, data_quality) VALUES
  ('gross_sales', 'Ventas brutas', 'Valor total de pedidos pagados antes de devoluciones.', 'SUM(orders.total_usd WHERE payment_status=approved)', 'currency', 'available'),
  ('orders', 'Pedidos', 'Número de pedidos creados.', 'COUNT(orders)', 'count', 'available'),
  ('aov', 'Ticket promedio', 'Venta bruta dividida por pedidos pagados.', 'gross_sales / paid_orders', 'currency', 'available'),
  ('units', 'Unidades', 'Unidades incluidas en pedidos pagados.', 'SUM(order_items.quantity)', 'count', 'available'),
  ('refund_rate', 'Tasa de reembolso', 'Pedidos reembolsados sobre pedidos pagados.', 'refunded_orders / paid_orders', 'percentage', 'available'),
  ('cart_abandonment_rate', 'Abandono de carrito', 'Carritos abandonados sobre carritos consentidos.', 'abandoned_carts / captured_carts', 'percentage', 'available'),
  ('roas', 'ROAS', 'Ingresos atribuidos a campañas sobre inversión publicitaria.', 'attributed_revenue / ad_spend', 'ratio', 'available'),
  ('mer', 'MER', 'Venta total sobre inversión publicitaria.', 'gross_sales / ad_spend', 'ratio', 'available'),
  ('gross_margin', 'Margen bruto', 'Venta menos costo de producto.', 'gross_sales - product_cost', 'currency', 'unavailable'),
  ('contribution_profit', 'Beneficio de contribución', 'Venta menos producto, pagos, envío, marketplace, publicidad, descuentos y devoluciones.', 'revenue - all_variable_costs', 'currency', 'unavailable'),
  ('conversion_rate', 'Conversión', 'Compras sobre sesiones.', 'purchases / sessions', 'percentage', 'unavailable'),
  ('ltv', 'LTV', 'Valor acumulado por cliente.', 'customer_lifetime_revenue', 'currency', 'estimated')
ON CONFLICT (key) DO UPDATE SET display_name=EXCLUDED.display_name, description=EXCLUDED.description, formula=EXCLUDED.formula, unit=EXCLUDED.unit, data_quality=EXCLUDED.data_quality, updated_at=NOW();

INSERT INTO automation_rules (id, name, description, trigger_event, conditions, actions, requires_approval, enabled) VALUES
  ('rule-low-stock', 'Revisar stock bajo', 'Propone reposición cuando el inventario cae bajo el umbral.', 'inventory_changed', '[{"field":"stock","operator":"lt","value":5}]', '[{"type":"create_insight","severity":"warning"}]', true, false),
  ('rule-high-value-cart', 'Recuperar carrito de alto valor', 'Propone revisar carritos abandonados superiores a USD 100.', 'cart_abandoned', '[{"field":"subtotal_usd","operator":"gte","value":100}]', '[{"type":"queue_recovery_draft"}]', true, false),
  ('rule-suppressed-listing', 'Alertar listing suprimido', 'Genera alerta cuando Amazon informa un listing suprimido.', 'amazon_listing_updated', '[{"field":"status","operator":"eq","value":"suppressed"}]', '[{"type":"create_insight","severity":"critical"}]', true, false),
  ('rule-campaign-review', 'Revisar campaña sin conversión', 'Propone revisión cuando hay inversión sin conversiones.', 'campaign_synced', '[{"field":"spend_minor","operator":"gt","value":0},{"field":"conversions","operator":"eq","value":0}]', '[{"type":"create_insight","severity":"warning"}]', true, false)
ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_commerce_events_name_date ON commerce_events(event_name, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_commerce_events_entity ON commerce_events(entity_type, entity_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_insights_status_severity ON ai_insights(status, severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_merchandising_recommendations_status ON merchandising_recommendations(status, score DESC);
CREATE INDEX IF NOT EXISTS idx_automation_runs_rule_date ON automation_runs(rule_id, created_at DESC);
