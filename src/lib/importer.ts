import * as cheerio from 'cheerio';
import type { ImportedProduct, SupplierSource } from '@/types';

// ── HELPERS ──────────────────────────────────────────────────────────────────

function shopifyFullSize(src: string): string {
  return src
    .replace(/_(pico|icon|thumb|small|compact|medium|large|grande|1024x1024|\d+x\d+)(\.[a-z]+)$/i, '$2')
    .replace(/\?v=\d+/, '');
}

const FRANCHISES = ['Batman', 'Superman', 'Spider-Man', 'Iron Man', 'Captain America',
  'Wolverine', 'X-Men', 'Avengers', 'Justice League', 'Wonder Woman', 'Flash',
  'Green Lantern', 'Deadpool', 'Thor', 'Hulk', 'Venom', 'Black Panther', 'Doctor Strange'];
const PUBLISHERS = ['Marvel', 'DC Comics', 'Image Comics', 'Dark Horse', 'IDW',
  'Boom Studios', 'Panini', 'Viz Media', 'Kodansha', 'Shueisha'];

function extractFranchise(text: string): string | undefined {
  for (const f of FRANCHISES) if (text.toLowerCase().includes(f.toLowerCase())) return f;
}
function extractCharacters(text: string): string[] {
  return FRANCHISES.filter(c => text.toLowerCase().includes(c.toLowerCase()));
}
function extractPublisher(text: string): string | undefined {
  for (const p of PUBLISHERS) if (text.includes(p)) return p;
}

// Extract product info from JSON-LD (works on most modern e-commerce sites)
function extractJsonLd($: cheerio.CheerioAPI): { title?: string; description?: string; price?: number; currency?: string; images?: string[]; brand?: string; sku?: string; inStock?: boolean } {
  let result: any = {};
  $('script[type="application/ld+json"]').each((_, el) => {
    if (result.title) return;
    try {
      const raw = $(el).html() || '{}';
      const data = JSON.parse(raw);
      const nodes = Array.isArray(data) ? data : (data['@graph'] || [data]);
      for (const node of nodes) {
        if (node['@type'] === 'Product' || node['@type']?.includes?.('Product')) {
          result.title = node.name;
          result.description = typeof node.description === 'string' ? node.description.slice(0, 2000) : '';
          result.brand = node.brand?.name;
          result.sku = node.sku || node.mpn;
          const offers = Array.isArray(node.offers) ? node.offers[0] : node.offers;
          if (offers) {
            result.price = parseFloat(String(offers.price || offers.lowPrice || 0));
            result.currency = offers.priceCurrency;
            result.inStock = offers.availability?.includes('InStock') ?? true;
          }
          const imgs = node.image;
          if (imgs) result.images = (Array.isArray(imgs) ? imgs : [imgs]).map((i: any) => typeof i === 'string' ? i : i.url).filter(Boolean);
          break;
        }
      }
    } catch {}
  });
  return result;
}

// Extract OpenGraph meta tags (universal fallback)
function extractOG($: cheerio.CheerioAPI): { title?: string; description?: string; image?: string; price?: number; currency?: string } {
  return {
    title: $('meta[property="og:title"]').attr('content') || '',
    description: $('meta[property="og:description"]').attr('content') || '',
    image: $('meta[property="og:image"]').attr('content') || '',
    price: parseFloat($('meta[property="og:price:amount"], meta[property="product:price:amount"]').attr('content') || '0') || 0,
    currency: $('meta[property="og:price:currency"], meta[property="product:price:currency"]').attr('content') || 'USD',
  };
}

// Standard browser headers for scraping
function browserHeaders(referer = 'https://www.google.com/'): Record<string, string> {
  return {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'es-CO,es;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Referer': referer,
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'cross-site',
    'upgrade-insecure-requests': '1',
  };
}

