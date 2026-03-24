/**
 * LIVE SEARCH ENGINE — La Tienda de Comics
 * Busca en tiempo real en Midtown, Iron Studios, Panini y Amazon.
 * Cache de 24 horas en PostgreSQL para reducir riesgo de bloqueo.
 */
import * as cheerio from 'cheerio';
import { query } from './db';
import { applyMargin, SUPPLIER_CONFIG } from './catalog-rules';
import { searchAmazon } from './amazon';

export interface LiveProduct {
  id: string;
  title: string;
  price_usd: number;
  price_cop: number;
  image: string;
  supplier: string;
  supplier_name: string;
  supplier_url: string;
  affiliate_url?: string;
  model: 'dropshipping' | 'affiliate';
  delivery_days: string;
  in_stock: boolean;
  color: string;
}

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Cache-Control': 'no-cache',
};

// ── CACHE ───────────────────────────────────
async function getCached(cacheKey: string): Promise<LiveProduct[] | null> {
  try {
    const r = await query(
      `SELECT value, created_at FROM settings WHERE key = $1`,
      [`livesearch:${cacheKey}`]
    );
    if (!r.rows.length) return null;
    const row = r.rows[0];
    const age = Date.now() - new Date(row.created_at || 0).getTime();
    if (age > 24 * 60 * 60 * 1000) return null; // 24h expired
    return JSON.parse(row.value);
  } catch { return null; }
}

async function setCache(cacheKey: string, data: LiveProduct[]): Promise<void> {
  try {
    await query(
      `INSERT INTO settings (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = $2`,
      [`livesearch:${cacheKey}`, JSON.stringify(data)]
    );
  } catch {}
}

// ── MIDTOWN COMICS (HTML scraping) ──────────
async function searchMidtown(q: string): Promise<LiveProduct[]> {
  const url = `https://www.midtowncomics.com/store/searchresult.asp?txtSearch=${encodeURIComponent(q)}&searchType=Product`;
  try {
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const html = await res.text();
    const $ = cheerio.load(html);
    const products: LiveProduct[] = [];

    $('.product-item, .item-wrap, [class*="product"]').slice(0, 4).each((_, el) => {
      const title = $(el).find('[class*="title"], h2, h3, .name').first().text().trim();
      const priceText = $(el).find('[class*="price"], .price').first().text().replace(/[^0-9.]/g, '');
      const price = parseFloat(priceText);
      const img = $(el).find('img').attr('src') || $(el).find('img').attr('data-src') || '';
      const href = $(el).find('a').attr('href') || '';
      const supplierUrl = href.startsWith('http') ? href : `https://www.midtowncomics.com${href}`;

      if (!title || !price || isNaN(price)) return;

      const myPrice = applyMargin(price, 'midtown');
      products.push({
        id: `midtown-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
        title,
        price_usd: myPrice,
        price_cop: Math.round(myPrice * 4100),
        image: img.startsWith('http') ? img : `https://www.midtowncomics.com${img}`,
        supplier: 'midtown',
        supplier_name: 'Midtown Comics',
        supplier_url: supplierUrl,
        model: 'dropshipping',
        delivery_days: '6–10',
        in_stock: true,
        color: '#2563eb',
      });
    });

    return products;
  } catch (err) {
    console.error('Midtown search error:', err);
    return [];
  }
}

// ── IRON STUDIOS (Shopify JSON) ─────────────
async function searchIronStudios(q: string): Promise<LiveProduct[]> {
  const url = `https://ironstudios.com/search?type=product&q=${encodeURIComponent(q)}&view=json`;
  try {
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();
    const items = data?.results || data?.products || [];

    return items.slice(0, 4).map((item: any) => {
      const priceRaw = item?.price_min || item?.price || 0;
      const price = priceRaw / 100;
      const myPrice = applyMargin(price, 'ironstudios');
      const handle = item?.handle || '';
      return {
        id: `iron-${item?.id || Math.random().toString(36).slice(2,9)}`,
        title: item?.title || 'Sin título',
        price_usd: myPrice,
        price_cop: Math.round(myPrice * 4100),
        image: item?.featured_image || item?.images?.[0] || '',
        supplier: 'ironstudios',
        supplier_name: 'Iron Studios',
        supplier_url: `https://ironstudios.com/products/${handle}`,
        model: 'dropshipping',
        delivery_days: '5–8',
        in_stock: item?.available !== false,
        color: '#7c3aed',
      };
    });
  } catch (err) {
    console.error('Iron Studios search error:', err);
    return [];
  }
}

// ── PANINI COLOMBIA (Shopify JSON) ──────────
async function searchPanini(q: string): Promise<LiveProduct[]> {
  const url = `https://paninitienda.com/search?type=product&q=${encodeURIComponent(q)}&view=json`;
  try {
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();
    const items = data?.results || data?.products || [];

    return items.slice(0, 2).map((item: any) => {
      const priceCOP = item?.price_min || item?.price || 0;
      const priceUSD = (priceCOP / 100) / 4100;
      const myPrice = applyMargin(priceUSD, 'panini');
      const handle = item?.handle || '';
      return {
        id: `panini-${item?.id || Math.random().toString(36).slice(2,9)}`,
        title: item?.title || 'Sin título',
        price_usd: myPrice,
        price_cop: Math.round(priceCOP / 100 * 1.25),
        image: item?.featured_image || '',
        supplier: 'panini',
        supplier_name: 'Panini Colombia',
        supplier_url: `https://paninitienda.com/products/${handle}`,
        model: 'dropshipping',
        delivery_days: '3–5',
        in_stock: item?.available !== false,
        color: '#CC0000',
      };
    });
  } catch (err) {
    console.error('Panini search error:', err);
    return [];
  }
}

// ── MAIN: SEARCH ALL SUPPLIERS ───────────────
export async function liveSearch(searchQuery: string): Promise<LiveProduct[]> {
  const cacheKey = searchQuery.toLowerCase().trim().replace(/\s+/g, '-');

  // Try cache first
  const cached = await getCached(cacheKey);
  if (cached && cached.length > 0) {
    console.log(`[LiveSearch] Cache hit: ${cacheKey}`);
    return cached;
  }

  console.log(`[LiveSearch] Searching: ${searchQuery}`);

  // Search all suppliers in parallel
  const [midtown, iron, panini, amazon] = await Promise.allSettled([
    searchMidtown(searchQuery),
    searchIronStudios(searchQuery),
    searchPanini(searchQuery),
    searchAmazon(searchQuery, 2),
  ]);

  const amazonProducts = (amazon.status === 'fulfilled' ? amazon.value : []).map(p => ({
    id: `amazon-${p.asin}`,
    title: p.title,
    price_usd: p.price_usd,
    price_cop: Math.round(p.price_usd * 4100),
    image: p.image,
    supplier: 'amazon',
    supplier_name: 'Amazon',
    supplier_url: p.url,
    affiliate_url: p.affiliate_url,
    model: 'affiliate' as const,
    delivery_days: '8–15',
    in_stock: true,
    color: '#f97316',
  }));

  const results: LiveProduct[] = [
    ...(midtown.status === 'fulfilled' ? midtown.value : []),
    ...(iron.status === 'fulfilled' ? iron.value : []),
    ...(panini.status === 'fulfilled' ? panini.value : []),
    ...amazonProducts,
  ].filter(p => p.title && p.price_usd > 0).slice(0, 8);

  // Save to cache
  if (results.length > 0) {
    await setCache(cacheKey, results);
  }

  return results;
}
