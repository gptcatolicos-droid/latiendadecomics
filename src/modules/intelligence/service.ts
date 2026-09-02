import { query } from '@/lib/db';
import { generateInsights, percentChange, type IntelligenceSnapshot } from './rules';

export async function refreshIntelligence() {
  const [sales, inventory, carts, ads, marketplace, events] = await Promise.all([
    query(`SELECT
      COALESCE(SUM(total_usd) FILTER (WHERE payment_status='approved' AND created_at >= NOW()-INTERVAL '30 days'),0)::numeric AS revenue_30d,
      COALESCE(SUM(total_usd) FILTER (WHERE payment_status='approved' AND created_at >= NOW()-INTERVAL '60 days' AND created_at < NOW()-INTERVAL '30 days'),0)::numeric AS revenue_previous_30d,
      COUNT(*) FILTER (WHERE payment_status='approved' AND created_at >= NOW()-INTERVAL '30 days')::int AS paid_orders_30d,
      COUNT(*) FILTER (WHERE created_at >= NOW()-INTERVAL '30 days')::int AS orders_30d
      FROM orders`),
    query(`SELECT COUNT(*) FILTER (WHERE status='published' AND stock BETWEEN 1 AND 4)::int AS low_stock,
                  COUNT(*) FILTER (WHERE status='published' AND stock=0)::int AS out_of_stock,
                  COUNT(*) FILTER (WHERE status='published' AND supplier_product_id IS NOT NULL)::int AS with_supplier_cost,
                  COUNT(*) FILTER (WHERE status='published')::int AS published
           FROM products`),
    query(`SELECT COUNT(*) FILTER (WHERE status IN ('abandoned','recovery_queued'))::int AS abandoned,
                  COALESCE(SUM(subtotal_usd) FILTER (WHERE status IN ('abandoned','recovery_queued')),0)::numeric AS recoverable_usd
           FROM abandoned_carts`),
    query(`SELECT COUNT(*) FILTER (WHERE spend_minor>0 AND conversions=0)::int AS no_conversions,
                  COALESCE(SUM(spend_minor) FILTER (WHERE spend_minor>0 AND conversions=0),0)::bigint AS inefficient_spend,
                  COALESCE(SUM(spend_minor),0)::bigint AS total_spend FROM ad_campaigns`),
    query(`SELECT COUNT(*) FILTER (WHERE status IN ('sync_error','out_of_stock','suppressed','price_error'))::int AS attention FROM marketplace_listings`),
    query(`SELECT COUNT(*) FILTER (WHERE event_name='purchase_completed' AND occurred_at >= NOW()-INTERVAL '30 days')::int AS purchases,
                  COUNT(DISTINCT session_hash) FILTER (WHERE session_hash IS NOT NULL AND occurred_at >= NOW()-INTERVAL '30 days')::int AS sessions
           FROM commerce_events`),
  ]);
  const sale = sales.rows[0]; const stock = inventory.rows[0]; const cart = carts.rows[0]; const ad = ads.rows[0]; const market = marketplace.rows[0]; const event = events.rows[0];
  const snapshot: IntelligenceSnapshot = {
    revenue30d: Number(sale.revenue_30d), revenuePrevious30d: Number(sale.revenue_previous_30d), paidOrders30d: Number(sale.paid_orders_30d),
    lowStockProducts: Number(stock.low_stock), outOfStockProducts: Number(stock.out_of_stock), abandonedCarts: Number(cart.abandoned),
    recoverableUsd: Number(cart.recoverable_usd), campaignsWithoutConversions: Number(ad.no_conversions), inefficientSpendMinor: Number(ad.inefficient_spend),
    marketplaceAttention: Number(market.attention), hasProductCosts: Number(stock.published) > 0 && Number(stock.with_supplier_cost) === Number(stock.published), sessions30d: Number(event.sessions),
  };
  const generated = generateInsights(snapshot);
  for (const insight of generated) {
    await query(
      `INSERT INTO ai_insights (fingerprint, insight_type, severity, title, summary, recommendation, evidence, confidence, valid_until)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,NOW()+INTERVAL '36 hours')
       ON CONFLICT (fingerprint) DO UPDATE SET insight_type=EXCLUDED.insight_type,severity=EXCLUDED.severity,title=EXCLUDED.title,
         summary=EXCLUDED.summary,recommendation=EXCLUDED.recommendation,evidence=EXCLUDED.evidence,confidence=EXCLUDED.confidence,
         status=CASE WHEN ai_insights.status='dismissed' THEN 'dismissed' ELSE 'open' END,valid_until=EXCLUDED.valid_until,updated_at=NOW()`,
      [insight.fingerprint, insight.type, insight.severity, insight.title, insight.summary, insight.recommendation, JSON.stringify(insight.evidence), insight.confidence]
    );
  }
  const fingerprints = generated.map(item => item.fingerprint);
  if (fingerprints.length) {
    await query(`UPDATE ai_insights SET status='resolved',updated_at=NOW() WHERE generated_by='rules-v1' AND status='open' AND NOT (fingerprint=ANY($1::text[]))`, [fingerprints]);
  }

  const topProducts = await query(`SELECT p.id,p.title,p.stock,COALESCE(SUM(oi.quantity),0)::int AS units,
      COALESCE(SUM(oi.quantity*oi.price_usd),0)::numeric AS revenue
    FROM products p JOIN order_items oi ON oi.product_id=p.id JOIN orders o ON o.id=oi.order_id
    WHERE o.payment_status='approved' AND o.created_at>=NOW()-INTERVAL '30 days'
    GROUP BY p.id,p.title,p.stock ORDER BY revenue DESC LIMIT 10`);
  for (const product of topProducts.rows) {
    const kind = Number(product.stock) >= 0 && Number(product.stock) < 5 ? 'restock' : 'feature';
    await query(`INSERT INTO merchandising_recommendations (product_id,recommendation_type,score,reason,evidence,expires_at)
      VALUES ($1,$2,$3,$4,$5::jsonb,NOW()+INTERVAL '7 days')
      ON CONFLICT (product_id,recommendation_type) DO UPDATE SET score=EXCLUDED.score,reason=EXCLUDED.reason,evidence=EXCLUDED.evidence,status='proposed',expires_at=EXCLUDED.expires_at,updated_at=NOW()`,
      [product.id, kind, Number(product.revenue), kind === 'restock' ? 'Ventas recientes con inventario crítico.' : 'Producto con ingresos pagados recientes.', JSON.stringify({ units: Number(product.units), revenue: Number(product.revenue), stock: Number(product.stock) })]
    );
  }
  return { snapshot, generated: generated.length, orders30d: Number(sale.orders_30d), totalSpendMinor: Number(ad.total_spend), purchases30d: Number(event.purchases) };
}

