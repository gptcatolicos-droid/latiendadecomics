import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://latiendadecomics.onrender.com';

export const metadata: Metadata = {
  title: 'Blog de Portadas de Comics — Top 100 Personajes | La Tienda de Comics',
  description: 'Galería completa de portadas de comics. Batman, Spider-Man, X-Men, Superman y más de 450,000 portadas. El archivo de covers más completo en español.',
  keywords: ['portadas comics','covers comics','batman covers','spider-man covers','galeria comics','mejores portadas comics'],
  openGraph: { title:'Blog de Portadas de Comics', description:'450,000+ portadas de comics.', url:`${BASE_URL}/blog`, images:[{url:`${BASE_URL}/logo.webp`}] },
  alternates: { canonical:`${BASE_URL}/blog` },
};

const TOP100 = [
  {slug:'batman',title:'Batman',rank:1},{slug:'amazing-spider-man',title:'Amazing Spider-Man',rank:2},
  {slug:'superman',title:'Superman',rank:3},{slug:'x-men',title:'X-Men',rank:4},
  {slug:'wonder-woman',title:'Wonder Woman',rank:5},{slug:'iron-man',title:'Iron Man',rank:6},
  {slug:'thor',title:'Thor',rank:7},{slug:'incredible-hulk',title:'Incredible Hulk',rank:8},
  {slug:'captain-america',title:'Captain America',rank:9},{slug:'spider-man',title:'Spider-Man',rank:10},
  {slug:'detective-comics',title:'Detective Comics',rank:11},{slug:'wolverine',title:'Wolverine',rank:12},
  {slug:'daredevil',title:'Daredevil',rank:13},{slug:'fantastic-four',title:'Fantastic Four',rank:14},
  {slug:'avengers',title:'Avengers',rank:15},{slug:'flash',title:'The Flash',rank:16},
  {slug:'green-lantern',title:'Green Lantern',rank:17},{slug:'deadpool',title:'Deadpool',rank:18},
  {slug:'venom',title:'Venom',rank:19},{slug:'aquaman',title:'Aquaman',rank:20},
  {slug:'captain-marvel',title:'Captain Marvel',rank:21},{slug:'black-panther',title:'Black Panther',rank:22},
  {slug:'doctor-strange',title:'Doctor Strange',rank:23},{slug:'punisher',title:'The Punisher',rank:24},
  {slug:'green-arrow',title:'Green Arrow',rank:25},{slug:'uncanny-x-men',title:'Uncanny X-Men',rank:26},
  {slug:'ultimate-spider-man',title:'Ultimate Spider-Man',rank:27},{slug:'batman-dark-knight-returns',title:'Dark Knight Returns',rank:28},
  {slug:'batman-long-halloween',title:'Batman: Long Halloween',rank:29},{slug:'catwoman',title:'Catwoman',rank:30},
  {slug:'nightwing',title:'Nightwing',rank:31},{slug:'harley-quinn',title:'Harley Quinn',rank:32},
  {slug:'black-widow',title:'Black Widow',rank:33},{slug:'hawkeye',title:'Hawkeye',rank:34},
  {slug:'mighty-thor',title:'Mighty Thor',rank:35},{slug:'new-avengers',title:'New Avengers',rank:36},
  {slug:'web-of-spider-man',title:'Web of Spider-Man',rank:37},{slug:'spectacular-spider-man',title:'Spectacular Spider-Man',rank:38},
  {slug:'action-comics',title:'Action Comics',rank:39},{slug:'teen-titans',title:'Teen Titans',rank:40},
  {slug:'justice-league',title:'Justice League',rank:41},{slug:'new-mutants',title:'New Mutants',rank:42},
  {slug:'x-force',title:'X-Force',rank:43},{slug:'robin',title:'Robin',rank:44},
  {slug:'batgirl',title:'Batgirl',rank:45},{slug:'guardians-of-the-galaxy',title:'Guardians of the Galaxy',rank:46},
  {slug:'silver-surfer',title:'Silver Surfer',rank:47},{slug:'thanos',title:'Thanos',rank:48},
  {slug:'doctor-doom',title:'Doctor Doom',rank:49},{slug:'loki',title:'Loki',rank:50},
  {slug:'nova',title:'Nova',rank:51},{slug:'moon-knight',title:'Moon Knight',rank:52},
  {slug:'ghost-rider',title:'Ghost Rider',rank:53},{slug:'blade',title:'Blade',rank:54},
  {slug:'spawn',title:'Spawn',rank:55},{slug:'sandman',title:'Sandman',rank:56},
  {slug:'watchmen',title:'Watchmen',rank:57},{slug:'infinity-gauntlet',title:'Infinity Gauntlet',rank:58},
  {slug:'civil-war',title:'Civil War',rank:59},{slug:'secret-wars',title:'Secret Wars',rank:60},
  {slug:'house-of-m',title:'House of M',rank:61},{slug:'annihilation',title:'Annihilation',rank:62},
  {slug:'alpha-flight',title:'Alpha Flight',rank:63},{slug:'excalibur',title:'Excalibur',rank:64},
  {slug:'x-factor',title:'X-Factor',rank:65},{slug:'cable',title:'Cable',rank:66},
  {slug:'generation-x',title:'Generation X',rank:67},{slug:'iron-fist',title:'Iron Fist',rank:68},
  {slug:'conan-the-barbarian',title:'Conan the Barbarian',rank:69},{slug:'star-wars-1977',title:'Star Wars (1977)',rank:70},
  {slug:'batman-shadow-of-the-bat',title:'Batman: Shadow of the Bat',rank:71},{slug:'batman-legends-of-the-dark-knight',title:'Legends Dark Knight',rank:72},
  {slug:'batman-chronicles',title:'Batman Chronicles',rank:73},{slug:'batman-gotham-knights',title:'Batman: Gotham Knights',rank:74},
  {slug:'all-star-batman-robin-the-boy-wonder',title:'All Star Batman & Robin',rank:75},
  {slug:'west-coast-avengers',title:'West Coast Avengers',rank:76},{slug:'peter-parker-the-spectacular-spider-man',title:'Peter Parker Spider-Man',rank:77},
  {slug:'amazing-fantasy',title:'Amazing Fantasy',rank:78},{slug:'tales-of-suspense',title:'Tales of Suspense',rank:79},
  {slug:'adventures-into-the-unknown',title:'Adventures Into the Unknown',rank:80},
  {slug:'kingdom-come',title:'Kingdom Come',rank:81},{slug:'marvels',title:'Marvels',rank:82},
  {slug:'crisis-on-infinite-earths',title:'Crisis on Infinite Earths',rank:83},{slug:'justice-league-america',title:'Justice League America',rank:84},
  {slug:'wonder-woman-1987',title:'Wonder Woman (1987)',rank:85},{slug:'green-lantern-1990',title:'Green Lantern (1990)',rank:86},
  {slug:'flash-1987',title:'Flash (1987)',rank:87},{slug:'aquaman-1994',title:'Aquaman (1994)',rank:88},
  {slug:'superman-man-of-steel',title:'Superman: Man of Steel',rank:89},{slug:'a-next',title:'A-Next',rank:90},
  {slug:'batgirl',title:'Batgirl Adventures',rank:91},{slug:'robin-ii',title:'Robin II',rank:92},
  {slug:'scarlet-witch',title:'Scarlet Witch',rank:93},{slug:'she-hulk',title:'She-Hulk',rank:94},
  {slug:'ms-marvel',title:'Ms. Marvel',rank:95},{slug:'black-cat',title:'Black Cat',rank:96},
  {slug:'vision',title:'The Vision',rank:97},{slug:'dazzler',title:'Dazzler',rank:98},
  {slug:'power-man-and-iron-fist',title:'Power Man and Iron Fist',rank:99},{slug:'luke-cage-hero-for-hire',title:'Luke Cage Hero for Hire',rank:100},
];

