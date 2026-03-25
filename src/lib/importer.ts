import * as cheerio from 'cheerio';
import type { ImportedProduct, SupplierSource } from '@/types';

// ── DETECT SUPPLIER FROM URL ──────────────────
// Returns Shopify image URL without any size suffix — gets full resolution
function shopifyFullSize(src: string): string {
  // Remove size suffix like _800x600, _1024x1024, _grande, _large, _medium, _small, _thumb
  return src.replace(/_(pico|icon|thumb|small|compact|medium|large|grande|1024x1024|\d+x\d+)(\.[a-z]+)$/i, '$2')
            .replace(/\?v=\d+/, ''); // also strip cache buster for cleaner URL
}

export function detectSupplier(url: string): SupplierSource | null {
  if (url.includes('ironstudios.com')) return 'ironstudios';
  if (url.includes('paninitienda.com')) return 'panini';
  if (url.includes('midtowncomics.com')) return 'midtown';
  if (url.includes('latiendadecomics.com')) return 'tiendanube';
  if (url.includes('amazon.com') || url.includes('amazon.co')) return 'amazon';
  return null;
}

// ── MAIN IMPORTER ─────────────────────────────
export async function importFromUrl(url: string): Promise<ImportedProduct> {
  const supplier = detectSupplier(url);
  if (!supplier) throw new Error('URL no reconocida. Proveedores soportados: Iron Studios, Panini, Midtown Comics, Amazon');

  switch (supplier) {
    case 'ironstudios': return importIronStudios(url);
    case 'panini': return importPanini(url);
    case 'midtown': return importMidtown(url);
    case 'tiendanube': return importTiendanube(url);
    case 'amazon': return importAmazon(url);
    default: throw new Error('Proveedor no soportado');
  }
}

// ── IRON STUDIOS (Shopify JSON) ───────────────
async function importIronStudios(url: string): Promise<ImportedProduct> {
  const jsonUrl = url.replace(/\?.*$/, '') + '.json';

  const res = await fetch(jsonUrl, {
    headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
  });
  if (!res.ok) throw new Error(`Iron Studios: Error ${res.status}`);

  const data = await res.json();
  const p = data.product;
  if (!p) throw new Error('Iron Studios: producto no encontrado');

  const variant = p.variants?.[0];
  const images = (p.images || [])
    .map((img: any) => img.src ? shopifyFullSize(img.src) : null)
    .filter(Boolean) as string[];
  const bodyHtml = p.body_html || '';
  const description = cheerio.load(bodyHtml).text().trim().slice(0, 2000);

  return {
    title: p.title || '',
    description,
    price_original: parseFloat(variant?.price || '0'),
    price_original_currency: 'USD',
    images,
    supplier: 'ironstudios',
    supplier_url: url,
    supplier_sku: variant?.sku || p.handle,
    publisher: 'Iron Studios',
    in_stock: variant?.inventory_quantity > 0 || variant?.inventory_management === null,
    franchise: extractFranchise(p.title || ''),
    characters: extractCharacters(p.title || ''),
  };
}

// ── PANINI COLOMBIA (Shopify JSON) ────────────
async function importPanini(url: string): Promise<ImportedProduct> {
  const cleanUrl = url.replace(/\?.*$/, '');
  const jsonUrl = cleanUrl.endsWith('.json') ? cleanUrl : cleanUrl + '.json';

  const res = await fetch(jsonUrl, {
    headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
  });
  if (!res.ok) throw new Error(`Panini: Error ${res.status}`);

  const data = await res.json();
  const p = data.product;
  if (!p) throw new Error('Panini: producto no encontrado');

  const variant = p.variants?.[0];
  const priceCOP = parseFloat(variant?.price || '0');
  const images = (p.images || [])
    .map((img: any) => img.src ? shopifyFullSize(img.src) : null)
    .filter(Boolean) as string[];
  const bodyHtml = p.body_html || '';
  const description = cheerio.load(bodyHtml).text().trim().slice(0, 2000);

  return {
    title: p.title || '',
    description,
    price_original: priceCOP,
    price_original_currency: 'COP',
    images,
    supplier: 'panini',
    supplier_url: url,
    supplier_sku: variant?.sku || p.handle,
    publisher: 'Panini Colombia',
    in_stock: variant?.available !== false,
    franchise: extractFranchise(p.title || ''),
    characters: extractCharacters(p.title || ''),
  };
}

