import { randomUUID } from 'node:crypto';
import slugify from 'slugify';
import { query, withTransaction } from '@/lib/db';
import { calculateSupplierRetail, createSupplierAdapter, getSupplierConnectionState } from '.';
import { SupplierProduct, SupplierProvider } from './types';

const PROVIDERS: SupplierProvider[] = ['printful', 'printify'];
const MAX_SYNC_PAGES = 20;

export async function getDropshippingDashboard() {
  const [suppliers, metrics, catalog, queue, syncRuns, fulfillments] = await Promise.all([
    query(`SELECT id,provider,name,enabled,status,external_store_id,capabilities,last_sync_at,last_error
      FROM suppliers ORDER BY name`),
    query(`SELECT
      (SELECT COUNT(*)::int FROM suppliers WHERE status='connected') AS connected_suppliers,
      (SELECT COUNT(*)::int FROM supplier_products) AS catalog_products,
      (SELECT COUNT(*)::int FROM supplier_import_queue WHERE status IN ('review','approved','failed')) AS pending_imports,
      (SELECT COUNT(*)::int FROM fulfillment_orders WHERE status NOT IN ('delivered','cancelled','failed')) AS active_fulfillments`),
    query(`SELECT sp.id,sp.external_id,sp.title,sp.image_url,sp.currency,sp.cost_minor,sp.retail_minor,
      sp.inventory_quantity,sp.availability,sp.last_synced_at,s.name AS supplier_name,s.provider,
      siq.id AS queue_id,siq.status AS import_status
      FROM supplier_products sp JOIN suppliers s ON s.id=sp.supplier_id
      LEFT JOIN supplier_import_queue siq ON siq.supplier_product_id=sp.id
      ORDER BY sp.last_synced_at DESC LIMIT 100`),
    query(`SELECT siq.id,siq.status,siq.draft,siq.imported_product_id,siq.last_error,siq.created_at,
      sp.title AS supplier_title,sp.image_url,s.name AS supplier_name,s.provider
      FROM supplier_import_queue siq JOIN supplier_products sp ON sp.id=siq.supplier_product_id
      JOIN suppliers s ON s.id=sp.supplier_id ORDER BY siq.created_at DESC LIMIT 50`),
    query(`SELECT isr.*,s.name AS supplier_name,s.provider FROM inventory_sync_runs isr
      JOIN suppliers s ON s.id=isr.supplier_id ORDER BY isr.started_at DESC LIMIT 20`),
    query(`SELECT fo.*,o.order_number,s.name AS supplier_name,s.provider FROM fulfillment_orders fo
      JOIN orders o ON o.id=fo.order_id JOIN suppliers s ON s.id=fo.supplier_id
      ORDER BY fo.created_at DESC LIMIT 50`),
  ]);

  const connectionState = Object.fromEntries(PROVIDERS.map(provider => [provider, getSupplierConnectionState(provider)]));
  return {
    metrics: metrics.rows[0],
    suppliers: suppliers.rows.map(row => ({ ...row, ...connectionState[row.provider as SupplierProvider] })),
    catalog: catalog.rows,
    importQueue: queue.rows,
    syncRuns: syncRuns.rows,
    fulfillments: fulfillments.rows,
  };
}

