import { query } from '@/lib/db';
import { abandonedCartConfiguration, getGrowthProviderConfigs } from './config';
import { hashEmail, hashToken, maskEmail, openEmail, sealEmail, unsubscribeToken } from './crypto';
import type { CaptureCartInput } from './schemas';

export class GrowthConfigurationError extends Error {}

export async function captureAbandonedCart(input: CaptureCartInput) {
  const configuration = abandonedCartConfiguration();
  if (!configuration.configured || !configuration.encryptionKey) {
    throw new GrowthConfigurationError('La recuperación de carritos aún no está configurada.');
  }

  const token = unsubscribeToken(input.cartId, configuration.encryptionKey);
  const encryptedEmail = sealEmail(input.email, configuration.encryptionKey);
  const itemCount = input.items.reduce((sum, item) => sum + item.quantity, 0);
  const saved = await query(
    `INSERT INTO abandoned_carts (
      id, email_hash, email_ciphertext, items, item_count, subtotal_usd,
      marketing_consent_at, unsubscribe_token_hash, source, last_activity_at
    ) VALUES ($1,$2,$3,$4::jsonb,$5,$6,NOW(),$7,$8::jsonb,NOW())
    ON CONFLICT (id) DO UPDATE SET
      email_hash = EXCLUDED.email_hash,
      email_ciphertext = EXCLUDED.email_ciphertext,
      items = EXCLUDED.items,
      item_count = EXCLUDED.item_count,
      subtotal_usd = EXCLUDED.subtotal_usd,
      source = EXCLUDED.source,
      status = CASE WHEN abandoned_carts.status IN ('converted','unsubscribed') THEN abandoned_carts.status ELSE 'active' END,
      marketing_consent_at = EXCLUDED.marketing_consent_at,
      last_activity_at = NOW(),
      updated_at = NOW()
    RETURNING id, status, (xmax = 0) AS inserted`,
    [input.cartId, hashEmail(input.email), encryptedEmail, JSON.stringify(input.items), itemCount, input.subtotalUsd, hashToken(token), JSON.stringify(input.source)]
  );
  const eventType = saved.rows[0].inserted ? 'captured' : 'updated';
  await query(
    'INSERT INTO abandoned_cart_events (cart_id, event_type, metadata) VALUES ($1,$2,$3::jsonb)',
    [input.cartId, eventType, JSON.stringify({ itemCount, subtotalUsd: input.subtotalUsd })]
  );
  await query(
    `INSERT INTO commerce_events (event_name,source,entity_type,entity_id,properties)
     VALUES ('checkout_started','store','cart',$1,$2::jsonb)`,
    [input.cartId, JSON.stringify({ itemCount, subtotalUsd: input.subtotalUsd, currency: 'USD', attribution: input.source })]
  );
  return { cartId: saved.rows[0].id, status: saved.rows[0].status };
}

export async function unsubscribeCart(token: string) {
  const result = await query(
    `UPDATE abandoned_carts SET status='unsubscribed', updated_at=NOW()
     WHERE unsubscribe_token_hash=$1 AND status <> 'unsubscribed'
     RETURNING id`,
    [hashToken(token)]
  );
  if (!result.rows[0]) return false;
  await query("INSERT INTO abandoned_cart_events (cart_id, event_type) VALUES ($1,'unsubscribed')", [result.rows[0].id]);
  await query("UPDATE marketing_outbox SET status='cancelled', updated_at=NOW() WHERE cart_id=$1 AND status IN ('draft','approved')", [result.rows[0].id]);
  return true;
}

export async function updateCartStatus(cartId: string, status: 'abandoned' | 'recovered' | 'expired') {
  const dateColumn = status === 'abandoned' ? 'abandoned_at' : status === 'recovered' ? 'recovered_at' : 'updated_at';
  const result = await query(
    `UPDATE abandoned_carts SET status=$2, ${dateColumn}=NOW(), updated_at=NOW()
     WHERE id=$1 AND status NOT IN ('converted','unsubscribed') RETURNING id`,
    [cartId, status]
  );
  if (result.rows[0]) {
    await query('INSERT INTO abandoned_cart_events (cart_id, event_type) VALUES ($1,$2)', [cartId, status]);
    if (status === 'recovered' || status === 'expired') {
      await query(
        "UPDATE marketing_outbox SET status='cancelled', updated_at=NOW() WHERE cart_id=$1 AND status IN ('draft','approved')",
        [cartId]
      );
    }
  }
  return Boolean(result.rows[0]);
}

