import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCharacterBySlug, getRelatedCharacters, CHARACTERS } from '@/lib/characters-data';
import CharacterJarvis from './CharacterJarvis';

export const dynamic = 'force-static';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://latiendadecomics.onrender.com';

export function generateStaticParams() {
  return CHARACTERS.map(c => ({ universe: c.universe, slug: c.slug }));
}

export async function generateMetadata({ params }: { params: { universe: string; slug: string } }): Promise<Metadata> {
  const char = getCharacterBySlug(params.slug);
  if (!char) return {};
  const uniLabel = char.universe === 'marvel' ? 'Marvel Comics' : 'DC Comics';
  const alignLabel = char.alignment === 'hero' ? 'Héroe' : char.alignment === 'villain' ? 'Villano' : 'Antihéroe';
  const title = `${char.name} (${char.realName}) — ${alignLabel} ${uniLabel} | La Tienda de Comics`;
  const desc = `${char.description.substring(0, 145)}. Primera aparición: ${char.firstAppearance}.`;
  const keywords = [
    char.name.toLowerCase(),
    char.realName.toLowerCase(),
    `${char.name.toLowerCase()} ${uniLabel.toLowerCase()}`,
    `${char.name.toLowerCase()} comics`,
    `${char.name.toLowerCase()} poderes`,
    `${char.name.toLowerCase()} historia`,
    `${char.name.toLowerCase()} portadas`,
    uniLabel.toLowerCase(),
    'personajes comics',
    `comics ${char.universe}`,
    ...char.powers.slice(0, 3).map(p => p.toLowerCase()),
  ];
  return {
    title,
    description: desc,
    keywords,
    openGraph: {
      title, description: desc,
      url: `${BASE_URL}/personajes/${char.universe}/${char.slug}`,
      images: [{ url: char.imageUrl, width: 400, height: 600, alt: `${char.name} — ${uniLabel}` }],
      type: 'profile',
    },
    twitter: { card: 'summary_large_image', title, description: desc, images: [char.imageUrl] },
    alternates: { canonical: `${BASE_URL}/personajes/${char.universe}/${char.slug}` },
  };
}

