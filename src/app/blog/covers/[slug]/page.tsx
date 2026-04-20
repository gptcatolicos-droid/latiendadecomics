import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getGalleryFromDB, getGalleryCoversFromDB } from '@/lib/coverbrowser-scraper';
import { ensureInit } from '@/lib/db';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://latiendadecomics.onrender.com';
const PER_PAGE = 50;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  await ensureInit();
  const gallery = await getGalleryFromDB(params.slug).catch(() => null);
  const title = gallery?.title || params.slug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
  const issues = gallery?.total_issues || '?';
  return {
    title: `${title} — Portadas #1 al ${issues} | Comics Gallery`,
    description: gallery?.description || `Galería completa de portadas de ${title}. Todas las ediciones con imágenes en alta resolución.`,
    keywords: [title.toLowerCase(), 'portadas comics', 'covers comics', `${title} comics`, 'comic gallery'],
    openGraph: {
      title: `${title} — Galería de Portadas`,
      description: `${issues} portadas de ${title}. Colección completa.`,
      url: `${BASE_URL}/blog/covers/${params.slug}`,
      images: [{ url: `https://www.coverbrowser.com/image/${params.slug}/1-1.jpg`, width: 400, height: 600 }],
    },
    alternates: { canonical: `${BASE_URL}/blog/covers/${params.slug}` },
  };
}

