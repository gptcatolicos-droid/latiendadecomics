import * as cheerio from 'cheerio';
import type { ImportedProduct, SupplierSource } from '@/types';

// ── CONSTANTS & HELPERS ──────────────────────────────────────────────────────

function shopifyFullSize(src: string): string {
  return src
    .replace(/_(pico|icon|thumb|small|compact|medium|large|grande|1024x1024|\d+x\d+)(\.[a-z]+)$/i, '$2')
    .replace(/\?v=\d+/, '');
}

const FRANCHISES = ['Batman', 'Superman', 'Spider-Man', 'Iron Man', 'Captain America',
  'Wolverine', 'X-Men', 'Avengers', 'Justice League', 'Wonder Woman', 'Flash',
  'Green Lantern', 'Deadpool', 'Thor', 'Hulk', 'Venom', 'Black Panther', 'Doctor Strange',
  'Naruto', 'Dragon Ball', 'One Piece', 'Attack on Titan', 'Demon Slayer'];
const PUBLISHERS = ['Marvel', 'DC Comics', 'Image Comics', 'Dark Horse', 'IDW',
  'Boom Studios', 'Panini', 'Viz Media', 'Kodansha', 'Shueisha', 'Iron Studios', 'Sideshow'];

function extractFranchise(text: string): string | undefined {
  for (const f of FRANCHISES) if (text.toLowerCase().includes(f.toLowerCase())) return f;
}
function extractCharacters(text: string): string[] {
  return FRANCHISES.filter(c => text.toLowerCase().includes(c.toLowerCase()));
}
function extractPublisher(text: string): string | undefined {
  for (const p of PUBLISHERS) if (text.includes(p)) return p;
}

// Parse JSON-LD structured data — works on ~80% of modern e-commerce sites
function extractJsonLd($: cheerio.CheerioAPI): {
  title?: string; description?: string; price?: number; currency?: string;
  images?: string[]; brand?: string; sku?: string; inStock?: boolean;
} {
  let result: any = {};
  $('script[type="application/ld+json"]').each((_, el) => {
    if (result.title) return;
    try {
      const data = JSON.parse($(el).html() || '{}');
      const nodes = Array.isArray(data) ? data : (data['@graph'] || [data]);
      for (const node of nodes) {
        const t = node['@type'];
        if (t === 'Product' || (Array.isArray(t) && t.includes('Product')) || String(t).includes('Product')) {
          result.title = node.name;
          result.description = typeof node.description === 'string' ? node.description.slice(0, 2000) : '';
          result.brand = node.brand?.name;
          result.sku = node.sku || node.mpn;
          const offers = Array.isArray(node.offers) ? node.offers[0] : node.offers;
          if (offers) {
            result.price = parseFloat(String(offers.price || offers.lowPrice || 0)) || 0;
            result.currency = offers.priceCurrency;
            result.inStock = offers.availability ? offers.availability.includes('InStock') : true;
          }
          const imgs = node.image;
          if (imgs) result.images = (Array.isArray(imgs) ? imgs : [imgs])
            .map((i: any) => (typeof i === 'string' ? i : i?.url || i?.contentUrl))
            .filter(Boolean);
          break;
        }
      }
    } catch {}
  });
  return result;
}

// OpenGraph meta tags — universal fallback
function extractOG($: cheerio.CheerioAPI) {
  return {
    title: $('meta[property="og:title"]').attr('content') || $('meta[name="title"]').attr('content') || '',
    description: $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '',
    image: $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content') || '',
    price: parseFloat($('meta[property="og:price:amount"], meta[property="product:price:amount"]').attr('content') || '0') || 0,
    currency: $('meta[property="og:price:currency"], meta[property="product:price:currency"]').attr('content') || 'USD',
  };
}

// ── FETCH STRATEGIES ─────────────────────────────────────────────────────────

const DESKTOP_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
const MOBILE_UA  = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1';

async function fetchDirect(url: string, ua = DESKTOP_UA, referer = 'https://www.google.com/'): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': ua,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'es-CO,es;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Referer': referer,
      'Cache-Control': 'no-cache',
      'upgrade-insecure-requests': '1',
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

