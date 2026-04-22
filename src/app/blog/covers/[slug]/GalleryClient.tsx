'use client';
import { useState } from 'react';

interface Cover { n: number; url: string; alt?: string; }
interface Props {
  slug: string; title: string; description: string;
  covers: Cover[]; totalIssues?: number;
}

export default function GalleryClient({ slug, title, description, covers, totalIssues = 0 }: Props) {
  const [modal, setModal] = useState<{ url: string; n: number; idx: number } | null>(null);

  const openModal = (cover: Cover, idx: number) => setModal({ url: cover.url, n: cover.n, idx });

  const prev = () => setModal(m => {
    if (!m) return null;
    const ni = m.idx - 1;
    if (ni < 0) return m;
    return { url: covers[ni].url, n: covers[ni].n, idx: ni };
  });

  const next = () => setModal(m => {
    if (!m) return null;
    const ni = m.idx + 1;
    if (ni >= covers.length) return m;
    return { url: covers[ni].url, n: covers[ni].n, idx: ni };
  });

  return (
    <>
      <style>{`
        .cover-thumb{background:white;border-radius:14px;overflow:hidden;border:1px solid #ebebeb;cursor:pointer;transition:box-shadow .15s}
        .cover-thumb:hover{box-shadow:0 6px 20px rgba(0,0,0,.12)}
        .nav-btn-blk{font-size:12px;font-weight:600;color:#fff;padding:5px 10px;border-radius:8px;text-decoration:none;background:#0D0D0D;white-space:nowrap}
        .nav-btn-red{font-size:12px;font-weight:600;color:#fff;padding:5px 12px;border-radius:8px;text-decoration:none;background:#CC0000;white-space:nowrap}
      `}</style>

      <div style={{ minHeight:'100vh', background:'#f7f7f7' }}>
        {/* NAV */}
        <nav style={{ background:'#0D0D0D', position:'sticky', top:0, zIndex:50 }}>
          <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 20px', height:56, display:'flex', alignItems:'center', gap:12 }}>
            <a href="/" style={{ textDecoration:'none', flexShrink:0 }}>
              <img src="/logo.webp" alt="La Tienda de Comics" style={{ height:36, objectFit:'contain' }} />
            </a>
            <div style={{ flex:1, display:'flex', gap:8, alignItems:'center', minWidth:0 }}>
              <a href="/blog" className="nav-btn-blk">← Blog</a>
              <span style={{ color:'rgba(255,255,255,.4)', fontSize:11, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{title}</span>
            </div>
            <a href="/catalogo" className="nav-btn-red">Ver Catálogo</a>
          </div>
        </nav>

        <div style={{ maxWidth:1200, margin:'0 auto', padding:'24px 20px' }}>
          {/* Header */}
          <div style={{ display:'flex', gap:16, alignItems:'flex-start', marginBottom:24, flexWrap:'wrap' }}>
            <img src={covers[0]?.url || `https://www.coverbrowser.com/image/${slug}/1-1.jpg`}
              alt={`${title} portada`} referrerPolicy="no-referrer"
              style={{ width:100, height:150, objectFit:'cover', borderRadius:10, border:'2px solid #CC0000', background:'#eee', flexShrink:0 }} />
            <div style={{ paddingTop:4 }}>
              <h1 style={{ fontSize:26, fontWeight:700, color:'#111', marginBottom:4 }}>{title}</h1>
              <p style={{ fontSize:13, color:'#888', marginBottom:12 }}>{description}</p>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <span style={{ background:'#f3f4f6', padding:'4px 12px', borderRadius:10, fontSize:12, color:'#374151' }}>
                  {covers.length} portadas{totalIssues > covers.length ? ` de ${totalIssues}` : ''}
                </span>
                <a href={`https://www.coverbrowser.com/covers/${slug}`} target="_blank" rel="noopener noreferrer"
                  style={{ padding:'6px 14px', background:'white', border:'1px solid #e0e0e0', borderRadius:10, fontSize:13, color:'#444', textDecoration:'none', fontWeight:600 }}>
                  Ver en CoverBrowser ↗
                </a>
              </div>
              <p style={{ fontSize:12, color:'#aaa', marginTop:10 }}>Haz clic en cualquier portada para verla a tamaño completo</p>
            </div>
          </div>

          {/* Grid */}
          {covers.length === 0 ? (
            <div style={{ textAlign:'center', padding:60, color:'#aaa' }}>
              No hay portadas disponibles para esta galería aún.
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:12 }}>
              {covers.map((cover, idx) => (
                <div key={cover.n} className="cover-thumb" onClick={() => openModal(cover, idx)}>
                  <div style={{ aspectRatio:'2/3', background:'#f5f5f5', overflow:'hidden', position:'relative' }}>
                    <span style={{ position:'absolute', top:6, left:6, background:'rgba(0,0,0,.7)', color:'#f59e0b', fontSize:9, fontWeight:700, padding:'2px 5px', borderRadius:4, zIndex:2 }}>
                      #{cover.n}
                    </span>
                    <img src={cover.url} alt={cover.alt || `${title} #${cover.n}`}
                      loading="lazy" referrerPolicy="no-referrer"
                      style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  </div>
                  <div style={{ padding:'6px 8px 10px' }}>
                    <div style={{ fontSize:11, fontWeight:600, color:'#222' }}>{title} #{cover.n}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* JARVIS sticky */}
        <div style={{ position:'sticky', bottom:0, background:'rgba(13,13,13,.97)', backdropFilter:'blur(8px)', borderTop:'1px solid #222', padding:'10px 16px', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <span style={{ fontSize:18 }}>🤖</span>
          <span style={{ flex:1, fontSize:12, color:'rgba(255,255,255,.6)', minWidth:120 }}>
            <b style={{ color:'#fff' }}>Jarvis IA:</b> ¿Quieres saber más sobre {title}?
          </span>
          <a href={`/comicsIA?q=${encodeURIComponent(title)}`} style={{ background:'#0D0D0D', color:'#fff', borderRadius:6, padding:'6px 12px', fontSize:12, textDecoration:'none', border:'1px solid rgba(255,255,255,.2)' }}>
            Preguntar a Jarvis
          </a>
          <a href="/catalogo" style={{ background:'#CC0000', color:'#fff', borderRadius:6, padding:'6px 12px', fontSize:12, textDecoration:'none', fontWeight:600 }}>Catálogo</a>
          <a href="/blog" style={{ color:'rgba(255,255,255,.4)', fontSize:12, textDecoration:'none' }}>← Blog</a>
        </div>
      </div>

      {/* FULL SIZE MODAL */}
      {modal && (
        <div onClick={() => setModal(null)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.92)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', cursor:'zoom-out' }}>
          <button onClick={e => { e.stopPropagation(); prev(); }}
            style={{ position:'absolute', left:16, background:'rgba(255,255,255,.15)', border:'none', borderRadius:'50%', width:48, height:48, color:'#fff', fontSize:24, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>

          <div onClick={e => e.stopPropagation()} style={{ position:'relative', maxWidth:'min(90vw, 580px)' }}>
            <img src={modal.url} alt={`${title} #${modal.n}`} referrerPolicy="no-referrer"
              style={{ maxWidth:'100%', maxHeight:'88vh', objectFit:'contain', borderRadius:8, display:'block', imageRendering:'auto' }} />
            <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'linear-gradient(transparent,rgba(0,0,0,.85))', borderRadius:'0 0 8px 8px', padding:'20px 16px 12px' }}>
              <div style={{ color:'#fff', fontSize:14, fontWeight:700 }}>{title} #{modal.n}</div>
              <a href={modal.url} target="_blank" rel="noopener noreferrer"
                style={{ color:'rgba(255,255,255,.6)', fontSize:11, textDecoration:'none' }}>Ver imagen original ↗</a>
            </div>
          </div>

          <button onClick={e => { e.stopPropagation(); next(); }}
            style={{ position:'absolute', right:16, background:'rgba(255,255,255,.15)', border:'none', borderRadius:'50%', width:48, height:48, color:'#fff', fontSize:24, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
          <button onClick={() => setModal(null)}
            style={{ position:'absolute', top:16, right:16, background:'rgba(255,255,255,.15)', border:'none', borderRadius:'50%', width:36, height:36, color:'#fff', fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
          <div style={{ position:'absolute', top:16, left:'50%', transform:'translateX(-50%)', color:'rgba(255,255,255,.5)', fontSize:12 }}>
            {modal.idx + 1} / {covers.length}
          </div>
        </div>
      )}
    </>
  );
}
