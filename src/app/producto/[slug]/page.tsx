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
  return {
    title: product.meta_title || `${product.title} | La Tienda de Comics`,
    description: product.meta_description || (product.description || '').slice(0, 160),
    openGraph: {
      title: product.title,
      description: (product.description || '').slice(0, 200),
      images: product.images[0] ? [{ url: product.images[0].url, alt: product.images[0].alt }] : [],
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const product = await getProduct(params.slug);
  if (!product) notFound();
  return <ProductPageClient product={product} />;
}
