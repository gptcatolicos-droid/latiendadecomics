import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.latiendadecomics.com';

export const metadata: Metadata = {
  title: 'Comics DC en Colombia — Batman, Superman, Wonder Woman | La Tienda de Comics',
  description: 'Guía completa del universo DC Comics en Colombia. Batman, Superman, Wonder Woman, Flash, Green Lantern y más. Dónde comprar DC Comics originales en Colombia con envío.',
  keywords: ['comics dc colombia','batman comics colombia','superman comics colombia','wonder woman colombia','dc comics precio colombia','comprar dc comics colombia'],
  alternates: { canonical: `${BASE}/blog/dc` },
  openGraph: { title: 'Comics DC Colombia — Guía Completa', description: 'Todo sobre el universo DC para fans en Colombia.', url: `${BASE}/blog/dc`, images:[{url:`${BASE}/logo.webp`}] },
};

const DC_HEROES = [
  { slug:'batman', name:'Batman', desc:'Bruce Wayne, el Caballero Oscuro de Gotham City.' },
  { slug:'superman', name:'Superman', desc:'Clark Kent / Kal-El, el Hombre de Acero más poderoso de DC.' },
  { slug:'wonder-woman', name:'Wonder Woman', desc:'Diana Prince, la Princesa Amazona guerrera más poderosa.' },
  { slug:'flash', name:'The Flash', desc:'Barry Allen, el hombre más rápido del universo DC.' },
  { slug:'green-lantern', name:'Green Lantern', desc:'Hal Jordan y los Guardianes del Universo con anillos de poder.' },
  { slug:'aquaman', name:'Aquaman', desc:'Arthur Curry, rey de Atlantis y protector de los océanos.' },
  { slug:'nightwing', name:'Nightwing', desc:'Dick Grayson, el primer Robin convertido en el protector de Bludhaven.' },
  { slug:'harley-quinn', name:'Harley Quinn', desc:'La Dra. Harleen Quinzel, antiheroína icónica de Gotham.' },
  { slug:'catwoman', name:'Catwoman', desc:'Selina Kyle, la ladrona felina aliada de Batman.' },
];

const DC_SERIES = [
  { slug:'batman', title:'Batman', issues:'700+ issues' },
  { slug:'detective-comics', title:'Detective Comics', issues:'1000+ issues' },
  { slug:'superman', title:'Superman', issues:'800+ issues' },
  { slug:'action-comics', title:'Action Comics', issues:'1000+ issues' },
  { slug:'wonder-woman', title:'Wonder Woman', issues:'700+ issues' },
  { slug:'justice-league', title:'Justice League', issues:'400+ issues' },
];

const faqItems = [
  { q:'¿Dónde comprar comics DC en Colombia?', a:'Compra comics DC originales en La Tienda de Comics Colombia (latiendadecomics.com). Tenemos Batman, Superman, Wonder Woman y todas las series DC con envío a toda Colombia.' },
  { q:'¿Cuál es el mejor comic DC para empezar?', a:'Para empezar con DC Comics recomendamos Batman: Year One, Batman: Long Halloween o The Killing Joke. Para equipos, Justice League: Origin. Todos disponibles en La Tienda de Comics Colombia.' },
  { q:'¿Son originales los comics DC de La Tienda de Comics?', a:'Sí, todos los comics DC que vendemos son originales y licenciados. Garantizamos autenticidad en cada producto con envío a toda Colombia.' },
  { q:'¿Cuánto cuestan los comics DC en Colombia?', a:'Los comics DC en Colombia tienen precios entre $30,000 y $250,000 COP según la edición y formato. En La Tienda de Comics siempre con los mejores precios en COP.' },
];

const jsonLd = {
  '@context':'https://schema.org', '@type':'CollectionPage',
  name:'Comics DC en Colombia',
  description:'Guía completa del universo DC Comics para fans en Colombia.',
  url:`${BASE}/blog/dc`,
  publisher:{ '@type':'Organization', name:'La Tienda de Comics', url: BASE },
  breadcrumb:{ '@type':'BreadcrumbList', itemListElement:[
    { '@type':'ListItem', position:1, name:'Inicio', item: BASE },
    { '@type':'ListItem', position:2, name:'Blog', item:`${BASE}/blog` },
    { '@type':'ListItem', position:3, name:'DC Comics', item:`${BASE}/blog/dc` },
  ]},
};

const faqJsonLd = {
  '@context':'https://schema.org', '@type':'FAQPage',
  mainEntity: faqItems.map(f => ({
    '@type':'Question', name: f.q,
    acceptedAnswer:{ '@type':'Answer', text: f.a },
  })),
};

