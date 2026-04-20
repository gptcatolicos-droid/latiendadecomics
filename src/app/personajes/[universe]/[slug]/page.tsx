import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCharacterBySlug, getRelatedCharacters, CHARACTERS } from '@/lib/characters-data';
import CharacterJarvis from './CharacterJarvis';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://latiendadecomics.onrender.com';

export async function generateStaticParams() {
  return CHARACTERS.map(c => ({ universe: c.universe, slug: c.slug }));
}

export async function generateMetadata({ params }: { params: { universe: string; slug: string } }): Promise<Metadata> {
  const char = getCharacterBySlug(params.slug);
  if (!char) return {};
  const uniLabel = char.universe === 'marvel' ? 'Marvel Comics' : 'DC Comics';
  const title = `${char.name} — ${char.realName} | Personajes ${uniLabel}`;
  const desc = char.description.substring(0, 155);
  return {
    title,
    description: desc,
    keywords: [char.name.toLowerCase(), char.realName.toLowerCase(), `${char.name} comics`, uniLabel.toLowerCase()],
    openGraph: {
      title, description: desc,
      url: `${BASE_URL}/personajes/${char.universe}/${char.slug}`,
      images: [{ url: char.imageUrl, width: 400, height: 600, alt: char.name }],
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
  const alignColor = char.alignment === 'hero' ? '#3b82f6' : char.alignment === 'villain' ? '#CC0000' : '#f59e0b';
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
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <style>{`
        .gallery-card { border-radius:8px; overflow:hidden; border:1px solid rgba(255,255,255,.1); background:#161616; text-decoration:none; display:block; transition:border-color .2s; }
        .gallery-card:hover { border-color:#CC0000; }
        .related-card { border-radius:8px; overflow:hidden; border:1px solid rgba(255,255,255,.08); background:#161616; text-decoration:none; display:block; transition:border-color .2s; }
        .related-card:hover { border-color:#CC0000; }
        @media(max-width:640px){
          .char-grid { grid-template-columns: 1fr !important; }
          .char-hero-img { width: 120px !important; }
        }
      `}</style>
      <div style={{ minHeight:'100vh', background:'#0D0D0D', color:'#fff' }}>

        {/* NAVBAR */}
        <nav style={{ background:'#111', borderBottom:'1px solid #222', position:'sticky', top:0, zIndex:50 }}>
          <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 16px', height:52, display:'flex', alignItems:'center', gap:8, overflow:'hidden' }}>
            <Link href="/" style={{ display:'flex', alignItems:'center', gap:6, textDecoration:'none', flexShrink:0 }}>
              <div style={{ width:26, height:26, background:'#CC0000', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11 }}>📚</div>
              <span style={{ fontFamily:'var(--font-oswald,serif)', fontSize:13, color:'#fff', letterSpacing:1, whiteSpace:'nowrap' }}>
                La Tienda de <span style={{ color:'#CC0000' }}>Comics</span>
              </span>
            </Link>
            <span style={{ color:'rgba(255,255,255,.3)', fontSize:11, flexShrink:0 }}>›</span>
            <Link href="/personajes" style={{ color:'rgba(255,255,255,.5)', fontSize:11, textDecoration:'none', whiteSpace:'nowrap' }}>Personajes</Link>
            <span style={{ color:'rgba(255,255,255,.3)', fontSize:11, flexShrink:0 }}>›</span>
            <span style={{ background:uniBg, color:'#fff', fontSize:10, padding:'2px 6px', borderRadius:4, whiteSpace:'nowrap' }}>{uniLabel}</span>
            <span style={{ color:'rgba(255,255,255,.3)', fontSize:11, flexShrink:0 }}>›</span>
            <span style={{ color:'#fff', fontSize:11, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{char.name}</span>
            <div style={{ marginLeft:'auto', flexShrink:0 }}>
              <Link href="/catalogo" style={{ background:'#CC0000', color:'#fff', fontSize:12, padding:'4px 10px', borderRadius:6, textDecoration:'none' }}>Catálogo</Link>
            </div>
          </div>
        </nav>

        {/* CHARACTER HERO */}
        <div style={{ background:'linear-gradient(180deg,#161616 0%,#0D0D0D 100%)', borderBottom:'1px solid #222', padding:'28px 16px' }}>
          <div style={{ maxWidth:1000, margin:'0 auto', display:'grid', gridTemplateColumns:'auto 1fr', gap:'20px 24px', alignItems:'start' }} className="char-grid">
            <img src={char.imageUrl} alt={char.name} referrerPolicy="no-referrer" className="char-hero-img"
              style={{ width:'clamp(120px,22vw,190px)', aspectRatio:'3/4', objectFit:'cover', objectPosition:'top', borderRadius:12, border:`2px solid ${uniBg}`, display:'block', background:'#222' }} />
            <div>
              <div style={{ display:'flex', gap:8, marginBottom:10, flexWrap:'wrap' }}>
                <span style={{ background:uniBg, color:'#fff', fontSize:11, padding:'3px 10px', borderRadius:12, fontWeight:700 }}>{uniLabel}</span>
                <span style={{ background:alignColor+'33', color:alignColor, fontSize:11, padding:'3px 10px', borderRadius:12, fontWeight:600, border:`1px solid ${alignColor}44` }}>{alignLabel}</span>
              </div>
              <h1 style={{ fontFamily:'var(--font-oswald,serif)', fontSize:'clamp(22px,5vw,42px)', fontWeight:700, color:'#fff', margin:'0 0 4px', letterSpacing:1 }}>{char.name}</h1>
              {char.realName !== char.name && (
                <p style={{ color:'rgba(255,255,255,.45)', fontSize:13, margin:'0 0 14px' }}>
                  Identidad: <b style={{ color:'rgba(255,255,255,.7)' }}>{char.realName}</b>
                </p>
              )}
              <p style={{ color:'rgba(255,255,255,.7)', fontSize:14, lineHeight:1.7, margin:'0 0 18px', maxWidth:580 }}>{char.description}</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:10, marginBottom:16 }}>
                <div style={{ background:'#1a1a1a', borderRadius:8, padding:'10px 14px', border:'1px solid rgba(255,255,255,.08)' }}>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,.35)', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>Primera Aparición</div>
                  <div style={{ fontSize:13, color:'#fff' }}>{char.firstAppearance}</div>
                </div>
                {char.creators.length > 0 && (
                  <div style={{ background:'#1a1a1a', borderRadius:8, padding:'10px 14px', border:'1px solid rgba(255,255,255,.08)' }}>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,.35)', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>Creadores</div>
                    <div style={{ fontSize:13, color:'#fff' }}>{char.creators.join(', ')}</div>
                  </div>
                )}
              </div>
              {char.teams.length > 0 && (
                <div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,.35)', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>Equipos</div>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {char.teams.map(t => (
                      <span key={t} style={{ background:'#1a1a1a', border:'1px solid rgba(255,255,255,.12)', color:'rgba(255,255,255,.65)', fontSize:11, padding:'3px 10px', borderRadius:12 }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div style={{ maxWidth:1000, margin:'0 auto', padding:'24px 16px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(0,280px)', gap:24, alignItems:'start' }}>

            {/* LEFT */}
            <div>
              {/* Powers */}
              <section style={{ marginBottom:28 }}>
                <h2 style={{ fontFamily:'var(--font-oswald,serif)', fontSize:18, color:'#fff', margin:'0 0 14px', letterSpacing:1 }}>⚡ Poderes y Habilidades</h2>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))', gap:8 }}>
                  {char.powers.map((p, i) => (
                    <div key={i} style={{ background:'#161616', border:'1px solid rgba(255,255,255,.08)', borderRadius:8, padding:'8px 12px', display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:6, height:6, borderRadius:'50%', background:alignColor, flexShrink:0 }} />
                      <span style={{ fontSize:13, color:'rgba(255,255,255,.75)' }}>{p}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Cover Galleries */}
              {char.relatedGalleries.length > 0 && (
                <section style={{ marginBottom:28 }}>
                  <h2 style={{ fontFamily:'var(--font-oswald,serif)', fontSize:18, color:'#fff', margin:'0 0 14px', letterSpacing:1 }}>📚 Galerías de Portadas</h2>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:10 }}>
                    {char.relatedGalleries.map(gs => (
                      <Link key={gs} href={`/blog/covers/${gs}`} className="gallery-card">
                        <img src={`https://www.coverbrowser.com/image/${gs}/1-1.jpg`} alt={gs.replace(/-/g,' ')}
                          loading="lazy" referrerPolicy="no-referrer"
                          style={{ width:'100%', aspectRatio:'2/3', objectFit:'cover', display:'block', background:'#222' }} />
                        <div style={{ padding:'6px 8px', fontSize:11, color:'rgba(255,255,255,.6)', textTransform:'capitalize' }}>{gs.replace(/-/g,' ')}</div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* RIGHT: Jarvis */}
            <div style={{ position:'sticky', top:70 }}>
              <CharacterJarvis character={char} />
            </div>
          </div>
        </div>

        {/* RELATED */}
        {related.length > 0 && (
          <div style={{ borderTop:'1px solid #222', padding:'28px 16px' }}>
            <div style={{ maxWidth:1000, margin:'0 auto' }}>
              <h2 style={{ fontFamily:'var(--font-oswald,serif)', fontSize:18, color:'#fff', margin:'0 0 16px', letterSpacing:1 }}>
                Otros Personajes de {uniLabel}
              </h2>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))', gap:10 }}>
                {related.map(r => (
                  <Link key={r.slug} href={`/personajes/${r.universe}/${r.slug}`} className="related-card">
                    <img src={r.imageUrl} alt={r.name} loading="lazy" referrerPolicy="no-referrer"
                      style={{ width:'100%', aspectRatio:'3/4', objectFit:'cover', objectPosition:'top', display:'block', background:'#222' }} />
                    <div style={{ padding:'5px 8px', fontSize:11, fontWeight:600, color:'#fff', lineHeight:1.2 }}>{r.name}</div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* FOOTER BAR */}
        <div style={{ position:'sticky', bottom:0, background:'rgba(13,13,13,.97)', backdropFilter:'blur(12px)', borderTop:'1px solid rgba(255,255,255,.1)', padding:'10px 16px', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <span style={{ fontSize:12, color:'rgba(255,255,255,.5)', flex:1, minWidth:140 }}>
            <b style={{ color:'#fff' }}>🤖 Jarvis:</b> ¿Quieres cómics de {char.name}?
          </span>
          <Link href="/personajes" style={{ border:'1px solid rgba(255,255,255,.15)', color:'rgba(255,255,255,.55)', borderRadius:6, padding:'5px 12px', fontSize:12, textDecoration:'none' }}>← Personajes</Link>
          <Link href="/catalogo" style={{ background:'#CC0000', color:'#fff', borderRadius:6, padding:'5px 12px', fontSize:12, textDecoration:'none', fontWeight:600 }}>Ver Catálogo</Link>
          <Link href="/" style={{ color:'rgba(255,255,255,.35)', fontSize:12, textDecoration:'none' }}>Inicio</Link>
        </div>
      </div>
    </>
  );
}