export async function getGrowthDashboard() {
  const marked = await query(
    `UPDATE abandoned_carts SET status='abandoned', abandoned_at=NOW(), updated_at=NOW()
     WHERE status='active' AND last_activity_at <= NOW() - INTERVAL '1 hour'
     RETURNING id`
  );
  for (const cart of marked.rows) {
    await query("INSERT INTO abandoned_cart_events (cart_id, event_type) VALUES ($1,'abandoned')", [cart.id]);
    await query("INSERT INTO commerce_events (event_name,source,entity_type,entity_id) VALUES ('cart_abandoned','store','cart',$1)", [cart.id]);
    await query(
      `INSERT INTO marketing_outbox (cart_id, channel, template_key, deduplication_key)
       VALUES ($1,'email','abandoned-cart-v1',$2) ON CONFLICT (deduplication_key) DO NOTHING`,
      [cart.id, `abandoned-cart-v1:${cart.id}`]
    );
  }

  const [connections, campaigns, campaignTotals, cartTotals, carts, commerce] = await Promise.all([
    query('SELECT * FROM growth_connections ORDER BY provider'),
    query(`SELECT * FROM ad_campaigns ORDER BY synced_at DESC LIMIT 50`),
    query(`SELECT COALESCE(SUM(spend_minor),0)::bigint AS spend_minor, COALESCE(SUM(impressions),0)::bigint AS impressions,
                  COALESCE(SUM(clicks),0)::bigint AS clicks, COALESCE(SUM(conversions),0)::numeric AS conversions,
                  COALESCE(SUM(revenue_minor),0)::bigint AS revenue_minor FROM ad_campaigns`),
    query(`SELECT COUNT(*) FILTER (WHERE status IN ('active','abandoned','recovery_queued'))::int AS open,
                  COUNT(*) FILTER (WHERE status='recovered')::int AS recovered,
                  COUNT(*) FILTER (WHERE status='converted')::int AS converted,
                  COALESCE(SUM(subtotal_usd) FILTER (WHERE status IN ('active','abandoned','recovery_queued')),0)::numeric AS recoverable_usd
           FROM abandoned_carts`),
    query(`SELECT id, email_ciphertext, item_count, subtotal_usd, status, source, last_activity_at, abandoned_at, recovered_at
           FROM abandoned_carts ORDER BY last_activity_at DESC LIMIT 100`),
    query(`SELECT COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::int AS orders_30d,
                  COUNT(*) FILTER (WHERE payment_status='approved' AND created_at >= NOW() - INTERVAL '30 days')::int AS paid_orders_30d,
                  COALESCE(SUM(total_usd) FILTER (WHERE payment_status='approved' AND created_at >= NOW() - INTERVAL '30 days'),0)::numeric AS revenue_30d
           FROM orders`),
  ]);

  const runtime = new Map(getGrowthProviderConfigs().map(item => [item.provider, item]));
  const mergedConnections = connections.rows.map(row => {
    const config = runtime.get(row.provider);
    return {
      ...row,
      configured: Boolean(config?.configured),
      featureEnabled: Boolean(config?.featureEnabled),
      missing: config?.missing || [],
      mode: 'read_only',
      account_external_id: config?.accountExternalId || row.account_external_id,
    };
  });

  const encryptionKey = abandonedCartConfiguration().encryptionKey;
  const safeCarts = carts.rows.map(row => {
    let email = 'correo protegido';
    if (encryptionKey) {
      try { email = maskEmail(openEmail(row.email_ciphertext, encryptionKey)); } catch {}
    }
    const { email_ciphertext: _hidden, ...safe } = row;
    return { ...safe, email };
  });

  return {
    metrics: {
      ...campaignTotals.rows[0],
      ...cartTotals.rows[0],
      ...commerce.rows[0],
    },
    recovery: { ...abandonedCartConfiguration(), encryptionKey: undefined },
    connections: mergedConnections,
    campaigns: campaigns.rows,
    carts: safeCarts,
  };
}
