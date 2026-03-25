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

  // Calculate COP price from USD
  const priceUSD = body.price_usd ? parseFloat(body.price_usd) : null;
  const priceOldUSD = body.price_old_usd ? parseFloat(body.price_old_usd) : null;
  
  // Price rounding: round to nearest X99 (Colombian pricing convention)
  function roundToCOP(usd: number): number {
    const raw = Math.round(usd * 4100);
    // Round to nearest 990/999 ending
    const magnitude = Math.pow(10, Math.floor(Math.log10(raw)) - 1);
    const rounded = Math.round(raw / magnitude) * magnitude;
    return rounded - 1; // e.g. 41000 -> 40999, 143000 -> 142999
  }
  
  const priceCop = priceUSD ? roundToCOP(priceUSD) : null;
  const priceOldCop = priceOldUSD ? roundToCOP(priceOldUSD) : null;

  await query(`
    UPDATE products SET
      title = COALESCE($1, title),
      description = COALESCE($2, description),
      price_usd = COALESCE($3, price_usd),
      price_cop = COALESCE($4, price_cop),
      price_old_usd = $5,
      category = COALESCE($6, category),
      supplier = COALESCE($7, supplier),
      supplier_url = COALESCE($8, supplier_url),
      stock = COALESCE($9, stock),
      status = COALESCE($10, status),
      publisher = $11,
      franchise = $12,
      meta_title = $13,
      meta_description = $14,
      featured = COALESCE($15, featured),
      updated_at = NOW()
    WHERE id = $16
  `, [
    body.title ?? null,
    body.description ?? null,
    priceUSD,
    priceCop,
    priceOldUSD,
    body.category ?? null,
    body.supplier ?? null,
    body.supplier_url ?? null,
    body.stock ?? null,
    body.status ?? null,
    body.publisher ?? null,
    body.franchise ?? null,
    body.meta_title ?? null,
    body.meta_description ?? null,
    body.featured !== undefined ? body.featured : null,
    params.id,
  ]);

  // Update images with SEO alt text
  if (body.images !== undefined) {
    await query('DELETE FROM product_images WHERE product_id = $1', [params.id]);
    if (body.images?.length) {
      for (let i = 0; i < body.images.length; i++) {
        const img = body.images[i];
        const altText = `La Tienda de Comics - ${body.title || img.alt || ''}`;
        await query(
          'INSERT INTO product_images (id, product_id, url, alt, is_primary, sort_order) VALUES ($1,$2,$3,$4,$5,$6)',
          [uuid(), params.id, img.url, altText, i === 0, i]
        );
      }
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
  await query('DELETE FROM products WHERE id = $1', [params.id]);
  return NextResponse.json({ success: true });
}
