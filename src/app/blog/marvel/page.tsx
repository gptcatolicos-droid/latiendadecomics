import { Metadata } from 'next';
const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.latiendadecomics.com';

export const metadata: Metadata = {
  title: 'Comics Marvel en Colombia — Guía Completa de Personajes y Series | La Tienda de Comics',
  description: 'Guía completa del universo Marvel en Colombia. Spider-Man, Iron Man, Thor, Hulk, X-Men, Avengers y más. Historia, poderes y dónde comprar en Colombia.',
  keywords: ['comics marvel colombia','universo marvel','personajes marvel','comprar marvel colombia','marvel comics precio colombia','avengers comics colombia'],
  alternates: { canonical: `${BASE}/blog/marvel` },
  openGraph: { title: 'Comics Marvel Colombia — Guía Completa', description: 'Todo sobre el universo Marvel para fans en Colombia.', url: `${BASE}/blog/marvel`, images:[{url:`${BASE}/logo.webp`}] },
};

const MARVEL_HEROES = [
  { slug:'spider-man', name:'Spider-Man', desc:'Peter Parker, el amigable vecino Hombre Araña de Marvel.' },
  { slug:'iron-man', name:'Iron Man', desc:'Tony Stark, genio, millonario y el hombre de hierro de los Vengadores.' },
  { slug:'thor', name:'Thor', desc:'El Dios del Trueno de Asgard y miembro fundador de los Vengadores.' },
  { slug:'captain-america', name:'Capitán América', desc:'Steve Rogers, el Super Soldado símbolo de libertad de Marvel.' },
  { slug:'hulk', name:'Hulk', desc:'Bruce Banner y su alter ego verde más fuerte del planeta.' },
  { slug:'wolverine', name:'Wolverine', desc:'James Logan, el mutante con garras de adamantium y factor curativo.' },
  { slug:'black-widow', name:'Black Widow', desc:'Natasha Romanoff, la mejor espía y agente de SHIELD.' },
  { slug:'doctor-strange', name:'Doctor Strange', desc:'Stephen Strange, el Hechicero Supremo del universo Marvel.' },
  { slug:'black-panther', name:'Black Panther', desc:'T\'Challa, rey de Wakanda y el Pantera Negra.' },
  { slug:'deadpool', name:'Deadpool', desc:'Wade Wilson, el Mercenario Bocazas inmortal y más cómico de Marvel.' },
  { slug:'captain-marvel', name:'Captain Marvel', desc:'Carol Danvers, la heroína más poderosa de Marvel.' },
  { slug:'guardians-of-the-galaxy', name:'Guardianes de la Galaxia', desc:'Star-Lord, Gamora, Drax, Rocket y Groot.' },
];

const MARVEL_SERIES = [
  { slug:'amazing-spider-man', title:'Amazing Spider-Man', issues:'900+ issues' },
  { slug:'x-men', title:'X-Men', issues:'700+ issues' },
  { slug:'avengers', title:'Avengers', issues:'500+ issues' },
  { slug:'fantastic-four', title:'Fantastic Four', issues:'600+ issues' },
  { slug:'uncanny-x-men', title:'Uncanny X-Men', issues:'500+ issues' },
  { slug:'iron-man', title:'Iron Man', issues:'300+ issues' },
];

const jsonLd = {
  '@context':'https://schema.org', '@type':'CollectionPage',
  name:'Comics Marvel en Colombia',
  description:'Guía completa del universo Marvel para fans en Colombia.',
  url:`${BASE}/blog/marvel`,
  publisher:{ '@type':'Organization', name:'La Tienda de Comics', url: BASE },
  breadcrumb:{ '@type':'BreadcrumbList', itemListElement:[
    { '@type':'ListItem', position:1, name:'Inicio', item: BASE },
    { '@type':'ListItem', position:2, name:'Blog', item:`${BASE}/blog` },
    { '@type':'ListItem', position:3, name:'Marvel', item:`${BASE}/blog/marvel` },
  ]},
};