// ── MIDTOWN COMICS (HTML scrape) ──────────────
async function importMidtown(url: string): Promise<ImportedProduct> {
  // Strip fragment (#...) — only meaningful in browser, not in HTTP requests
  const cleanUrl = url.split('#')[0];

  const res = await fetch(cleanUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://www.midtowncomics.com/',
      'Cache-Control': 'no-cache',
    },
  });

  if (!res.ok) throw new Error(`Midtown Comics: Error ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  // Title — try structured selectors first, then clean up <title> fallback
  let title = $('h1.product-title, h1.productTitle, h1[itemprop="name"], .product-name h1').first().text().trim();
  if (!title) {
    title = $('title').text()
      .replace(/\s*[-|]\s*Midtown Comics.*$/i, '')
      .replace(/\s*[-|]\s*Comics.*$/i, '')
      .trim();
  }

  // Price — try JSON-LD structured data first (most reliable)
  let price = 0;
  $('script[type="application/ld+json"]').each((_, el) => {
    if (price > 0) return;
    try {
      const data = JSON.parse($(el).html() || '{}');
      const offers = data.offers || data['@graph']?.find((n: any) => n['@type'] === 'Product')?.offers;
      if (offers?.price) price = parseFloat(offers.price);
      else if (offers?.lowPrice) price = parseFloat(offers.lowPrice);
    } catch {}
  });

  // Price — meta og:price or itemprop
  if (!price) {
    const metaPrice = $('meta[property="og:price:amount"], meta[itemprop="price"]').attr('content')
      || $('[itemprop="price"]').attr('content')
      || $('[itemprop="price"]').text().trim();
    if (metaPrice) price = parseFloat(metaPrice.replace(/[^0-9.]/g, '')) || 0;
  }

  // Price — visible DOM selectors (try many patterns Midtown has used)
  if (!price) {
    const priceSelectors = [
      '.product-price', '.price-box .price', '#product-price-',
      '.regular-price .price', '.special-price .price',
      '[class*="price"]', '.pricetag', '.amt',
    ];
    for (const sel of priceSelectors) {
      const text = $(sel).first().text().trim();
      const parsed = parseFloat(text.replace(/[^0-9.]/g, ''));
      if (parsed > 0) { price = parsed; break; }
    }
  }

  const description = $('[itemprop="description"], .product-description, .description, .product-details').first().text().trim().slice(0, 2000);

  const images: string[] = [];
  // og:image is most reliable canonical image
  const ogImage = $('meta[property="og:image"]').attr('content');
  if (ogImage) images.push(ogImage);
  // Try product image selectors with zoom/hires priority
  const imgSelectors = [
    'img[itemprop="image"]', '.product-image img', '.main-image img',
    '#product-image img', '.productImage img', 'img.product-image',
    '.gallery-image img', 'img[src*="midtowncomics"]', 'img[src*="product"]',
  ];
  for (const sel of imgSelectors) {
    $(sel).each((_, el) => {
      const src = $(el).attr('data-zoom-image') || $(el).attr('data-hires')
        || $(el).attr('data-src') || $(el).attr('data-lazy-src') || $(el).attr('src');
      if (src && !src.includes('placeholder') && !src.includes('logo') && !src.includes('icon') && src.length > 20) {
        const full = src.startsWith('http') ? src : `https://www.midtowncomics.com${src}`;
        if (!images.includes(full)) images.push(full);
      }
    });
    if (images.length >= 3) break;
  }

  const inStock = !$('.out-of-stock, .unavailable, .sold-out').length
    && $('[itemprop="availability"]').attr('content') !== 'OutOfStock';

  return {
    title,
    description,
    price_original: price,
    price_original_currency: 'USD',
    images,
    supplier: 'midtown',
    supplier_url: cleanUrl,
    publisher: extractPublisher($('body').text()),
    in_stock: inStock,
    franchise: extractFranchise(title),
    characters: extractCharacters(title),
  };
}