export default function DCPage() {
  return (
    <>
      <style>{`
        .hero-card{background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:12px 14px;text-decoration:none;display:block;transition:border-color .2s}
        .hero-card:hover{border-color:#0476D0}
        .series-card{background:white;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;text-decoration:none;display:block;transition:box-shadow .2s}
        .series-card:hover{box-shadow:0 4px 12px rgba(4,118,208,.15)}
        details summary{list-style:none}
        details summary::-webkit-details-marker{display:none}
      `}</style>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div style={{ minHeight:'100vh', background:'#fff' }}>
        <nav style={{ background:'#0476D0', padding:'0 20px', height:52, display:'flex', alignItems:'center', gap:12, position:'sticky', top:0, zIndex:50 }}>
          <a href="/" style={{ flexShrink:0 }}><img src="/logo.webp" alt="La Tienda de Comics" style={{ height:30, objectFit:'contain' }} /></a>
          <span style={{ color:'rgba(255,255,255,.5)', fontSize:12 }}>›</span>
          <a href="/blog" style={{ color:'rgba(255,255,255,.7)', fontSize:12, textDecoration:'none' }}>Blog</a>
          <span style={{ color:'rgba(255,255,255,.4)', fontSize:12 }}>›</span>
          <span style={{ color:'#fff', fontSize:12, fontWeight:700 }}>DC Comics</span>
          <a href="/catalogo?categoria=comics" style={{ marginLeft:'auto', background:'white', color:'#0476D0', borderRadius:6, padding:'5px 12px', fontSize:12, textDecoration:'none', fontWeight:700 }}>Comprar Comics →</a>
        </nav>

        <div style={{ maxWidth:960, margin:'0 auto', padding:'32px 20px' }}>

          <div style={{ marginBottom:32, paddingBottom:20, borderBottom:'3px solid #0476D0' }}>
            <span style={{ background:'#0476D0', color:'#fff', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:4 }}>DC COMICS</span>
            <h1 style={{ fontFamily:'Oswald, sans-serif', fontSize:'clamp(28px,5vw,52px)', fontWeight:700, color:'#111', margin:'10px 0 12px', letterSpacing:1 }}>
              Cómics DC en Colombia
            </h1>
            <p style={{ fontSize:16, color:'#4b5563', lineHeight:1.7, maxWidth:700 }}>
              El universo completo de DC Comics para fans en Colombia: Batman, Superman, Wonder Woman, Justice League y más. Personajes, sagas épicas y dónde comprar DC Comics originales en Colombia.
            </p>
          </div>

          {/* Quick answer for AI/Google */}
          <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:12, padding:'16px 20px', marginBottom:32 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#0476D0', marginBottom:6, textTransform:'uppercase', letterSpacing:1 }}>📍 Respuesta directa</div>
            <p style={{ fontSize:14, color:'#374151', lineHeight:1.7, margin:0 }}>
              <strong>¿Dónde comprar cómics DC en Colombia?</strong> En La Tienda de Comics (latiendadecomics.com) con envío a Bogotá, Medellín, Cali y toda Colombia. Cómics originales de Batman, Superman, Wonder Woman y más con precios en COP.
            </p>
          </div>

          {/* Heroes */}
          <section style={{ marginBottom:40 }}>
            <h2 style={{ fontFamily:'Oswald, sans-serif', fontSize:24, color:'#111', margin:'0 0 16px' }}>🦸 Personajes DC Comics</h2>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:12 }}>
              {DC_HEROES.map(h => (
                <a key={h.slug} href={`/personajes/dc/${h.slug}`} className="hero-card">
                  <div style={{ fontSize:14, fontWeight:700, color:'#111', marginBottom:4 }}>{h.name}</div>
                  <div style={{ fontSize:12, color:'#6b7280', lineHeight:1.4 }}>{h.desc}</div>
                  <div style={{ fontSize:11, color:'#0476D0', marginTop:6, fontWeight:600 }}>Ver perfil →</div>
                </a>
              ))}
            </div>
          </section>

          {/* Series */}
          <section style={{ marginBottom:40 }}>
            <h2 style={{ fontFamily:'Oswald, sans-serif', fontSize:24, color:'#111', margin:'0 0 16px' }}>📚 Series DC más importantes</h2>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(150px, 1fr))', gap:10 }}>
              {DC_SERIES.map(s => (
                <a key={s.slug} href={`/blog/covers/${s.slug}`} className="series-card">
                  <img src={`https://www.coverbrowser.com/image/${s.slug}/1-1.jpg`} alt={`${s.title} comics Colombia`}
                    referrerPolicy="no-referrer" loading="lazy"
                    style={{ width:'100%', aspectRatio:'2/3', objectFit:'cover', background:'#f3f4f6' }} />
                  <div style={{ padding:'8px 10px' }}>
                    <div style={{ fontSize:12, fontWeight:700, color:'#111' }}>{s.title}</div>
                    <div style={{ fontSize:10, color:'#9ca3af' }}>{s.issues}</div>
                  </div>
                </a>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section style={{ marginBottom:40 }}>
            <h2 style={{ fontFamily:'Oswald, sans-serif', fontSize:24, color:'#111', margin:'0 0 16px' }}>❓ Preguntas frecuentes</h2>
            {faqItems.map((f, i) => (
              <details key={i} style={{ border:'1px solid #e5e7eb', borderRadius:8, marginBottom:8 }}>
                <summary style={{ padding:'12px 16px', cursor:'pointer', fontWeight:600, fontSize:14, color:'#111', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  {f.q} <span style={{ color:'#0476D0', fontSize:18, lineHeight:1 }}>+</span>
                </summary>
                <div style={{ padding:'0 16px 14px', fontSize:14, color:'#4b5563', lineHeight:1.7 }}>{f.a}</div>
              </details>
            ))}
          </section>

          {/* CTA */}
          <div style={{ background:'linear-gradient(135deg, #0476D0, #0353a4)', borderRadius:12, padding:'28px', textAlign:'center' }}>
            <div style={{ fontFamily:'Oswald, sans-serif', fontSize:24, fontWeight:700, color:'#fff', marginBottom:8 }}>🛒 Compra Cómics DC en Colombia</div>
            <p style={{ color:'rgba(255,255,255,.8)', fontSize:14, marginBottom:16 }}>Envíos a Bogotá, Medellín, Cali y toda Colombia. Precios en COP.</p>
            <a href="/catalogo?categoria=comics" style={{ background:'#fff', color:'#0476D0', borderRadius:8, padding:'12px 30px', textDecoration:'none', fontWeight:700, fontSize:15, display:'inline-block' }}>
              Ver Catálogo DC Comics →
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
