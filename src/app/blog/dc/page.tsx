import { Metadata } from 'next';
const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.latiendadecomics.com';

export const metadata: Metadata = {
  title: 'Comics DC en Colombia — Batman, Superman, Wonder Woman | La Tienda de Comics',
  description: 'Guía completa del universo DC Comics en Colombia. Batman, Superman, Wonder Woman, Flash, Green Lantern y más. Dónde comprar DC Comics originales en Colombia.',
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
  { slug:'joker', name:'Joker', desc:'El Príncipe del Crimen, el villano más icónico de DC.' },
];

const jsonLd = {
  '@context':'https://schema.org', '@type':'CollectionPage',
  name:'Comics DC en Colombia',
  description:'Guía completa del universo DC Comics para fans en Colombia.',
  url:`${BASE}/blog/dc`,
  publisher:{ '@type':'Organization', name:'La Tienda de Comics', url: BASE },
};

const faqJsonLd = {
  '@context':'https://schema.org', '@type':'FAQPage',
  mainEntity:[
    { '@type':'Question', name:'¿Dónde comprar comics DC en Colombia?', acceptedAnswer:{ '@type':'Answer', text:'Compra comics DC originales en La Tienda de Comics Colombia (latiendadecomics.com). Tenemos Batman, Superman, Wonder Woman y todas las series DC con envío a toda Colombia.' }},
    { '@type':'Question', name:'¿Cuál es el mejor comic DC para empezar?', acceptedAnswer:{ '@type':'Answer', text:'Para empezar con DC Comics recomendamos Batman: Year One o Batman: Long Halloween (ideales para nuevos lectores), The Killing Joke (historia esencial) o Justice League: Origin (el equipo completo). Todos disponibles en La Tienda de Comics.' }},
    { '@type':'Question', name:'¿Son originales los comics DC de La Tienda de Comics?', acceptedAnswer:{ '@type':'Answer', text:'Sí, todos los comics DC que vendemos en La Tienda de Comics son originales y licenciados. Garantizamos la autenticidad de cada producto con envío a toda Colombia.' }},
  ],
};

export default function DCPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <div style={{ minHeight:'100vh', background:'#fff' }}>
        <nav style={{ background:'#0476D0', padding:'0 20px', height:52, display:'flex', alignItems:'center', gap:12, position:'sticky', top:0, zIndex:50 }}>
          <a href="/" style={{ flexShrink:0 }}><img src="/logo.webp" alt="La Tienda de Comics" style={{ height:30, objectFit:'contain' }} /></a>
          <span style={{ color:'rgba(255,255,255,.6)', fontSize:12 }}>›</span>
          <a href="/blog" style={{ color:'rgba(255,255,255,.7)', fontSize:12, textDecoration:'none' }}>Blog</a>
          <span style={{ color:'rgba(255,255,255,.4)', fontSize:12 }}>›</span>
          <span style={{ color:'#fff', fontSize:12, fontWeight:700 }}>DC Comics</span>
          <div style={{ marginLeft:'auto' }}>
            <a href="/catalogo?categoria=comics" style={{ background:'white', color:'#0476D0', borderRadius:6, padding:'5px 12px', fontSize:12, textDecoration:'none', fontWeight:700 }}>Comprar Cómics →</a>
          </div>
        </nav>

        <div style={{ maxWidth:960, margin:'0 auto', padding:'32px 20px' }}>
          <div style={{ marginBottom:32, paddingBottom:20, borderBottom:'3px solid #0476D0' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
              <span style={{ background:'#0476D0', color:'#fff', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:4 }}>DC COMICS</span>
              <span style={{ fontSize:12, color:'#9ca3af' }}>Guía completa para Colombia</span>
            </div>
            <h1 style={{ fontFamily:'Oswald, sans-serif', fontSize:'clamp(28px,5vw,52px)', fontWeight:700, color:'#111', margin:'0 0 12px', letterSpacing:1 }}>
              Cómics DC en Colombia
            </h1>
            <p style={{ fontSize:16, color:'#4b5563', lineHeight:1.7, maxWidth:700 }}>
              El universo completo de DC Comics para fans en Colombia: Batman, Superman, Wonder Woman, Justice League y más. Historia, personajes clave y dónde comprar DC Comics originales en Colombia.
            </p>
          </div>

          <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:12, padding:'16px 20px', marginBottom:32 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#0476D0', marginBottom:6, textTransform:'uppercase', letterSpacing:1 }}>📍 Respuesta Rápida</div>
            <p style={{ fontSize:14, color:'#374151', lineHeight:1.7, margin:0 }}>
              <strong>¿Dónde comprar cómics DC en Colombia?</strong> En La Tienda de Comics encontrarás los mejores cómics DC originales: Batman, Superman, Wonder Woman y más, con precios en COP y envío a todo Colombia.
            </p>
          </div>

          <section style={{ marginBottom:40 }}>
            <h2 style={{ fontFamily:'Oswald, sans-serif', fontSize:24, color:'#111', margin:'0 0 16px' }}>🦸 Personajes DC — Colombia</h2>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:12 }}>
              {DC_HEROES.map(h => (
                <a key={h.slug} href={`/personajes/dc/${h.slug}`}
                  style={{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:10, padding:'12px 14px', textDecoration:'none', display:'block' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor='#0476D0')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor='#e5e7eb')}>
                  <div style={{ fontSize:14, fontWeight:700, color:'#111', marginBottom:4 }}>{h.name}</div>
                  <div style={{ fontSize:12, color:'#6b7280', lineHeight:1.4 }}>{h.desc}</div>
                  <div style={{ fontSize:11, color:'#0476D0', marginTop:6, fontWeight:600 }}>Ver perfil →</div>
                </a>
              ))}
            </div>
          </section>

          <section style={{ marginBottom:40 }}>
            <h2 style={{ fontFamily:'Oswald, sans-serif', fontSize:24, color:'#111', margin:'0 0 16px' }}>❓ Preguntas frecuentes — DC Comics Colombia</h2>
            {faqJsonLd.mainEntity.map((faq, i) => (
              <details key={i} style={{ border:'1px solid #e5e7eb', borderRadius:8, marginBottom:8 }}>
                <summary style={{ padding:'12px 16px', cursor:'pointer', fontWeight:600, fontSize:14, color:'#111', listStyle:'none', display:'flex', justifyContent:'space-between' }}>
                  {faq.name} <span style={{ color:'#0476D0' }}>+</span>
                </summary>
                <div style={{ padding:'0 16px 12px', fontSize:14, color:'#4b5563', lineHeight:1.6 }}>{faq.acceptedAnswer.text}</div>
              </details>
            ))}
          </section>

          <div style={{ background:'linear-gradient(135deg, #0476D0, #0353a4)', borderRadius:12, padding:'24px 28px', textAlign:'center' }}>
            <div style={{ fontFamily:'Oswald, sans-serif', fontSize:22, fontWeight:700, color:'#fff', marginBottom:8 }}>🛒 Compra Cómics DC en Colombia</div>
            <p style={{ color:'rgba(255,255,255,.8)', fontSize:14, marginBottom:16 }}>Envíos a Bogotá, Medellín, Cali y toda Colombia. Precios en COP.</p>
            <a href="/catalogo?categoria=comics" style={{ background:'#fff', color:'#0476D0', borderRadius:8, padding:'11px 28px', textDecoration:'none', fontWeight:700, fontSize:15, display:'inline-block' }}>
              Ver Catálogo DC Comics →
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