// ── TIENDANUBE (latiendadecomics.com) ────────────────
async function importTiendanube(url: string): Promise<ImportedProduct> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'es-CO,es;q=0.9',
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new Error(`Tiendanube: Error ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  // Tiendanube structure
  const title = $('h1.product-name, h1[itemprop="name"], .product-header h1').first().text().trim()
    || $('title').text().split('|')[0].split('-')[0].trim();

  const priceText = $('[itemprop="price"], .product-price .price, .js-price-display').first().text().trim()
    || $('meta[itemprop="price"]').attr('content') || '0';
  const price = parseFloat(String(priceText).replace(/[^0-9.]/g, '')) || 0;

  const description = $('[itemprop="description"], .product-description').first().text().trim().slice(0, 2000);

  const images: string[] = [];
  // og:image is most reliable for Tiendanube
  const ogImg = $('meta[property="og:image"]').attr('content');
  if (ogImg) images.push(ogImg);
  // Also try product images
  $('img.product-featured-image, .product-image img, [data-image-id] img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-zoom-image') || $(el).attr('data-image');
    if (src && !src.includes('placeholder') && !images.includes(src)) {
      const fullSrc = src.startsWith('http') ? src : `https://www.latiendadecomics.com${src}`;
      // Get largest size by replacing size suffixes
      images.push(fullSrc.replace(/_\d+x\d+/, '').replace(/_(small|medium|large|thumb)/, ''));
    }
  });

  // Price is in COP for this store
  const priceCOP = price;
  const priceUSD = price > 500 ? Math.round((price / 4100) * 100) / 100 : price;

  return {
    title,
    description,
    price_original: priceCOP,
    price_original_currency: 'COP',
    images: images.slice(0, 5),
    supplier: 'manual',
    supplier_url: url,
    publisher: extractPublisher(html),
    in_stock: !$('.no-stock, .sold-out').length,
    franchise: extractFranchise(title),
    characters: extractCharacters(title),
  };
}

