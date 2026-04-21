import type { Metadata } from 'next';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://latiendadecomics.onrender.com';

export const metadata: Metadata = {
  title: 'Blog de Portadas de Comics — Top 100 Personajes | La Tienda de Comics',
  description: 'Galería completa de portadas de comics. Batman, Spider-Man, X-Men, Superman y más de 450,000 portadas. El archivo de covers más completo en español.',
  keywords: ['portadas comics','covers comics','batman covers','spider-man covers','galeria comics','mejores portadas comics'],
  openGraph: {
    title: 'Blog de Portadas de Comics — Top 100 Personajes',
    description: '450,000+ portadas de comics. El archivo más completo en español.',
    url: `${BASE_URL}/blog`,
    images: [{ url: `${BASE_URL}/logo.webp` }],
  },
  alternates: { canonical: `${BASE_URL}/blog` },
};

const TOP100 = [
  { slug:'batman', title:'Batman', rank:1 },
  { slug:'amazing-spider-man', title:'Amazing Spider-Man', rank:2 },
  { slug:'superman', title:'Superman', rank:3 },
  { slug:'x-men', title:'X-Men', rank:4 },
  { slug:'wonder-woman', title:'Wonder Woman', rank:5 },
  { slug:'iron-man', title:'Iron Man', rank:6 },
  { slug:'thor', title:'Thor', rank:7 },
  { slug:'incredible-hulk', title:'Incredible Hulk', rank:8 },
  { slug:'captain-america', title:'Captain America', rank:9 },
  { slug:'spider-man', title:'Spider-Man', rank:10 },
  { slug:'detective-comics', title:'Detective Comics', rank:11 },
  { slug:'wolverine', title:'Wolverine', rank:12 },
  { slug:'daredevil', title:'Daredevil', rank:13 },
  { slug:'fantastic-four', title:'Fantastic Four', rank:14 },
  { slug:'avengers', title:'Avengers', rank:15 },
  { slug:'flash', title:'The Flash', rank:16 },
  { slug:'green-lantern', title:'Green Lantern', rank:17 },
  { slug:'deadpool', title:'Deadpool', rank:18 },
  { slug:'venom', title:'Venom', rank:19 },
  { slug:'aquaman', title:'Aquaman', rank:20 },
  { slug:'captain-marvel', title:'Captain Marvel', rank:21 },
  { slug:'black-panther', title:'Black Panther', rank:22 },
  { slug:'doctor-strange', title:'Doctor Strange', rank:23 },
  { slug:'punisher', title:'The Punisher', rank:24 },
  { slug:'green-arrow', title:'Green Arrow', rank:25 },
  { slug:'uncanny-x-men', title:'Uncanny X-Men', rank:26 },
  { slug:'ultimate-spider-man', title:'Ultimate Spider-Man', rank:27 },
  { slug:'batman-dark-knight-returns', title:'Dark Knight Returns', rank:28 },
  { slug:'batman-long-halloween', title:'Batman: Long Halloween', rank:29 },
  { slug:'catwoman', title:'Catwoman', rank:30 },
  { slug:'nightwing', title:'Nightwing', rank:31 },
  { slug:'harley-quinn', title:'Harley Quinn', rank:32 },
  { slug:'black-widow', title:'Black Widow', rank:33 },
  { slug:'hawkeye', title:'Hawkeye', rank:34 },
  { slug:'mighty-thor', title:'Mighty Thor', rank:35 },
  { slug:'new-avengers', title:'New Avengers', rank:36 },
  { slug:'web-of-spider-man', title:'Web of Spider-Man', rank:37 },
  { slug:'spectacular-spider-man', title:'Spectacular Spider-Man', rank:38 },
  { slug:'action-comics', title:'Action Comics', rank:39 },
  { slug:'teen-titans', title:'Teen Titans', rank:40 },
  { slug:'justice-league', title:'Justice League', rank:41 },
  { slug:'new-mutants', title:'New Mutants', rank:42 },
  { slug:'x-force', title:'X-Force', rank:43 },
  { slug:'robin', title:'Robin', rank:44 },
  { slug:'batgirl', title:'Batgirl', rank:45 },
  { slug:'guardians-of-the-galaxy', title:'Guardians of the Galaxy', rank:46 },
  { slug:'silver-surfer', title:'Silver Surfer', rank:47 },
  { slug:'thanos', title:'Thanos', rank:48 },
  { slug:'doctor-doom', title:'Doctor Doom', rank:49 },
  { slug:'loki', title:'Loki', rank:50 },
  { slug:'nova', title:'Nova', rank:51 },
  { slug:'moon-knight', title:'Moon Knight', rank:52 },
  { slug:'scarlet-witch', title:'Scarlet Witch', rank:53 },
  { slug:'vision', title:'The Vision', rank:54 },
  { slug:'she-hulk', title:'She-Hulk', rank:55 },
  { slug:'ms-marvel', title:'Ms. Marvel', rank:56 },
  { slug:'black-cat', title:'Black Cat', rank:57 },
  { slug:'ghost-rider', title:'Ghost Rider', rank:58 },
  { slug:'blade', title:'Blade', rank:59 },
  { slug:'dazzler', title:'Dazzler', rank:60 },
  { slug:'batman-shadow-of-the-bat', title:'Batman: Shadow of the Bat', rank:61 },
  { slug:'superman-man-of-steel', title:'Superman: Man of Steel', rank:62 },
  { slug:'justice-league-america', title:'Justice League America', rank:63 },
  { slug:'wonder-woman-1987', title:'Wonder Woman (1987)', rank:64 },
  { slug:'green-lantern-1990', title:'Green Lantern (1990)', rank:65 },
  { slug:'flash-1987', title:'Flash (1987)', rank:66 },
  { slug:'aquaman-1994', title:'Aquaman (1994)', rank:67 },
  { slug:'batman-legends-of-the-dark-knight', title:'Legends of the Dark Knight', rank:68 },
  { slug:'west-coast-avengers', title:'West Coast Avengers', rank:69 },
  { slug:'alpha-flight', title:'Alpha Flight', rank:70 },
  { slug:'excalibur', title:'Excalibur', rank:71 },
  { slug:'x-factor', title:'X-Factor', rank:72 },
  { slug:'x-calibre', title:'Wolverine (1988)', rank:73 },
  { slug:'wolverine', title:'Wolverine', rank:73 },
  { slug:'cable', title:'Cable', rank:74 },
  { slug:'generation-x', title:'Generation X', rank:75 },
  { slug:'iron-fist', title:'Iron Fist', rank:76 },
  { slug:'luke-cage-hero-for-hire', title:'Luke Cage, Hero for Hire', rank:77 },
  { slug:'power-man-and-iron-fist', title:'Power Man and Iron Fist', rank:78 },
  { slug:'conan-the-barbarian', title:'Conan the Barbarian', rank:79 },
  { slug:'star-wars-1977', title:'Star Wars (1977)', rank:80 },
  { slug:'spawn', title:'Spawn', rank:81 },
  { slug:'bone', title:'Bone', rank:82 },
  { slug:'sandman', title:'Sandman', rank:83 },
  { slug:'watchmen', title:'Watchmen', rank:84 },
  { slug:'v-for-vendetta', title:'V for Vendetta', rank:85 },
  { slug:'batman-killing-joke', title:'Batman: Killing Joke', rank:86 },
  { slug:'marvels', title:'Marvels', rank:87 },
  { slug:'kingdom-come', title:'Kingdom Come', rank:88 },
  { slug:'crisis-on-infinite-earths', title:'Crisis on Infinite Earths', rank:89 },
  { slug:'secret-wars', title:'Secret Wars', rank:90 },
  { slug:'infinity-gauntlet', title:'Infinity Gauntlet', rank:91 },
  { slug:'civil-war', title:'Civil War', rank:92 },
  { slug:'house-of-m', title:'House of M', rank:93 },
  { slug:'annihilation', title:'Annihilation', rank:94 },
  { slug:'all-star-batman-robin-the-boy-wonder', title:'All Star Batman & Robin', rank:95 },
  { slug:'batman-gotham-knights', title:'Batman: Gotham Knights', rank:96 },
  { slug:'batman-chronicles', title:'Batman Chronicles', rank:97 },
  { slug:'adventures-into-the-unknown', title:'Adventures Into the Unknown', rank:98 },
  { slug:'amazing-fantasy', title:'Amazing Fantasy', rank:99 },
  { slug:'tales-of-suspense', title:'Tales of Suspense', rank:100 },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Blog de Portadas de Comics — Top 100',
  description: '450,000+ portadas de comics. El archivo más completo en español.',
  url: `${BASE_URL}/blog`,
  publisher: { '@type': 'Organization', name: 'La Tienda de Comics', url: BASE_URL },
};