export async function syncSupplierCatalog(provider: SupplierProvider) {
  if (!PROVIDERS.includes(provider)) throw new Error('Proveedor no soportado.');
  const supplierResult = await query('SELECT * FROM suppliers WHERE provider=$1 ORDER BY created_at LIMIT 1', [provider]);
  const supplier = supplierResult.rows[0];
  if (!supplier) throw new Error('El proveedor no existe en la configuración.');

  const adapter = createSupplierAdapter(provider, supplier.external_store_id);
  const runId = randomUUID();
  await query(`INSERT INTO inventory_sync_runs(id,supplier_id,status,trigger_type) VALUES($1,$2,'running','manual')`, [runId, supplier.id]);
  await query(`UPDATE suppliers SET enabled=true,status='syncing',last_error=NULL,updated_at=NOW() WHERE id=$1`, [supplier.id]);

  try {
    const stores = await adapter.connect();
    const selectedStore = supplier.external_store_id || (provider === 'printify' ? process.env.PRINTIFY_SHOP_ID : process.env.PRINTFUL_STORE_ID) || stores[0]?.id || null;
    let cursor: string | undefined;
    let pages = 0;
    const products: SupplierProduct[] = [];

    do {
      const page = await adapter.getProducts(cursor);
      products.push(...page.items);
      cursor = page.nextCursor;
      pages += 1;
    } while (cursor && pages < MAX_SYNC_PAGES);

    const counts = await withTransaction(async client => {
      let variantsUpdated = 0;
      for (const product of products) {
        const productResult = await client.query(
          `INSERT INTO supplier_products(
            id,supplier_id,external_id,title,description,external_sku,image_url,currency,cost_minor,retail_minor,
            inventory_quantity,availability,raw_data,last_synced_at,updated_at
          ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW(),NOW())
          ON CONFLICT(supplier_id,external_id) DO UPDATE SET title=EXCLUDED.title,description=EXCLUDED.description,
            external_sku=EXCLUDED.external_sku,image_url=EXCLUDED.image_url,currency=EXCLUDED.currency,
            cost_minor=EXCLUDED.cost_minor,retail_minor=EXCLUDED.retail_minor,inventory_quantity=EXCLUDED.inventory_quantity,
            availability=EXCLUDED.availability,raw_data=EXCLUDED.raw_data,last_synced_at=NOW(),updated_at=NOW()
          RETURNING id`,
          [randomUUID(), supplier.id, product.id, product.title, product.description, product.sku || null, product.imageUrl || null,
            product.currency.slice(0, 3), product.costMinor ?? null, product.retailMinor ?? null,
            product.inventoryQuantity ?? null, product.availability, JSON.stringify(product.raw)],
        );
        const supplierProductId = productResult.rows[0].id;
        for (const variant of product.variants) {
          await client.query(
            `INSERT INTO supplier_product_variants(
              id,supplier_product_id,external_id,title,sku,currency,cost_minor,retail_minor,inventory_quantity,
              available,option_values,raw_data,updated_at
            ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())
            ON CONFLICT(supplier_product_id,external_id) DO UPDATE SET title=EXCLUDED.title,sku=EXCLUDED.sku,
              currency=EXCLUDED.currency,cost_minor=EXCLUDED.cost_minor,retail_minor=EXCLUDED.retail_minor,
              inventory_quantity=EXCLUDED.inventory_quantity,available=EXCLUDED.available,
              option_values=EXCLUDED.option_values,raw_data=EXCLUDED.raw_data,updated_at=NOW()`,
            [randomUUID(), supplierProductId, variant.id, variant.title, variant.sku || null, variant.currency.slice(0, 3),
              variant.costMinor ?? null, variant.retailMinor ?? null, variant.inventoryQuantity ?? null,
              variant.available, JSON.stringify(variant.options), JSON.stringify(variant.raw)],
          );
          variantsUpdated += 1;
        }
      }
      return { productsUpdated: products.length, variantsUpdated };
    });

    await query(`UPDATE suppliers SET enabled=true,status='connected',external_store_id=COALESCE($2,external_store_id),
      capabilities=$3,last_sync_at=NOW(),last_error=NULL,updated_at=NOW() WHERE id=$1`,
      [supplier.id, selectedStore, JSON.stringify(adapter.capabilities)]);
    await query(`UPDATE inventory_sync_runs SET status=$2,products_seen=$3,products_updated=$4,
      variants_updated=$5,finished_at=NOW() WHERE id=$1`,
      [runId, cursor ? 'partial' : 'completed', products.length, counts.productsUpdated, counts.variantsUpdated]);
    await query(
      `INSERT INTO commerce_events (event_name,source,entity_type,entity_id,properties)
       VALUES ('supplier_synced',$1,'supplier',$2,$3::jsonb)`,
      [provider, supplier.id, JSON.stringify({ runId, status: cursor ? 'partial' : 'completed', products: products.length, variants: counts.variantsUpdated })]
    );

    return { runId, status: cursor ? 'partial' : 'completed', products: products.length, variants: counts.variantsUpdated };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido del proveedor.';
    await Promise.all([
      query(`UPDATE suppliers SET status='error',last_error=$2,updated_at=NOW() WHERE id=$1`, [supplier.id, message]),
      query(`UPDATE inventory_sync_runs SET status='failed',error_message=$2,finished_at=NOW() WHERE id=$1`, [runId, message]),
    ]);
    throw error;
  }
}

export async function queueSupplierProduct(supplierProductId: string) {
  return withTransaction(async client => {
    const result = await client.query(
      `SELECT sp.*,spr.strategy,spr.value,spr.minimum_margin_percent,spr.rounding
       FROM supplier_products sp
       LEFT JOIN supplier_pricing_rules spr ON spr.supplier_id=sp.supplier_id AND spr.enabled=true
       WHERE sp.id=$1 ORDER BY spr.created_at LIMIT 1 FOR UPDATE OF sp`,
      [supplierProductId],
    );
    const product = result.rows[0];
    if (!product) throw new Error('El producto del proveedor no existe.');

    const retailMinor = product.retail_minor != null
      ? Number(product.retail_minor)
      : product.cost_minor != null
        ? calculateSupplierRetail(Number(product.cost_minor), {
          strategy: product.strategy || 'multiplier', value: Number(product.value ?? 2),
          minimumMarginPercent: Number(product.minimum_margin_percent ?? 20), rounding: product.rounding || 'ninety_nine',
        })
        : 0;
    const draft = {
      title: product.title,
      description: product.description,
      image_url: product.image_url,
      price_usd: retailMinor / 100,
      category: 'otros',
      status: 'draft',
    };
    const queueId = randomUUID();
    const queued = await client.query(
      `INSERT INTO supplier_import_queue(id,supplier_product_id,status,draft)
       VALUES($1,$2,'review',$3)
       ON CONFLICT(supplier_product_id) DO UPDATE SET draft=CASE
         WHEN supplier_import_queue.status='imported' THEN supplier_import_queue.draft ELSE EXCLUDED.draft END,
         updated_at=NOW() RETURNING *`,
      [queueId, supplierProductId, JSON.stringify(draft)],
    );
    return queued.rows[0];
  });
}

