import type { Metadata } from 'next';
import GalleryClient from './GalleryClient';

export const dynamic = 'force-static';
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://latiendadecomics.onrender.com';

const GALLERY_META: Record<string, { description: string }> = {
  'batman': { description: 'Colección completa de portadas de Batman. Desde Detective Comics #27 (1939) hasta las series más recientes.' },
  'amazing-spider-man': { description: 'Todas las portadas de The Amazing Spider-Man desde el #1 (1963) hasta la actualidad.' },
  'superman': { description: 'Portadas de Superman, el Hombre de Acero. Desde Action Comics hasta las series modernas.' },
  'x-men': { description: 'Portadas de X-Men. La historia completa de los mutantes de Marvel en imágenes.' },
  'wonder-woman': { description: 'Portadas de Wonder Woman, la Princesa de las Amazonas. Serie completa.' },
  'thor': { description: 'Portadas de Thor, el Dios del Trueno de Asgard. Todas las ediciones de Marvel.' },
  'iron-man': { description: 'Portadas de Iron Man / Tony Stark. Colección completa de Marvel Comics.' },
};

function getMeta(slug: string) {
  const title = slug.replace(/-/g,' ').replace(/\b\w/g, c => c.toUpperCase());
  const base = GALLERY_META[slug] || { description:`Galería completa de portadas de ${title}. Todas las ediciones en alta resolución desde CoverBrowser.` };
  return { title, description: base.description };
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = params;
  const meta = getMeta(slug);
  const pageTitle = `${meta.title} — Portadas Comics | La Tienda de Comics`;
  return {
    title: pageTitle,
    description: meta.description,
    keywords: [meta.title.toLowerCase(), 'portadas comics', 'covers comics', `${meta.title.toLowerCase()} comics`, 'comic gallery'],
    openGraph: { title: pageTitle, description: meta.description, url:`${BASE_URL}/blog/covers/${slug}`, images:[{url:`https://www.coverbrowser.com/image/${slug}/1-1.jpg`,width:400,height:600}] },
    twitter: { card:'summary_large_image', title: pageTitle, description: meta.description, images:[`https://www.coverbrowser.com/image/${slug}/1-1.jpg`] },
    alternates: { canonical:`${BASE_URL}/blog/covers/${slug}` },
  };
}

export default function GalleryPage({ params }: { params: { slug: string } }) {
  const meta = getMeta(params.slug);
  const jsonLd = {
    '@context':'https://schema.org', '@type':'ImageGallery',
    name:`${meta.title} — Galería de Portadas`,
    description: meta.description,
    url:`${BASE_URL}/blog/covers/${params.slug}`,
    publisher:{ '@type':'Organization', name:'La Tienda de Comics', url: BASE_URL },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <GalleryClient slug={params.slug} title={meta.title} description={meta.description} />
    </>
  );
}
