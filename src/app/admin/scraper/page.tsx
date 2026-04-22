'use client';
import { useState, useRef } from 'react';

// ── Cover manager component ────────────────────────────────────────────────
interface Cover { id: number; issue_number: number; image_url: string; alt_text: string; sort_order: number; }

function CoverManager({ slug, onClose }: { slug: string; onClose: () => void }) {
  const [covers, setCovers] = useState<Cover[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const dragId = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  useState(() => { loadCovers(); });

  async function loadCovers() {
    setLoading(true);
    const r = await fetch(`/api/admin/gallery-covers?slug=${slug}`);
    const d = await r.json();
    setCovers(d.covers || []);
    setLoading(false);
  }

  async function hidecover(id: number) {
    setCovers(prev => prev.filter(c => c.id !== id));
    await fetch('/api/admin/gallery-covers', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, hidden: true }),
    });
    setMsg('Portada eliminada');
    setTimeout(() => setMsg(''), 2000);
  }

  async function saveOrder() {
    setSaving(true);
    const updates = covers.map((c, i) => ({ id: c.id, sort_order: i + 1 }));
    await fetch('/api/admin/gallery-covers', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates }),
    });
    setSaving(false);
    setMsg('✅ Orden guardado');
    setTimeout(() => setMsg(''), 2000);
  }

  const onDragStart = (id: number) => { dragId.current = id; };
  const onDragOver = (e: React.DragEvent, id: number) => { e.preventDefault(); setDragOver(id); };
  const onDrop = (targetId: number) => {
    const srcId = dragId.current;
    if (!srcId || srcId === targetId) { setDragOver(null); return; }
    setCovers(prev => {
      const srcIdx = prev.findIndex(c => c.id === srcId);
      const tgtIdx = prev.findIndex(c => c.id === targetId);
      const next = [...prev];
      const [removed] = next.splice(srcIdx, 1);
      next.splice(tgtIdx, 0, removed);
      return next;
    });
    setDragOver(null);
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.8)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'#111', borderRadius:16, width:'100%', maxWidth:900, maxHeight:'90vh', display:'flex', flexDirection:'column', border:'1px solid #333' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid #222', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ color:'#fff', fontSize:16, fontWeight:700, flex:1 }}>🖼️ Gestionar portadas: {slug}</div>
          <span style={{ fontSize:12, color:'#666' }}>{covers.length} portadas visibles</span>
          <button onClick={saveOrder} disabled={saving}
            style={{ padding:'7px 14px', background:'#22c55e', border:'none', borderRadius:8, color:'#fff', fontSize:13, cursor:'pointer', fontWeight:700 }}>
            {saving ? '...' : '💾 Guardar orden'}
          </button>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#666', fontSize:22, cursor:'pointer' }}>✕</button>
        </div>

        <div style={{ padding:'10px 20px', fontSize:12, color:'#666', borderBottom:'1px solid #1a1a1a' }}>
          🖱️ Arrastra para reordenar · 🗑 Clic en X para ocultar portada
          {msg && <span style={{ marginLeft:16, color:'#22c55e' }}>{msg}</span>}
        </div>

        <div style={{ overflowY:'auto', flex:1, padding:16 }}>
          {loading ? (
            <div style={{ textAlign:'center', padding:40, color:'#666' }}>Cargando portadas...</div>
          ) : covers.length === 0 ? (
            <div style={{ textAlign:'center', padding:40, color:'#666' }}>No hay portadas en esta galería.</div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(90px, 1fr))', gap:8 }}>
              {covers.map(cover => (
                <div key={cover.id}
                  draggable
                  onDragStart={() => onDragStart(cover.id)}
                  onDragOver={e => onDragOver(e, cover.id)}
                  onDrop={() => onDrop(cover.id)}
                  onDragEnd={() => setDragOver(null)}
                  style={{ borderRadius:8, border:`2px solid ${dragOver === cover.id ? '#CC0000' : 'transparent'}`, cursor:'grab', position:'relative', background:'#1a1a1a', transition:'border-color .15s' }}
                >
                  {/* Remove button */}
                  <button onClick={() => hidecover(cover.id)}
                    style={{ position:'absolute', top:3, right:3, width:20, height:20, background:'rgba(239,68,68,.9)', border:'none', borderRadius:'50%', color:'#fff', fontSize:10, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', zIndex:3 }}>
                    ✕
                  </button>
                  <span style={{ position:'absolute', top:3, left:3, background:'rgba(0,0,0,.75)', color:'#f59e0b', fontSize:8, fontWeight:700, padding:'1px 4px', borderRadius:3, zIndex:2 }}>
                    #{cover.issue_number}
                  </span>
                  <img src={cover.image_url} alt={cover.alt_text || `#${cover.issue_number}`}
                    loading="lazy" referrerPolicy="no-referrer"
                    style={{ width:'100%', aspectRatio:'2/3', objectFit:'cover', borderRadius:6, display:'block', background:'#333' }} />
                  <div style={{ padding:'3px 4px', fontSize:9, color:'#666', textAlign:'center' }}>#{cover.issue_number}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Scraper page ──────────────────────────────────────────────────────
export default function ScraperAdmin() {
  const [log, setLog] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  // Single scrape
  const [singleSlug, setSingleSlug] = useState('');
  const [targetSlug, setTargetSlug] = useState('');
  const [appendMode, setAppendMode] = useState(false);

  // Cover manager
  const [managerSlug, setManagerSlug] = useState('');
  const [showManager, setShowManager] = useState(false);

  const logLine = (s: string) => setLog(prev => [...prev.slice(-300), s]);

  // Full scrape
  const startFullScrape = async () => {
    setLog([]); setRunning(true); setDone(false);
    const token = localStorage.getItem('admin_token') || '';
    try {
      const res = await fetch('/api/admin/scrape/coverbrowser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ batchSize: 3 }),
      });
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done: d, value } = await reader.read();
        if (d) break;
        const text = decoder.decode(value);
        for (const line of text.split('\n').filter(l => l.startsWith('data:'))) {
          try {
            const data = JSON.parse(line.slice(5));
            if (data.msg) logLine(data.msg);
            if (data.done) { setDone(true); setRunning(false); logLine('✅ Scrape completo!'); }
            if (data.error) { logLine(`❌ ${data.error}`); setRunning(false); }
          } catch {}
        }
      }
    } catch (err: any) {
      logLine(`Error: ${err.message}`); setRunning(false);
    }
  };

  // Individual scrape (supports multi-slug and append)
  const scrapeSingle = async () => {
    const slugInput = singleSlug.trim();
    if (!slugInput) return;
    const target = targetSlug.trim() || slugInput.split(',')[0].trim();
    logLine(`⏳ Scraping: ${slugInput}${appendMode ? ` → append a "${target}"` : ''}`);
    setRunning(true);
    try {
      const params = new URLSearchParams({ slug: slugInput });
      if (targetSlug.trim()) params.set('target', targetSlug.trim());
      if (appendMode) params.set('append', '1');
      const res = await fetch(`/api/admin/scrape/coverbrowser?${params}`);
      const data = await res.json();
      if (data.success) {
        logLine(`✅ "${data.title}" — ${data.covers} portadas → /blog/covers/${data.slug}`);
        if (data.slugsProcessed?.length > 1) logLine(`   Slugs procesados: ${data.slugsProcessed.join(', ')}`);
      } else {
        logLine(`❌ Error: ${data.error}`);
      }
    } catch (err: any) {
      logLine(`❌ ${err.message}`);
    } finally { setRunning(false); }
  };

  const s = {
    card: { background: '#111', border: '1px solid #333', borderRadius: 10, padding: 18 },
    input: { width: '100%', background: '#0a0a0a', border: '1px solid #333', borderRadius: 6, padding: '7px 10px', color: '#0f0', fontSize: 13, marginBottom: 8, fontFamily: 'monospace', boxSizing: 'border-box' as const },
    label: { color: '#888', fontSize: 11, display: 'block' as const, marginBottom: 4 },
    btn: (bg: string, disabled = false) => ({ background: disabled ? '#333' : bg, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }),
  };

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', background: '#0a0a0a', minHeight: '100vh', color: '#0f0' }}>
      <h1 style={{ color: '#CC0000', fontFamily: 'sans-serif', marginBottom: 4 }}>🤖 Admin — Scraper Panel</h1>
      <p style={{ color: '#666', fontSize: 12, fontFamily: 'sans-serif', marginBottom: 20 }}>
        Importa portadas desde CoverBrowser. Los slugs son el último segmento de la URL: coverbrowser.com/covers/<b style={{ color: '#0f0' }}>batman</b>
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>

        {/* Full scrape */}
        <div style={s.card}>
          <h2 style={{ color: '#fff', fontSize: 13, marginBottom: 8, fontFamily: 'sans-serif' }}>Scrape Completo</h2>
          <p style={{ color: '#666', fontSize: 11, marginBottom: 12, fontFamily: 'sans-serif' }}>
            Todas las galerías (~450K covers). Tarda horas.
          </p>
          <button onClick={startFullScrape} disabled={running} style={s.btn('#CC0000', running)}>
            {running ? '⏳ Corriendo...' : '🚀 Iniciar Completo'}
          </button>
        </div>

        {/* Individual / multi-slug */}
        <div style={s.card}>
          <h2 style={{ color: '#fff', fontSize: 13, marginBottom: 10, fontFamily: 'sans-serif' }}>Scrape Individual / Multi</h2>

          <label style={s.label}>Slug(s) de CoverBrowser <span style={{ color: '#555' }}>(comas para varios)</span></label>
          <input value={singleSlug} onChange={e => setSingleSlug(e.target.value)}
            placeholder="hulk, incredible-hulk" style={s.input}
            onKeyDown={e => e.key === 'Enter' && !running && scrapeSingle()} />

          <label style={s.label}>Galería destino <span style={{ color: '#555' }}>(slug de la galería a crear/actualizar)</span></label>
          <input value={targetSlug} onChange={e => setTargetSlug(e.target.value)}
            placeholder={singleSlug.split(',')[0]?.trim() || 'hulk'} style={s.input} />

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
            <label style={{ color: '#888', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={appendMode} onChange={e => setAppendMode(e.target.checked)}
                style={{ accentColor: '#CC0000' }} />
              Modo Agregar (no reemplaza portadas existentes)
            </label>
          </div>

          <button onClick={scrapeSingle} disabled={running || !singleSlug.trim()} style={s.btn('#0476D0', running || !singleSlug.trim())}>
            {running ? '⏳...' : '▶ Scrape'}
          </button>

          <div style={{ marginTop: 10, fontSize: 10, color: '#555', lineHeight: 1.6 }}>
            Ejemplos:<br />
            hulk → galería "hulk"<br />
            hulk, incredible-hulk → galería "hulk" con ambas series<br />
            hulk + target=incredible-hulk → merge en "incredible-hulk"
          </div>
        </div>

        {/* Cover manager */}
        <div style={s.card}>
          <h2 style={{ color: '#fff', fontSize: 13, marginBottom: 10, fontFamily: 'sans-serif' }}>Gestionar Portadas</h2>
          <p style={{ color: '#666', fontSize: 11, marginBottom: 10, fontFamily: 'sans-serif' }}>
            Reordena, elimina portadas rotas o no deseadas de una galería.
          </p>
          <label style={s.label}>Slug de la galería</label>
          <input value={managerSlug} onChange={e => setManagerSlug(e.target.value)}
            placeholder="hulk" style={s.input}
            onKeyDown={e => e.key === 'Enter' && managerSlug && setShowManager(true)} />
          <button onClick={() => setShowManager(true)} disabled={!managerSlug.trim()}
            style={s.btn('#7c3aed', !managerSlug.trim())}>
            🖼️ Abrir Gestor
          </button>
        </div>
      </div>

      {/* Log */}
      <div style={{ background: '#000', border: '1px solid #222', borderRadius: 8, padding: 16, height: 360, overflowY: 'auto' }}>
        <div style={{ fontSize: 11, color: '#555', marginBottom: 8 }}>
          LOG {running ? '⏳ running...' : done ? '✅ done' : ''}
        </div>
        {log.length === 0 ? (
          <div style={{ color: '#333', fontSize: 12 }}>Listo para correr...</div>
        ) : (
          log.map((line, i) => (
            <div key={i} style={{ fontSize: 11, lineHeight: 1.6, color: line.startsWith('✅') ? '#22c55e' : line.startsWith('❌') ? '#ef4444' : '#0f0' }}>
              {line}
            </div>
          ))
        )}
      </div>

      {/* Cover manager modal */}
      {showManager && managerSlug && (
        <CoverManager slug={managerSlug} onClose={() => setShowManager(false)} />
      )}
    </div>
  );
}