export async function publishSupplierImport(queueId: string, changes: { title?: string; description?: string; priceUsd?: number }) {
  return withTransaction(async client => {
    const queueResult = await client.query(
      `SELECT siq.*,sp.external_id,sp.external_sku,sp.image_url,sp.inventory_quantity,
        sp.supplier_id,s.provider,s.name AS supplier_name
       FROM supplier_import_queue siq JOIN supplier_products sp ON sp.id=siq.supplier_product_id
       JOIN suppliers s ON s.id=sp.supplier_id WHERE siq.id=$1 FOR UPDATE OF siq`,
      [queueId],
    );
    const queued = queueResult.rows[0];
    if (!queued) throw new Error('La importación no existe.');
    if (queued.status === 'imported' && queued.imported_product_id) return { productId: queued.imported_product_id, alreadyImported: true };

    const draft = typeof queued.draft === 'string' ? JSON.parse(queued.draft) : queued.draft;
    const title = String(changes.title || draft.title || '').trim();
    const description = String(changes.description ?? draft.description ?? '').trim();
    const priceUsd = Number(changes.priceUsd ?? draft.price_usd);
    if (!title) throw new Error('El título es obligatorio.');
    if (!Number.isFinite(priceUsd) || priceUsd <= 0) throw new Error('Define un precio válido antes de importar.');

    const baseSlug = slugify(title, { lower: true, strict: true, locale: 'es' }) || `producto-${randomUUID().slice(0, 8)}`;
    const existingSlug = await client.query('SELECT 1 FROM products WHERE slug=$1', [baseSlug]);
    const productSlug = existingSlug.rowCount ? `${baseSlug}-${randomUUID().slice(0, 6)}` : baseSlug;
    const productId = randomUUID();
    const exchange = await client.query(`SELECT COALESCE(
      (SELECT value::numeric FROM settings WHERE key='usd_to_cop'),
      (SELECT usd_to_cop FROM exchange_rates ORDER BY id DESC LIMIT 1),4100) AS rate`);
    const rate = Number(exchange.rows[0]?.rate || 4100);

    await client.query(
      `INSERT INTO products(id,slug,title,description,price_usd,price_cop,category,supplier,supplier_sku,
        stock,status,delivery_type,supplier_id,supplier_product_id)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'draft','dropshipping',$11,$12)`,
      [productId, productSlug, title, description, priceUsd, Math.round(priceUsd * rate), draft.category || 'otros',
        queued.provider, queued.external_sku || queued.external_id, queued.inventory_quantity ?? -1,
        queued.supplier_id, queued.supplier_product_id],
    );
    if (queued.image_url) {
      await client.query(`INSERT INTO product_images(id,product_id,url,alt,is_primary,sort_order)
        VALUES($1,$2,$3,$4,true,0)`, [randomUUID(), productId, queued.image_url, title]);
    }

    const variants = await client.query('SELECT * FROM supplier_product_variants WHERE supplier_product_id=$1 ORDER BY title', [queued.supplier_product_id]);
    for (const variant of variants.rows) {
      const variantPrice = variant.retail_minor != null ? Number(variant.retail_minor) / 100 : priceUsd;
      await client.query(
        `INSERT INTO product_variants(id,product_id,title,sku,option_values,price_usd,price_cop,stock,status,sort_order)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,'draft',$9)`,
        [randomUUID(), productId, variant.title, variant.sku || null, JSON.stringify(variant.option_values || {}),
          variantPrice, Math.round(variantPrice * rate), variant.inventory_quantity ?? -1, variants.rows.indexOf(variant)],
      );
    }

    await client.query(`UPDATE supplier_import_queue SET status='imported',imported_product_id=$2,
      draft=$3,last_error=NULL,updated_at=NOW() WHERE id=$1`,
      [queueId, productId, JSON.stringify({ ...draft, title, description, price_usd: priceUsd })]);
    return { productId, alreadyImported: false };
  });
}
