import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://latiendadecomics.onrender.com';

// Curated metadata per gallery for SEO
const GALLERY_META: Record<string, { title: string; description: string; keywords: string[] }> = {
  'batman': { title:'Batman Comics', description:'Galería completa de portadas de Batman. Todas las ediciones de Detective Comics a la serie moderna.', keywords:['batman comics','batman portadas','batman dc comics','caballero oscuro'] },
  'amazing-spider-man': { title:'Amazing Spider-Man', description:'Todas las portadas de The Amazing Spider-Man desde el #1 hasta la actualidad.', keywords:['amazing spider-man','spider-man portadas','marvel comics spider-man'] },
  'superman': { title:'Superman Comics', description:'Portadas de Superman, el Hombre de Acero. Desde Action Comics hasta las series modernas.', keywords:['superman portadas','superman dc comics','man of steel comics'] },
  'x-men': { title:'X-Men Comics', description:'Portadas de X-Men. La historia completa de los mutantes de Marvel en imágenes.', keywords:['x-men portadas','x-men comics','mutantes marvel'] },
  'wonder-woman': { title:'Wonder Woman Comics', description:'Portadas de Wonder Woman, la Princesa de las Amazonas. Serie completa.', keywords:['wonder woman portadas','wonder woman dc','amazon comics'] },
};

function getMeta(slug: string) {
  if (GALLERY_META[slug]) return GALLERY_META[slug];
  const title = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return {
    title: `${title} Comics`,
    description: `Galería completa de portadas de ${title}. Todas las ediciones en alta resolución desde CoverBrowser.`,
    keywords: [title.toLowerCase(), 'portadas comics', 'covers comics', `${title.toLowerCase()} comics`],
  };
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = params;
  const meta = getMeta(slug);
  const title = `${meta.title} — Portadas | Comics Gallery`;
  return {
    title,
    description: meta.description,
    keywords: meta.keywords,
    openGraph: {
      title,
      description: meta.description,
      url: `${BASE_URL}/blog/covers/${slug}`,
      images: [{ url: `https://www.coverbrowser.com/image/${slug}/1-1.jpg`, width:400, height:600, alt: meta.title }],
    },
    twitter: { card:'summary_large_image', title, description: meta.description, images:[`https://www.coverbrowser.com/image/${slug}/1-1.jpg`] },
    alternates: { canonical: `${BASE_URL}/blog/covers/${slug}` },
  };
}

