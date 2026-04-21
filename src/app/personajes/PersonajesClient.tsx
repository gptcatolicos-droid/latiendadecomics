'use client';
import { useState, useMemo } from 'react';
import { CHARACTERS } from '@/lib/characters-data';

export default function PersonajesClient() {
  const [universe, setUniverse] = useState<'all'|'marvel'|'dc'>('all');
  const [alignment, setAlignment] = useState<'all'|'hero'|'villain'|'antihero'>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => CHARACTERS.filter(c => {
    if (universe !== 'all' && c.universe !== universe) return false;
    if (alignment !== 'all' && c.alignment !== alignment) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.realName.toLowerCase().includes(q);
    }
    return true;
  }), [universe, alignment, search]);

  const marvelCount = CHARACTERS.filter(c => c.universe === 'marvel').length;
  const dcCount = CHARACTERS.filter(c => c.universe === 'dc').length;

  return (
    <div style={{ minHeight:'100vh', background:'#fff' }}>
      {/* NAV */}
      <nav style={{ background:'#0D0D0D', position:'sticky', top:0, zIndex:50, borderBottom:'1px solid #222' }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 16px', height:52, display:'flex', alignItems:'center', gap:10 }}>
          <a href="/" style={{ flexShrink:0 }}>
            <img src="/logo.webp" alt="La Tienda de Comics" style={{ height:28, objectFit:'contain', display:'block' }} />
          </a>
          <span style={{ color:'rgba(255,255,255,.3)', fontSize:12 }}>›</span>
          <span style={{ color:'#CC0000', fontSize:13, fontWeight:700 }}>🦸 Personajes</span>
          <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
            <a href="/blog" style={{ color:'rgba(255,255,255,.65)', fontSize:12, padding:'4px 10px', borderRadius:6, textDecoration:'none', border:'1px solid rgba(255,255,255,.15)' }}>📰 Blog</a>
            <a href="/universo" style={{ color:'rgba(255,255,255,.65)', fontSize:12, padding:'4px 10px', borderRadius:6, textDecoration:'none', border:'1px solid rgba(255,255,255,.15)' }}>🤖 Jarvis</a>
            <a href="/catalogo" style={{ background:'#CC0000', color:'#fff', fontSize:12, padding:'4px 12px', borderRadius:6, textDecoration:'none', fontWeight:600 }}>Catálogo</a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ background:'linear-gradient(180deg,#0a0a1a 0%,#0D0D0D 60%,#111 100%)', padding:'32px 16px 24px', textAlign:'center' }}>
        <h1 style={{ fontFamily:'Oswald,sans-serif', fontSize:'clamp(24px,5vw,46px)', fontWeight:700, letterSpacing:2, color:'#fff', margin:'0 0 8px' }}>
          🦸 Directorio de <span style={{ color:'#CC0000' }}>Personajes</span>
        </h1>
        <p style={{ color:'rgba(255,255,255,.45)', fontSize:14, margin:'0 0 20px' }}>
          {CHARACTERS.length} personajes · Marvel · DC · Manga
        </p>
        {/* Universe toggle */}
        <div style={{ display:'inline-flex', border:'1px solid rgba(255,255,255,.15)', borderRadius:10, overflow:'hidden', marginBottom:16 }}>
          {([['all','Todos',CHARACTERS.length],['marvel','Marvel',marvelCount],['dc','DC',dcCount]] as const).map(([val,label,count]) => (
            <button key={val} onClick={() => setUniverse(val)}
              style={{ padding:'8px 18px', fontSize:13, fontWeight:700, border:'none', cursor:'pointer',
                background: universe===val ? (val==='dc'?'#0476D0':val==='marvel'?'#CC0000':'#333') : 'transparent',
                color: universe===val ? '#fff' : 'rgba(255,255,255,.45)', transition:'all .2s',
              }}>
              {label} <span style={{ fontSize:10, opacity:.7 }}>({count})</span>
            </button>
          ))}
        </div>
        {/* Search */}
        <div style={{ maxWidth:440, margin:'0 auto' }}>
          <input type="text" placeholder="Buscar personaje..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width:'100%', padding:'10px 16px', borderRadius:10, border:'1px solid rgba(255,255,255,.15)', background:'rgba(255,255,255,.08)', color:'#fff', fontSize:14, outline:'none', boxSizing:'border-box' }} />
        </div>
      </div>

      {/* ALIGNMENT TABS */}
      <div style={{ borderBottom:'1px solid #eee', background:'#fafafa', overflowX:'auto' }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 16px', display:'flex', minWidth:'max-content' }}>
          {([['all','Todos'],['hero','💙 Héroes'],['villain','🔴 Villanos'],['antihero','⚡ Antihéroes']] as const).map(([val,label]) => (
            <button key={val} onClick={() => setAlignment(val)}
              style={{ padding:'11px 16px', fontSize:13, fontWeight:500, border:'none', background:'transparent', cursor:'pointer', whiteSpace:'nowrap',
                color: alignment===val ? '#CC0000' : '#777',
                borderBottom: `2px solid ${alignment===val?'#CC0000':'transparent'}`,
              }}>{label}</button>
          ))}
        </div>
      </div>

      {/* CHARACTER GRID */}
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'24px 16px' }}>
        <p style={{ color:'#9ca3af', fontSize:12, marginBottom:16 }}>{filtered.length} personajes</p>
        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'48px 0', color:'#9ca3af' }}>
            No se encontraron personajes.
            <br /><button onClick={() => { setSearch(''); setUniverse('all'); setAlignment('all'); }}
              style={{ color:'#CC0000', background:'none', border:'none', cursor:'pointer', marginTop:8, fontSize:14 }}>Limpiar filtros</button>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(145px,1fr))', gap:12 }}>
            {filtered.map(char => {
              const uniBg = char.universe==='marvel'?'#CC0000':'#0476D0';
              const alignColor = char.alignment==='hero'?'#3b82f6':char.alignment==='villain'?'#CC0000':'#f59e0b';
              return (
                <a key={char.slug} href={`/personajes/${char.universe}/${char.slug}`}
                  style={{ textDecoration:'none', borderRadius:10, overflow:'hidden', border:'1px solid #e5e7eb', background:'#fff', display:'block', transition:'box-shadow .2s,transform .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,.12)'; e.currentTarget.style.transform='translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow='none'; e.currentTarget.style.transform='none'; }}
                >
                  <div style={{ position:'relative' }}>
                    <img src={char.imageUrl} alt={`${char.name} — ${char.realName}`} loading="lazy" referrerPolicy="no-referrer"
                      style={{ width:'100%', aspectRatio:'3/4', objectFit:'cover', objectPosition:'top', display:'block', background:'#f3f4f6' }} />
                    <span style={{ position:'absolute', top:5, right:5, background:uniBg, color:'#fff', fontSize:8, fontWeight:700, padding:'2px 5px', borderRadius:4 }}>
                      {char.universe==='marvel'?'MARVEL':'DC'}
                    </span>
                    <span style={{ position:'absolute', bottom:5, left:5, background:alignColor+'dd', color:'#fff', fontSize:8, padding:'2px 5px', borderRadius:4 }}>
                      {char.alignment==='hero'?'Héroe':char.alignment==='villain'?'Villano':'Antihéroe'}
                    </span>
                  </div>
                  <div style={{ padding:'8px 10px 10px' }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#111', lineHeight:1.2 }}>{char.name}</div>
                    {char.realName !== char.name && (
                      <div style={{ fontSize:10, color:'#6b7280', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{char.realName}</div>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>

      {/* JARVIS STICKY */}
      <div style={{ position:'sticky', bottom:0, background:'rgba(13,13,13,.97)', backdropFilter:'blur(12px)', borderTop:'1px solid #222', padding:'10px 16px', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
        <span style={{ fontSize:20 }}>🤖</span>
        <span style={{ flex:1, fontSize:12, color:'rgba(255,255,255,.6)', minWidth:120 }}>
          <b style={{ color:'#fff' }}>Jarvis IA:</b> Pregúntame sobre cualquier personaje
        </span>
        <a href="/universo" style={{ border:'1px solid rgba(255,255,255,.2)', color:'rgba(255,255,255,.7)', borderRadius:6, padding:'6px 12px', fontSize:12, textDecoration:'none' }}>Preguntar a Jarvis</a>
        <a href="/catalogo" style={{ background:'#CC0000', color:'#fff', borderRadius:6, padding:'6px 12px', fontSize:12, textDecoration:'none', fontWeight:600 }}>Catálogo</a>
        <a href="/" style={{ color:'rgba(255,255,255,.4)', fontSize:12, textDecoration:'none' }}>Inicio</a>
      </div>
    </div>
  );
}