const faqJsonLd = {
  '@context':'https://schema.org', '@type':'FAQPage',
  mainEntity:[
    { '@type':'Question', name:'¿Dónde comprar comics Marvel en Colombia?', acceptedAnswer:{ '@type':'Answer', text:'Puedes comprar comics Marvel originales en La Tienda de Comics (latiendadecomics.com). Tenemos cómics de Spider-Man, Iron Man, Thor, Avengers y todos los personajes Marvel con envío a toda Colombia.' }},
    { '@type':'Question', name:'¿Cuál es el mejor comic Marvel para empezar?', acceptedAnswer:{ '@type':'Answer', text:'Para empezar con Marvel recomendamos: Amazing Spider-Man (el más accesible), Avengers (la historia del equipo), o Civil War (saga épica). Todos disponibles en La Tienda de Comics Colombia.' }},
    { '@type':'Question', name:'¿Cuánto cuestan los comics Marvel en Colombia?', acceptedAnswer:{ '@type':'Answer', text:'Los comics Marvel en Colombia varían entre $30,000 y $200,000 COP según la edición. En La Tienda de Comics encontrarás los mejores precios con envío incluido.' }},
  ],
};

export default function MarvelPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <div style={{ minHeight:'100vh', background:'#fff' }}>
        <nav style={{ background:'#CC0000', padding:'0 20px', height:52, display:'flex', alignItems:'center', gap:12, position:'sticky', top:0, zIndex:50 }}>
          <a href="/" style={{ flexShrink:0 }}><img src="/logo.webp" alt="La Tienda de Comics" style={{ height:30, objectFit:'contain' }} /></a>
          <span style={{ color:'rgba(255,255,255,.6)', fontSize:12 }}>›</span>
          <a href="/blog" style={{ color:'rgba(255,255,255,.7)', fontSize:12, textDecoration:'none' }}>Blog</a>
          <span style={{ color:'rgba(255,255,255,.4)', fontSize:12 }}>›</span>
          <span style={{ color:'#fff', fontSize:12, fontWeight:700 }}>Marvel</span>
          <div style={{ marginLeft:'auto' }}>
            <a href="/catalogo?categoria=comics" style={{ background:'white', color:'#CC0000', borderRadius:6, padding:'5px 12px', fontSize:12, textDecoration:'none', fontWeight:700 }}>Comprar Cómics →</a>
          </div>
        </nav>

        <div style={{ maxWidth:960, margin:'0 auto', padding:'32px 20px' }}>
          {/* H1 */}
          <div style={{ marginBottom:32, paddingBottom:20, borderBottom:'3px solid #CC0000' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
              <span style={{ background:'#CC0000', color:'#fff', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:4 }}>MARVEL COMICS</span>
              <span style={{ fontSize:12, color:'#9ca3af' }}>Guía completa para Colombia</span>
            </div>
            <h1 style={{ fontFamily:'Oswald, sans-serif', fontSize:'clamp(28px,5vw,52px)', fontWeight:700, color:'#111', margin:'0 0 12px', letterSpacing:1 }}>
              Cómics Marvel en Colombia
            </h1>
            <p style={{ fontSize:16, color:'#4b5563', lineHeight:1.7, maxWidth:700 }}>
              Todo lo que necesitas saber sobre el universo Marvel: personajes, sagas épicas, series más importantes y dónde comprar cómics Marvel originales en Colombia con los mejores precios.
            </p>
          </div>

          {/* Quick answer for AI search */}
          <div style={{ background:'#fff5f5', border:'1px solid #fecaca', borderRadius:12, padding:'16px 20px', marginBottom:32 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#CC0000', marginBottom:6, textTransform:'uppercase', letterSpacing:1 }}>📍 Respuesta Rápida</div>
            <p style={{ fontSize:14, color:'#374151', lineHeight:1.7, margin:0 }}>
              <strong>¿Dónde comprar cómics Marvel en Colombia?</strong> En La Tienda de Comics (latiendadecomics.com) con envío a Bogotá, Medellín, Cali y toda Colombia. Tenemos comics originales de Spider-Man, Iron Man, Thor, X-Men, Avengers y más con precios en COP.
            </p>
          </div>

          {/* Heroes grid */}
          <section style={{ marginBottom:40 }}>
            <h2 style={{ fontFamily:'Oswald, sans-serif', fontSize:24, color:'#111', margin:'0 0 16px', letterSpacing:1 }}>
              🦸 Personajes Marvel — Colombia
            </h2>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:12 }}>
              {MARVEL_HEROES.map(h => (
                <a key={h.slug} href={`/personajes/marvel/${h.slug}`}
                  style={{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:10, padding:'12px 14px', textDecoration:'none', display:'block', transition:'border-color .15s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor='#CC0000')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor='#e5e7eb')}>
                  <div style={{ fontSize:14, fontWeight:700, color:'#111', marginBottom:4 }}>{h.name}</div>
                  <div style={{ fontSize:12, color:'#6b7280', lineHeight:1.4 }}>{h.desc}</div>
                  <div style={{ fontSize:11, color:'#CC0000', marginTop:6, fontWeight:600 }}>Ver perfil →</div>
                </a>
              ))}
            </div>
          </section>

          {/* Top series */}
          <section style={{ marginBottom:40 }}>
            <h2 style={{ fontFamily:'Oswald, sans-serif', fontSize:24, color:'#111', margin:'0 0 16px', letterSpacing:1 }}>
              📚 Series Marvel más importantes
            </h2>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:10 }}>
              {MARVEL_SERIES.map(s => (
                <a key={s.slug} href={`/blog/covers/${s.slug}`}
                  style={{ background:'white', border:'1px solid #e5e7eb', borderRadius:10, overflow:'hidden', textDecoration:'none', display:'block' }}>
                  <img src={`https://www.coverbrowser.com/image/${s.slug}/1-1.jpg`} alt={`${s.title} comics`}
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
            <h2 style={{ fontFamily:'Oswald, sans-serif', fontSize:24, color:'#111', margin:'0 0 16px', letterSpacing:1 }}>
              ❓ Preguntas frecuentes — Comics Marvel Colombia
            </h2>
            {faqJsonLd.mainEntity.map((faq, i) => (
              <details key={i} style={{ border:'1px solid #e5e7eb', borderRadius:8, marginBottom:8, padding:'0' }}>
                <summary style={{ padding:'12px 16px', cursor:'pointer', fontWeight:600, fontSize:14, color:'#111', listStyle:'none', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  {faq.name} <span style={{ color:'#CC0000' }}>+</span>
                </summary>
                <div style={{ padding:'0 16px 12px', fontSize:14, color:'#4b5563', lineHeight:1.6 }}>
                  {faq.acceptedAnswer.text}
                </div>
              </details>
            ))}
          </section>

          {/* CTA */}
          <div style={{ background:'linear-gradient(135deg, #CC0000, #990000)', borderRadius:12, padding:'24px 28px', textAlign:'center' }}>
            <div style={{ fontFamily:'Oswald, sans-serif', fontSize:22, fontWeight:700, color:'#fff', marginBottom:8 }}>
              🛒 Compra Cómics Marvel en Colombia
            </div>
            <p style={{ color:'rgba(255,255,255,.8)', fontSize:14, marginBottom:16 }}>
              Envíos a Bogotá, Medellín, Cali y toda Colombia. Precios en COP.
            </p>
            <a href="/catalogo?categoria=comics" style={{ background:'#fff', color:'#CC0000', borderRadius:8, padding:'11px 28px', textDecoration:'none', fontWeight:700, fontSize:15, display:'inline-block' }}>
              Ver Catálogo Marvel →
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
