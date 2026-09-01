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
});