const FILTERS = [['all','Todo'],['marvel','Marvel'],['dc','DC Comics'],['manga','Manga'],['clasicos','Clásicos']];

const MARVEL_SLUGS = new Set(['amazing-spider-man','spider-man','x-men','iron-man','thor','incredible-hulk','captain-america','wolverine','daredevil','fantastic-four','avengers','deadpool','venom','captain-marvel','black-panther','doctor-strange','punisher','uncanny-x-men','ultimate-spider-man','black-widow','hawkeye','mighty-thor','new-avengers','web-of-spider-man','spectacular-spider-man','new-mutants','x-force','guardians-of-the-galaxy','silver-surfer','thanos','doctor-doom','loki','nova','moon-knight','ghost-rider','blade','spawn','infinity-gauntlet','civil-war','secret-wars','house-of-m','annihilation','alpha-flight','excalibur','x-factor','cable','generation-x','iron-fist','conan-the-barbarian','star-wars-1977','west-coast-avengers','peter-parker-the-spectacular-spider-man','amazing-fantasy','tales-of-suspense','kingdom-come','marvels','a-next','scarlet-witch','she-hulk','ms-marvel','black-cat','vision','dazzler','power-man-and-iron-fist','luke-cage-hero-for-hire']);
const DC_SLUGS = new Set(['batman','superman','wonder-woman','detective-comics','flash','green-lantern','aquaman','catwoman','nightwing','harley-quinn','action-comics','teen-titans','justice-league','robin','batgirl','batman-dark-knight-returns','batman-long-halloween','batman-shadow-of-the-bat','batman-legends-of-the-dark-knight','batman-chronicles','batman-gotham-knights','all-star-batman-robin-the-boy-wonder','crisis-on-infinite-earths','justice-league-america','wonder-woman-1987','green-lantern-1990','flash-1987','aquaman-1994','superman-man-of-steel','robin-ii']);