// Proxy fetch for sites that block server IPs (AliExpress, DHgate, etc.)
async function fetchViaProxy(url: string): Promise<string> {
  // Try multiple free proxies in order
  const proxies = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
  ];

  for (const proxyUrl of proxies) {
    try {
      const res = await fetch(proxyUrl, {
        headers: { 'User-Agent': DESKTOP_UA },
        signal: AbortSignal.timeout(18000),
      });
      if (res.ok) {
        const text = await res.text();
        if (text.length > 500 && !text.includes('Error') && !text.includes('blocked')) return text;
      }
    } catch {}
  }
  throw new Error('No se pudo acceder a la página. El sitio puede estar bloqueando importaciones automáticas.');
}

// Try direct first, fall back to proxy
async function fetchWithFallback(url: string, ua = DESKTOP_UA, referer?: string): Promise<string> {
  try {
    return await fetchDirect(url, ua, referer || new URL(url).origin + '/');
  } catch {
    return fetchViaProxy(url);
  }
}

// ── SUPPLIER DETECTION ───────────────────────────────────────────────────────

type Supplier = SupplierSource | 'shopify_generic' | 'aliexpress' | 'alibaba' | 'dhgate' | 'shein' | 'temu' | 'walmart' | 'sideshow';

export function detectSupplier(url: string): Supplier | null {
  const u = url.toLowerCase();
  if (u.includes('ironstudios.com')) return 'ironstudios';
  if (u.includes('paninitienda.com')) return 'panini';
  if (u.includes('midtowncomics.com')) return 'midtown';
  if (u.includes('latiendadecomics.com')) return 'tiendanube';
  if (u.includes('sideshow.com')) return 'sideshow';
  if (u.includes('amazon.com') || u.includes('amazon.co')) return 'amazon';
  if (u.includes('walmart.com')) return 'walmart';
  if (u.includes('aliexpress.com') || u.includes('es.aliexpress.com')) return 'aliexpress';
  if (u.includes('alibaba.com')) return 'alibaba';
  if (u.includes('dhgate.com')) return 'dhgate';
  if (u.includes('shein.com')) return 'shein';
  if (u.includes('temu.com')) return 'temu';
  if (u.includes('/products/') || u.includes('.myshopify.com')) return 'shopify_generic';
  return null;
}

// ── MAIN ENTRY ────────────────────────────────────────────────────────────────

export async function importFromUrl(url: string): Promise<ImportedProduct> {
  const supplier = detectSupplier(url);
  switch (supplier) {
    case 'ironstudios': return importShopify(url, 'ironstudios', 'Iron Studios', 'figuras');
    case 'panini':      return importShopify(url, 'panini', 'Panini Colombia', 'comics', 'COP');
    case 'sideshow':    return importSideshow(url);
    case 'shopify_generic': return importShopify(url, 'manual');
    case 'midtown':     return importMidtown(url);
    case 'tiendanube':  return importTiendanube(url);
    case 'amazon':      return importAmazon(url);
    case 'walmart':     return importWalmart(url);
    case 'aliexpress':  return importAliExpress(url);
    case 'alibaba':     return importAlibaba(url);
    case 'dhgate':      return importDHGate(url);
    case 'shein':       return importShein(url);
    case 'temu':        return importTemu(url);
    default:
      if (url.includes('/products/')) return importShopify(url, 'manual');
      throw new Error('URL no reconocida. Soportados: Shopify, Amazon, Walmart, Sideshow, AliExpress, Alibaba, DHgate, Shein, Temu, Midtown Comics, Iron Studios, Panini.');
  }
}

// ── SHOPIFY (generic — works on ANY Shopify store) ────────────────────────────

