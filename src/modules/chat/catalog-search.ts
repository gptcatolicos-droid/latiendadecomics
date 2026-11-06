import { query, ensureInit } from '@/lib/db';

export type SearchMode = 'search' | 'recommend' | 'novedades' | 'destacados';

export async function searchProducts(q: string, mode: SearchMode = 'search') {
  try {
    await ensureInit();

    // Ensure leads table exists
    await query(`CREATE TABLE IF NOT EXISTS customer_leads (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      producto TEXT NOT NULL,
      contacto TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`).catch(() => {});

    if (mode === 'novedades') {
      const r = await query(`
        SELECT p.id, p.title, p.slug, p.price_usd, p.price_cop, p.supplier, p.supplier_url,
               p.affiliate_url, p.delivery_type, p.publisher, p.category, pi.url as image
        FROM products p
        LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = true
        WHERE p.status = 'published'
        ORDER BY p.created_at DESC LIMIT 4
      `);
      return formatProducts(r.rows);
    }

    if (mode === 'destacados') {
      const r = await query(`
        SELECT p.id, p.title, p.slug, p.price_usd, p.price_cop, p.supplier, p.supplier_url,
               p.affiliate_url, p.delivery_type, p.publisher, p.category, pi.url as image
        FROM products p
        LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = true
        WHERE p.status = 'published' AND (p.featured = true OR p.price_usd > 30)
        ORDER BY RANDOM() LIMIT 4
      `);
      return formatProducts(r.rows);
    }

    // Phrase match first
    const phraseCondition = `LOWER(p.title) LIKE $1 OR LOWER(COALESCE(p.publisher,'')) LIKE $1 OR LOWER(COALESCE(p.franchise,'')) LIKE $1 OR LOWER(COALESCE(p.category,'')) LIKE $1 OR LOWER(COALESCE(p.description,'')) LIKE $1 OR LOWER(p.tags::text) LIKE $1`;
    const phraseResult = await query(`
      SELECT p.id, p.title, p.slug, p.price_usd, p.price_cop, p.supplier, p.supplier_url,
             p.affiliate_url, p.delivery_type, p.publisher, p.category, pi.url as image
      FROM products p
      LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = true
      WHERE p.status = 'published' AND (${phraseCondition})
      ORDER BY p.created_at DESC LIMIT 4
    `, [`%${q.toLowerCase()}%`]);

    if (phraseResult.rows.length > 0) return formatProducts(phraseResult.rows);

    // Word-by-word fallback
    const terms = q.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    if (!terms.length) return [];
    const conditions = terms.slice(0, 3).map((_, i) =>
      `(LOWER(p.title) LIKE $${i+1} OR LOWER(COALESCE(p.publisher,'')) LIKE $${i+1} OR LOWER(COALESCE(p.franchise,'')) LIKE $${i+1} OR LOWER(COALESCE(p.description,'')) LIKE $${i+1} OR LOWER(p.tags::text) LIKE $${i+1})`
    ).join(' OR ');
    const r = await query(`
      SELECT p.id, p.title, p.slug, p.price_usd, p.price_cop, p.supplier, p.supplier_url,
             p.affiliate_url, p.delivery_type, p.publisher, p.category, pi.url as image
      FROM products p
      LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = true
      WHERE p.status = 'published' AND (${conditions})
      ORDER BY p.created_at DESC LIMIT 4
    `, terms.slice(0, 3).map(t => `%${t}%`));
    return formatProducts(r.rows);
  } catch (err) {
    console.error('Search error:', err);
    return [];
  }
}

export async function saveLead(producto: string, contacto: string) {
  try {
    await ensureInit();
    await query(`CREATE TABLE IF NOT EXISTS customer_leads (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      producto TEXT NOT NULL, contacto TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`).catch(() => {});
    await query(`INSERT INTO customer_leads (id, producto, contacto) VALUES (gen_random_uuid()::text, $1, $2)`, [producto, contacto]);
  } catch (err) {
    console.error('Lead save error:', err);
  }
}

export function formatProducts(rows: any[]) {
  return rows.map(row => ({
    id: row.id, title: row.title, slug: row.slug || '',
    price_usd: parseFloat(row.price_usd),
    price_cop: row.price_cop || Math.round(parseFloat(row.price_usd) * 4100),
    image: row.image || '', images: row.image ? [{ url: row.image, alt: row.title }] : [],
    supplier: row.supplier, supplier_url: row.supplier_url || '',
    affiliate_url: row.affiliate_url || '', delivery_type: row.delivery_type || 'standard',
    publisher: row.publisher || '', category: row.category || '', in_stock: true,
  }));
}