export default async function GalleryPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { page?: string; q?: string };
}) {
  await ensureInit();

  const page = parseInt(searchParams.page || '1');
  const { slug } = params;

  let gallery: any = null;
  let covers: any[] = [];

  try {
    gallery = await getGalleryFromDB(slug);
    if (gallery) {
      covers = await getGalleryCoversFromDB(slug, page, PER_PAGE);
    }
  } catch { }

  // If not in DB yet, show a live-scrape placeholder with the known image pattern
  const totalPages = gallery ? Math.ceil(gallery.total_issues / PER_PAGE) : 0;
  const title = gallery?.title || slug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
  const description = gallery?.description || '';

  // Generate preview covers even if not scraped (using the known URL pattern)
  const previewCovers = covers.length > 0 ? covers : Array.from({ length: 48 }, (_, i) => ({
    issue_number: i + 1,
    image_url: `https://www.coverbrowser.com/image/${slug}/${i + 1}-1.jpg`,
    alt_text: `${title} #${i + 1}`,
  }));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name: `${title} — Galería de Portadas`,
    description: description || `Colección completa de portadas de ${title}`,
    url: `${BASE_URL}/blog/covers/${slug}`,
    numberOfItems: gallery?.total_issues || 0,
    publisher: { '@type': 'Organization', name: 'La Tienda de Comics', url: BASE_URL },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div style={{ minHeight: '100vh', background: '#0D0D0D', color: '#fff' }}>

        {/* ── NAVBAR ── */}
        <nav style={{ background: '#111', borderBottom: '1px solid #222', position: 'sticky', top: 0, zIndex: 50 }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px', height: 52, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
              <div style={{ width: 28, height: 28, background: '#CC0000', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 12 }}>📚</span>
              </div>
              <span style={{ fontFamily: 'var(--font-oswald), serif', fontSize: 14, color: '#fff', letterSpacing: 1 }}>
                La Tienda de <span style={{ color: '#CC0000' }}>Comics</span>
              </span>
            </Link>
            <span style={{ color: 'rgba(255,255,255,.3)', fontSize: 12 }}>›</span>
            <Link href="/blog" style={{ color: 'rgba(255,255,255,.5)', fontSize: 12, textDecoration: 'none' }}>Blog</Link>
            <span style={{ color: 'rgba(255,255,255,.3)', fontSize: 12 }}>›</span>
            <span style={{ color: '#fff', fontSize: 12 }}>{title}</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <Link href="/catalogo" style={{ background: '#CC0000', color: '#fff', fontSize: 12, padding: '4px 12px', borderRadius: 6, textDecoration: 'none' }}>
                Ver Catálogo
              </Link>
            </div>
          </div>
        </nav>

        {/* ── GALLERY HERO ── */}
        <div style={{ background: '#111', borderBottom: '1px solid #222', padding: '24px 16px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Cover preview */}
            <div style={{ flexShrink: 0 }}>
              <img
                src={`https://www.coverbrowser.com/image/${slug}/1-1.jpg`}
                alt={`${title} #1`}
                referrerPolicy="no-referrer"
                style={{ width: 120, height: 180, objectFit: 'cover', borderRadius: 8, border: '2px solid #CC0000', display: 'block' }}
              />
            </div>
            {/* Info */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <h1 style={{ fontFamily: 'var(--font-oswald), serif', fontSize: 'clamp(20px, 4vw, 36px)', fontWeight: 700, color: '#fff', margin: '0 0 8px', letterSpacing: 1 }}>
                {title}
              </h1>
              {description && (
                <p style={{ color: 'rgba(255,255,255,.55)', fontSize: 13, lineHeight: 1.6, margin: '0 0 12px', maxWidth: 600 }}>
                  {description}
                </p>
              )}
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {gallery?.total_issues > 0 && (
                  <div>
                    <span style={{ fontFamily: 'var(--font-oswald)', fontSize: 20, fontWeight: 700, color: '#CC0000' }}>
                      {gallery.total_issues}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,.4)', fontSize: 11, marginLeft: 4, textTransform: 'uppercase' }}>Issues</span>
                  </div>
                )}
                {gallery?.total_pages > 0 && (
                  <div>
                    <span style={{ fontFamily: 'var(--font-oswald)', fontSize: 20, fontWeight: 700, color: '#CC0000' }}>
                      {gallery.total_pages}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,.4)', fontSize: 11, marginLeft: 4, textTransform: 'uppercase' }}>Páginas</span>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <a
                  href={`https://www.coverbrowser.com/covers/${slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ border: '1px solid rgba(255,255,255,.2)', color: 'rgba(255,255,255,.6)', fontSize: 12, padding: '5px 12px', borderRadius: 6, textDecoration: 'none' }}
                >
                  Ver en CoverBrowser ↗
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ── COVERS GRID ── */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
          {/* Page header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ color: 'rgba(255,255,255,.5)', fontSize: 13 }}>
              {covers.length > 0
                ? `Mostrando #${(page - 1) * PER_PAGE + 1}–${(page - 1) * PER_PAGE + covers.length}`
                : 'Portadas del archivo CoverBrowser'
              }
            </div>
          </div>

          {/* Covers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: 10,
          }}>
            {previewCovers.map((cover: any) => (
              <div
                key={cover.issue_number}
                title={cover.alt_text || `${title} #${cover.issue_number}`}
                style={{ borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(255,255,255,.08)', background: '#161616', position: 'relative', cursor: 'default' }}
              >
                <div style={{ position: 'absolute', top: 3, left: 3, background: 'rgba(0,0,0,.75)', color: '#CC0000', fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 3, zIndex: 2 }}>
                  #{cover.issue_number}
                </div>
                <img
                  src={cover.image_url}
                  alt={cover.alt_text || `${title} #${cover.issue_number}`}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block', background: '#222' }}
                />
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32, flexWrap: 'wrap' }}>
              {page > 1 && (
                <Link href={`/blog/covers/${slug}?page=${page - 1}`} style={{ padding: '8px 16px', border: '1px solid rgba(255,255,255,.2)', borderRadius: 8, color: '#fff', textDecoration: 'none', fontSize: 13 }}>
                  ← Anterior
                </Link>
              )}
              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(p => (
                <Link
                  key={p}
                  href={`/blog/covers/${slug}?page=${p}`}
                  style={{
                    padding: '8px 14px', borderRadius: 8, fontSize: 13, textDecoration: 'none',
                    background: p === page ? '#CC0000' : 'transparent',
                    border: `1px solid ${p === page ? '#CC0000' : 'rgba(255,255,255,.2)'}`,
                    color: '#fff',
                  }}
                >
                  {p}
                </Link>
              ))}
              {page < totalPages && (
                <Link href={`/blog/covers/${slug}?page=${page + 1}`} style={{ padding: '8px 16px', border: '1px solid rgba(255,255,255,.2)', borderRadius: 8, color: '#fff', textDecoration: 'none', fontSize: 13 }}>
                  Siguiente →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* ── JARVIS FLOAT ── */}
        <JarvisGalleryBar title={title} slug={slug} />
      </div>
    </>
  );
}

function JarvisGalleryBar({ title, slug }: { title: string; slug: string }) {
  // Related character link
  const charSlug = slug.replace(/[-\s]+/g, '-').toLowerCase()
    .replace('amazing-', '').replace('incredible-', '').replace('mighty-', '').replace('uncanny-', '');

  return (
    <div style={{ position: 'sticky', bottom: 0, background: 'rgba(13,13,13,.97)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,.1)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <div style={{ width: 32, height: 32, background: '#CC0000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 14 }}>🤖</span>
      </div>
      <div style={{ flex: 1, minWidth: 180 }}>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>
          <b style={{ color: '#fff' }}>Jarvis IA:</b> ¿Quieres saber más sobre {title} o comprar esta serie?
        </span>
      </div>
      <Link href={`/personajes/marvel/${charSlug}`} style={{ border: '1px solid rgba(255,255,255,.2)', color: 'rgba(255,255,255,.6)', borderRadius: 6, padding: '6px 12px', fontSize: 12, textDecoration: 'none' }}>
        Ver personaje
      </Link>
      <Link href={`/universo?q=${encodeURIComponent(title)}`} style={{ border: '1px solid rgba(204,0,0,.5)', color: '#CC0000', borderRadius: 6, padding: '6px 12px', fontSize: 12, textDecoration: 'none' }}>
        Preguntarle a Jarvis
      </Link>
      <Link href="/catalogo" style={{ background: '#CC0000', color: '#fff', borderRadius: 6, padding: '6px 12px', fontSize: 12, textDecoration: 'none', fontWeight: 600 }}>
        Catálogo
      </Link>
      <Link href="/" style={{ color: 'rgba(255,255,255,.35)', fontSize: 12, textDecoration: 'none' }}>
        Inicio
      </Link>
    </div>
  );
}
