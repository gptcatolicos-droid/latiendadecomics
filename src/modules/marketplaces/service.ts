import { v4 as uuid } from 'uuid';
import { query, withTransaction } from '@/lib/db';
import { AmazonMarketplaceAdapter } from './amazon';

const amazon = new AmazonMarketplaceAdapter();

export class MarketplaceInputError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

function listingSku(slug: string, variantSku?: string | null) {
  const value = (variantSku || slug).toUpperCase().replace(/[^A-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  return value || `LTC-${uuid().slice(0, 8).toUpperCase()}`;
}

export async function prepareAmazonListing(productId: string, variantId?: string | null) {
  return withTransaction(async client => {
    const result = await client.query(
      `SELECT p.id, p.slug, p.title, p.description, p.price_usd, p.stock, p.status,
              v.id AS variant_id, v.sku AS variant_sku, v.title AS variant_title,
              COALESCE(v.price_usd, p.price_usd) AS listing_price,
              COALESCE(v.stock, p.stock) AS listing_stock
       FROM products p LEFT JOIN product_variants v ON v.id=$2 AND v.product_id=p.id
       WHERE p.id=$1`,
      [productId, variantId || null]
    );
    const product = result.rows[0];
    if (!product || product.status !== 'published') throw new MarketplaceInputError('El producto debe estar publicado antes de preparar el listing.', 409);
    if (variantId && !product.variant_id) throw new MarketplaceInputError('La variante no pertenece al producto.');

    const marketplaceId = amazon.marketplaceIds()[0] || 'pending-marketplace';
    const externalSku = listingSku(product.slug, product.variant_sku);
    const listing = await client.query(
      `INSERT INTO marketplace_listings (
        id, provider, product_id, variant_id, marketplace_id, external_sku, status,
        price_minor, currency, inventory_quantity, attributes
      ) VALUES ($1,'amazon',$2,$3,$4,$5,'review',$6,'USD',$7,$8::jsonb)
      ON CONFLICT (provider, marketplace_id, external_sku) DO UPDATE SET
        price_minor=EXCLUDED.price_minor, inventory_quantity=EXCLUDED.inventory_quantity,
        attributes=EXCLUDED.attributes, updated_at=NOW()
      RETURNING *`,
      [uuid(), productId, product.variant_id || null, marketplaceId, externalSku,
        Math.round(Number(product.listing_price) * 100), Math.max(0, Number(product.listing_stock)),
        JSON.stringify({ title: product.title, description: product.description, variantTitle: product.variant_title || null })]
    );
    await client.query(
      `INSERT INTO marketplace_jobs (id, provider, listing_id, action, payload)
       VALUES ($1,'amazon',$2,'create_listing',$3::jsonb)`,
      [uuid(), listing.rows[0].id, JSON.stringify({ marketplaceId, externalSku, mode: 'review_only' })]
    );
    return listing.rows[0];
  });
}

export async function archiveMarketplaceListing(listingId: string) {
  const result = await query(
    `UPDATE marketplace_listings SET status='archived', updated_at=NOW()
     WHERE id=$1 AND status <> 'archived' RETURNING id`,
    [listingId]
  );
  if (!result.rows[0]) return false;
  await query(
    `UPDATE marketplace_jobs SET status='cancelled', updated_at=NOW()
     WHERE listing_id=$1 AND status IN ('draft','approved')`,
    [listingId]
  );
  return true;
}

export async function getMarketplaceDashboard() {
  const [connection, totals, listings, candidates, orders, runs, jobs] = await Promise.all([
    query("SELECT * FROM marketplace_connections WHERE provider='amazon'"),
    query(`SELECT COUNT(*)::int AS total,
                  COUNT(*) FILTER (WHERE status='active')::int AS active,
                  COUNT(*) FILTER (WHERE status='review')::int AS review,
                  COUNT(*) FILTER (WHERE status IN ('sync_error','suppressed','price_error','out_of_stock'))::int AS attention
           FROM marketplace_listings WHERE provider='amazon'`),
    query(`SELECT l.*, p.title AS product_title, p.slug, v.title AS variant_title,
                  COUNT(i.id) FILTER (WHERE i.resolved_at IS NULL)::int AS open_issues
           FROM marketplace_listings l JOIN products p ON p.id=l.product_id
           LEFT JOIN product_variants v ON v.id=l.variant_id
           LEFT JOIN marketplace_listing_issues i ON i.listing_id=l.id
           WHERE l.provider='amazon'
           GROUP BY l.id,p.title,p.slug,v.title ORDER BY l.updated_at DESC LIMIT 100`),
    query(`SELECT p.id, p.title, p.slug, p.price_usd, p.stock,
                  (SELECT url FROM product_images WHERE product_id=p.id ORDER BY is_primary DESC, sort_order LIMIT 1) AS image_url
           FROM products p WHERE p.status='published'
             AND NOT EXISTS (SELECT 1 FROM marketplace_listings l WHERE l.product_id=p.id AND l.provider='amazon' AND l.status <> 'archived')
           ORDER BY p.updated_at DESC LIMIT 30`),
    query(`SELECT * FROM marketplace_orders WHERE provider='amazon' ORDER BY purchase_at DESC NULLS LAST LIMIT 50`),
    query(`SELECT * FROM marketplace_sync_runs WHERE provider='amazon' ORDER BY started_at DESC LIMIT 20`),
    query(`SELECT COUNT(*) FILTER (WHERE status='draft')::int AS draft,
                  COUNT(*) FILTER (WHERE status='failed')::int AS failed FROM marketplace_jobs WHERE provider='amazon'`),
  ]);

  const row = connection.rows[0] || {};
  return {
    metrics: { ...totals.rows[0], ...jobs.rows[0], orders: orders.rowCount || 0 },
    connection: {
      ...row,
      configured: amazon.isConfigured(),
      featureEnabled: (process.env.ENABLE_AMAZON || '').toLowerCase() === 'true',
      missing: amazon.missingConfiguration(),
      seller_external_id: amazon.sellerId() || row.seller_external_id,
      marketplace_ids: amazon.marketplaceIds().length ? amazon.marketplaceIds() : row.marketplace_ids,
      mode: 'read_only',
    },
    listings: listings.rows,
    candidates: candidates.rows,
    orders: orders.rows,
    syncRuns: runs.rows,
  };
}
