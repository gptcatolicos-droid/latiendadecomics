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
  return <ProductPageClient product={product} />;
}