async function fetchHtml(url: string, extraHeaders: Record<string, string> = {}, timeout = 15000): Promise<string> {
  const res = await fetch(url, {
    headers: { ...browserHeaders(), ...extraHeaders },
    signal: AbortSignal.timeout(timeout),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} al obtener ${url}`);
  return res.text();
}

// ── SUPPLIER DETECTION ───────────────────────────────────────────────────────

export function detectSupplier(url: string): SupplierSource | 'shopify_generic' | 'aliexpress' | 'alibaba' | 'dhgate' | 'shein' | 'temu' | 'walmart' | null {
  const u = url.toLowerCase();
  if (u.includes('ironstudios.com')) return 'ironstudios';
  if (u.includes('paninitienda.com')) return 'panini';
  if (u.includes('midtowncomics.com')) return 'midtown';
  if (u.includes('latiendadecomics.com')) return 'tiendanube';
  if (u.includes('amazon.com') || u.includes('amazon.co')) return 'amazon';
  if (u.includes('walmart.com') || u.includes('walmart.com.mx')) return 'walmart';
  if (u.includes('aliexpress.com') || u.includes('es.aliexpress.com')) return 'aliexpress';
  if (u.includes('alibaba.com') || u.includes('es.alibaba.com')) return 'alibaba';
  if (u.includes('dhgate.com')) return 'dhgate';
  if (u.includes('shein.com') || u.includes('shein.com.co') || u.includes('shein.com.mx')) return 'shein';
  if (u.includes('temu.com')) return 'temu';
  // Generic Shopify detection: path contains /products/
  if (u.includes('/products/') && !u.includes('?') || u.match(/\.myshopify\.com/)) return 'shopify_generic';
  return null;
}

// ── MAIN ENTRY POINT ─────────────────────────────────────────────────────────

export async function importFromUrl(url: string): Promise<ImportedProduct> {
  const supplier = detectSupplier(url);

  switch (supplier) {
    case 'ironstudios': return importShopify(url, 'ironstudios', 'Iron Studios', 'figuras');
    case 'panini': return importShopify(url, 'panini', 'Panini Colombia', 'comics', 'COP');
    case 'shopify_generic': return importShopify(url, 'manual', undefined, undefined);
    case 'midtown': return importMidtown(url);
    case 'tiendanube': return importTiendanube(url);
    case 'amazon': return importAmazon(url);
    case 'walmart': return importWalmart(url);
    case 'aliexpress': return importAliExpress(url);
    case 'alibaba': return importAlibaba(url);
    case 'dhgate': return importDHGate(url);
    case 'shein': return importShein(url);
    case 'temu': return importTemu(url);
    default:
      // Last resort: try Shopify JSON endpoint
      if (url.includes('/products/')) return importShopify(url, 'manual', undefined, undefined);
      throw new Error('URL no reconocida. Soportados: Shopify, Amazon, Walmart, AliExpress, Alibaba, DHGate, Shein, Temu, Midtown Comics.');
  }
}

// ── SHOPIFY (universal) ───────────────────────────────────────────────────────

async function importShopify(
  url: string,
  supplierKey: string,
  defaultPublisher?: string,
  defaultCategory?: string,
  priceCurrency: 'USD' | 'COP' = 'USD'
): Promise<ImportedProduct> {
  const cleanUrl = url.replace(/\?.*$/, '').replace(/\/$/, '');
  const jsonUrl = cleanUrl.endsWith('.json') ? cleanUrl : cleanUrl + '.json';

  const res = await fetch(jsonUrl, {
    headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`Shopify: Error ${res.status}. Verifica que la URL sea de un producto (debe incluir /products/nombre)`);

  const data = await res.json();
  const p = data.product;
  if (!p) throw new Error('Shopify: respuesta inesperada — asegúrate de que la URL sea de un producto Shopify (/products/slug)');

  const variant = p.variants?.[0];
  const price = parseFloat(variant?.price || '0');
  const images = (p.images || [])
    .map((img: any) => img.src ? shopifyFullSize(img.src) : null)
    .filter(Boolean) as string[];
  const description = cheerio.load(p.body_html || '').text().trim().slice(0, 2000);

  // Try to detect publisher from product type/tags/vendor
  const publisher = defaultPublisher
    || extractPublisher(p.vendor || '')
    || extractPublisher(p.product_type || '')
    || (p.vendor ? p.vendor : undefined);

  const domain = new URL(url).hostname.replace('www.', '');
  const supplierName = supplierKey !== 'manual' ? supplierKey : domain;

  return {
    title: p.title || '',
    description,
    price_original: price,
    price_original_currency: priceCurrency,
    images,
    supplier: supplierName as any,
    supplier_url: url,
    supplier_sku: variant?.sku || p.handle,
    publisher,
    in_stock: variant?.available !== false,
    franchise: extractFranchise(p.title || ''),
    characters: extractCharacters(p.title || ''),
    category: defaultCategory,
  };
}

// ── WALMART ──────────────────────────────────────────────────────────────────

async function importWalmart(url: string): Promise<ImportedProduct> {
  const cleanUrl = url.split('#')[0];
  const html = await fetchHtml(cleanUrl, { 'Referer': 'https://www.walmart.com/' });
  const $ = cheerio.load(html);

  const ld = extractJsonLd($);
  const og = extractOG($);

  const title = ld.title || $('h1[itemprop="name"], h1.prod-ProductTitle').first().text().trim() || og.title || '';

  let price = ld.price || 0;
  if (!price) {
    const priceSels = ['[itemprop="price"]', '.price-characteristic', '.price-group', '[data-testid="price-wrap"] span'];
    for (const sel of priceSels) {
      const t = $(sel).first().attr('content') || $(sel).first().text();
      const p = parseFloat((t || '').replace(/[^0-9.]/g, ''));
      if (p > 0) { price = p; break; }
    }
  }

  const description = ld.description
    || $('[data-testid="product-description-content"], .about-product-description, [itemprop="description"]').first().text().trim().slice(0, 2000)
    || og.description || '';

  const images: string[] = [];
  if (og.image) images.push(og.image);
  if (ld.images?.length) ld.images.forEach(i => { if (!images.includes(i)) images.push(i); });
  // Walmart also loads images in a __NEXT_DATA__ script
  const nextData = html.match(/"url":"(https:\/\/i5\.walmartimages\.com[^"]+)"/g);
  if (nextData) {
    nextData.slice(0, 5).forEach(m => {
      const u = m.replace('"url":"', '').replace('"', '');
      if (!images.includes(u)) images.push(u);
    });
  }

  return {
    title,
    description,
    price_original: price,
    price_original_currency: ld.currency as any || 'USD',
    images: images.slice(0, 5),
    supplier: 'walmart' as any,
    supplier_url: cleanUrl,
    supplier_sku: ld.sku,
    publisher: ld.brand || extractPublisher(title),
    in_stock: ld.inStock ?? true,
    franchise: extractFranchise(title),
    characters: extractCharacters(title),
  };
}

// ── ALIEXPRESS ───────────────────────────────────────────────────────────────

async function importAliExpress(url: string): Promise<ImportedProduct> {
  const cleanUrl = url.split('?')[0] + '?spm=a2g0o.detail.0.0';
  const html = await fetchHtml(cleanUrl, {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1',
    'Referer': 'https://www.aliexpress.com/',
  });
  const $ = cheerio.load(html);

  const ld = extractJsonLd($);
  const og = extractOG($);

  const title = ld.title || $('h1[data-pl="product-title"], .product-title-text, h1').first().text().trim() || og.title || '';

  let price = ld.price || og.price || 0;
  if (!price) {
    // AliExpress price in window.runParams
    const priceMatch = html.match(/"actSkuCalPrice":"([0-9.]+)"/);
    if (priceMatch) price = parseFloat(priceMatch[1]);
  }
  if (!price) {
    const priceMatch = html.match(/"minPrice":([0-9.]+)/);
    if (priceMatch) price = parseFloat(priceMatch[1]);
  }

  const description = ld.description
    || $('[data-pl="product-detail"], .product-description, .detail-desc').first().text().trim().slice(0, 2000)
    || og.description || '';

  const images: string[] = [];
  if (og.image) images.push(og.image);
  if (ld.images?.length) ld.images.forEach(i => { if (!images.includes(i)) images.push(i); });
  // AliExpress imagePathList in JSON
  const imgMatch = html.match(/"imagePathList":\[([^\]]+)\]/);
  if (imgMatch) {
    imgMatch[1].replace(/"/g, '').split(',').forEach(src => {
      const u = src.startsWith('//') ? 'https:' + src : src;
      if (u.startsWith('http') && !images.includes(u)) images.push(u);
    });
  }

  return {
    title: title.replace(/\s+/g, ' ').trim(),
    description,
    price_original: price,
    price_original_currency: 'USD',
    images: images.slice(0, 5),
    supplier: 'aliexpress' as any,
    supplier_url: url,
    supplier_sku: ld.sku || url.match(/item\/(\d+)/)?.[1],
    publisher: ld.brand,
    in_stock: ld.inStock ?? true,
    franchise: extractFranchise(title),
    characters: extractCharacters(title),
  };
}

// ── ALIBABA ──────────────────────────────────────────────────────────────────

async function importAlibaba(url: string): Promise<ImportedProduct> {
  const cleanUrl = url.split('?')[0];
  const html = await fetchHtml(cleanUrl, { 'Referer': 'https://www.alibaba.com/' });
  const $ = cheerio.load(html);

  const ld = extractJsonLd($);
  const og = extractOG($);

  const title = ld.title || $('h1.product-name, h1[data-module="productTitle"], h1').first().text().trim() || og.title || '';

  let price = ld.price || og.price || 0;
  if (!price) {
    const priceMatch = html.match(/"minPrice":"?([0-9.]+)"?/);
    if (priceMatch) price = parseFloat(priceMatch[1]);
  }

  const description = ld.description
    || $('.product-description, [data-module="productDescription"]').first().text().trim().slice(0, 2000)
    || og.description || '';

  const images: string[] = [];
  if (og.image) images.push(og.image.replace(/_.jpg$/, '.jpg'));
  if (ld.images?.length) ld.images.forEach(i => { if (!images.includes(i)) images.push(i); });
  $('img[src*="alicdn.com"]').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src');
    if (src && src.includes('alicdn') && !images.includes(src)) images.push(src);
  });

  return {
    title: title.trim(),
    description,
    price_original: price,
    price_original_currency: 'USD',
    images: images.slice(0, 5),
    supplier: 'alibaba' as any,
    supplier_url: url,
    supplier_sku: ld.sku,
    publisher: ld.brand,
    in_stock: true,
    franchise: extractFranchise(title),
    characters: extractCharacters(title),
  };
}

// ── DHGATE ───────────────────────────────────────────────────────────────────

async function importDHGate(url: string): Promise<ImportedProduct> {
  const cleanUrl = url.split('?')[0];
  const html = await fetchHtml(cleanUrl, { 'Referer': 'https://www.dhgate.com/' });
  const $ = cheerio.load(html);

  const ld = extractJsonLd($);
  const og = extractOG($);

  const title = ld.title || $('h1.product-title, h1[class*="title"]').first().text().trim() || og.title || '';

  let price = ld.price || og.price || 0;
  if (!price) {
    const pM = html.match(/"minPrice":([0-9.]+)/);
    if (pM) price = parseFloat(pM[1]);
  }

  const description = ld.description
    || $('.product-detail-description, .details-desc').first().text().trim().slice(0, 2000)
    || og.description || '';

  const images: string[] = [];
  if (og.image) images.push(og.image);
  if (ld.images?.length) ld.images.forEach(i => { if (!images.includes(i)) images.push(i); });
  $('img[data-original], img[src*="dhresource.com"]').each((_, el) => {
    const src = $(el).attr('data-original') || $(el).attr('src');
    if (src && src.includes('dhresource') && !images.includes(src)) images.push(src);
  });

  return {
    title,
    description,
    price_original: price,
    price_original_currency: 'USD',
    images: images.slice(0, 5),
    supplier: 'dhgate' as any,
    supplier_url: url,
    supplier_sku: ld.sku,
    publisher: ld.brand,
    in_stock: ld.inStock ?? true,
    franchise: extractFranchise(title),
    characters: extractCharacters(title),
  };
}

// ── SHEIN ─────────────────────────────────────────────────────────────────────

async function importShein(url: string): Promise<ImportedProduct> {
  const cleanUrl = url.split('?')[0] + '?src=SEO';
  const html = await fetchHtml(cleanUrl, {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1',
    'Referer': 'https://www.shein.com/',
  });
  const $ = cheerio.load(html);

  const ld = extractJsonLd($);
  const og = extractOG($);

  const title = ld.title || $('h1.product-intro__head-name, h1[class*="title"]').first().text().trim() || og.title || '';

  let price = ld.price || og.price || 0;
  if (!price) {
    const pM = html.match(/"salePrice":\{"amount":"([0-9.]+)"/);
    if (pM) price = parseFloat(pM[1]);
  }
  if (!price) {
    const pM = html.match(/"retailPrice":\{"amount":"([0-9.]+)"/);
    if (pM) price = parseFloat(pM[1]);
  }

  const description = ld.description || og.description || '';

  const images: string[] = [];
  if (og.image) images.push(og.image);
  if (ld.images?.length) ld.images.forEach(i => { if (!images.includes(i)) images.push(i); });
  // Shein images in JSON blob
  const imgMatches = html.match(/https:\/\/img\.shein\.com\/[^"'\s]+\.jpg[^"'\s]*/g);
  if (imgMatches) {
    [...new Set(imgMatches)].slice(0, 6).forEach(u => {
      const clean = u.split('?')[0];
      if (!images.includes(clean)) images.push(clean);
    });
  }

  return {
    title,
    description,
    price_original: price,
    price_original_currency: ld.currency as any || 'USD',
    images: images.slice(0, 5),
    supplier: 'shein' as any,
    supplier_url: url,
    supplier_sku: ld.sku || url.match(/p-(\d+)/)?.[1],
    publisher: ld.brand || 'SHEIN',
    in_stock: ld.inStock ?? true,
    franchise: extractFranchise(title),
    characters: extractCharacters(title),
  };
}

// ── TEMU ─────────────────────────────────────────────────────────────────────

async function importTemu(url: string): Promise<ImportedProduct> {
  const cleanUrl = url.split('?')[0];
  const html = await fetchHtml(cleanUrl, {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1',
    'Referer': 'https://www.temu.com/',
  });
  const $ = cheerio.load(html);

  const ld = extractJsonLd($);
  const og = extractOG($);

  const title = ld.title || $('h1[class*="title"], h1[class*="name"]').first().text().trim() || og.title || '';

  let price = ld.price || og.price || 0;
  if (!price) {
    const pM = html.match(/"price":([0-9.]+)/);
    if (pM) price = parseFloat(pM[1]);
  }

  const description = ld.description || og.description || '';

  const images: string[] = [];
  if (og.image) images.push(og.image);
  if (ld.images?.length) ld.images.forEach(i => { if (!images.includes(i)) images.push(i); });
  const imgMs = html.match(/https:\/\/img\.temu\.com\/[^"'\s]+/g);
  if (imgMs) {
    [...new Set(imgMs)].slice(0, 5).forEach(u => { if (!images.includes(u)) images.push(u); });
  }

  return {
    title,
    description,
    price_original: price,
    price_original_currency: ld.currency as any || 'USD',
    images: images.slice(0, 5),
    supplier: 'temu' as any,
    supplier_url: url,
    supplier_sku: ld.sku,
    publisher: ld.brand,
    in_stock: ld.inStock ?? true,
    franchise: extractFranchise(title),
    characters: extractCharacters(title),
  };
}

// ── MIDTOWN COMICS (HTML) ─────────────────────────────────────────────────────

async function importMidtown(url: string): Promise<ImportedProduct> {
  const cleanUrl = url.split('#')[0];
  const html = await fetchHtml(cleanUrl, { 'Referer': 'https://www.midtowncomics.com/' });
  const $ = cheerio.load(html);
  const ld = extractJsonLd($);
  const og = extractOG($);

  let title = ld.title || $('h1.product-title,h1.productTitle,h1[itemprop="name"],.product-name h1').first().text().trim();
  if (!title) title = $('title').text().replace(/\s*[-|]\s*Midtown Comics.*$/i, '').trim();

  let price = ld.price || 0;
  if (!price && og.price) price = og.price;
  if (!price) {
    for (const sel of ['.product-price','.price-box .price','[class*="price"]','.pricetag','.amt']) {
      const p = parseFloat($(sel).first().text().replace(/[^0-9.]/g, ''));
      if (p > 0) { price = p; break; }
    }
  }

  const description = ld.description || $('[itemprop="description"],.product-description').first().text().trim().slice(0, 2000);

  const images: string[] = [];
  if (og.image) images.push(og.image);
  if (ld.images?.length) ld.images.forEach(i => { if (!images.includes(i)) images.push(i); });
  for (const sel of ['img[itemprop="image"]','.product-image img','.main-image img','#product-image img']) {
    $(sel).each((_, el) => {
      const src = $(el).attr('data-zoom-image') || $(el).attr('data-hires') || $(el).attr('data-src') || $(el).attr('src');
      if (src && !src.includes('placeholder') && !src.includes('logo')) {
        const full = src.startsWith('http') ? src : `https://www.midtowncomics.com${src}`;
        if (!images.includes(full)) images.push(full);
      }
    });
    if (images.length >= 3) break;
  }

  return {
    title, description, price_original: price, price_original_currency: 'USD',
    images, supplier: 'midtown', supplier_url: cleanUrl,
    publisher: ld.brand || extractPublisher($('body').text()),
    in_stock: !$('.out-of-stock,.unavailable,.sold-out').length,
    franchise: extractFranchise(title), characters: extractCharacters(title),
  };
}

