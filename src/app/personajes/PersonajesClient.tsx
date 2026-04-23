'use client';
import { useState, useMemo } from 'react';
import { CHARACTERS } from '@/lib/characters-data';
import SiteNav from '@/components/SiteNav';


// Extended lists beyond the 35 in characters-data — linked to their profiles
const MARVEL_EXTENDED = [
  'Spider-Man','Iron Man','Captain America','Thor','Hulk','Wolverine','Black Widow',
  'Doctor Strange','Black Panther','Deadpool','Thanos','Venom','Magneto','Doctor Doom',
  'Loki','Punisher','Scarlet Witch','Captain Marvel','Hawkeye','Daredevil','Green Goblin',
  'Fantastic Four','Mr. Fantastic','Invisible Woman','Human Torch','The Thing',
  'Avengers','X-Men','Cyclops','Jean Grey','Beast','Angel','Iceman','Storm','Rogue',
  'Gambit','Nightcrawler','Colossus','Jubilee','Professor X','Mystique','Sabretooth',
  'Silver Surfer','Galactus','Ultron','Red Skull','MODOK','Absorbing Man','Juggernaut',
  'Kingpin','Electro','Sandman','Vulture','Mysterio','Rhino','Scorpion','Lizard',
  'Nova','Moon Knight','Ghost Rider','Blade','Jessica Jones','Luke Cage','Iron Fist',
  'Ms. Marvel','She-Hulk','Vision','Scarlet Spider','Spider-Gwen','Miles Morales',
  'Falcon','War Machine','Rescue (Pepper Potts)','Wasp','Ant-Man','Quicksilver',
  'Polaris','Havok','Bishop','Cable','Domino','Psylocke','Angel Archangel',
  'Carnage','Anti-Venom','Symbiote Spider-Man','Spider-Man 2099','Spider-Woman',
  'Howard the Duck','Rocket Raccoon','Groot','Drax','Star-Lord','Nebula','Gamora',
  'Nick Fury','Agent Phil Coulson','Maria Hill','Black Knight','Captain Britain',
  'Shang-Chi','America Chavez','Kate Bishop','Yelena Belova','Echo','Dazzler',
];

const DC_EXTENDED = [
  'Batman','Superman','Wonder Woman','The Flash','Green Lantern','Aquaman','Cyborg',
  'Joker','Harley Quinn','Lex Luthor','Catwoman','Nightwing','Deathstroke','Poison Ivy',
  'Bane','Green Arrow','Black Adam','Shazam','Robin','Batgirl','Red Hood','Oracle',
  'Batwoman','Supergirl','Superboy','Power Girl','Huntress','Black Canary',
  'Zatanna','Constantine','Swamp Thing','Animal Man','Deadman','Phantom Stranger',
  'Spectre','Doctor Fate','Hawkman','Hawkgirl','Atom','Elongated Man',
  'Plastic Man','Blue Beetle','Booster Gold','Firestorm','Martian Manhunter',
  'John Stewart','Guy Gardner','Kyle Rayner','Jessica Cruz','Simon Baz','Alan Scott',
  'Barry Allen','Wally West','Jay Garrick','Bart Allen','Zoom','Reverse-Flash','Captain Cold',
  'Gorilla Grodd','Mirror Master','Trickster','Weather Wizard','Heatwave',
  'Two-Face','Riddler','Scarecrow','Mr. Freeze','Ra\'s al Ghul','Talia al Ghul',
  'Penguin','Hugo Strange','Killer Croc','Man-Bat','Clayface','Poison Ivy',
  'Sinestro','Parallax','Black Hand','Star Sapphire','Larfleeze','Atrocitus',
  'Black Manta','Ocean Master','Mera','Darkseid','Parademon','Granny Goodness',
  'Steppenwolf','Desaad','Big Barda','Mister Miracle','New Gods',
  'Brainiac','Doomsday','Parasite','Metallo','Bizarro','General Zod','Faora',
  'Vandal Savage','Ocean Master','Cheetah','Ares','Circe','Maxwell Lord',
  'Amanda Waller','Deadshot','Captain Boomerang','Enchantress','King Shark',
];

