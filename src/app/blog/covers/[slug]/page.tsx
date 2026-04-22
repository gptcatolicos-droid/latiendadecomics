import type { Metadata } from 'next';
import GalleryClient from './GalleryClient';
import { getGalleryFromDB } from '@/lib/coverbrowser-scraper';
import { ensureInit } from '@/lib/db';

export const dynamic = 'force-dynamic';
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://latiendadecomics.onrender.com';

// ── SEO Pro descriptions — fallback if DB has no seo_description ──────────
const SEO_FALLBACK: Record<string, string> = {
  'batman': 'Colección completa de portadas de Batman desde Detective Comics #27 (1939). El Caballero Oscuro en todas sus ediciones.',
  'amazing-spider-man': 'Todas las portadas de The Amazing Spider-Man desde el #1 (1963). El héroe trepamuros de Marvel en imágenes.',
  'superman': 'Portadas de Superman, el Hombre de Acero. Desde Action Comics #1 (1938) hasta las series más recientes de DC Comics.',
  'x-men': 'Portadas de X-Men. La historia completa de los mutantes de Marvel en imágenes desde 1963.',
  'wonder-woman': 'Portadas de Wonder Woman, la Princesa de las Amazonas de DC Comics. Serie completa desde All Star Comics #8 (1941).',
  'thor': 'Portadas de Thor, el Dios del Trueno de Asgard. Colección completa de Marvel Comics desde Journey into Mystery #83 (1962).',
  'iron-man': 'Portadas de Iron Man / Tony Stark. Colección completa de Marvel Comics desde Tales of Suspense #39 (1963).',
  'incredible-hulk': 'Portadas de Incredible Hulk, el gigante verde de Marvel. Colección completa desde The Incredible Hulk #1 (1962).',
  'captain-america': 'Portadas de Captain America. El Supersoldado de Marvel desde Captain America Comics #1 (1941).',
  'daredevil': 'Portadas de Daredevil, el Hombre sin Miedo. Colección completa de Marvel Comics desde 1964.',
  'avengers': 'Portadas de The Avengers, los Vengadores de Marvel. Colección completa desde The Avengers #1 (1963).',
  'fantastic-four': 'Portadas de Fantastic Four, la Primera Familia de Marvel. Colección completa desde Fantastic Four #1 (1961).',
  'detective-comics': 'Portadas de Detective Comics, la serie más longeva de DC Comics. Incluye los primeros appearances de Batman desde 1939.',
  'wolverine': 'Portadas de Wolverine. El mejor en lo que hace — colección completa de Marvel Comics.',
  'deadpool': 'Portadas de Deadpool, el Mercenario Bocazas. Colección completa de Marvel Comics.',
  'venom': 'Portadas de Venom. El simbionte alienígena de Marvel — colección completa.',
};

function buildSeoDescription(slug: string, title: string, dbDesc?: string): string {
  const custom = dbDesc?.trim();
  if (custom) return custom;
  const fallback = SEO_FALLBACK[slug];
  if (fallback) return `La Tienda de Comics IA — ${title}. ${fallback} Disponible en Colombia y toda LATAM.`;
  const clean = title.replace(/-/g, ' ');
  return `La Tienda de Comics IA — ${title}. Galería completa de portadas de ${clean}. Todas las ediciones en alta resolución. Compra cómics en Colombia y LATAM con La Tienda de Comics.`;
}

async function getGalleryData(slug: string) {
  try {
    await ensureInit();
    const g = await getGalleryFromDB(slug);
    return g;
  } catch { return null; }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = params;
  const g = await getGalleryData(slug);
  const title = g?.title || slug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
  const seoDesc = buildSeoDescription(slug, title, g?.seo_description);
  const pageTitle = `La Tienda de Comics IA — ${title} | Portadas y Galería Completa`;
  const coverImg = g?.first_image_url || `https://www.coverbrowser.com/image/${slug}/1-1.jpg`;
  const issues = g?.total_issues;

  const keywords = [
    title.toLowerCase(),
    `${title.toLowerCase()} portadas`,
    `${title.toLowerCase()} comics`,
    `${title.toLowerCase()} covers`,
    'portadas comics colombia',
    'galeria comics',
    'la tienda de comics',
    'comics colombia',
  ];

  return {
    title: pageTitle,
    description: seoDesc,
    keywords,
    openGraph: {
      title: pageTitle,
      description: seoDesc,
      url: `${BASE_URL}/blog/covers/${slug}`,
      type: 'website',
      images: [{ url: coverImg, width: 400, height: 600, alt: `${title} — portada` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: seoDesc,
      images: [coverImg],
    },
    alternates: { canonical: `${BASE_URL}/blog/covers/${slug}` },
    other: {
      'og:site_name': 'La Tienda de Comics',
    },
  };
}

export default async function GalleryPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const g = await getGalleryData(slug);
  const title = g?.title || slug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
  const seoDesc = buildSeoDescription(slug, title, g?.seo_description);
  const description = g?.description || seoDesc;
  const customCovers = g?.custom_covers || null;
  const sourceType = g?.source_type || 'coverbrowser';
  const totalIssues = g?.total_issues || 100;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name: `La Tienda de Comics IA — ${title}`,
    description: seoDesc,
    url: `${BASE_URL}/blog/covers/${slug}`,
    numberOfItems: totalIssues,
    publisher: {
      '@type': 'Organization',
      name: 'La Tienda de Comics',
      url: BASE_URL,
      logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo.webp` },
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE_URL },
        { '@type': 'ListItem', position: 2, name: 'Blog de Portadas', item: `${BASE_URL}/blog` },
        { '@type': 'ListItem', position: 3, name: title, item: `${BASE_URL}/blog/covers/${slug}` },
      ],
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <GalleryClient
        slug={slug}
        title={title}
        description={description}
        customCovers={customCovers}
        sourceType={sourceType}
        totalIssues={totalIssues}
      />
    </>
  );
}