// ── TIENDANUBE ────────────────────────────────────────────────────────────────

async function importTiendanube(url: string): Promise<ImportedProduct> {
  const html = await fetchHtml(url, { 'Accept-Language': 'es-CO,es;q=0.9' });
  const $ = cheerio.load(html);
  const ld = extractJsonLd($);
  const og = extractOG($);

  const title = ld.title || $('h1.product-name,h1[itemprop="name"]').first().text().trim() || og.title?.split('|')[0].trim() || '';
  const priceText = $('[itemprop="price"],.product-price .price,.js-price-display').first().text().trim();
  const price = ld.price || parseFloat(priceText.replace(/[^0-9.]/g, '')) || og.price || 0;
  const description = ld.description || $('[itemprop="description"],.product-description').first().text().trim().slice(0, 2000);

  const images: string[] = [];
  if (og.image) images.push(og.image);
  if (ld.images?.length) ld.images.forEach(i => { if (!images.includes(i)) images.push(i); });

  return {
    title, description, price_original: price, price_original_currency: 'COP',
    images: images.slice(0, 5), supplier: 'manual', supplier_url: url,
    publisher: ld.brand || extractPublisher(html), in_stock: !$('.no-stock,.sold-out').length,
    franchise: extractFranchise(title), characters: extractCharacters(title),
  };
}