export async function getIntelligenceDashboard() {
  const current = await refreshIntelligence();
  const [insights, kpis, recommendations, rules, events] = await Promise.all([
    query(`SELECT * FROM ai_insights WHERE status IN ('open','acknowledged') ORDER BY CASE severity WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 WHEN 'opportunity' THEN 3 ELSE 4 END, created_at DESC LIMIT 30`),
    query('SELECT * FROM kpi_definitions ORDER BY display_name'),
    query(`SELECT r.*,p.title AS product_title FROM merchandising_recommendations r LEFT JOIN products p ON p.id=r.product_id WHERE r.status='proposed' AND (r.expires_at IS NULL OR r.expires_at>NOW()) ORDER BY r.score DESC LIMIT 20`),
    query('SELECT * FROM automation_rules ORDER BY name'),
    query(`SELECT event_name,COUNT(*)::int AS count FROM commerce_events WHERE occurred_at>=NOW()-INTERVAL '30 days' GROUP BY event_name ORDER BY count DESC`),
  ]);
  const revenueChange = percentChange(current.snapshot.revenue30d, current.snapshot.revenuePrevious30d);
  const aov = current.snapshot.paidOrders30d ? current.snapshot.revenue30d / current.snapshot.paidOrders30d : 0;
  return { metrics: { ...current.snapshot, orders30d: current.orders30d, revenueChange, aov, eventPurchases30d: current.purchases30d }, insights: insights.rows, kpis: kpis.rows, recommendations: recommendations.rows, rules: rules.rows, events: events.rows, dataAsOf: new Date().toISOString() };
}

export async function updateInsightStatus(id: string, status: 'acknowledged' | 'dismissed') {
  const result = await query("UPDATE ai_insights SET status=$2,updated_at=NOW() WHERE id=$1 AND status IN ('open','acknowledged') RETURNING id", [id, status]);
  return Boolean(result.rows[0]);
}
