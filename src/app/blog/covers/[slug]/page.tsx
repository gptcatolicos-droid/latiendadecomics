import type { Metadata } from 'next';
import GalleryClient from './GalleryClient';
import { getGalleryFromDB, getGalleryCoversFromDB } from '@/lib/coverbrowser-scraper';
import { ensureInit } from '@/lib/db';

export const dynamic = 'force-dynamic';
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://latiendadecomics.onrender.com';

const SEO_FALLBACK: Record<string, string> = {
  'batman': 'Colección completa de portadas de Batman desde Detective Comics #27 (1939). El Caballero Oscuro en todas sus ediciones.',
  'amazing-spider-man': 'Todas las portadas de The Amazing Spider-Man desde el #1 (1963). El héroe trepamuros de Marvel en imágenes.',
  'superman': 'Portadas de Superman, el Hombre de Acero. Desde Action Comics #1 (1938) hasta las series más recientes de DC Comics.',
  'x-men': 'Portadas de X-Men. La historia completa de los mutantes de Marvel en imágenes desde 1963.',
  'wonder-woman': 'Portadas de Wonder Woman, la Princesa de las Amazonas de DC Comics. Serie completa.',
  'thor': 'Portadas de Thor, el Dios del Trueno de Asgard. Colección completa de Marvel Comics.',
  'iron-man': 'Portadas de Iron Man / Tony Stark. Colección completa de Marvel Comics.',
  'incredible-hulk': 'Portadas de Incredible Hulk. El gigante verde de Marvel desde 1962.',
  'hulk': 'Portadas de Hulk. Colección completa de Marvel Comics incluyendo todas sus ediciones.',
  'captain-america': 'Portadas de Captain America. El Supersoldado de Marvel desde 1941.',
  'daredevil': 'Portadas de Daredevil, el Hombre sin Miedo. Colección completa de Marvel Comics.',
  'avengers': 'Portadas de The Avengers. Los Vengadores de Marvel desde 1963.',
  'detective-comics': 'Portadas de Detective Comics. La serie más longeva de DC Comics, hogar de Batman desde 1939.',
};

function buildSeoDesc(slug: string, title: string, dbDesc?: string): string {
  if (dbDesc?.trim()) return dbDesc.trim();
  const fb = SEO_FALLBACK[slug];
  if (fb) return `La Tienda de Comics IA — ${title}. ${fb} Disponible en Colombia y toda LATAM.`;
  return `La Tienda de Comics IA — ${title}. Galería completa de portadas de ${title}. Todas las ediciones en alta resolución. Compra cómics en Colombia y LATAM.`;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = params;
  let g: any = null;
  try { await ensureInit(); g = await getGalleryFromDB(slug); } catch {}
  const title = g?.title || slug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
  const seoDesc = buildSeoDesc(slug, title, g?.seo_description);
  const pageTitle = `La Tienda de Comics IA — ${title} | Portadas y Galería Completa`;
  const coverImg = g?.first_image_url || `https://www.coverbrowser.com/image/${slug}/1-1.jpg`;
  return {
    title: pageTitle, description: seoDesc,
    keywords: [title.toLowerCase(), `${title.toLowerCase()} portadas`, `${title.toLowerCase()} comics`, 'portadas comics colombia', 'la tienda de comics'],
    openGraph: { title: pageTitle, description: seoDesc, url: `${BASE_URL}/blog/covers/${slug}`, images: [{ url: coverImg, width: 400, height: 600 }] },
    twitter: { card: 'summary_large_image', title: pageTitle, description: seoDesc, images: [coverImg] },
    alternates: { canonical: `${BASE_URL}/blog/covers/${slug}` },
  };
}

export default async function GalleryPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  let g: any = null;
  let dbCovers: any[] = [];

  try {
    await ensureInit();
    g = await getGalleryFromDB(slug);
    if (g) {
      // Load ALL covers from DB (real issue numbers and URLs)
      dbCovers = await getGalleryCoversFromDB(slug, 1, 1000);
    }
  } catch {}

  const title = g?.title || slug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
  const seoDesc = buildSeoDesc(slug, title, g?.seo_description);
  const description = g?.description || seoDesc;
  const totalIssues = g?.total_issues || 100;
  const sourceType = g?.source_type || 'coverbrowser';

  // Build cover list: prefer DB covers (real URLs), fallback to pattern
  const covers = dbCovers.length > 0
    ? dbCovers.map((c: any) => ({ n: c.issue_number, url: c.image_url, alt: c.alt_text }))
    : (g?.custom_covers?.length > 0
        ? (g.custom_covers as any[]).map((c: any) => ({ n: c.issue_number, url: c.url, alt: c.title }))
        : Array.from({ length: Math.min(totalIssues, 50) }, (_, i) => ({
            n: i + 1,
            url: `https://www.coverbrowser.com/image/${slug}/${i + 1}-1.jpg`,
            alt: `${title} #${i + 1}`,
          }))
      );

  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'ImageGallery',
    name: `La Tienda de Comics IA — ${title}`, description: seoDesc,
    url: `${BASE_URL}/blog/covers/${slug}`, numberOfItems: covers.length,
    publisher: { '@type': 'Organization', name: 'La Tienda de Comics', url: BASE_URL, logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo.webp` } },
    breadcrumb: { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog de Portadas', item: `${BASE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: title, item: `${BASE_URL}/blog/covers/${slug}` },
    ]},
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <GalleryClient slug={slug} title={title} description={description} covers={covers} totalIssues={totalIssues} />
    </>
  );
}