// ── AMAZON ────────────────────────────────────────────────────────────────────

async function importAmazon(url: string): Promise<ImportedProduct> {
  const asinMatch = url.match(/(?:\/dp\/|\/gp\/product\/|\/product\/)([A-Z0-9]{10})/i);
  const asin = asinMatch?.[1]?.toUpperCase();
  const cleanUrl = asin ? `https://www.amazon.com/dp/${asin}` : url.split('?')[0];
  const asinImage = asin ? `https://images-na.ssl-images-amazon.com/images/P/${asin}.01.LZZZZZZZ.jpg` : null;

  let html = '';
  for (const ua of [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1',
  ]) {
    if (html) break;
    try {
      const res = await fetch(cleanUrl, { headers: { 'User-Agent': ua, 'Accept': 'text/html', 'Accept-Language': 'en-US,en;q=0.9', 'Referer': 'https://www.google.com/' }, signal: AbortSignal.timeout(12000) });
      if (res.ok) {
        const t = await res.text();
        if (t.includes('productTitle') || t.includes('a-price') || t.includes('feature-bullets')) html = t;
      }
    } catch {}
  }

  const $ = cheerio.load(html);
  const ld = extractJsonLd($);
  const title = ld.title || $('#productTitle').text().trim() || (asin ? `Amazon ASIN: ${asin}` : 'Producto Amazon');
  const description = ld.description || $('#feature-bullets li:not(.aok-hidden)').map((_, el) => $(el).text().trim()).get().join(' ').slice(0, 2000);

  let price = ld.price || 0;
  if (!price) {
    for (const sel of ['.apexPriceToPay .a-offscreen','.priceToPay .a-offscreen','#corePriceDisplay_desktop_feature_div .a-offscreen','.a-price .a-offscreen','#priceblock_ourprice']) {
      const p = parseFloat($(sel).first().text().replace(/[^0-9.]/g, ''));
      if (p > 0 && p < 10000) { price = p; break; }
    }
  }

  const images: string[] = [];
  if (asinImage) images.push(asinImage);
  const dynImg = $('#landingImage,#imgBlkFront').attr('data-a-dynamic-image');
  if (dynImg) {
    try { Object.entries(JSON.parse(dynImg)).sort((a: any, b: any) => (b[1][0]*b[1][1])-(a[1][0]*a[1][1])).slice(0,4).forEach(([u]: any) => { if (!images.includes(u)) images.push(u); }); } catch {}
  }

  return {
    title, description, price_original: price, price_original_currency: 'USD',
    images, supplier: 'amazon', supplier_url: cleanUrl, supplier_sku: asin,
    in_stock: !$('#outOfStock').length,
    franchise: extractFranchise(title), characters: extractCharacters(title),
  };
}

// ── CALCULATE SELLING PRICE ───────────────────────────────────────────────────

export function calculateSellingPrice(
  originalPrice: number,
  currency: 'USD' | 'COP',
  marginPercent = 10,
  shippingUsd = 5,
  exchangeRateCOP = 4100,
): number {
  const baseUsd = currency === 'COP' ? originalPrice / exchangeRateCOP : originalPrice;
  return Math.round((baseUsd * (1 + marginPercent / 100) + shippingUsd) * 100) / 100;
}
