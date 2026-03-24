import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { query, ensureInit } from '@/lib/db';
import { v4 as uuid } from 'uuid';
import slugify from 'slugify';

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;
  await ensureInit();

  const results = { imported: 0, skipped: 0, errors: 0 };

  try {
    let page = 1;
    while (true) {
      const res = await fetch(`https://www.latiendadecomics.com/products.json?limit=50&page=${page}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible)', 'Accept': 'application/json' },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) break;
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('json')) break;
      const data = await res.json();
      const products = data?.products || [];
      if (!products.length) break;

      for (const p of products) {
        try {
          const variant = p.variants?.[0];
          if (!variant?.price) { results.skipped++; continue; }
          const priceNum = parseFloat(variant.price);
          if (!priceNum) { results.skipped++; continue; }

          const exists = await query('SELECT id FROM products WHERE title = $1', [p.title]);
          if (exists.rows.length) { results.skipped++; continue; }

          const id = uuid();
          let slug = slugify(p.title || 'producto', { lower: true, strict: true }).slice(0, 80);
          const existing = await query('SELECT id FROM products WHERE slug = $1', [slug]);
          if (existing.rows.length) slug = `${slug}-${Date.now()}`;

          const isCOP = priceNum > 500;
          const priceUSD = isCOP ? Math.round((priceNum / 4100) * 100) / 100 : priceNum;
          const priceCOP = isCOP ? Math.round(priceNum) : Math.round(priceNum * 4100);

          const titleLower = (p.title || '').toLowerCase();
          let category = 'comics';
          if (titleLower.includes('figura') || titleLower.includes('iron studios') || titleLower.includes('funko') || titleLower.includes('mcfarlane') || titleLower.includes('statue')) category = 'figuras';
          else if (titleLower.includes('manga') || titleLower.includes('naruto') || titleLower.includes('dragon ball') || titleLower.includes('anime')) category = 'manga';

          await query(`
            INSERT INTO products (id, slug, title, description, price_usd, price_cop, category, supplier, supplier_url, stock, status, created_at, updated_at)
            VALUES ($1,$2,$3,$4,$5,$6,$7,'manual',$8,$9,'published',NOW(),NOW())
          `, [
            id, slug, p.title,
            (p.body_html || '').replace(/<[^>]+>/g, '').slice(0, 600) || p.title,
            priceUSD, priceCOP, category,
            `https://www.latiendadecomics.com/products/${p.handle}`,
            10,
          ]);

          const imgs = (p.images || []).slice(0, 3);
          for (let i = 0; i < imgs.length; i++) {
            await query(
              'INSERT INTO product_images (id, product_id, url, alt, is_primary, sort_order) VALUES ($1,$2,$3,$4,$5,$6)',
              [uuid(), id, imgs[i].src, p.title, i === 0, i]
            );
          }
          results.imported++;
        } catch { results.errors++; }
      }
      if (products.length < 50) break;
      page++;
    }
  } catch (err: any) {
    console.error('Seed error:', err?.message);
  }

  return NextResponse.json({ success: true, results });
}
