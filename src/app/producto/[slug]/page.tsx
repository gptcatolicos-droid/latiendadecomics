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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return { title: 'Producto no encontrado' };
  const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://latiendadecomics.onrender.com';
  const title = product.meta_title || `${product.title} | La Tienda de Comics`;
  const description = product.meta_description || (product.description || '').slice(0, 160);
  const image = product.images[0]?.url;
  return {
    title,
    description,
    keywords: product.tags?.join(', ') || undefined,
    alternates: { canonical: `${BASE}/producto/${params.slug}` },
    openGraph: {
      type: 'website',
      locale: 'es_CO',
      siteName: 'La Tienda de Comics',
      title: product.title,
      description: (product.description || '').slice(0, 200),
      url: `${BASE}/producto/${params.slug}`,
      images: image ? [{ url: image, alt: product.title }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: product.title,
      description: description,
      images: image ? [image] : [],
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://latiendadecomics.onrender.com';
  const productUrl = `${BASE}/producto/${params.slug}`;
  const imageUrl = product.images[0]?.url;

  // JSON-LD: Product structured data (rich results in Google)
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description || '',
    url: productUrl,
    image: imageUrl ? [imageUrl] : [],
    sku: product.supplier_sku || product.id,
    brand: { '@type': 'Brand', name: product.publisher || 'La Tienda de Comics' },
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'COP',
      price: product.price_cop,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'La Tienda de Comics' },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: { '@type': 'MonetaryAmount', value: '5', currency: 'USD' },
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'CO' },
        deliveryTime: { '@type': 'ShippingDeliveryTime', handlingTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 3, unitCode: 'DAY' }, transitTime: { '@type': 'QuantitativeValue', minValue: 6, maxValue: 10, unitCode: 'DAY' } },
      },
    },
  };

  // JSON-LD: BreadcrumbList
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE },
      { '@type': 'ListItem', position: 2, name: product.category, item: `${BASE}/catalogo?categoria=${product.category}` },
      { '@type': 'ListItem', position: 3, name: product.title, item: productUrl },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <ProductPageClient product={product} />
    </>
  );
}