// Generate 50 covers client-side from CoverBrowser URL pattern
export default function GalleryPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const meta = getMeta(slug);
  const title = meta.title;
  const charSlug = slug.replace(/^(amazing|incredible|mighty|uncanny|ultimate|spectacular|web-of|peter-parker-the-spectacular)-/, '').split('-')[0];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name: `${title} — Galería de Portadas`,
    description: meta.description,
    url: `${BASE_URL}/blog/covers/${slug}`,
    publisher: { '@type': 'Organization', name: 'La Tienda de Comics', url: BASE_URL },
  };

  // Build 100 cover URLs using the known CoverBrowser pattern
  const covers = Array.from({ length: 100 }, (_, i) => ({
    n: i + 1,
    url: `https://www.coverbrowser.com/image/${slug}/${i + 1}-1.jpg`,
  }));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <style>{`
        .cover-thumb{border-radius:6px;overflow:hidden;border:1px solid #e5e7eb;background:#f3f4f6;position:relative;cursor:default}
        .cover-thumb img{display:block;width:100%;aspect-ratio:2/3;object-fit:cover;background:#ddd}
        .page-btn{padding:7px 14px;border:1px solid #d1d5db;border-radius:8px;color:#374151;text-decoration:none;font-size:13px;transition:background .15s}
        .page-btn:hover{background:#f3f4f6}
        .page-btn-active{background:#CC0000!important;border-color:#CC0000!important;color:#fff!important}
        .nav-pill{font-size:12px;font-weight:600;padding:5px 12px;border-radius:8px;text-decoration:none;white-space:nowrap}
      `}</style>

      <div style={{ minHeight:'100vh', background:'#fff' }}>

        {/* NAV */}
        <nav style={{ background:'#0D0D0D', position:'sticky', top:0, zIndex:50, borderBottom:'1px solid #222' }}>
          <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 16px', height:52, display:'flex', alignItems:'center', gap:8, overflow:'hidden' }}>
            <a href="/" style={{ flexShrink:0 }}>
              <img src="/logo.webp" alt="La Tienda de Comics" style={{ height:28, objectFit:'contain', display:'block' }} />
            </a>
            <span style={{ color:'rgba(255,255,255,.3)', fontSize:11, flexShrink:0 }}>›</span>
            <a href="/blog" style={{ color:'rgba(255,255,255,.5)', fontSize:11, textDecoration:'none', whiteSpace:'nowrap' }}>Blog</a>
            <span style={{ color:'rgba(255,255,255,.3)', fontSize:11, flexShrink:0 }}>›</span>
            <span style={{ color:'#fff', fontSize:11, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{title}</span>
            <div style={{ marginLeft:'auto', display:'flex', gap:8, flexShrink:0 }}>
              <a href="/personajes" className="nav-pill" style={{ color:'#fff', background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.15)' }}>🦸</a>
              <a href="/catalogo" className="nav-pill" style={{ color:'#fff', background:'#CC0000' }}>Catálogo</a>
            </div>
          </div>
        </nav>

        {/* GALLERY HERO */}
        <div style={{ background:'#111', borderBottom:'1px solid #222', padding:'24px 16px' }}>
          <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', gap:20, alignItems:'flex-start', flexWrap:'wrap' }}>
            <img src={`https://www.coverbrowser.com/image/${slug}/1-1.jpg`} alt={`${title} #1`}
              referrerPolicy="no-referrer"
              style={{ width:110, height:165, objectFit:'cover', borderRadius:8, border:'2px solid #CC0000', background:'#333', flexShrink:0 }} />
            <div style={{ flex:1, minWidth:180 }}>
              <h1 style={{ fontFamily:'Oswald,sans-serif', fontSize:'clamp(20px,4vw,36px)', fontWeight:700, color:'#fff', margin:'0 0 8px', letterSpacing:1 }}>
                {title}
              </h1>
              <p style={{ color:'rgba(255,255,255,.5)', fontSize:13, lineHeight:1.6, margin:'0 0 16px', maxWidth:540 }}>
                {meta.description}
              </p>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <a href={`https://www.coverbrowser.com/covers/${slug}`} target="_blank" rel="noopener noreferrer"
                  style={{ border:'1px solid rgba(255,255,255,.2)', color:'rgba(255,255,255,.6)', fontSize:12, padding:'5px 12px', borderRadius:6, textDecoration:'none' }}>
                  Ver en CoverBrowser ↗
                </a>
                <a href={`/personajes/marvel/${charSlug}`}
                  style={{ border:'1px solid rgba(204,0,0,.4)', color:'#CC0000', fontSize:12, padding:'5px 12px', borderRadius:6, textDecoration:'none' }}>
                  Ver personaje
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* COVERS GRID */}
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'24px 16px' }}>
          <p style={{ color:'#6b7280', fontSize:12, marginBottom:16 }}>
            Portadas cargadas desde CoverBrowser.com • Las imágenes se cargan progresivamente
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(100px,1fr))', gap:8 }}>
            {covers.map(c => (
              <div key={c.n} className="cover-thumb">
                <div style={{ position:'absolute', top:3, left:3, background:'rgba(0,0,0,.7)', color:'#CC0000', fontSize:8, fontWeight:700, padding:'1px 4px', borderRadius:3, zIndex:2 }}>#{c.n}</div>
                <img src={c.url} alt={`${title} #${c.n}`} loading="lazy" referrerPolicy="no-referrer" />
              </div>
            ))}
          </div>
          <p style={{ color:'#9ca3af', fontSize:12, marginTop:16, textAlign:'center' }}>
            Imágenes con copyright © de sus respectivos autores y editoriales · Mostradas bajo criterio de uso justo
          </p>
        </div>

        {/* JARVIS STICKY */}
        <div style={{ position:'sticky', bottom:0, background:'rgba(13,13,13,.97)', backdropFilter:'blur(12px)', borderTop:'1px solid #222', padding:'10px 16px', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <span style={{ fontSize:20 }}>🤖</span>
          <span style={{ flex:1, fontSize:12, color:'rgba(255,255,255,.6)', minWidth:120 }}>
            <b style={{ color:'#fff' }}>Jarvis IA:</b> ¿Quieres saber más sobre {title}?
          </span>
          <a href={`/universo?q=${encodeURIComponent(title)}`} style={{ border:'1px solid rgba(255,255,255,.2)', color:'rgba(255,255,255,.7)', borderRadius:6, padding:'6px 12px', fontSize:12, textDecoration:'none' }}>Preguntarle a Jarvis</a>
          <a href="/catalogo" style={{ background:'#CC0000', color:'#fff', borderRadius:6, padding:'6px 12px', fontSize:12, textDecoration:'none', fontWeight:600 }}>Catálogo</a>
          <a href="/blog" style={{ color:'rgba(255,255,255,.4)', fontSize:12, textDecoration:'none' }}>← Blog</a>
        </div>
      </div>
    </>
  );
}
