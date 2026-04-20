import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllGalleriesFromDB, searchGalleriesFromDB } from '@/lib/coverbrowser-scraper';
import { ensureInit } from '@/lib/db';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://latiendadecomics.onrender.com';

export const metadata: Metadata = {
  title: 'Blog de Portadas — Top 100 Personajes de Comics | La Tienda de Comics',
  description: 'Las mejores portadas de comics de todos los tiempos. Galería completa con 450,000+ portadas de Batman, Spider-Man, X-Men, Superman y más. El archivo de covers más completo en español.',
  keywords: ['portadas comics','covers comics','batman covers','spider-man covers','comics gallery','mejores portadas comics'],
  openGraph: {
    title: 'Blog de Portadas — Top 100 Personajes de Comics',
    description: 'Galería completa con 450,000+ portadas. El archivo de covers más completo.',
    url: `${BASE_URL}/blog`,
    images: [{ url: `${BASE_URL}/logo.webp`, width: 400, height: 400 }],
  },
  alternates: { canonical: `${BASE_URL}/blog` },
};

const ARTICLE_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Blog de Portadas de Comics',
  description: 'Galería completa de portadas de comics de todos los tiempos',
  url: `${BASE_URL}/blog`,
  publisher: {
    '@type': 'Organization',
    name: 'La Tienda de Comics',
    url: BASE_URL,
  },
};

// ── TOP 100 CHARACTERS for the curated section ────────────────────────────
const TOP100 = [
  { slug: 'batman', title: 'Batman', rank: 1 },
  { slug: 'amazing-spider-man', title: 'Amazing Spider-Man', rank: 2 },
  { slug: 'superman', title: 'Superman', rank: 3 },
  { slug: 'x-men', title: 'X-Men', rank: 4 },
  { slug: 'wonder-woman', title: 'Wonder Woman', rank: 5 },
  { slug: 'iron-man', title: 'Iron Man', rank: 6 },
  { slug: 'thor', title: 'Thor', rank: 7 },
  { slug: 'incredible-hulk', title: 'Incredible Hulk', rank: 8 },
  { slug: 'captain-america', title: 'Captain America', rank: 9 },
  { slug: 'spider-man', title: 'Spider-Man (Serie)', rank: 10 },
  { slug: 'detective-comics', title: 'Detective Comics', rank: 11 },
  { slug: 'wolverine', title: 'Wolverine', rank: 12 },
  { slug: 'daredevil', title: 'Daredevil', rank: 13 },
  { slug: 'fantastic-four', title: 'Fantastic Four', rank: 14 },
  { slug: 'avengers', title: 'Avengers', rank: 15 },
  { slug: 'flash', title: 'The Flash', rank: 16 },
  { slug: 'green-lantern', title: 'Green Lantern', rank: 17 },
  { slug: 'deadpool', title: 'Deadpool', rank: 18 },
  { slug: 'venom', title: 'Venom', rank: 19 },
  { slug: 'aquaman', title: 'Aquaman', rank: 20 },
  { slug: 'captain-marvel', title: 'Captain Marvel', rank: 21 },
  { slug: 'black-panther', title: 'Black Panther', rank: 22 },
  { slug: 'doctor-strange', title: 'Doctor Strange', rank: 23 },
  { slug: 'punisher', title: 'The Punisher', rank: 24 },
  { slug: 'green-arrow', title: 'Green Arrow', rank: 25 },
  { slug: 'uncanny-x-men', title: 'Uncanny X-Men', rank: 26 },
  { slug: 'ultimate-spider-man', title: 'Ultimate Spider-Man', rank: 27 },
  { slug: 'batman-dark-knight-returns', title: 'Dark Knight Returns', rank: 28 },
  { slug: 'batman-long-halloween', title: 'Batman: Long Halloween', rank: 29 },
  { slug: 'catwoman', title: 'Catwoman', rank: 30 },
  { slug: 'nightwing', title: 'Nightwing', rank: 31 },
  { slug: 'harley-quinn', title: 'Harley Quinn', rank: 32 },
  { slug: 'black-widow', title: 'Black Widow', rank: 33 },
  { slug: 'hawkeye', title: 'Hawkeye', rank: 34 },
  { slug: 'mighty-thor', title: 'Mighty Thor', rank: 35 },
  { slug: 'new-avengers', title: 'New Avengers', rank: 36 },
  { slug: 'web-of-spider-man', title: 'Web of Spider-Man', rank: 37 },
  { slug: 'spectacular-spider-man', title: 'Spectacular Spider-Man', rank: 38 },
  { slug: 'action-comics', title: 'Action Comics', rank: 39 },
  { slug: 'teen-titans', title: 'Teen Titans', rank: 40 },
  { slug: 'justice-league', title: 'Justice League', rank: 41 },
  { slug: 'new-mutants', title: 'New Mutants', rank: 42 },
  { slug: 'x-force', title: 'X-Force', rank: 43 },
  { slug: 'generation-x', title: 'Generation X', rank: 44 },
  { slug: 'robin', title: 'Robin', rank: 45 },
  { slug: 'batgirl', title: 'Batgirl', rank: 46 },
  { slug: 'all-star-batman-robin-the-boy-wonder', title: 'All Star Batman', rank: 47 },
  { slug: 'guardians-of-the-galaxy', title: 'Guardians of the Galaxy', rank: 48 },
  { slug: 'silver-surfer', title: 'Silver Surfer', rank: 49 },
  { slug: 'thanos', title: 'Thanos', rank: 50 },
];

