import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('render.com') || process.env.DATABASE_URL?.includes('amazonaws.com')
    ? { rejectUnauthorized: false }
    : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export async function query(sql: string, params: any[] = []) {
  const client = await pool.connect();
  try {
    return await client.query(sql, params);
  } finally {
    client.release();
  }
}

let initialized = false;

export async function ensureInit() {
  if (initialized) return;
  initialized = true;

  const statements = [
    `CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, title TEXT NOT NULL,
      title_en TEXT, description TEXT NOT NULL DEFAULT '', description_en TEXT,
      price_usd DECIMAL(10,2) NOT NULL, price_usd_original DECIMAL(10,2),
      price_cop INTEGER NOT NULL DEFAULT 0, price_old_usd DECIMAL(10,2),
      category TEXT NOT NULL DEFAULT 'comics', supplier TEXT NOT NULL DEFAULT 'manual',
      supplier_url TEXT, supplier_sku TEXT, affiliate_url TEXT,
      stock INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'draft',
      preventa_enabled BOOLEAN NOT NULL DEFAULT false,
      preventa_percent INTEGER NOT NULL DEFAULT 25, preventa_launch_date TEXT,
      delivery_type TEXT NOT NULL DEFAULT 'standard',
      margin_percent NUMERIC NOT NULL DEFAULT 15,
      installments_enabled BOOLEAN NOT NULL DEFAULT false,
      installments_options JSONB DEFAULT '[3,6]',
      show_coupon_banner BOOLEAN NOT NULL DEFAULT false,
      meta_title TEXT, meta_description TEXT,
      seo_keywords JSONB DEFAULT '[]', publisher TEXT, author TEXT,
      year INTEGER, isbn TEXT, characters JSONB DEFAULT '[]', franchise TEXT,
      featured BOOLEAN NOT NULL DEFAULT false,
      tags JSONB DEFAULT '[]',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS product_images (
      id TEXT PRIMARY KEY, product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      url TEXT NOT NULL, alt TEXT NOT NULL DEFAULT '',
      is_primary BOOLEAN NOT NULL DEFAULT false, sort_order INTEGER NOT NULL DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY, order_number TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      customer_name TEXT NOT NULL, customer_email TEXT NOT NULL,
      customer_phone TEXT, customer_country TEXT NOT NULL DEFAULT 'CO',
      shipping_line1 TEXT NOT NULL, shipping_line2 TEXT,
      shipping_city TEXT NOT NULL, shipping_state TEXT, shipping_postal TEXT,
      shipping_country TEXT NOT NULL, shipping_country_code TEXT NOT NULL DEFAULT 'CO',
      shipping_zone TEXT NOT NULL DEFAULT 'colombia',
      subtotal_usd DECIMAL(10,2) NOT NULL DEFAULT 0,
      shipping_usd DECIMAL(10,2) NOT NULL DEFAULT 0,
      discount_usd DECIMAL(10,2) NOT NULL DEFAULT 0,
      total_usd DECIMAL(10,2) NOT NULL DEFAULT 0,
      total_cop INTEGER NOT NULL DEFAULT 0,
      coupon_code TEXT, payment_id TEXT, payment_method TEXT,
      tracking_number TEXT, tracking_carrier TEXT, tracking_notified_at TIMESTAMPTZ,
      notes TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL, product_title TEXT NOT NULL, product_image TEXT,
      quantity INTEGER NOT NULL DEFAULT 1, price_usd DECIMAL(10,2) NOT NULL,
      supplier_url TEXT, is_preventa BOOLEAN NOT NULL DEFAULT false,
      preventa_amount_paid DECIMAL(10,2), preventa_remaining DECIMAL(10,2)
    )`,
    `CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL DEFAULT 'percentage', value DECIMAL(10,2) NOT NULL,
      max_uses INTEGER, uses_count INTEGER NOT NULL DEFAULT 0,
      min_order_usd DECIMAL(10,2), expires_at TIMESTAMPTZ,
      active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS exchange_rates (
      id SERIAL PRIMARY KEY,
      usd_to_cop DECIMAL(10,2) NOT NULL DEFAULT 4100,
      usd_to_mxn DECIMAL(10,2) NOT NULL DEFAULT 17.5,
      usd_to_ars DECIMAL(10,2) NOT NULL DEFAULT 900,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL, name TEXT NOT NULL DEFAULT 'Admin',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS customer_leads (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      producto TEXT NOT NULL,
      contacto TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_leads_created ON customer_leads(created_at DESC)`,
    // ── COVERBROWSER GALLERIES ─────────────────────────────────────────────
    `CREATE TABLE IF NOT EXISTS cb_galleries (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      total_issues INTEGER DEFAULT 0,
      total_pages INTEGER DEFAULT 1,
      first_image_url TEXT DEFAULT '',
      scraped_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_cbg_slug ON cb_galleries(slug)`,
    // ── COVERBROWSER COVERS ────────────────────────────────────────────────
    `CREATE TABLE IF NOT EXISTS cb_covers (
      id SERIAL PRIMARY KEY,
      gallery_slug TEXT NOT NULL,
      issue_number INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      alt_text TEXT DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(gallery_slug, issue_number)
    )`,
    `CREATE INDEX IF NOT EXISTS idx_cbc_gallery ON cb_covers(gallery_slug)`,
    `CREATE INDEX IF NOT EXISTS idx_cbc_issue ON cb_covers(gallery_slug, issue_number)`,
    // ── CHARACTERS ────────────────────────────────────────────────────────
    `CREATE TABLE IF NOT EXISTS characters (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      universe TEXT NOT NULL,
      real_name TEXT DEFAULT '',
      description TEXT DEFAULT '',
      image_url TEXT DEFAULT '',
      first_appearance TEXT DEFAULT '',
      alignment TEXT DEFAULT 'hero',
      powers JSONB DEFAULT '[]',
      related_galleries JSONB DEFAULT '[]',
      teams JSONB DEFAULT '[]',
      creators JSONB DEFAULT '[]',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_char_slug ON characters(slug)`,
    `CREATE INDEX IF NOT EXISTS idx_char_universe ON characters(universe)`,
    `CREATE INDEX IF NOT EXISTS idx_char_alignment ON characters(alignment)`,
    `CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug)`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS affiliate_url TEXT`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS delivery_type TEXT DEFAULT 'standard'`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS margin_percent NUMERIC DEFAULT 15`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS installments_enabled BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS installments_options JSONB DEFAULT '[3,6]'`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS show_coupon_banner BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS price_usd_original DECIMAL(10,2)`,
    `CREATE INDEX IF NOT EXISTS idx_products_status ON products(status)`,
    `CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number)`,
    `CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(customer_email)`,
    `CREATE INDEX IF NOT EXISTS idx_pimages_pid ON product_images(product_id)`,
    `INSERT INTO exchange_rates (usd_to_cop, usd_to_mxn, usd_to_ars) SELECT 4100, 17.5, 900 WHERE NOT EXISTS (SELECT 1 FROM exchange_rates LIMIT 1)`,
  ];

  const defaults: Record<string, string> = {
    shipping_colombia_usd: '5',
    shipping_international_usd: '30',
    default_margin_percent: '25',
    preventa_default_percent: '30',
    store_name: 'La Tienda de Comics',
  };

  for (const sql of statements) {
    try {
      await query(sql);
    } catch (err: any) {
      // Ignore "already exists" errors
      if (!err.message?.includes('already exists')) {
        console.error('DB init error:', err.message);
      }
    }
  }

  for (const [key, value] of Object.entries(defaults)) {
    try {
      await query('INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING', [key, value]);
    } catch {}
  }
}

export async function getSetting(key: string): Promise<string | null> {
  await ensureInit();
  const r = await query('SELECT value FROM settings WHERE key = $1', [key]);
  return r.rows[0]?.value ?? null;
}

export async function getExchangeRate() {
  await ensureInit();
  const r = await query('SELECT usd_to_cop, usd_to_mxn, usd_to_ars FROM exchange_rates ORDER BY id DESC LIMIT 1');
  return r.rows[0] || { usd_to_cop: 4100, usd_to_mxn: 17.5, usd_to_ars: 900 };
}

export async function usdToCop(usd: number): Promise<number> {
  const rate = await getExchangeRate();
  return Math.round(usd * parseFloat(rate.usd_to_cop));
}

export async function getShippingRate(zone: 'colombia' | 'international'): Promise<number> {
  const key = zone === 'colombia' ? 'shipping_colombia_usd' : 'shipping_international_usd';
  const val = await getSetting(key);
  return parseFloat(val || (zone === 'colombia' ? '5' : '30'));
}