async function importShopify(
  url: string, supplierKey: string,
  defaultPublisher?: string, defaultCategory?: string, priceCurrency: 'USD'|'COP' = 'USD'
): Promise<ImportedProduct> {
  const cleanUrl = url.replace(/\?.*$/, '').replace(/\/$/, '');
  const jsonUrl = cleanUrl.endsWith('.json') ? cleanUrl : cleanUrl + '.json';

  const res = await fetch(jsonUrl, {
    headers: { 'Accept': 'application/json', 'User-Agent': DESKTOP_UA },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`Shopify: Error ${res.status}. La URL debe incluir /products/nombre-del-producto`);

  const data = await res.json();
  const p = data.product;
  if (!p) throw new Error('Shopify: respuesta inesperada — verifica que la URL sea de un producto (/products/slug)');

  const variant = p.variants?.[0];
  const images = (p.images || []).map((img: any) => img.src ? shopifyFullSize(img.src) : null).filter(Boolean) as string[];
  const description = cheerio.load(p.body_html || '').text().trim().slice(0, 2000);
  const publisher = defaultPublisher || extractPublisher(p.vendor || '') || p.vendor || undefined;

  return {
    title: p.title || '',
    description,
    price_original: parseFloat(variant?.price || '0'),
    price_original_currency: priceCurrency,
    images,
    supplier: supplierKey as any,
    supplier_url: url,
    supplier_sku: variant?.sku || p.handle,
    publisher,
    in_stock: variant?.available !== false,
    franchise: extractFranchise(p.title || ''),
    characters: extractCharacters(p.title || ''),
    category: defaultCategory,
  };
}

// ── SIDESHOW COLLECTIBLES ─────────────────────────────────────────────────────

async function importSideshow(url: string): Promise<ImportedProduct> {
  const html = await fetchDirect(url, DESKTOP_UA, 'https://www.sideshow.com/');
  const $ = cheerio.load(html);
  const ld = extractJsonLd($);
  const og = extractOG($);

  const title = ld.title || $('h1.product-name, h1[itemprop="name"], h1').first().text().trim() || og.title || '';

  let price = ld.price || 0;
  if (!price) {
    const priceSels = [
      '[itemprop="price"]', '.product-price .price', '.price-current',
      '[data-product-price]', '.product-info__price', '.price__regular',
    ];
    for (const sel of priceSels) {
      const t = $(sel).first().attr('content') || $(sel).first().text();
      const p = parseFloat((t || '').replace(/[^0-9.]/g, ''));
      if (p > 0) { price = p; break; }
    }
  }
  // Sideshow price also in JSON blob
  if (!price) {
    const pm = html.match(/"price":\s*"?(\d+\.?\d*)"?/);
    if (pm) price = parseFloat(pm[1]);
  }

  const description = ld.description
    || $('.product-description, .product-detail__description, [itemprop="description"]').first().text().trim().slice(0, 2000)
    || og.description || '';

  const images: string[] = [];
  if (og.image) images.push(og.image);
  if (ld.images?.length) ld.images.forEach(i => { if (i && !images.includes(i)) images.push(i); });
  $('img[data-zoom-image], img.product-image, .product-carousel img, img[itemprop="image"]').each((_, el) => {
    const src = $(el).attr('data-zoom-image') || $(el).attr('data-src') || $(el).attr('src');
    if (src && src.startsWith('http') && !src.includes('logo') && !images.includes(src)) images.push(src);
  });

  return {
    title,
    description,
    price_original: price,
    price_original_currency: 'USD',
    images: images.slice(0, 6),
    supplier: 'sideshow' as any,
    supplier_url: url,
    supplier_sku: ld.sku,
    publisher: ld.brand || 'Sideshow Collectibles',
    in_stock: ld.inStock ?? !$('.out-of-stock, .sold-out, [data-sold-out]').length,
    franchise: extractFranchise(title),
    characters: extractCharacters(title),
    category: 'figuras',
  };
}

// ── ALIEXPRESS ────────────────────────────────────────────────────────────────

async function importAliExpress(url: string): Promise<ImportedProduct> {
  // Clean URL to canonical form
  const itemIdMatch = url.match(/item\/(\d+)/);
  const itemId = itemIdMatch?.[1];
  const cleanUrl = itemId
    ? `https://www.aliexpress.com/item/${itemId}.html`
    : url.split('?')[0];

  let html = '';
  // Try mobile site first (less bot protection)
  const mobileUrl = cleanUrl.replace('www.aliexpress.com', 'm.aliexpress.com');
  try {
    html = await fetchDirect(mobileUrl, MOBILE_UA, 'https://m.aliexpress.com/');
  } catch {
    html = await fetchWithFallback(cleanUrl, MOBILE_UA, 'https://www.aliexpress.com/');
  }

  const $ = cheerio.load(html);
  const ld = extractJsonLd($);
  const og = extractOG($);

  // Title: JSON-LD first, then og:title cleaned, then page h1
  let title = ld.title || '';
  if (!title) title = og.title?.replace(/\s*[-|].*AliExpress.*/i, '').replace(/\s*\|\s*$/,'').trim() || '';
  if (!title) title = $('h1').first().text().trim();
  // Clean up typical AliExpress title noise
  title = title.replace(/^PRODUCTOS_.*?\|/i, '').replace(/\|\s*temu\s*$/i, '').trim();

  let price = ld.price || og.price || 0;
  if (!price) {
    const patterns = [
      /"actSkuCalPrice":"([0-9.]+)"/,
      /"minPrice":([0-9.]+)/,
      /"salePrice":\{"value":"([0-9.]+)"/,
      /"price":\{"value":"([0-9.]+)"/,
    ];
    for (const p of patterns) {
      const m = html.match(p);
      if (m) { price = parseFloat(m[1]); break; }
    }
  }

  const description = ld.description
    || $('[data-pl="product-description"], .product-description').first().text().trim().slice(0, 2000)
    || og.description?.slice(0, 2000) || '';

  const images: string[] = [];
  if (og.image && og.image.startsWith('http')) images.push(og.image);
  if (ld.images?.length) ld.images.forEach(i => { if (i && !images.includes(i)) images.push(i); });

  // Extract image list from JSON in page
  const imgListPatterns = [
    /"imagePathList":\[([^\]]+)\]/,
    /"images":\[([^\]]+)\]/,
    /imageUrlList.*?:\[([^\]]+)\]/,
  ];
  for (const pattern of imgListPatterns) {
    const m = html.match(pattern);
    if (m) {
      try {
        const urls = JSON.parse('[' + m[1] + ']');
        urls.forEach((u: string) => {
          const full = u.startsWith('//') ? 'https:' + u : u;
          if (full.startsWith('http') && !images.includes(full)) images.push(full);
        });
      } catch {}
      break;
    }
  }

  return {
    title: title || 'Producto AliExpress',
    description,
    price_original: price,
    price_original_currency: 'USD',
    images: images.slice(0, 5),
    supplier: 'aliexpress' as any,
    supplier_url: cleanUrl,
    supplier_sku: ld.sku || itemId,
    publisher: ld.brand,
    in_stock: true,
    franchise: extractFranchise(title),
    characters: extractCharacters(title),
  };
}

