import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { ensureInit } from '@/lib/db';
import { seedAmazonProducts } from '@/lib/seed-amazon';

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;
  await ensureInit();
  const results = await seedAmazonProducts();
  return NextResponse.json({ success: true, results });
}

// Also auto-seed on GET for easy triggering
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;
  await ensureInit();
  const results = await seedAmazonProducts();
  return NextResponse.json({ success: true, results });
}

export async function PUT(req: NextRequest) {
  // Import from latiendadecomics.com (Tiendanube)
  const auth = await requireAdmin(req);
  if (auth) return auth;
  await ensureInit();

  const results = { imported: 0, skipped: 0, errors: 0 };
  
  try {
    // Tiendanube public product JSON endpoint
    const baseUrl = 'https://www.latiendadecomics.com';
    let page = 1;
    
    while (true) {
      const res = await fetch(`${baseUrl}/productos.json?page=${page}&per_page=50`, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
        signal: AbortSignal.timeout(15000),
      });
      
      if (!res.ok) break;
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('json')) break;
      
      const data = await res.json();
      const products = data?.products || data || [];
      if (!Array.isArray(products) || !products.length) break;

      for (const p of products) {
        try {
          const title = p.name?.es || p.name || p.title || '';
          if (!title) { results.skipped++; continue; }

          const exists = await query('SELECT id FROM products WHERE title = $1', [title]);
          if (exists.rows.length) { results.skipped++; continue; }

          const variant = p.variants?.[0];
          const priceNum = parseFloat(variant?.price || p.price || '0');
          if (!priceNum) { results.skipped++; continue; }

          const isCOP = priceNum > 500;
          const priceUSD = isCOP ? Math.round((priceNum / 4100) * 100) / 100 : priceNum;
          const priceCOP = isCOP ? Math.round(priceNum) : Math.round(priceNum * 4100);

          const id = require('crypto').randomUUID();
          let slug = (title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 70) + '-' + Date.now()).slice(0, 80);

          const images = (p.images || []).slice(0, 3);
          const desc = (p.description?.es || p.description || title).replace(/<[^>]+>/g, '').slice(0, 500);
          const supplierUrl = `${baseUrl}/productos/${p.handle || p.id}`;

          await query(`INSERT INTO products (id,slug,title,description,price_usd,price_cop,category,supplier,supplier_url,stock,status,created_at,updated_at)
            VALUES ($1,$2,$3,$4,$5,$6,'comics','manual',$7,10,'published',NOW(),NOW())`,
            [id, slug, title, desc, priceUSD, priceCOP, supplierUrl]);

          for (let i = 0; i < images.length; i++) {
            const imgUrl = images[i].src || images[i].url || images[i];
            if (imgUrl) await query('INSERT INTO product_images (id,product_id,url,alt,is_primary,sort_order) VALUES ($1,$2,$3,$4,$5,$6)',
              [require('crypto').randomUUID(), id, imgUrl, title, i === 0, i]);
          }
          results.imported++;
        } catch { results.errors++; }
      }

      if (products.length < 50) break;
      page++;
    }
  } catch (err: any) {
    console.error('Tiendanube seed error:', err?.message);
  }

  return NextResponse.json({ success: true, results });
}