export default function BlogPage({ searchParams }: { searchParams: { q?: string; filter?: string } }) {
  const q = searchParams.q || '';
  const filter = searchParams.filter || 'all';

  const filtered = TOP100.filter(item => {
    const matchQ = !q || item.title.toLowerCase().includes(q.toLowerCase()) || item.slug.includes(q.toLowerCase());
    const matchF = filter === 'all' ||
      (filter === 'marvel' && MARVEL_SLUGS.has(item.slug)) ||
      (filter === 'dc' && DC_SLUGS.has(item.slug));
    return matchQ && matchF;
  });

  const jsonLd = { '@context':'https://schema.org', '@type':'CollectionPage', name:'Blog de Portadas de Comics — Top 100', description:'450,000+ portadas de comics. El archivo más completo en español.', url:`${BASE_URL}/blog` };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <style>{`
        .blog-card{background:white;border-radius:14px;overflow:hidden;text-decoration:none;border:1px solid #ebebeb;display:block;transition:box-shadow .15s}
        .blog-card:hover{box-shadow:0 6px 20px rgba(0,0,0,.1)}
        .nav-btn-blk{font-size:12px;font-weight:600;color:#fff;padding:5px 10px;border-radius:8px;text-decoration:none;background:#0D0D0D;white-space:nowrap}
        .nav-btn-red{font-size:12px;font-weight:600;color:#fff;padding:5px 12px;border-radius:8px;text-decoration:none;background:#CC0000;white-space:nowrap}
        .filter-btn{padding:9px 16px;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;border:1px solid #e0e0e0;font-family:inherit;transition:all .15s}
        .filter-btn:hover{border-color:#CC0000}
      `}</style>

      <div style={{ minHeight:'100vh', background:'#f7f7f7' }}>

        {/* NAV — same as catalog */}
        <nav style={{ background:'#0D0D0D', position:'sticky', top:0, zIndex:50 }}>
          <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 20px', height:56, display:'flex', alignItems:'center', gap:12 }}>
            <a href="/" style={{ textDecoration:'none', flexShrink:0 }}>
              <img src="/logo.webp" alt="La Tienda de Comics" style={{ height:36, objectFit:'contain' }} />
            </a>
            <div style={{ flex:1, display:'flex', gap:8, alignItems:'center' }}>
              <a href="/personajes" className="nav-btn-blk">Personajes</a>
              <a href="/comicsIA" className="nav-btn-blk">Comics IA</a>
            </div>
            <a href="/catalogo" className="nav-btn-red">Ver Catálogo</a>
          </div>
        </nav>

        <div style={{ maxWidth:1200, margin:'0 auto', padding:'24px 20px' }}>
          {/* Header */}
          <div style={{ marginBottom:20 }}>
            <h1 style={{ fontSize:26, fontWeight:700, color:'#111', marginBottom:4 }}>Blog de Portadas</h1>
            <p style={{ fontSize:13, color:'#888' }}>{filtered.length} series · Top 100 personajes más buscados</p>
          </div>

          {/* Search + filters — same style as catalog */}
          <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
            <form action="/blog" method="GET" style={{ flex:1, minWidth:200, display:'flex', gap:8 }}>
              <input name="q" defaultValue={q} placeholder="Buscar serie o personaje..."
                style={{ flex:1, padding:'10px 14px', border:'1px solid #e0e0e0', borderRadius:10, fontSize:14, fontFamily:'inherit', outline:'none', background:'white' }} />
              {filter !== 'all' && <input type="hidden" name="filter" value={filter} />}
            </form>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {FILTERS.map(([val, label]) => (
                <a key={val} href={`/blog?filter=${val}${q?`&q=${q}`:''}`}
                  className="filter-btn"
                  style={{ background: filter===val ? '#CC0000' : 'white', color: filter===val ? 'white' : '#555', textDecoration:'none', display:'inline-block', padding:'9px 16px', borderRadius:10, fontSize:13, fontWeight:600, border:`1px solid ${filter===val?'#CC0000':'#e0e0e0'}` }}>
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* Grid — same as catalog */}
          {filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:60, color:'#aaa' }}>No se encontraron series para "{q}".</div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:16 }}>
              {filtered.map(item => (
                <a key={item.slug+item.rank} href={`/blog/covers/${item.slug}`} className="blog-card">
                  <div style={{ aspectRatio:'2/3', background:'#f5f5f5', overflow:'hidden', position:'relative' }}>
                    <span style={{ position:'absolute', top:8, left:8, background:'rgba(0,0,0,.7)', color:'#CC0000', fontSize:10, fontWeight:700, padding:'3px 7px', borderRadius:5, zIndex:2 }}>
                      #{item.rank}
                    </span>
                    <img
                      src={`https://www.coverbrowser.com/image/${item.slug}/1-1.jpg`}
                      alt={`${item.title} portadas comics`}
                      loading="lazy" referrerPolicy="no-referrer"
                      style={{ width:'100%', height:'100%', objectFit:'cover' }}
                    />
                  </div>
                  <div style={{ padding:'10px 12px 14px' }}>
                    <div style={{ fontSize:12, fontWeight:600, color:'#222', lineHeight:1.35, marginBottom:4, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize:11, color:'#aaa' }}>Ver portadas →</div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* JARVIS sticky bar */}
        <div style={{ position:'sticky', bottom:0, background:'rgba(13,13,13,.97)', backdropFilter:'blur(8px)', borderTop:'1px solid #222', padding:'10px 16px', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <span style={{ fontSize:18 }}>🤖</span>
          <span style={{ flex:1, fontSize:12, color:'rgba(255,255,255,.6)', minWidth:120 }}>
            <b style={{ color:'#fff' }}>Jarvis IA:</b> ¿Buscas un cómic? Te ayudo a encontrarlo.
          </span>
          <a href="/comicsIA" style={{ background:'#0D0D0D', color:'#fff', borderRadius:6, padding:'6px 12px', fontSize:12, textDecoration:'none', border:'1px solid rgba(255,255,255,.2)' }}>Preguntarle a Jarvis</a>
          <a href="/catalogo" style={{ background:'#CC0000', color:'#fff', borderRadius:6, padding:'6px 12px', fontSize:12, textDecoration:'none', fontWeight:600 }}>Ver Catálogo</a>
          <a href="/" style={{ color:'rgba(255,255,255,.4)', fontSize:12, textDecoration:'none' }}>Inicio</a>
        </div>
      </div>
    </>
  );
}