// ── ALIBABA ───────────────────────────────────────────────────────────────────

async function importAlibaba(url: string): Promise<ImportedProduct> {
  const cleanUrl = url.split('?')[0];
  const html = await fetchWithFallback(cleanUrl, DESKTOP_UA, 'https://www.alibaba.com/');
  const $ = cheerio.load(html);
  const ld = extractJsonLd($);
  const og = extractOG($);

  const title = ld.title
    || $('h1.product-name-text, h1[data-module="productTitle"], .product-title h1').first().text().trim()
    || og.title?.replace(/\s*[-|]\s*Alibaba.*$/i, '').trim() || '';

  let price = ld.price || og.price || 0;
  if (!price) {
    const patterns = [/"minPrice":"?([0-9.]+)"?/, /"price":"?([0-9.]+)"?/, /priceRange.*?([0-9]+\.?[0-9]*)/];
    for (const p of patterns) {
      const m = html.match(p);
      if (m) { price = parseFloat(m[1]); break; }
    }
  }

  const description = ld.description
    || $('.product-description-detail, .product-detail-description').first().text().trim().slice(0, 2000)
    || og.description || '';

  const images: string[] = [];
  if (og.image) images.push(og.image.replace(/_.(?:jpg|png)$/, '.jpg'));
  if (ld.images?.length) ld.images.forEach(i => { if (i && !images.includes(i)) images.push(i); });
  $('img[src*="alicdn.com"], img[data-src*="alicdn.com"]').each((_, el) => {
    const src = $(el).attr('data-src') || $(el).attr('src');
    if (src?.includes('alicdn') && !images.includes(src)) images.push(src);
  });

  return {
    title: title || 'Producto Alibaba',
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

// ── DHGATE ────────────────────────────────────────────────────────────────────

async function importDHGate(url: string): Promise<ImportedProduct> {
  const cleanUrl = url.split('?')[0].split('#')[0];
  const html = await fetchWithFallback(cleanUrl, MOBILE_UA, 'https://www.dhgate.com/');
  const $ = cheerio.load(html);
  const ld = extractJsonLd($);
  const og = extractOG($);

  const title = ld.title
    || $('h1.product-name, h1[class*="title"], h1[class*="product"]').first().text().trim()
    || og.title?.replace(/\s*[-|]\s*DHgate.*$/i, '').trim() || '';

  let price = ld.price || og.price || 0;
  if (!price) {
    const patterns = [/"minPrice":([0-9.]+)/, /"price":"?([0-9.]+)"?/, /"salePrice":([0-9.]+)/];
    for (const p of patterns) {
      const m = html.match(p);
      if (m) { price = parseFloat(m[1]); break; }
    }
  }
  if (!price) {
    const priceSel = $('[itemprop="price"], .product-price, .price-number, .price-m').first();
    const rawPrice = priceSel.attr('content') || priceSel.text();
    price = parseFloat((rawPrice || '').replace(/[^0-9.]/g, '')) || 0;
  }

  const description = ld.description
    || $('.describe-content, .product-description, [class*="description"]').first().text().trim().slice(0, 2000)
    || og.description || '';

  const images: string[] = [];
  if (og.image) images.push(og.image);
  if (ld.images?.length) ld.images.forEach(i => { if (i && !images.includes(i)) images.push(i); });
  $('img[data-original], img[src*="dhresource.com"], img[src*="dhimg.com"]').each((_, el) => {
    const src = $(el).attr('data-original') || $(el).attr('data-src') || $(el).attr('src');
    if (src && (src.includes('dhresource') || src.includes('dhimg')) && !images.includes(src)) images.push(src);
  });
  // JSON image array
  const imgMatch = html.match(/"imgList":\[([^\]]+)\]/) || html.match(/"imageList":\[([^\]]+)\]/);
  if (imgMatch) {
    try { JSON.parse('[' + imgMatch[1] + ']').forEach((u: string) => { if (u.startsWith('http') && !images.includes(u)) images.push(u); }); } catch {}
  }

  return {
    title: title || 'Producto DHgate',
    description,
    price_original: price,
    price_original_currency: 'USD',
    images: images.slice(0, 5),
    supplier: 'dhgate' as any,
    supplier_url: url,
    supplier_sku: ld.sku,
    publisher: ld.brand,
    in_stock: true,
    franchise: extractFranchise(title),
    characters: extractCharacters(title),
  };
}