// ── AMAZON (multi-strategy scrape) ─
async function importAmazon(url: string): Promise<ImportedProduct> {
  // Extract ASIN — handles /dp/, /gp/product/, search URLs with ASIN in path
  const asinMatch = url.match(/(?:\/dp\/|\/gp\/product\/|\/product\/)([A-Z0-9]{10})/i)
    || url.match(/[^a-zA-Z0-9]([A-Z0-9]{10})(?:[/?&#]|$)/);
  const asin = asinMatch?.[1]?.toUpperCase();

  const cleanUrl = asin ? `https://www.amazon.com/dp/${asin}` : url.split('?')[0].split('#')[0];
  const asinImage = asin ? `https://images-na.ssl-images-amazon.com/images/P/${asin}.01.LZZZZZZZ.jpg` : null;

  // Try two different User-Agents — Amazon has different bot detection paths
  let html = '';
  const attempts = [
    {
      ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      extra: { 'Referer': 'https://www.google.com/', 'sec-fetch-site': 'cross-site', 'sec-fetch-mode': 'navigate', 'upgrade-insecure-requests': '1' },
    },
    {
      ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1',
      extra: {},
    },
  ];

  for (const attempt of attempts) {
    if (html) break;
    try {
      const res = await fetch(cleanUrl, {
        headers: {
          'User-Agent': attempt.ua,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          ...attempt.extra,
        },
        signal: AbortSignal.timeout(12000),
      });
      if (res.ok) {
        const text = await res.text();
        // Only use if it's a real product page, not a robot/captcha page
        if (text.includes('productTitle') || text.includes('a-price') || text.includes('feature-bullets') || text.includes('buyBoxAccordion')) {
          html = text;
        }
      }
    } catch {}
  }

  const $ = cheerio.load(html);

  const title = $('#productTitle').text().trim()
    || $('h1[data-feature-name="title"] span').text().trim()
    || (asin ? `Amazon ASIN: ${asin}` : 'Producto Amazon');

  const description = $('#feature-bullets li:not(.aok-hidden), #productDescription p')
    .map((_: any, el: any) => $(el).text().trim()).get().filter(Boolean).join(' ').slice(0, 2000);

  // Images — guaranteed ASIN cover first, then dynamic JSON
  const images: string[] = [];
  if (asinImage) images.push(asinImage);
  const dynImg = $('#landingImage, #imgBlkFront').attr('data-a-dynamic-image');
  if (dynImg) {
    try {
      const imgMap = JSON.parse(dynImg);
      Object.entries(imgMap).sort((a: any, b: any) => (b[1][0]*b[1][1]) - (a[1][0]*a[1][1]))
        .slice(0, 4).forEach(([u]: any) => { if (!images.includes(u)) images.push(u); });
    } catch {}
  }
  $('#landingImage, #imgBlkFront').each((_: any, el: any) => {
    const hires = $(el).attr('data-old-hires');
    if (hires && !images.includes(hires)) images.unshift(hires);
  });

  // Price — JSON-LD first (most reliable when scrape succeeds)
  let finalPrice = 0;
  $('script[type="application/ld+json"]').each((_, el) => {
    if (finalPrice > 0) return;
    try {
      const d = JSON.parse($(el).html() || '{}');
      const p = d.offers?.price || d.offers?.lowPrice;
      if (p) finalPrice = parseFloat(String(p));
    } catch {}
  });

  // DOM price selectors — try newest Amazon markup first
  if (!finalPrice) {
    const sels = [
      '.a-price[data-a-size="xl"] .a-offscreen',
      '.apexPriceToPay .a-offscreen',
      '.priceToPay .a-offscreen',
      '#corePrice_feature_div .a-offscreen',
      '#corePriceDisplay_desktop_feature_div .a-offscreen',
      '.a-price .a-offscreen',
      '#priceblock_ourprice', '#priceblock_dealprice', '#priceblock_saleprice',
    ];
    for (const sel of sels) {
      const raw = $(sel).first().text().trim();
      const p = parseFloat(raw.replace(/[^0-9.]/g, ''));
      if (p > 0 && p < 10000) { finalPrice = p; break; }
    }
  }

  // Meta price as last resort
  if (!finalPrice) {
    const meta = $('meta[property="og:price:amount"], meta[name="twitter:data2"]').first().attr('content');
    if (meta) { const p = parseFloat(meta.replace(/[^0-9.]/g, '')); if (p > 0) finalPrice = p; }
  }

  return {
    title,
    description,
    price_original: finalPrice, // 0 means Amazon blocked the scrape — admin enters price manually
    price_original_currency: 'USD',
    images,
    supplier: 'amazon',
    supplier_url: cleanUrl,
    supplier_sku: asin,
    in_stock: !$('#outOfStock').length && !$('#availability').text().toLowerCase().includes('unavailable'),
    franchise: extractFranchise(title),
    characters: extractCharacters(title),
  };
}

async function importAmazonViaAPI(asin: string, originalUrl: string): Promise<ImportedProduct> {
  // Amazon Product Advertising API 5.0 implementation
  // This requires AMAZON_ACCESS_KEY, AMAZON_SECRET_KEY, AMAZON_PARTNER_TAG
  const crypto = await import('crypto');

  const region = 'us-east-1';
  const service = 'ProductAdvertisingAPI';
  const host = 'webservices.amazon.com';
  const path = '/paapi5/getitems';

  const payload = JSON.stringify({
    ItemIds: [asin],
    PartnerTag: process.env.AMAZON_PARTNER_TAG,
    PartnerType: 'Associates',
    Resources: [
      'ItemInfo.Title',
      'ItemInfo.Features',
      'ItemInfo.ByLineInfo',
      'Offers.Listings.Price',
      'Images.Primary.Large',
      'Images.Variants.Large',
    ],
  });

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '').slice(0, 15) + 'Z';
  const dateStamp = amzDate.slice(0, 8);

  const canonicalHeaders = `content-encoding:amz-1.0\ncontent-type:application/json; charset=utf-8\nhost:${host}\nx-amz-date:${amzDate}\nx-amz-target:com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems\n`;
  const signedHeaders = 'content-encoding;content-type;host;x-amz-date;x-amz-target';
  const payloadHash = crypto.default.createHash('sha256').update(payload).digest('hex');
  const canonicalRequest = `POST\n${path}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${crypto.default.createHash('sha256').update(canonicalRequest).digest('hex')}`;

  const getSignatureKey = (key: string, dateStamp: string, region: string, service: string) => {
    const kDate = crypto.default.createHmac('sha256', `AWS4${key}`).update(dateStamp).digest();
    const kRegion = crypto.default.createHmac('sha256', kDate).update(region).digest();
    const kService = crypto.default.createHmac('sha256', kRegion).update(service).digest();
    return crypto.default.createHmac('sha256', kService).update('aws4_request').digest();
  };

  const signingKey = getSignatureKey(process.env.AMAZON_SECRET_KEY!, dateStamp, region, service);
  const signature = crypto.default.createHmac('sha256', signingKey).update(stringToSign).digest('hex');
  const authHeader = `AWS4-HMAC-SHA256 Credential=${process.env.AMAZON_ACCESS_KEY}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetch(`https://${host}${path}`, {
    method: 'POST',
    headers: {
      'content-encoding': 'amz-1.0',
      'content-type': 'application/json; charset=utf-8',
      'host': host,
      'x-amz-date': amzDate,
      'x-amz-target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems',
      'Authorization': authHeader,
    },
    body: payload,
  });

  const data = await res.json();
  const item = data.ItemsResult?.Items?.[0];
  if (!item) throw new Error('Amazon API: producto no encontrado');

  const title = item.ItemInfo?.Title?.DisplayValue || '';
  const price = item.Offers?.Listings?.[0]?.Price?.Amount || 0;
  const images = [
    item.Images?.Primary?.Large?.URL,
    ...(item.Images?.Variants || []).map((v: any) => v.Large?.URL),
  ].filter(Boolean);
  const features = item.ItemInfo?.Features?.DisplayValues || [];
  const description = features.join(' ');

  return {
    title,
    description,
    price_original: price,
    price_original_currency: 'USD',
    images,
    supplier: 'amazon',
    supplier_url: originalUrl,
    supplier_sku: asin,
    in_stock: true,
    franchise: extractFranchise(title),
    characters: extractCharacters(title),
  };
}