export default function CharacterPage({ params }: { params: { universe: string; slug: string } }) {
  const char = getCharacterBySlug(params.slug);
  if (!char || char.universe !== params.universe) notFound();

  const related = getRelatedCharacters(char, 8);
  const uniLabel = char.universe === 'marvel' ? 'Marvel Comics' : 'DC Comics';
  const uniBg = char.universe === 'marvel' ? '#CC0000' : '#0476D0';
  const alignColor = char.alignment === 'hero' ? '#2563eb' : char.alignment === 'villain' ? '#CC0000' : '#d97706';
  const alignLabel = char.alignment === 'hero' ? '💙 Héroe' : char.alignment === 'villain' ? '🔴 Villano' : '⚡ Antihéroe';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: char.name,
    alternateName: char.realName,
    description: char.description,
    image: char.imageUrl,
    url: `${BASE_URL}/personajes/${char.universe}/${char.slug}`,
    memberOf: char.teams.map(t => ({ '@type': 'Organization', name: t })),
    creator: char.creators.map(c => ({ '@type': 'Person', name: c })),
    knowsAbout: char.powers,
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Personajes', item: `${BASE_URL}/personajes` },
      { '@type': 'ListItem', position: 3, name: uniLabel, item: `${BASE_URL}/personajes?filter=${char.universe}` },
      { '@type': 'ListItem', position: 4, name: char.name, item: `${BASE_URL}/personajes/${char.universe}/${char.slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <style>{`
        .gallery-link{border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;text-decoration:none;display:block;transition:border-color .2s,box-shadow .2s}
        .gallery-link:hover{border-color:#CC0000;box-shadow:0 2px 8px rgba(204,0,0,.15)}
        .related-link{border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;text-decoration:none;display:block;transition:border-color .2s,box-shadow .2s}
        .related-link:hover{border-color:#CC0000;box-shadow:0 2px 8px rgba(204,0,0,.12)}
        @media(max-width:640px){
          .char-hero{grid-template-columns:1fr!important}
          .char-img{width:100%!important;max-width:200px;margin:0 auto!important}
          .main-grid{grid-template-columns:1fr!important}
        }
      `}</style>

      <div style={{ minHeight:'100vh', background:'#fff' }}>
        {/* NAV */}
        <nav style={{ background:'#0D0D0D', position:'sticky', top:0, zIndex:50 }}>
          <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 16px', height:52, display:'flex', alignItems:'center', gap:8, overflow:'hidden' }}>
            <a href="/" style={{ flexShrink:0 }}>
              <img src="/logo.webp" alt="La Tienda de Comics" style={{ height:28, objectFit:'contain', display:'block' }} />
            </a>
            <span style={{ color:'rgba(255,255,255,.3)', fontSize:11, flexShrink:0 }}>›</span>
            <a href="/personajes" style={{ color:'rgba(255,255,255,.5)', fontSize:11, textDecoration:'none', whiteSpace:'nowrap' }}>Personajes</a>
            <span style={{ color:'rgba(255,255,255,.3)', fontSize:11, flexShrink:0 }}>›</span>
            <span style={{ background:uniBg, color:'#fff', fontSize:9, padding:'2px 6px', borderRadius:4, whiteSpace:'nowrap', flexShrink:0 }}>{uniLabel}</span>
            <span style={{ color:'rgba(255,255,255,.3)', fontSize:11, flexShrink:0 }}>›</span>
            <span style={{ color:'#fff', fontSize:11, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{char.name}</span>
            <div style={{ marginLeft:'auto', display:'flex', gap:8, flexShrink:0 }}>
              <a href="/catalogo" style={{ background:'#CC0000', color:'#fff', fontSize:12, padding:'4px 10px', borderRadius:6, textDecoration:'none', fontWeight:600 }}>Catálogo</a>
            </div>
          </div>
        </nav>

        {/* HERO */}
        <div style={{ background:'linear-gradient(180deg,#161616 0%,#1a1a1a 100%)', borderBottom:'1px solid #222', padding:'28px 16px' }}>
          <div className="char-hero" style={{ maxWidth:960, margin:'0 auto', display:'grid', gridTemplateColumns:'auto 1fr', gap:'20px 24px', alignItems:'start' }}>
            <img src={char.imageUrl} alt={`${char.name} — ${char.realName} | ${uniLabel}`} referrerPolicy="no-referrer" className="char-img"
              style={{ width:'clamp(110px,20vw,180px)', aspectRatio:'3/4', objectFit:'cover', objectPosition:'top', borderRadius:10, border:`2px solid ${uniBg}`, display:'block', background:'#333' }} />
            <div>
              <div style={{ display:'flex', gap:6, marginBottom:10, flexWrap:'wrap' }}>
                <span style={{ background:uniBg, color:'#fff', fontSize:11, padding:'3px 10px', borderRadius:12, fontWeight:700 }}>{uniLabel}</span>
                <span style={{ background:alignColor+'22', color:alignColor, fontSize:11, padding:'3px 10px', borderRadius:12, fontWeight:600, border:`1px solid ${alignColor}44` }}>{alignLabel}</span>
              </div>
              <h1 style={{ fontFamily:'Oswald,sans-serif', fontSize:'clamp(22px,5vw,40px)', fontWeight:700, color:'#fff', margin:'0 0 4px', letterSpacing:1 }}>{char.name}</h1>
              {char.realName !== char.name && (
                <p style={{ color:'rgba(255,255,255,.45)', fontSize:13, margin:'0 0 12px' }}>
                  Identidad secreta: <b style={{ color:'rgba(255,255,255,.7)' }}>{char.realName}</b>
                </p>
              )}
              <p style={{ color:'rgba(255,255,255,.7)', fontSize:14, lineHeight:1.7, margin:'0 0 16px', maxWidth:560 }}>{char.description}</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:8, maxWidth:560, marginBottom:14 }}>
                <div style={{ background:'rgba(255,255,255,.06)', borderRadius:8, padding:'8px 12px' }}>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,.35)', textTransform:'uppercase', letterSpacing:1, marginBottom:3 }}>Primera aparición</div>
                  <div style={{ fontSize:12, color:'#fff' }}>{char.firstAppearance}</div>
                </div>
                {char.creators.length > 0 && (
                  <div style={{ background:'rgba(255,255,255,.06)', borderRadius:8, padding:'8px 12px' }}>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,.35)', textTransform:'uppercase', letterSpacing:1, marginBottom:3 }}>Creadores</div>
                    <div style={{ fontSize:12, color:'#fff' }}>{char.creators.join(', ')}</div>
                  </div>
                )}
              </div>
              {char.teams.length > 0 && (
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {char.teams.map(t => (
                    <span key={t} style={{ background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.12)', color:'rgba(255,255,255,.6)', fontSize:11, padding:'3px 10px', borderRadius:12 }}>{t}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div style={{ maxWidth:960, margin:'0 auto', padding:'24px 16px' }}>
          <div className="main-grid" style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) 280px', gap:24, alignItems:'start' }}>
            <div>
              {/* Powers */}
              <section style={{ marginBottom:28 }}>
                <h2 style={{ fontFamily:'Oswald,sans-serif', fontSize:18, color:'#111', margin:'0 0 12px', letterSpacing:1 }}>⚡ Poderes y Habilidades</h2>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(185px,1fr))', gap:8 }}>
                  {char.powers.map((p,i) => (
                    <div key={i} style={{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 12px', display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:6, height:6, borderRadius:'50%', background:alignColor, flexShrink:0 }} />
                      <span style={{ fontSize:13, color:'#374151' }}>{p}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Cover Galleries */}
              {char.relatedGalleries.length > 0 && (
                <section style={{ marginBottom:28 }}>
                  <h2 style={{ fontFamily:'Oswald,sans-serif', fontSize:18, color:'#111', margin:'0 0 12px', letterSpacing:1 }}>📚 Galerías de Portadas</h2>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))', gap:10 }}>
                    {char.relatedGalleries.map(gs => (
                      <a key={gs} href={`/blog/covers/${gs}`} className="gallery-link">
                        <img src={`https://www.coverbrowser.com/image/${gs}/1-1.jpg`} alt={`${gs.replace(/-/g,' ')} portadas comics`}
                          loading="lazy" referrerPolicy="no-referrer"
                          style={{ width:'100%', aspectRatio:'2/3', objectFit:'cover', display:'block', background:'#f3f4f6' }} />
                        <div style={{ padding:'6px 8px', fontSize:11, color:'#374151', textTransform:'capitalize', lineHeight:1.3 }}>
                          {gs.replace(/-/g,' ')}
                        </div>
                      </a>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Jarvis sidebar */}
            <div style={{ position:'sticky', top:70 }}>
              <CharacterJarvis character={char} />
            </div>
          </div>
        </div>

        {/* RELATED */}
        {related.length > 0 && (
          <div style={{ borderTop:'1px solid #e5e7eb', padding:'24px 16px', background:'#fafafa' }}>
            <div style={{ maxWidth:960, margin:'0 auto' }}>
              <h2 style={{ fontFamily:'Oswald,sans-serif', fontSize:18, color:'#111', margin:'0 0 14px' }}>
                Más personajes de {uniLabel}
              </h2>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(105px,1fr))', gap:10 }}>
                {related.map(r => (
                  <a key={r.slug} href={`/personajes/${r.universe}/${r.slug}`} className="related-link">
                    <img src={r.imageUrl} alt={`${r.name} — ${r.realName}`} loading="lazy" referrerPolicy="no-referrer"
                      style={{ width:'100%', aspectRatio:'3/4', objectFit:'cover', objectPosition:'top', display:'block', background:'#f3f4f6' }} />
                    <div style={{ padding:'5px 8px', fontSize:11, fontWeight:600, color:'#111', lineHeight:1.2 }}>{r.name}</div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* FOOTER BAR */}
        <div style={{ position:'sticky', bottom:0, background:'rgba(13,13,13,.97)', backdropFilter:'blur(12px)', borderTop:'1px solid #222', padding:'10px 16px', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <span style={{ fontSize:12, color:'rgba(255,255,255,.5)', flex:1, minWidth:140 }}>
            <b style={{ color:'#fff' }}>🤖 Jarvis:</b> ¿Quieres cómics de {char.name}?
          </span>
          <a href="/personajes" style={{ border:'1px solid rgba(255,255,255,.15)', color:'rgba(255,255,255,.6)', borderRadius:6, padding:'5px 12px', fontSize:12, textDecoration:'none' }}>← Personajes</a>
          <a href="/catalogo" style={{ background:'#CC0000', color:'#fff', borderRadius:6, padding:'5px 12px', fontSize:12, textDecoration:'none', fontWeight:600 }}>Ver Catálogo</a>
          <a href="/" style={{ color:'rgba(255,255,255,.35)', fontSize:12, textDecoration:'none' }}>Inicio</a>
        </div>
      </div>
    </>
  );
}