export default function PersonajesClient() {
  const [activeTab, setActiveTab] = useState<'marvel'|'dc'>('marvel');
  const [search, setSearch] = useState('');

  // Characters with profiles (from characters-data)
  const profiledChars = useMemo(() =>
    CHARACTERS.filter(c => c.universe === activeTab), [activeTab]);

  // Full list for the current tab
  const fullList = activeTab === 'marvel' ? MARVEL_EXTENDED : DC_EXTENDED;

  const filteredList = search
    ? fullList.filter(n => n.toLowerCase().includes(search.toLowerCase()))
    : fullList;

  const filteredProfiled = search
    ? profiledChars.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.realName.toLowerCase().includes(search.toLowerCase()))
    : profiledChars;

  // Build slug lookup for profiled characters
  const slugMap: Record<string, string> = {};
  CHARACTERS.forEach(c => { slugMap[c.name] = c.slug; });

  return (
    <div style={{ minHeight:'100vh', background:'var(--site-bg,#F5F0E6)' }}>

      {/* NAV */}
      <nav style={{ background:'#0D0D0D', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 20px', height:56, display:'flex', alignItems:'center', gap:12 }}>
          <a href="/" style={{ textDecoration:'none', flexShrink:0 }}>
            <img src="/logo.webp" alt="La Tienda de Comics" style={{ height:36, objectFit:'contain' }} />
          </a>
          <div style={{ flex:1, display:'flex', gap:8 }}>
            <a href="/blog" style={{ fontSize:12, fontWeight:600, color:'#fff', padding:'5px 10px', borderRadius:8, textDecoration:'none', background:'#0D0D0D', border:'1px solid rgba(255,255,255,.2)', whiteSpace:'nowrap' }}>Blog Portadas</a>
            <a href="/comicsIA" style={{ fontSize:12, fontWeight:600, color:'#fff', padding:'5px 10px', borderRadius:8, textDecoration:'none', background:'#0D0D0D', border:'1px solid rgba(255,255,255,.2)', whiteSpace:'nowrap' }}>Comics IA</a>
          </div>
          <a href="/catalogo" style={{ fontSize:12, fontWeight:600, color:'#fff', padding:'5px 12px', borderRadius:8, textDecoration:'none', background:'#CC0000', whiteSpace:'nowrap' }}>Ver Catálogo</a>
        </div>
      </nav>

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'24px 20px' }}>
        {/* Header */}
        <div style={{ marginBottom:20 }}>
          <h1 style={{ fontSize:26, fontWeight:700, color:'#111', marginBottom:4 }}>Directorio de Personajes</h1>
          <p style={{ fontSize:13, color:'#888' }}>Marvel Comics y DC Comics — perfiles, poderes, historia y portadas</p>
        </div>

        {/* Tab + Search */}
        <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={() => setActiveTab('marvel')}
              style={{ padding:'10px 20px', background: activeTab==='marvel'?'#CC0000':'white', color: activeTab==='marvel'?'white':'#555', border:'1px solid #e0e0e0', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              Marvel Comics
            </button>
            <button onClick={() => setActiveTab('dc')}
              style={{ padding:'10px 20px', background: activeTab==='dc'?'#0476D0':'white', color: activeTab==='dc'?'white':'#555', border:'1px solid #e0e0e0', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              DC Comics
            </button>
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar personaje..."
            style={{ flex:1, minWidth:180, padding:'10px 14px', border:'1px solid #e0e0e0', borderRadius:10, fontSize:14, fontFamily:'inherit', outline:'none', background:'white' }}
          />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) 280px', gap:24, alignItems:'start' }}>

          {/* LEFT — Character cards with profile photo */}
          <div>
            <h2 style={{ fontSize:16, fontWeight:700, color:'#111', marginBottom:14 }}>
              Con perfil completo
              <span style={{ fontSize:12, fontWeight:400, color:'#aaa', marginLeft:8 }}>{filteredProfiled.length} personajes</span>
            </h2>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:14, marginBottom:32 }}>
              {filteredProfiled.map(char => {
                const uniBg = char.universe==='marvel'?'#CC0000':'#0476D0';
                const alignColor = char.alignment==='hero'?'#2563eb':char.alignment==='villain'?'#CC0000':'#d97706';
                return (
                  <a key={char.slug} href={`/personajes/${char.universe}/${char.slug}`}
                    style={{ background:'white', borderRadius:14, overflow:'hidden', textDecoration:'none', border:'1px solid #ebebeb', display:'block', transition:'box-shadow .15s' }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow='0 6px 20px rgba(0,0,0,.1)')}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow='none')}
                  >
                    <div style={{ aspectRatio:'3/4', background:'#f5f5f5', overflow:'hidden', position:'relative' }}>
                      <img src={char.imageUrl} alt={`${char.name} — ${char.realName}`}
                        loading="lazy" referrerPolicy="no-referrer"
                        style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'top' }} />
                      <span style={{ position:'absolute', top:6, right:6, background:uniBg, color:'#fff', fontSize:8, fontWeight:700, padding:'2px 5px', borderRadius:4 }}>
                        {char.universe==='marvel'?'MARVEL':'DC'}
                      </span>
                      <span style={{ position:'absolute', bottom:6, left:6, background:alignColor+'dd', color:'#fff', fontSize:8, padding:'2px 5px', borderRadius:4 }}>
                        {char.alignment==='hero'?'Héroe':char.alignment==='villain'?'Villano':'Antihéroe'}
                      </span>
                    </div>
                    <div style={{ padding:'10px 12px 12px' }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'#111', lineHeight:1.2 }}>{char.name}</div>
                      {char.realName !== char.name && (
                        <div style={{ fontSize:10, color:'#aaa', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{char.realName}</div>
                      )}
                      <div style={{ fontSize:11, color:'#CC0000', marginTop:4, fontWeight:600 }}>Ver perfil completo →</div>
                    </div>
                  </a>
                );
              })}
            </div>

            {/* Plain text list — all 100 */}
            <h2 style={{ fontSize:16, fontWeight:700, color:'#111', marginBottom:12 }}>
              {activeTab === 'marvel' ? 'Marvel Comics' : 'DC Comics'} — directorio completo
              <span style={{ fontSize:12, fontWeight:400, color:'#aaa', marginLeft:8 }}>{filteredList.length} personajes</span>
            </h2>
            <div style={{ background:'white', borderRadius:12, border:'1px solid #e5e7eb', padding:'16px 20px', columns:2, columnGap:32 }}>
              {filteredList.map(name => {
                const slug = slugMap[name];
                const href = slug
                  ? `/personajes/${activeTab}/${slug}`
                  : `/comicsIA?q=${encodeURIComponent(name)}`;
                return (
                  <div key={name} style={{ breakInside:'avoid', marginBottom:4 }}>
                    <a href={href} style={{ fontSize:13, color: slug ? '#CC0000' : '#374151', textDecoration:'none', fontWeight: slug ? 600 : 400, lineHeight:1.8, display:'block' }}>
                      {name}{slug && ' →'}
                    </a>
                  </div>
                );
              })}
            </div>
            {filteredList.length === 0 && (
              <div style={{ textAlign:'center', padding:40, color:'#aaa' }}>
                No se encontraron personajes para "{search}"
              </div>
            )}
          </div>

          {/* RIGHT — Quick access cover gallery */}
          <div style={{ position:'sticky', top:70 }}>
            <div style={{ background:'white', borderRadius:12, border:'1px solid #e5e7eb', padding:16, marginBottom:16 }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:'#111', marginBottom:12 }}>Galerías de portadas</h3>
              {[
                {slug:'batman',title:'Batman'},
                {slug:'amazing-spider-man',title:'Amazing Spider-Man'},
                {slug:'x-men',title:'X-Men'},
                {slug:'superman',title:'Superman'},
                {slug:'avengers',title:'Avengers'},
                {slug:'detective-comics',title:'Detective Comics'},
              ].filter(g => activeTab==='marvel'
                ? ['amazing-spider-man','x-men','avengers'].includes(g.slug)
                : ['batman','superman','detective-comics'].includes(g.slug)
              ).map(g => (
                <a key={g.slug} href={`/blog/covers/${g.slug}`}
                  style={{ display:'flex', gap:10, alignItems:'center', marginBottom:10, textDecoration:'none', padding:'6px 0', borderBottom:'1px solid #f3f4f6' }}>
                  <img src={`https://www.coverbrowser.com/image/${g.slug}/1-1.jpg`} alt={g.title}
                    loading="lazy" referrerPolicy="no-referrer"
                    style={{ width:40, height:60, objectFit:'cover', borderRadius:5, background:'#eee', flexShrink:0 }} />
                  <div>
                    <div style={{ fontSize:12, fontWeight:600, color:'#111' }}>{g.title}</div>
                    <div style={{ fontSize:11, color:'#CC0000' }}>Ver portadas →</div>
                  </div>
                </a>
              ))}
            </div>

            <div style={{ background:'#0D0D0D', borderRadius:12, padding:16 }}>
              <div style={{ fontSize:14, fontWeight:700, color:'#fff', marginBottom:6 }}>🤖 Jarvis Comics IA</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,.55)', marginBottom:12, lineHeight:1.5 }}>
                Pregunta sobre cualquier personaje, saga o historia de comics.
              </div>
              <a href="/comicsIA" style={{ display:'block', background:'#CC0000', color:'#fff', borderRadius:8, padding:'10px 0', textAlign:'center', fontSize:13, fontWeight:700, textDecoration:'none' }}>
                Abrir Jarvis IA
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