// ── HELPERS ──────────────────────────────────
const FRANCHISES = ['Batman', 'Superman', 'Spider-Man', 'Iron Man', 'Captain America', 'Wolverine', 'X-Men', 'Avengers', 'Justice League', 'Wonder Woman', 'Flash', 'Green Lantern', 'Deadpool', 'Thor', 'Hulk'];
const PUBLISHERS = ['Marvel', 'DC Comics', 'Image Comics', 'Dark Horse', 'IDW', 'Boom Studios', 'Panini'];

function extractFranchise(text: string): string | undefined {
  for (const f of FRANCHISES) {
    if (text.toLowerCase().includes(f.toLowerCase())) return f;
  }
  return undefined;
}

function extractCharacters(text: string): string[] {
  return FRANCHISES.filter(c => text.toLowerCase().includes(c.toLowerCase()));
}

function extractPublisher(text: string): string | undefined {
  for (const p of PUBLISHERS) {
    if (text.includes(p)) return p;
  }
  return undefined;
}

// ── CALCULATE SELLING PRICE ───────────────────
export function calculateSellingPrice(
  originalPrice: number,
  currency: 'USD' | 'COP',
  marginPercent: number = 10,
  shippingUsd: number = 5,
  exchangeRateCOP: number = 4100,
): number {
  let baseUsd = currency === 'COP' ? originalPrice / exchangeRateCOP : originalPrice;
  return Math.round((baseUsd * (1 + marginPercent / 100) + shippingUsd) * 100) / 100;
}