export default function BlogPage({ searchParams }: { searchParams: { q?: string; filter?: string } }) {
  const query = searchParams.q || '';
  const filter = searchParams.filter || 'all';
  const filtered = query
    ? TOP100.filter(i => i.title.toLowerCase().includes(query.toLowerCase()) || i.slug.includes(query.toLowerCase()))
    : TOP100;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <style>{`
        .cover-card{border-radius:8px;overflow:hidden;border:1px solid rgba(0,0,0,.1);background:#f9f9f9;text-decoration:none;display:block;transition:border-color .2s,box-shadow .2s}
        .cover-card:hover{border-color:#CC0000;box-shadow:0 4px 12px rgba(204,0,0,.15)}
        .nav-pill{font-size:12px;font-weight:600;padding:5px 12px;border-radius:8px;text-decoration:none;white-space:nowrap;transition:opacity .15s}
        .nav-pill:hover{opacity:.8}
        .filter-tab{padding:10px 14px;font-size:13px;font-weight:500;text-decoration:none;color:#888;border-bottom:2px solid transparent;white-space:nowrap;transition:color .15s}
        .filter-tab:hover{color:#333}
        .filter-tab-active{color:#CC0000!important;border-bottom-color:#CC0000!important}
        @media(max-width:600px){.stats-row{gap:12px!important}}
      `}</style>

      <div style={{ minHeight:'100vh', background:'#fff' }}>

        {/* TOP NAV */}
        <nav style={{ background:'#0D0D0D', position:'sticky', top:0, zIndex:50, borderBottom:'1px solid #222' }}>
          <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 16px', height:52, display:'flex', alignItems:'center', gap:10 }}>
            <a href="/" style={{ flexShrink:0 }}>
              <img src="/logo.webp" alt="La Tienda de Comics" style={{ height:28, objectFit:'contain', display:'block' }} />
            </a>
            <span style={{ color:'rgba(255,255,255,.3)', fontSize:12 }}>›</span>
            <span style={{ color:'#CC0000', fontSize:13, fontWeight:700 }}>📰 Blog de Portadas</span>
            <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center' }}>
              <a href="/personajes" className="nav-pill" style={{ color:'#fff', background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.1)' }}>🦸 Personajes</a>
              <a href="/universo" className="nav-pill" style={{ color:'#fff', background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.1)' }}>🤖 Jarvis IA</a>
              <a href="/catalogo" className="nav-pill" style={{ color:'#fff', background:'#CC0000' }}>Ver Catálogo</a>
            </div>
          </div>
        </nav>

        {/* HERO */}
        <div style={{ background:'linear-gradient(180deg,#1a0000 0%,#0D0D0D 60%,#111 100%)', padding:'36px 16px 28px', textAlign:'center' }}>
          <h1 style={{ fontFamily:'Oswald,sans-serif', fontSize:'clamp(26px,5vw,50px)', fontWeight:700, letterSpacing:2, color:'#fff', margin:'0 0 8px' }}>
            📰 Blog de <span style={{ color:'#CC0000' }}>Portadas</span>
          </h1>
          <p style={{ color:'rgba(255,255,255,.5)', fontSize:'clamp(13px,2vw,15px)', margin:'0 0 20px' }}>
            450,000+ portadas de comics • El archivo más completo en español
          </p>
          <form action="/blog" method="GET" style={{ maxWidth:480, margin:'0 auto 20px', display:'flex', gap:8 }}>
            <input name="q" defaultValue={query} placeholder="Buscar serie (ej: Batman, X-Men...)"
              style={{ flex:1, padding:'10px 16px', borderRadius:10, border:'1px solid rgba(255,255,255,.2)', background:'rgba(255,255,255,.1)', color:'#fff', fontSize:14, outline:'none' }} />
            <button type="submit" style={{ background:'#CC0000', border:'none', borderRadius:10, padding:'10px 18px', color:'#fff', cursor:'pointer', fontSize:14, fontWeight:700 }}>→</button>
          </form>
          <div className="stats-row" style={{ display:'flex', gap:20, justifyContent:'center', flexWrap:'wrap' }}>
            {[['450K+','Portadas'],['6,000+','Series'],['80+','Años'],['100','Top Personajes']].map(([n,l]) => (
              <div key={l} style={{ textAlign:'center' }}>
                <div style={{ fontFamily:'Oswald,sans-serif', fontSize:20, fontWeight:700, color:'#CC0000' }}>{n}</div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:1 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FILTER TABS */}
        <div style={{ borderBottom:'1px solid #eee', overflowX:'auto', background:'#fafafa' }}>
          <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 16px', display:'flex', minWidth:'max-content' }}>
            {[['all','Todos'],['marvel','Marvel'],['dc','DC Comics'],['manga','Manga'],['clasicos','Clásicos']].map(([val,label]) => (
              <a key={val} href={`/blog?filter=${val}${query?`&q=${query}`:''}`}
                className={`filter-tab${filter===val?' filter-tab-active':''}`}>{label}</a>
            ))}
          </div>
        </div>

        {/* TOP 100 GRID */}
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'24px 16px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
            <h2 style={{ fontFamily:'Oswald,sans-serif', fontSize:22, color:'#111', margin:0 }}>
              {query ? `Resultados: "${query}"` : '🏆 Top 100 Personajes'}
            </h2>
            <span style={{ background:'#CC0000', color:'#fff', fontSize:10, padding:'2px 8px', borderRadius:10, fontWeight:700 }}>
              {filtered.length} series
            </span>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))', gap:10 }}>
            {filtered.map(item => (
              <a key={item.slug+item.rank} href={`/blog/covers/${item.slug}`} className="cover-card">
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', top:4, left:4, background:'rgba(0,0,0,.7)', color:'#CC0000', fontSize:9, fontWeight:700, padding:'2px 5px', borderRadius:4, zIndex:2 }}>
                    #{item.rank}
                  </span>
                  <img
                    src={`https://www.coverbrowser.com/image/${item.slug}/1-1.jpg`}
                    alt={`${item.title} portada comics`}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    style={{ width:'100%', aspectRatio:'2/3', objectFit:'cover', display:'block', background:'#ddd' }}
                  />
                </div>
                <div style={{ padding:'6px 8px' }}>
                  <div style={{ fontSize:11, fontWeight:600, color:'#111', lineHeight:1.3, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                    {item.title}
                  </div>
                </div>
              </a>
            ))}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign:'center', padding:'48px 0', color:'#999' }}>
              <div style={{ fontSize:40, marginBottom:8 }}>🔍</div>
              No se encontraron series para "{query}".
              <br /><a href="/blog" style={{ color:'#CC0000', textDecoration:'none', marginTop:8, display:'inline-block' }}>Ver todo →</a>
            </div>
          )}
        </div>

        {/* JARVIS STICKY */}
        <div style={{ position:'sticky', bottom:0, background:'rgba(13,13,13,.97)', backdropFilter:'blur(12px)', borderTop:'1px solid #222', padding:'10px 16px', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <span style={{ fontSize:22 }}>🤖</span>
          <span style={{ flex:1, fontSize:12, color:'rgba(255,255,255,.6)', minWidth:120 }}>
            <b style={{ color:'#fff' }}>Jarvis IA:</b> ¿Buscas un cómic? Te ayudo a encontrarlo.
          </span>
          <a href="/universo" style={{ border:'1px solid rgba(255,255,255,.2)', color:'rgba(255,255,255,.7)', borderRadius:6, padding:'6px 12px', fontSize:12, textDecoration:'none' }}>Preguntarle a Jarvis</a>
          <a href="/catalogo" style={{ background:'#CC0000', color:'#fff', borderRadius:6, padding:'6px 12px', fontSize:12, textDecoration:'none', fontWeight:600 }}>Ver Catálogo</a>
          <a href="/" style={{ color:'rgba(255,255,255,.4)', fontSize:12, textDecoration:'none' }}>Inicio</a>
        </div>
      </div>
    </>
  );
}
