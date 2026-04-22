export const dynamic = 'force-dynamic';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { query, ensureInit } from '@/lib/db';
import { parseProduct } from '../../api/products/route';
import ProductPageClient from '@/components/product/ProductPageClient';

interface PageProps { params: { slug: string } }

async function getProduct(slug: string) {
  await ensureInit();
  const r = await query(`
    SELECT p.*, json_agg(json_build_object('id', pi.id, 'url', pi.url, 'alt', pi.alt, 'is_primary', pi.is_primary, 'sort_order', pi.sort_order)
      ORDER BY pi.is_primary DESC, pi.sort_order ASC) FILTER (WHERE pi.id IS NOT NULL) as images_json
    FROM products p LEFT JOIN product_images pi ON pi.product_id = p.id
    WHERE (p.slug = $1 OR p.id = $1) AND p.status = 'published' GROUP BY p.id
  `, [slug]);
  if (!r.rows.length) return null;
  return parseProduct(r.rows[0]);
}

async function getRelated(category: string, excludeSlug: string) {
  try {
    await ensureInit();
    const r = await query(`
      SELECT p.slug, p.title, p.price_cop, p.publisher,
             (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image
      FROM products p
      WHERE p.status = 'published' AND p.category = $1 AND p.slug != $2
      ORDER BY p.featured DESC, RANDOM() LIMIT 4
    `, [category, excludeSlug]);
    return r.rows;
  } catch { return []; }
}

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.latiendadecomics.com';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return { title: 'Producto no encontrado | La Tienda de Comics' };

  const rawTitle = product.title;
  const publisher = product.publisher || 'La Tienda de Comics';
  const priceCop = product.price_cop ? `$${Math.round(product.price_cop).toLocaleString('es-CO')} COP` : '';
  const category = product.category || 'comics';

  // SEO Pro title template
  const seoTitle = product.meta_title ||
    `${rawTitle} — ${priceCop ? `Precio: ${priceCop} · ` : ''}Comprar en Colombia | La Tienda de Comics`;

  // SEO Pro description (AI-optimized: answers the query directly)
  const seoDescription = product.meta_description ||
    `Compra ${rawTitle} de ${publisher} en La Tienda de Comics. ${priceCop ? `Precio: ${priceCop}. ` : ''}Envío a toda Colombia y LATAM. ${category === 'figuras' ? 'Figura coleccionable original.' : category === 'manga' ? 'Manga original en español.' : 'Cómic original.'}`;

  const image = product.images?.[0]?.url;
  const productUrl = `${BASE}/producto/${params.slug}`;

  const keywords = [
    rawTitle.toLowerCase(),
    `comprar ${rawTitle.toLowerCase()}`,
    `${rawTitle.toLowerCase()} colombia`,
    `${rawTitle.toLowerCase()} precio`,
    publisher.toLowerCase(),
    `comics ${publisher.toLowerCase()} colombia`,
    ...(product.tags || []),
    `tienda comics colombia`,
    `comprar ${category} colombia`,
  ];

  return {
    title: seoTitle,
    description: seoDescription,
    keywords,
    alternates: { canonical: productUrl },
    openGraph: {
      type: 'website', locale: 'es_CO',
      siteName: 'La Tienda de Comics',
      title: `${rawTitle} | La Tienda de Comics`,
      description: seoDescription,
      url: productUrl,
      images: image ? [{ url: image, width: 800, height: 800, alt: `${rawTitle} — ${publisher}` }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${rawTitle} | La Tienda de Comics`,
      description: seoDescription,
      images: image ? [image] : [],
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const productUrl = `${BASE}/producto/${params.slug}`;
  const imageUrl = product.images?.[0]?.url;
  const priceCop = product.price_cop || 0;
  const publisher = product.publisher || 'La Tienda de Comics';
  const isInStock = (product.stock || 0) > 0 || product.affiliate_url;

  // Related products for cross-sell
  const related = await getRelated(product.category, params.slug);

  // ── JSON-LD: Product (Rich Results) ─────────────────────────────────────
  const productJsonLd: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description || `${product.title} disponible en La Tienda de Comics Colombia.`,
    url: productUrl,
    image: product.images?.map((img: any) => img.url).filter(Boolean) || [],
    sku: product.id,
    mpn: product.supplier_sku || product.id,
    brand: { '@type': 'Brand', name: publisher },
    category: product.category,
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'COP',
      price: Math.round(priceCop),
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability: isInStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: 'La Tienda de Comics', url: BASE },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: { '@type': 'MonetaryAmount', value: '15000', currency: 'COP' },
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'CO' },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 3, unitCode: 'DAY' },
          transitTime: { '@type': 'QuantitativeValue', minValue: 3, maxValue: 8, unitCode: 'DAY' },
        },
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'CO',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 15,
      },
    },
  };

  // ── JSON-LD: BreadcrumbList ──────────────────────────────────────────────
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE },
      { '@type': 'ListItem', position: 2, name: 'Catálogo', item: `${BASE}/catalogo` },
      ...(product.category ? [{ '@type': 'ListItem', position: 3, name: product.category, item: `${BASE}/catalogo?categoria=${product.category}` }] : []),
      { '@type': 'ListItem', position: product.category ? 4 : 3, name: product.title, item: productUrl },
    ],
  };

  // ── JSON-LD: FAQPage (AI search optimization) ────────────────────────────
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `¿Dónde comprar ${product.title} en Colombia?`,
        acceptedAnswer: { '@type': 'Answer', text: `Puedes comprar ${product.title} en La Tienda de Comics (latiendadecomics.com). Precio: $${Math.round(priceCop).toLocaleString('es-CO')} COP. Envíos a toda Colombia y LATAM.` },
      },
      {
        '@type': 'Question',
        name: `¿Cuánto cuesta ${product.title} en Colombia?`,
        acceptedAnswer: { '@type': 'Answer', text: `${product.title} tiene un precio de $${Math.round(priceCop).toLocaleString('es-CO')} COP en La Tienda de Comics. Incluye envío a Bogotá, Medellín, Cali y todas las ciudades de Colombia.` },
      },
      {
        '@type': 'Question',
        name: `¿${product.title} está disponible en Colombia?`,
        acceptedAnswer: { '@type': 'Answer', text: `${isInStock ? `Sí, ${product.title} está disponible en La Tienda de Comics con envío inmediato a toda Colombia.` : `Puedes solicitar ${product.title} en La Tienda de Comics. Contáctanos por WhatsApp.`}` },
      },
      ...(publisher !== 'La Tienda de Comics' ? [{
        '@type': 'Question',
        name: `¿Es ${product.title} de ${publisher} original?`,
        acceptedAnswer: { '@type': 'Answer', text: `Sí, todos los productos de La Tienda de Comics son originales de ${publisher}. Garantizamos autenticidad en cada producto.` },
      }] : []),
    ],
  };

  // ── JSON-LD: ItemList (related products) ────────────────────────────────
  const relatedJsonLd = related.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Más productos de ${product.category} en La Tienda de Comics`,
    itemListElement: related.map((r: any, i: number) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${BASE}/producto/${r.slug}`,
      name: r.title,
    })),
  } : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      {relatedJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(relatedJsonLd) }} />}
      <ProductPageClient product={product} />
    </>
  );
}