// ── SHEIN ─────────────────────────────────────────────────────────────────────

async function importShein(url: string): Promise<ImportedProduct> {
  const html = await fetchWithFallback(url, MOBILE_UA, 'https://www.shein.com/');
  const $ = cheerio.load(html);
  const ld = extractJsonLd($);
  const og = extractOG($);

  const title = ld.title
    || $('h1[class*="title"], h1[class*="name"]').first().text().trim()
    || og.title?.replace(/\s*[-|]\s*SHEIN.*$/i, '').trim() || '';

  let price = ld.price || og.price || 0;
  if (!price) {
    const patterns = [
      /"salePrice":\{"amount":"([0-9.]+)"/,
      /"retailPrice":\{"amount":"([0-9.]+)"/,
      /"price":"([0-9.]+)"/,
    ];
    for (const p of patterns) {
      const m = html.match(p);
      if (m) { price = parseFloat(m[1]); break; }
    }
  }

  const description = ld.description || og.description || '';

  const images: string[] = [];
  if (og.image) images.push(og.image);
  if (ld.images?.length) ld.images.forEach(i => { if (i && !images.includes(i)) images.push(i); });
  const sheinImgs = html.match(/https:\/\/img\.shein\.com\/[^"' \s]+\.(?:jpg|jpeg|png|webp)/g);
  if (sheinImgs) [...new Set(sheinImgs)].slice(0, 5).forEach(u => { const c = u.split('?')[0]; if (!images.includes(c)) images.push(c); });

  return {
    title: title || 'Producto SHEIN',
    description,
    price_original: price,
    price_original_currency: ld.currency as any || 'USD',
    images: images.slice(0, 5),
    supplier: 'shein' as any,
    supplier_url: url,
    supplier_sku: ld.sku || url.match(/p-(\d+)/)?.[1],
    publisher: 'SHEIN',
    in_stock: true,
    franchise: extractFranchise(title),
    characters: extractCharacters(title),
  };
}

// ── TEMU ──────────────────────────────────────────────────────────────────────

async function importTemu(url: string): Promise<ImportedProduct> {
  const cleanUrl = url.split('?')[0];
  const html = await fetchWithFallback(cleanUrl, MOBILE_UA, 'https://www.temu.com/');
  const $ = cheerio.load(html);
  const ld = extractJsonLd($);
  const og = extractOG($);

  // Temu often has garbled page titles — prefer JSON-LD > og:title
  let title = ld.title || '';
  if (!title || title.includes('PRODUCTOS_') || title.includes('_POINT')) {
    // Try og:title
    title = og.title?.replace(/\s*[-|]\s*Temu.*$/i, '').replace(/\|\s*temu\s*$/i, '').trim() || '';
  }
  // Last resort: extract from URL slug
  if (!title || title.length < 5) {
    const slugMatch = cleanUrl.match(/temu\.com\/(?:[a-z]{2}\/)?(.+?)(?:\.html)?(?:\?|$)/);
    if (slugMatch) title = slugMatch[1].replace(/-+/g, ' ').replace(/\d{10,}.*$/, '').trim();
  }

  let price = ld.price || og.price || 0;
  if (!price) {
    const patterns = [/"price":([0-9.]+)/, /"originalPrice":([0-9.]+)/, /"salePrice":([0-9.]+)/];
    for (const p of patterns) {
      const m = html.match(p);
      if (m && parseFloat(m[1]) < 10000) { price = parseFloat(m[1]); break; }
    }
  }

  const description = ld.description || og.description?.slice(0, 2000) || '';

  const images: string[] = [];
  if (og.image && og.image.startsWith('http')) images.push(og.image);
  if (ld.images?.length) ld.images.forEach(i => { if (i && !images.includes(i)) images.push(i); });
  // Temu CDN images
  const temuImgs = html.match(/https:\/\/img\.temu\.com\/[^"' \s]+/g);
  if (temuImgs) [...new Set(temuImgs)].filter(u => !u.includes('icon') && !u.includes('logo')).slice(0, 5).forEach(u => { if (!images.includes(u)) images.push(u); });
  // Also try akamaized images
  const akaImgs = html.match(/https:\/\/[^"' \s]+\.temu\.com\/[^"' \s]+\.(?:jpg|jpeg|png|webp)/g);
  if (akaImgs) [...new Set(akaImgs)].slice(0, 3).forEach(u => { if (!images.includes(u)) images.push(u); });

  return {
    title: title || 'Producto Temu',
    description,
    price_original: price,
    price_original_currency: ld.currency as any || 'USD',
    images: images.slice(0, 5),
    supplier: 'temu' as any,
    supplier_url: url,
    supplier_sku: ld.sku,
    publisher: ld.brand,
    in_stock: true,
    franchise: extractFranchise(title),
    characters: extractCharacters(title),
  };
}

// ── WALMART ───────────────────────────────────────────────────────────────────

async function importWalmart(url: string): Promise<ImportedProduct> {
  const html = await fetchWithFallback(url, DESKTOP_UA, 'https://www.walmart.com/');
  const $ = cheerio.load(html);
  const ld = extractJsonLd($);
  const og = extractOG($);

  const title = ld.title || $('h1[itemprop="name"], h1.prod-ProductTitle').first().text().trim() || og.title || '';

  let price = ld.price || og.price || 0;
  if (!price) {
    for (const sel of ['[itemprop="price"]', '.price-characteristic', '[data-testid="price-wrap"] span']) {
      const t = $(sel).first().attr('content') || $(sel).first().text();
      const p = parseFloat((t||'').replace(/[^0-9.]/g, ''));
      if (p > 0) { price = p; break; }
    }
  }

  const description = ld.description || $('[data-testid="product-description-content"]').first().text().trim().slice(0, 2000) || og.description || '';

  const images: string[] = [];
  if (og.image) images.push(og.image);
  if (ld.images?.length) ld.images.forEach(i => { if (i && !images.includes(i)) images.push(i); });
  const walmartImgs = html.match(/"url":"(https:\/\/i5\.walmartimages\.com[^"]+)"/g);
  if (walmartImgs) walmartImgs.slice(0, 5).forEach(m => {
    const u = m.replace('"url":"','').replace('"','');
    if (!images.includes(u)) images.push(u);
  });

  return {
    title,
    description,
    price_original: price,
    price_original_currency: ld.currency as any || 'USD',
    images: images.slice(0, 5),
    supplier: 'walmart' as any,
    supplier_url: url,
    supplier_sku: ld.sku,
    publisher: ld.brand || extractPublisher(title),
    in_stock: ld.inStock ?? true,
    franchise: extractFranchise(title),
    characters: extractCharacters(title),
  };
}

// ── MIDTOWN COMICS ────────────────────────────────────────────────────────────

async function importMidtown(url: string): Promise<ImportedProduct> {
  const cleanUrl = url.split('#')[0];
  const html = await fetchDirect(cleanUrl, DESKTOP_UA, 'https://www.midtowncomics.com/');
  const $ = cheerio.load(html);
  const ld = extractJsonLd($);
  const og = extractOG($);

  let title = ld.title || $('h1.product-title,h1.productTitle,h1[itemprop="name"]').first().text().trim();
  if (!title) title = $('title').text().replace(/\s*[-|]\s*Midtown Comics.*$/i, '').trim();

  let price = ld.price || og.price || 0;
  if (!price) {
    for (const sel of ['.product-price','.price-box .price','[class*="price"]','.pricetag']) {
      const p = parseFloat($(sel).first().text().replace(/[^0-9.]/g, ''));
      if (p > 0) { price = p; break; }
    }
  }

  const description = ld.description || $('[itemprop="description"],.product-description').first().text().trim().slice(0, 2000) || og.description || '';

  const images: string[] = [];
  if (og.image) images.push(og.image);
  if (ld.images?.length) ld.images.forEach(i => { if (i && !images.includes(i)) images.push(i); });
  for (const sel of ['img[itemprop="image"]','.product-image img','.main-image img']) {
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
  const html = await fetchDirect(url, DESKTOP_UA, 'https://www.latiendadecomics.com/');
  const $ = cheerio.load(html);
  const ld = extractJsonLd($);
  const og = extractOG($);
  const title = ld.title || $('h1.product-name,h1[itemprop="name"]').first().text().trim() || og.title?.split('|')[0].trim() || '';
  const price = ld.price || parseFloat($('[itemprop="price"]').first().text().replace(/[^0-9.]/g, '')) || og.price || 0;
  const description = ld.description || $('[itemprop="description"]').first().text().trim().slice(0, 2000);
  const images: string[] = [];
  if (og.image) images.push(og.image);
  if (ld.images?.length) ld.images.forEach(i => { if (i && !images.includes(i)) images.push(i); });
  return { title, description, price_original: price, price_original_currency: 'COP', images: images.slice(0, 5), supplier: 'manual', supplier_url: url, publisher: ld.brand || extractPublisher(title), in_stock: !$('.no-stock,.sold-out').length, franchise: extractFranchise(title), characters: extractCharacters(title) };
}

// ── AMAZON ────────────────────────────────────────────────────────────────────

async function importAmazon(url: string): Promise<ImportedProduct> {
  const asinMatch = url.match(/(?:\/dp\/|\/gp\/product\/|\/product\/)([A-Z0-9]{10})/i);
  const asin = asinMatch?.[1]?.toUpperCase();
  const cleanUrl = asin ? `https://www.amazon.com/dp/${asin}` : url.split('?')[0];
  const asinImage = asin ? `https://images-na.ssl-images-amazon.com/images/P/${asin}.01.LZZZZZZZ.jpg` : null;

  let html = '';
  for (const ua of [DESKTOP_UA, MOBILE_UA]) {
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

  return { title, description, price_original: price, price_original_currency: 'USD', images, supplier: 'amazon', supplier_url: cleanUrl, supplier_sku: asin, in_stock: !$('#outOfStock').length, franchise: extractFranchise(title), characters: extractCharacters(title) };
}

// ── CALCULATE SELLING PRICE ───────────────────────────────────────────────────

export function calculateSellingPrice(originalPrice: number, currency: 'USD'|'COP', marginPercent = 10, shippingUsd = 5, exchangeRateCOP = 4100): number {
  const baseUsd = currency === 'COP' ? originalPrice / exchangeRateCOP : originalPrice;
  return Math.round((baseUsd * (1 + marginPercent / 100) + shippingUsd) * 100) / 100;
}
