import { NextRequest, NextResponse } from 'next/server';
import { query, ensureInit, usdToCop } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { parseProduct } from '../route';
import { v4 as uuid } from 'uuid';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  await ensureInit();
  const r = await query(`
    SELECT p.*, json_agg(json_build_object('id', pi.id, 'url', pi.url, 'alt', pi.alt, 'is_primary', pi.is_primary, 'sort_order', pi.sort_order)
      ORDER BY pi.is_primary DESC, pi.sort_order ASC) FILTER (WHERE pi.id IS NOT NULL) as images_json
    FROM products p LEFT JOIN product_images pi ON pi.product_id = p.id
    WHERE p.id = $1 OR p.slug = $1 GROUP BY p.id
  `, [params.id]);
  if (!r.rows.length) return NextResponse.json({ success: false, error: 'Producto no encontrado' }, { status: 404 });
  return NextResponse.json({ success: true, data: parseProduct(r.rows[0]) });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(req);
  if (auth) return auth;
  await ensureInit();
  const body = await req.json();

  // Ensure new columns exist (idempotent migrations)
  await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS affiliate_url TEXT`).catch(() => {});
  await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'`).catch(() => {});
  await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS delivery_type TEXT DEFAULT 'standard'`).catch(() => {});
  await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS margin_percent NUMERIC DEFAULT 15`).catch(() => {});
  await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS installments_enabled BOOLEAN DEFAULT FALSE`).catch(() => {});
  await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS installments_options JSONB DEFAULT '[3,6]'`).catch(() => {});
  await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS show_coupon_banner BOOLEAN DEFAULT FALSE`).catch(() => {});

  const priceUSD = body.price_usd != null ? parseFloat(body.price_usd) : null;
  const priceOldUSD = body.price_old_usd != null ? parseFloat(body.price_old_usd) : null;
  const priceCop = body.price_cop != null ? parseInt(body.price_cop) 
    : (priceUSD ? Math.round(priceUSD * 4100) : null);

  // Build dynamic SET clause to only update provided fields
  const sets: string[] = ['updated_at = NOW()'];
  const vals: any[] = [];
  let i = 1;

  const add = (col: string, val: any) => {
    sets.push(`${col} = $${i++}`);
    vals.push(val);
  };
  const addCoalesce = (col: string, val: any) => {
    if (val === undefined) return;
    sets.push(`${col} = COALESCE($${i++}, ${col})`);
    vals.push(val ?? null);
  };

  if (body.title !== undefined) addCoalesce('title', body.title);
  if (body.description !== undefined) addCoalesce('description', body.description);
  if (priceUSD !== null) addCoalesce('price_usd', priceUSD);
  if (priceCop !== null) addCoalesce('price_cop', priceCop);
  if (body.price_usd_original !== undefined) add('price_usd_original', parseFloat(body.price_usd_original) || null);
  if (body.price_old_usd !== undefined) add('price_old_usd', priceOldUSD);
  if (body.category !== undefined) addCoalesce('category', body.category);
  if (body.supplier !== undefined) addCoalesce('supplier', body.supplier);
  if (body.supplier_url !== undefined) addCoalesce('supplier_url', body.supplier_url);
  if (body.affiliate_url !== undefined) add('affiliate_url', body.affiliate_url || null);
  if (body.stock !== undefined) addCoalesce('stock', body.stock);
  if (body.status !== undefined) addCoalesce('status', body.status);
  if (body.publisher !== undefined) add('publisher', body.publisher ?? null);
  if (body.franchise !== undefined) add('franchise', body.franchise ?? null);
  if (body.meta_title !== undefined) add('meta_title', body.meta_title ?? null);
  if (body.meta_description !== undefined) add('meta_description', body.meta_description ?? null);
  if (body.featured !== undefined) addCoalesce('featured', body.featured);
  if (body.tags !== undefined) add('tags', JSON.stringify(body.tags || []));
  if (body.delivery_type !== undefined) add('delivery_type', body.delivery_type || 'standard');
  if (body.margin_percent !== undefined) add('margin_percent', parseFloat(body.margin_percent) || 15);
  if (body.preventa_enabled !== undefined) add('preventa_enabled', Boolean(body.preventa_enabled));
  if (body.preventa_percent !== undefined) add('preventa_percent', parseInt(body.preventa_percent) || 25);
  if (body.preventa_launch_date !== undefined) add('preventa_launch_date', body.preventa_launch_date || null);
  if (body.installments_enabled !== undefined) add('installments_enabled', Boolean(body.installments_enabled));
  if (body.installments_options !== undefined) add('installments_options', JSON.stringify(body.installments_options || [3,6]));
  if (body.show_coupon_banner !== undefined) add('show_coupon_banner', Boolean(body.show_coupon_banner));

  vals.push(params.id);
  const idParam = i;

  await query(`UPDATE products SET ${sets.join(', ')} WHERE id = $${idParam}`, vals);

  // Update images with SEO alt text
  if (body.images !== undefined) {
    await query('DELETE FROM product_images WHERE product_id = $1', [params.id]);
    for (let j = 0; j < (body.images?.length || 0); j++) {
      const img = body.images[j];
      const altText = `La Tienda de Comics - ${body.title || ''}`;
      await query(
        'INSERT INTO product_images (id, product_id, url, alt, is_primary, sort_order) VALUES ($1,$2,$3,$4,$5,$6)',
        [uuid(), params.id, img.url, altText, j === 0, j]
      );
    }
  }

  const updated = await query(`
    SELECT p.*, json_agg(json_build_object('id', pi.id, 'url', pi.url, 'alt', pi.alt, 'is_primary', pi.is_primary, 'sort_order', pi.sort_order)
      ORDER BY pi.is_primary DESC, pi.sort_order ASC) FILTER (WHERE pi.id IS NOT NULL) as images_json
    FROM products p LEFT JOIN product_images pi ON pi.product_id = p.id
    WHERE p.id = $1 GROUP BY p.id
  `, [params.id]);

  return NextResponse.json({ success: true, data: parseProduct(updated.rows[0]) });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(req);
  if (auth) return auth;
  await ensureInit();
  await query('DELETE FROM product_images WHERE product_id = $1', [params.id]);
  await query('DELETE FROM products WHERE id = $1', [params.id]);
  return NextResponse.json({ success: true });
}