export default async function BlogPage({
  searchParams,
}: {
  searchParams: { q?: string; filter?: string; page?: string };
}) {
  await ensureInit();

  const query = searchParams.q || '';
  const filter = searchParams.filter || 'all';
  const page = parseInt(searchParams.page || '1');

  let galleries: any[] = [];
  let totalFromDB = 0;

  try {
    if (query) {
      galleries = await searchGalleriesFromDB(query);
    } else {
      galleries = await getAllGalleriesFromDB(page, 120);
      totalFromDB = galleries.length;
    }
  } catch {
    galleries = [];
  }

  // Build cover image URL — always use CoverBrowser CDN pattern
  const getCoverImg = (slug: string, imageUrl: string) => {
    if (imageUrl && imageUrl.startsWith('http')) return imageUrl;
    return `https://www.coverbrowser.com/image/${slug}/1-1.jpg`;
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_JSON_LD) }}
      />

      <div style={{ minHeight: '100vh', background: '#0D0D0D', color: '#fff' }}>

        {/* ── NAVBAR ── */}
        <nav style={{ background: '#111', borderBottom: '1px solid #222', position: 'sticky', top: 0, zIndex: 50 }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
              <div style={{ width: 30, height: 30, background: '#CC0000', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="18" height="4" rx="1" fill="white" opacity=".3"/>
                  <rect x="3" y="7" width="18" height="14" rx="1" fill="white" opacity=".12"/>
                </svg>
              </div>
              <span style={{ fontFamily: 'var(--font-oswald), serif', fontSize: 16, color: '#fff', letterSpacing: 1 }}>
                La Tienda de <span style={{ color: '#CC0000' }}>Comics</span>
              </span>
            </Link>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <Link href="/personajes" style={{ color: 'rgba(255,255,255,.65)', fontSize: 13, padding: '4px 12px', borderRadius: 6, textDecoration: 'none', border: '1px solid rgba(255,255,255,.1)' }}>
                🦸 Personajes
              </Link>
              <Link href="/universo" style={{ color: 'rgba(255,255,255,.65)', fontSize: 13, padding: '4px 12px', borderRadius: 6, textDecoration: 'none', border: '1px solid rgba(255,255,255,.1)' }}>
                🤖 Jarvis IA
              </Link>
              <Link href="/catalogo" style={{ background: '#CC0000', color: '#fff', fontSize: 13, padding: '4px 12px', borderRadius: 6, textDecoration: 'none' }}>
                Ver Catálogo
              </Link>
            </div>
          </div>
        </nav>

        {/* ── HERO ── */}
        <div style={{ background: 'linear-gradient(180deg, #1a0000 0%, #0D0D0D 100%)', padding: '40px 16px 32px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(45deg, rgba(204,0,0,.03) 0, rgba(204,0,0,.03) 1px, transparent 1px, transparent 20px)', pointerEvents: 'none' }} />
          <h1 style={{ fontFamily: 'var(--font-oswald), serif', fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 700, letterSpacing: 2, color: '#fff', margin: '0 0 8px', position: 'relative' }}>
            📰 Blog de <span style={{ color: '#CC0000' }}>Portadas</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,.55)', fontSize: 'clamp(13px, 2vw, 16px)', margin: '0 0 24px', position: 'relative' }}>
            450,000+ portadas de comics • El archivo más completo en español
          </p>

          {/* Search */}
          <form action="/blog" method="GET" style={{ maxWidth: 500, margin: '0 auto', position: 'relative' }}>
            <input
              name="q"
              defaultValue={query}
              placeholder="Buscar serie o personaje (ej: Batman, X-Men...)"
              style={{ width: '100%', padding: '12px 50px 12px 18px', borderRadius: 12, border: '1px solid rgba(255,255,255,.15)', background: 'rgba(255,255,255,.08)', color: '#fff', fontSize: 14, outline: 'none' }}
            />
            <button type="submit" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: '#CC0000', border: 'none', borderRadius: 8, padding: '6px 12px', color: '#fff', cursor: 'pointer', fontSize: 14 }}>
              →
            </button>
          </form>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
            {[['450K+','Portadas'],['6,000+','Series'],['80+','Años'],['100','Top Personajes']].map(([n, l]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-oswald), serif', fontSize: 22, fontWeight: 700, color: '#CC0000' }}>{n}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', textTransform: 'uppercase', letterSpacing: 1 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FILTER TABS ── */}
        <div style={{ borderBottom: '1px solid #222', padding: '0 16px', background: '#111', overflowX: 'auto' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 0, minWidth: 'max-content' }}>
            {[['all','Todos'],['marvel','Marvel'],['dc','DC Comics'],['manga','Manga'],['clasicos','Clásicos']].map(([val, label]) => (
              <Link
                key={val}
                href={`/blog?filter=${val}${query ? `&q=${query}` : ''}`}
                style={{
                  padding: '12px 16px', fontSize: 13, fontWeight: 500, textDecoration: 'none',
                  color: filter === val ? '#CC0000' : 'rgba(255,255,255,.5)',
                  borderBottom: filter === val ? '2px solid #CC0000' : '2px solid transparent',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>

          {/* ── TOP 100 CURATED SECTION ── */}
          {!query && (
            <section style={{ marginBottom: 40 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <h2 style={{ fontFamily: 'var(--font-oswald), serif', fontSize: 22, color: '#fff', margin: 0 }}>
                  🏆 Top 100 Personajes
                </h2>
                <span style={{ background: '#CC0000', color: '#fff', fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                  CURADO
                </span>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: 10,
              }}>
                {TOP100.slice(0, 50).map(item => (
                  <Link
                    key={item.slug}
                    href={`/blog/covers/${item.slug}`}
                    style={{ textDecoration: 'none', display: 'block' }}
                  >
                    <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,.1)', background: '#161616', transition: 'border-color .2s', position: 'relative' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = '#CC0000')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,.1)')}
                    >
                      <div style={{ position: 'absolute', top: 4, left: 4, zIndex: 2, background: 'rgba(0,0,0,.8)', color: '#CC0000', fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 4 }}>
                        #{item.rank}
                      </div>
                      {/* Cover image — hotlinked from CoverBrowser */}
                      <img
                        src={`https://www.coverbrowser.com/image/${item.slug}/1-1.jpg`}
                        alt={`${item.title} #1 cover`}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block', background: '#222' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='130' height='195' viewBox='0 0 130 195'><rect fill='%23222'/><text x='65' y='97' text-anchor='middle' fill='%23666' font-size='11'>${item.title}</text></svg>`;
                        }}
                      />
                      <div style={{ padding: '6px 8px' }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#fff', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {item.title}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Link href="/blog?filter=all&show=100" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,.2)', color: '#fff', padding: '8px 24px', borderRadius: 8, textDecoration: 'none', fontSize: 13 }}>
                  Ver los 100 →
                </Link>
              </div>
            </section>
          )}

          {/* ── ALL GALLERIES FROM DB ── */}
          {galleries.length > 0 ? (
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <h2 style={{ fontFamily: 'var(--font-oswald), serif', fontSize: 22, color: '#fff', margin: 0 }}>
                  {query ? `Resultados para "${query}"` : '📚 Todas las Galerías'}
                </h2>
                <span style={{ color: 'rgba(255,255,255,.4)', fontSize: 12 }}>
                  {galleries.length} series
                </span>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: 10,
              }}>
                {galleries.map((g: any) => (
                  <Link key={g.slug} href={`/blog/covers/${g.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                    <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,.1)', background: '#161616', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = '#CC0000')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,.1)')}
                    >
                      <img
                        src={getCoverImg(g.slug, g.first_image_url)}
                        alt={`${g.title} portada`}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block', background: '#222' }}
                      />
                      <div style={{ padding: '6px 8px' }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#fff', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {g.title}
                        </div>
                        {g.total_issues > 0 && (
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', marginTop: 2 }}>
                            {g.total_issues} issues
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : (
            !query && (
              <div style={{ textAlign: 'center', padding: '48px 16px' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
                <div style={{ color: 'rgba(255,255,255,.55)', fontSize: 15, marginBottom: 16 }}>
                  Las galerías se cargarán después de ejecutar el scraper.
                </div>
                <p style={{ color: 'rgba(255,255,255,.3)', fontSize: 12 }}>
                  Admin: <code style={{ background: '#222', padding: '2px 6px', borderRadius: 4 }}>POST /api/admin/scrape/coverbrowser</code>
                </p>
              </div>
            )
          )}
        </div>

        {/* ── JARVIS FLOAT ── */}
        <div style={{ position: 'sticky', bottom: 0, background: 'rgba(13,13,13,.97)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,.1)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ width: 32, height: 32, background: '#CC0000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 14 }}>🤖</span>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>
              <b style={{ color: '#fff' }}>Jarvis IA:</b> ¿Buscas un cómic en particular? Tengo todo el catálogo disponible.
            </span>
          </div>
          <Link href="/universo" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,.2)', color: 'rgba(255,255,255,.7)', borderRadius: 6, padding: '6px 12px', fontSize: 12, textDecoration: 'none' }}>
            Pregúntale a Jarvis
          </Link>
          <Link href="/catalogo" style={{ background: '#CC0000', color: '#fff', borderRadius: 6, padding: '6px 12px', fontSize: 12, textDecoration: 'none', fontWeight: 600 }}>
            Ver Catálogo
          </Link>
          <Link href="/" style={{ color: 'rgba(255,255,255,.4)', fontSize: 12, textDecoration: 'none' }}>
            Inicio
          </Link>
        </div>
      </div>
    </>
  );
}
