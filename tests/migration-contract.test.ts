import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('transaction security migration', () => {
  it('enforces reservations and webhook idempotency in PostgreSQL', async () => {
    const sql = await readFile(
      path.join(process.cwd(), 'migrations/001_transaction_security_foundation.sql'),
      'utf8'
    );
    expect(sql).toContain("CHECK (quantity > 0 AND quantity <= 25)");
    expect(sql).toContain('UNIQUE(order_id, product_id)');
    expect(sql).toContain('UNIQUE(provider, event_key)');
    expect(sql).toContain('public_token_hash');
  });

  it('ships a baseline schema before additive migrations', async () => {
    const sql = await readFile(path.join(process.cwd(), 'migrations/000_legacy_schema.sql'), 'utf8');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS products');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS orders');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS admin_users');
  });

  it('adds a searchable media registry for the admin foundation', async () => {
    const sql = await readFile(
      path.join(process.cwd(), 'migrations/002_admin_foundation.sql'),
      'utf8'
    );
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS media_assets');
    expect(sql).toContain("CHECK (kind IN ('image', 'video', 'audio', 'document'))");
    expect(sql).toContain('idx_media_assets_kind_created');
  });

  it('adds the commerce catalog, storefront and normalized payment foundation', async () => {
    const sql = await readFile(
      path.join(process.cwd(), 'migrations/003_commerce_core.sql'),
      'utf8'
    );
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS categories');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS collections');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS store_sections');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS product_variants');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS media_usages');
    expect(sql).toContain('UNIQUE(provider, external_id)');
    expect(sql).toContain("CHECK (status IN ('not_connected', 'configured', 'connected', 'error'))");
  });

  it('adds supplier catalog, reviewed imports, inventory sync and fulfillment tracking', async () => {
    const sql = await readFile(
      path.join(process.cwd(), 'migrations/004_dropshipping_foundation.sql'),
      'utf8'
    );
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS suppliers');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS supplier_products');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS supplier_import_queue');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS inventory_sync_runs');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS fulfillment_orders');
    expect(sql).toContain('supplier_product_id TEXT REFERENCES supplier_products');
  });

  it('adds consented cart recovery, ad reporting and order attribution', async () => {
    const sql = await readFile(
      path.join(process.cwd(), 'migrations/005_growth_foundation.sql'),
      'utf8'
    );
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS growth_connections');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS ad_campaigns');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS abandoned_carts');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS marketing_outbox');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS marketing_attributions');
    expect(sql).toContain("status IN ('draft', 'approved', 'sending', 'sent', 'failed', 'cancelled')");
    expect(sql).toContain('unsubscribe_token_hash TEXT NOT NULL UNIQUE');
  });

  it('adds Amazon marketplace listings, orders, sync runs and reviewed jobs', async () => {
    const sql = await readFile(
      path.join(process.cwd(), 'migrations/006_marketplace_foundation.sql'),
      'utf8'
    );
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS marketplace_connections');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS marketplace_listings');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS marketplace_orders');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS marketplace_sync_runs');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS marketplace_jobs');
    expect(sql).toContain("fulfillment_channel IN ('merchant', 'amazon')");
    expect(sql).toContain("status IN ('review', 'active', 'inactive', 'sync_error', 'out_of_stock', 'suppressed', 'price_error', 'archived')");
  });
});
