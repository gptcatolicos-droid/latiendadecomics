'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

interface Gallery {
  id: number;
  slug: string;
  title: string;
  description: string;
  seo_description: string;
  total_issues: number;
  first_image_url: string;
  active: boolean;
  sort_order: number;
  source_type: string;
  scraped_at: string | null;
}

type Tab = 'list' | 'create' | 'seo';

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
}

function CoverImg({ src, alt, size = 48 }: { src: string; alt: string; size?: number }) {
  const [err, setErr] = useState(false);
  if (err || !src) return (
    <div style={{ width: size, height: size * 1.5, background: '#e5e7eb', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>📚</div>
  );
  return (
    <img src={src} alt={alt} referrerPolicy="no-referrer" onError={() => setErr(true)}
      style={{ width: size, height: size * 1.5, objectFit: 'cover', borderRadius: 6, flexShrink: 0, background: '#e5e7eb', display: 'block' }} />
  );
}

// ── Inline AI SEO button ───────────────────────────────────────────────────
function AISeoBtn({ title, onResult, loading, setLoading }: { title: string; onResult: (text: string) => void; loading: boolean; setLoading: (v: boolean) => void }) {
  const generate = async () => {
    if (!title || loading) return;
    setLoading(true);
    try {
      const prompt = `Crea una meta description SEO de máximo 155 caracteres para la galería de portadas de cómics "${title}". Empieza con "La Tienda de Comics IA — ${title}.". Menciona Colombia y LATAM. Sin comillas.`;
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
      });
      const data = await res.json();
      if (data.text) onResult(data.text.trim());
    } catch {}
    setLoading(false);
  };
  return (
    <button onClick={generate} disabled={loading || !title}
      style={{ padding: '5px 10px', background: loading ? '#f3f4f6' : '#fef3c7', border: '1px solid #fbbf24', borderRadius: 6, fontSize: 11, color: loading ? '#9ca3af' : '#92400e', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
      {loading ? '...' : '✦ IA'}
    </button>
  );
}

// ── Gallery preview modal ──────────────────────────────────────────────────
function PreviewModal({ gallery, onClose, onSaveImage }: { gallery: Gallery; onClose: () => void; onSaveImage: (url: string) => void }) {
  const [imgUrl, setImgUrl] = useState(gallery.first_image_url || '');
  const [saving, setSaving] = useState(false);

  const covers = Array.from({ length: Math.min(gallery.total_issues || 20, 20) }, (_, i) => ({
    n: i + 1,
    url: gallery.source_type === 'coverbrowser'
      ? `https://www.coverbrowser.com/image/${gallery.slug}/${i + 1}-1.jpg`
      : '',
  }));

  const save = async () => {
    setSaving(true);
    await onSaveImage(imgUrl);
    setSaving(false);
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 780, maxHeight: '88vh', overflow: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,.3)' }}>
        {/* Header */}
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 12 }}>
          <CoverImg src={imgUrl} alt={gallery.title} size={40} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>{gallery.title}</div>
            <a href={`/blog/covers/${gallery.slug}`} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 12, color: '#CC0000', textDecoration: 'none' }}>/blog/covers/{gallery.slug} ↗</a>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#9ca3af' }}>✕</button>
        </div>

        {/* Image assignment */}
        <div style={{ padding: '16px 20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Imagen de portada del card</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={imgUrl} onChange={e => setImgUrl(e.target.value)}
              placeholder="Pega URL de imagen (CoverBrowser, Midtown, etc)..."
              style={{ flex: 1, padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
            {imgUrl && <img src={imgUrl} alt="preview" referrerPolicy="no-referrer"
              style={{ width: 40, height: 60, objectFit: 'cover', borderRadius: 6, flexShrink: 0, border: '1px solid #e5e7eb' }} />}
            <button onClick={save} disabled={saving}
              style={{ padding: '8px 14px', background: '#CC0000', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', flexShrink: 0 }}>
              {saving ? '...' : 'Guardar'}
            </button>
          </div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>
            💡 Haz clic en cualquier portada abajo para usarla como imagen del card
          </div>
        </div>

        {/* Cover grid preview */}
        <div style={{ padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 12 }}>
            Portadas ({gallery.total_issues > 0 ? `${gallery.total_issues} issues` : 'vista previa'})
          </div>
          {gallery.source_type !== 'coverbrowser' && !gallery.total_issues ? (
            <div style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>
              Esta galería tiene portadas personalizadas.
              <br /><a href={`/blog/covers/${gallery.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: '#CC0000', textDecoration: 'none' }}>Ver en el blog ↗</a>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 8 }}>
              {covers.map(c => c.url ? (
                <div key={c.n} onClick={() => setImgUrl(c.url)} title={`Usar portada #${c.n}`}
                  style={{ cursor: 'pointer', borderRadius: 6, overflow: 'hidden', border: imgUrl === c.url ? '2px solid #CC0000' : '1px solid #e5e7eb', transition: 'border-color .15s' }}>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', top: 3, left: 3, background: 'rgba(0,0,0,.65)', color: '#f59e0b', fontSize: 8, fontWeight: 700, padding: '1px 4px', borderRadius: 3, zIndex: 2 }}>#{c.n}</span>
                    <img src={c.url} alt={`${gallery.title} #${c.n}`} loading="lazy" referrerPolicy="no-referrer"
                      style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block', background: '#f3f4f6' }} />
                  </div>
                </div>
              ) : null)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function GaleriasAdmin() {
  const [tab, setTab] = useState<Tab>('list');
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState<number | null>(null);
  const [msg, setMsg] = useState('');
  const [preview, setPreview] = useState<Gallery | null>(null);

  // Drag & drop
  const dragId = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  // AI loading states
  const [aiLoadingSlug, setAiLoadingSlug] = useState('');
  const [aiLoadingBulk, setAiLoadingBulk] = useState('');

  // Create form
  const [newSlug, setNewSlug] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSeoDesc, setNewSeoDesc] = useState('');
  const [newCovers, setNewCovers] = useState('');
  const [creating, setCreating] = useState(false);
  const [newSeoLoading, setNewSeoLoading] = useState(false);

  // SEO bulk
  const [seoEdits, setSeoEdits] = useState<Record<string, string>>({});
  const [savingSeo, setSavingSeo] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/galleries?q=${encodeURIComponent(search)}&page=1`);
      const d = await r.json();
      setGalleries(d.galleries || []);
      setTotal(d.total || 0);
      const edits: Record<string, string> = {};
      (d.galleries || []).forEach((g: Gallery) => { edits[g.slug] = g.seo_description || ''; });
      setSeoEdits(edits);
    } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const patch = async (id: number, data: Record<string, any>) => {
    await fetch('/api/admin/galleries', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data }),
    });
  };

  const toggleActive = async (g: Gallery) => {
    setSaving(g.id);
    await patch(g.id, { active: !g.active });
    setGalleries(prev => prev.map(x => x.id === g.id ? { ...x, active: !x.active } : x));
    setSaving(null);
    flash(`${g.title} ${!g.active ? '✅ activada' : '⚫ desactivada'}`);
  };

  const updateOrder = async (id: number, order: number) => {
    await patch(id, { sort_order: order });
    setGalleries(prev => [...prev.map(x => x.id === id ? { ...x, sort_order: order } : x)]
      .sort((a, b) => a.sort_order - b.sort_order));
  };

  const saveSeoInline = async (slug: string, text: string) => {
    await fetch('/api/admin/galleries', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, seo_description: text }),
    });
    setGalleries(prev => prev.map(x => x.slug === slug ? { ...x, seo_description: text } : x));
    flash(`SEO guardado: ${slug}`);
  };

  const saveImage = async (g: Gallery, url: string) => {
    await patch(g.id, { first_image_url: url });
    setGalleries(prev => prev.map(x => x.id === g.id ? { ...x, first_image_url: url } : x));
    if (preview?.id === g.id) setPreview({ ...preview, first_image_url: url });
    flash(`Imagen actualizada: ${g.title}`);
  };

  const deleteGallery = async (g: Gallery) => {
    if (!confirm(`¿Eliminar "${g.title}"? Se borrarán todas sus portadas.`)) return;
    await fetch(`/api/admin/galleries?slug=${g.slug}`, { method: 'DELETE' });
    setGalleries(prev => prev.filter(x => x.id !== g.id));
    flash(`Eliminada: ${g.title}`);
  };

  // ── Drag & Drop ───────────────────────────────────────────────────────────
  const handleDragStart = (id: number) => { dragId.current = id; };
  const handleDragOver = (e: React.DragEvent, id: number) => { e.preventDefault(); setDragOver(id); };
  const handleDrop = async (targetId: number) => {
    const srcId = dragId.current;
    if (!srcId || srcId === targetId) { setDragOver(null); return; }
    const src = galleries.find(g => g.id === srcId);
    const tgt = galleries.find(g => g.id === targetId);
    if (!src || !tgt) { setDragOver(null); return; }
    // Swap sort_orders
    await patch(srcId, { sort_order: tgt.sort_order });
    await patch(targetId, { sort_order: src.sort_order });
    setGalleries(prev => {
      const updated = prev.map(g => {
        if (g.id === srcId) return { ...g, sort_order: tgt.sort_order };
        if (g.id === targetId) return { ...g, sort_order: src.sort_order };
        return g;
      });
      return updated.sort((a, b) => a.sort_order - b.sort_order);
    });
    setDragOver(null);
    flash(`Reordenado: ${src.title}`);
  };

  // ── Bulk SEO save ──────────────────────────────────────────────────────────
  const saveSeoAll = async () => {
    setSavingSeo(true);
    let count = 0;
    for (const [slug, seo] of Object.entries(seoEdits)) {
      const g = galleries.find(x => x.slug === slug);
      if (!g || seo === g.seo_description) continue;
      await fetch('/api/admin/galleries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, seo_description: seo }),
      });
      count++;
    }
    await load();
    setSavingSeo(false);
    flash(`✅ ${count} descripciones SEO guardadas`);
  };

  // ── Bulk AI generate ALL ───────────────────────────────────────────────────
  const generateAllSeo = async () => {
    setSavingSeo(true);
    for (const g of galleries) {
      if (seoEdits[g.slug]?.trim()) continue; // skip if already has text
      setAiLoadingBulk(g.slug);
      try {
        const prompt = `Crea una meta description SEO de máximo 155 caracteres para la galería de portadas de cómics "${g.title}". Empieza con "La Tienda de Comics IA — ${g.title}.". Menciona Colombia y LATAM. Sin comillas.`;
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
        });
        const data = await res.json();
        if (data.text) setSeoEdits(prev => ({ ...prev, [g.slug]: data.text.trim() }));
      } catch {}
    }
    setAiLoadingBulk('');
    setSavingSeo(false);
    flash('✅ SEO generado para todas las galerías sin descripción');
  };

  // ── Create custom gallery ─────────────────────────────────────────────────
  const createGallery = async () => {
    if (!newSlug || !newTitle) { flash('❌ Slug y título son requeridos'); return; }
    setCreating(true);
    const lines = newCovers.split('\n').map(l => l.trim()).filter(l => l.startsWith('http'));
    const covers = lines.map((line, i) => {
      const [url, ...rest] = line.split('|').map(s => s.trim());
      return { url, title: rest.join(' ') || `${newTitle} #${i + 1}`, issue_number: i + 1 };
    });
    const res = await fetch('/api/admin/galleries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: newSlug, title: newTitle, description: newDesc, seo_description: newSeoDesc, covers, first_image_url: covers[0]?.url || '' }),
    });
    const d = await res.json();
    setCreating(false);
    if (d.success) {
      flash(`✅ Galería "${newTitle}" creada con ${covers.length} portadas`);
      setNewSlug(''); setNewTitle(''); setNewDesc(''); setNewSeoDesc(''); setNewCovers('');
      setTab('list'); load();
    } else { flash(`❌ ${d.error}`); }
  };

  const S = { input: { padding: '9px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: 'white' } };
  const btnStyle = (bg: string) => ({ padding: '8px 14px', background: bg, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: 600 });

  return (
    <div style={{ padding: 24, background: '#f7f7f7', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', marginBottom: 4 }}>🖼️ Galerías de Portadas</h1>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>
        {total} galerías en total · {galleries.filter(g => g.active).length} activas
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {([['list','📋 Gestionar'],['create','➕ Nueva Galería'],['seo','🔍 SEO Masivo']] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #e0e0e0', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, background: tab === t ? '#CC0000' : 'white', color: tab === t ? 'white' : '#555' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB: LIST ──────────────────────────────────────────────────────── */}
      {tab === 'list' && (
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar galería..."
              style={{ ...S.input, flex: 1 }} onKeyDown={e => e.key === 'Enter' && load()} />
            <button onClick={load} style={btnStyle('#0D0D0D')}>Buscar</button>
            <a href="/blog" target="_blank" style={{ ...btnStyle('#6b7280'), textDecoration: 'none', display: 'flex', alignItems: 'center' }}>Ver Blog ↗</a>
          </div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>
            🖱️ Arrastra para reordenar · Haz click en la imagen/título para previsualizar · Cambia el número de orden y sale del campo para guardar
          </div>

          {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>Cargando...</div> : (
            <div>
              {galleries.map(g => {
                const isDragTarget = dragOver === g.id;
                return (
                  <div key={g.id}
                    draggable
                    onDragStart={() => handleDragStart(g.id)}
                    onDragOver={e => handleDragOver(e, g.id)}
                    onDrop={() => handleDrop(g.id)}
                    onDragEnd={() => setDragOver(null)}
                    style={{
                      display: 'flex', gap: 10, alignItems: 'center',
                      padding: '10px 14px', borderRadius: 10, marginBottom: 8,
                      background: g.active ? 'white' : '#fef2f2',
                      border: `2px solid ${isDragTarget ? '#CC0000' : g.active ? '#e5e7eb' : '#fecaca'}`,
                      opacity: g.active ? 1 : 0.75, cursor: 'grab',
                      transition: 'border-color .15s, box-shadow .15s',
                      boxShadow: isDragTarget ? '0 4px 12px rgba(204,0,0,.15)' : 'none',
                    }}>
                    {/* Drag handle */}
                    <div style={{ color: '#d1d5db', fontSize: 16, cursor: 'grab', flexShrink: 0, userSelect: 'none' }}>⠿</div>

                    {/* Cover — click to preview */}
                    <div onClick={() => setPreview(g)} style={{ cursor: 'pointer', flexShrink: 0 }} title="Clic para previsualizar y editar imagen">
                      <CoverImg src={g.first_image_url || `https://www.coverbrowser.com/image/${g.slug}/1-1.jpg`} alt={g.title} size={40} />
                    </div>

                    {/* Title + meta — click to preview */}
                    <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => setPreview(g)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{g.title}</span>
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, fontWeight: 700, background: g.active ? '#dcfce7' : '#fee2e2', color: g.active ? '#166534' : '#991b1b' }}>
                          {g.active ? 'Activa' : 'Oculta'}
                        </span>
                        {g.source_type === 'custom' && <span style={{ fontSize: 10, background: '#eff6ff', padding: '2px 6px', borderRadius: 4, color: '#1d4ed8' }}>✏️ Custom</span>}
                        {g.total_issues > 0 && <span style={{ fontSize: 10, color: '#9ca3af' }}>{g.total_issues} issues</span>}
                        {g.seo_description && <span style={{ fontSize: 10, color: '#22c55e' }}>✓ SEO</span>}
                      </div>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>/blog/covers/{g.slug}</div>
                    </div>

                    {/* Sort order */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      <span style={{ fontSize: 11, color: '#9ca3af' }}>Orden</span>
                      <input type="number" defaultValue={g.sort_order}
                        onBlur={e => { const v = parseInt(e.target.value); if (v !== g.sort_order) updateOrder(g.id, v || 9999); }}
                        onKeyDown={e => { if (e.key === 'Enter') { const v = parseInt((e.target as HTMLInputElement).value); updateOrder(g.id, v || 9999); (e.target as HTMLInputElement).blur(); } }}
                        onClick={e => e.stopPropagation()}
                        style={{ ...S.input, width: 60, textAlign: 'center', fontSize: 12, padding: '5px 6px' }} />
                    </div>

                    {/* SEO inline */}
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                      <input
                        key={g.slug}
                        defaultValue={g.seo_description}
                        placeholder="Descripción SEO Pro..."
                        onBlur={async e => { if (e.target.value !== g.seo_description) await saveSeoInline(g.slug, e.target.value); }}
                        style={{ ...S.input, width: 200, fontSize: 12, padding: '5px 8px' }}
                      />
                      <AISeoBtn
                        title={g.title}
                        loading={aiLoadingSlug === g.slug}
                        setLoading={v => setAiLoadingSlug(v ? g.slug : '')}
                        onResult={text => {
                          saveSeoInline(g.slug, text);
                          // Update the input value visually
                          const inputs = document.querySelectorAll<HTMLInputElement>(`input[placeholder="Descripción SEO Pro..."]`);
                          inputs.forEach(inp => { if (inp.closest('[data-slug="' + g.slug + '"]')) inp.value = text; });
                        }}
                      />
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => toggleActive(g)} disabled={saving === g.id}
                        style={btnStyle(g.active ? '#f59e0b' : '#22c55e')}>
                        {saving === g.id ? '...' : g.active ? 'Ocultar' : 'Activar'}
                      </button>
                      <a href={`/blog/covers/${g.slug}`} target="_blank"
                        style={{ ...btnStyle('#6b7280'), textDecoration: 'none', display: 'flex', alignItems: 'center' }}>↗</a>
                      <button onClick={() => deleteGallery(g)} style={btnStyle('#ef4444')}>🗑</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── TAB: CREAR ─────────────────────────────────────────────────────── */}
      {tab === 'create' && (
        <div style={{ maxWidth: 720, background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 20 }}>Crear galería personalizada</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4, display: 'block' }}>Título *</label>
              <input value={newTitle} onChange={e => { setNewTitle(e.target.value); setNewSlug(slugify(e.target.value)); }}
                placeholder="Ej: Batman Black Label" style={{ ...S.input, width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4, display: 'block' }}>Slug (URL) *</label>
              <input value={newSlug} onChange={e => setNewSlug(slugify(e.target.value))}
                placeholder="batman-black-label" style={{ ...S.input, width: '100%', fontFamily: 'monospace' }} />
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>/blog/covers/{newSlug || 'mi-galeria'}</div>
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4, display: 'block' }}>Descripción interna</label>
            <input value={newDesc} onChange={e => setNewDesc(e.target.value)}
              placeholder="Descripción interna..." style={{ ...S.input, width: '100%' }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>Descripción SEO Pro</label>
              <AISeoBtn title={newTitle} loading={newSeoLoading} setLoading={setNewSeoLoading}
                onResult={text => setNewSeoDesc(text)} />
            </div>
            <textarea value={newSeoDesc} onChange={e => setNewSeoDesc(e.target.value)}
              placeholder={`La Tienda de Comics IA — ${newTitle || 'Título'}. Colección completa de portadas...`}
              rows={3} style={{ ...S.input, width: '100%', resize: 'vertical' }} />
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
              {newSeoDesc.length} chars {newSeoDesc.length > 160 && '⚠️ ideal máx 155'}
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4, display: 'block' }}>
              URLs de imágenes — una por línea &nbsp;
              <span style={{ fontWeight: 400, color: '#9ca3af' }}>Formato: URL | Título opcional</span>
            </label>
            <textarea value={newCovers} onChange={e => setNewCovers(e.target.value)} rows={10}
              placeholder={'https://www.midtowncomics.com/images/PROD/XXL/1234_XXL.jpg | Batman #1\nhttps://www.midtowncomics.com/images/PROD/XXL/5678_XXL.jpg | Batman #2'}
              style={{ ...S.input, width: '100%', fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }} />
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
              {newCovers.split('\n').filter(l => l.trim().startsWith('http')).length} URLs detectadas
            </div>
          </div>
          {(() => {
            const firstUrl = newCovers.split('\n').find(l => l.trim().startsWith('http'))?.split('|')[0].trim();
            return firstUrl ? (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6, display: 'block' }}>Vista previa</label>
                <img src={firstUrl} alt="preview" referrerPolicy="no-referrer"
                  style={{ height: 120, objectFit: 'contain', borderRadius: 8, border: '1px solid #e5e7eb', background: '#f3f4f6' }} />
              </div>
            ) : null;
          })()}
          <button onClick={createGallery} disabled={creating || !newSlug || !newTitle}
            style={{ ...btnStyle('#CC0000'), opacity: creating || !newSlug || !newTitle ? 0.5 : 1 }}>
            {creating ? '⏳ Creando...' : '✅ Crear Galería'}
          </button>
        </div>
      )}

      {/* ── TAB: SEO MASIVO ────────────────────────────────────────────────── */}
      {tab === 'seo' && (
        <div style={{ maxWidth: 900 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111', margin: 0 }}>SEO Pro — Edición Masiva</h2>
              <p style={{ fontSize: 12, color: '#888', marginTop: 4, maxWidth: 500 }}>
                Cada descripción empieza con "La Tienda de Comics IA — [Título]." Google usa el primer párrafo para el snippet.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={generateAllSeo} disabled={savingSeo}
                style={{ ...btnStyle('#f59e0b'), display: 'flex', alignItems: 'center', gap: 6 }}>
                {savingSeo && aiLoadingBulk ? `✦ IA — ${aiLoadingBulk}` : '✦ IA Generar Todo'}
              </button>
              <button onClick={saveSeoAll} disabled={savingSeo} style={btnStyle('#22c55e')}>
                {savingSeo && !aiLoadingBulk ? '⏳ Guardando...' : '💾 Guardar Todo'}
              </button>
            </div>
          </div>

          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#92400e' }}>
            💡 Fórmula: <b>"La Tienda de Comics IA — [Título]. [Descripción] con portadas desde [año]. Colección completa disponible en Colombia y LATAM."</b>
          </div>

          {galleries.map(g => (
            <div key={g.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10, padding: '12px 14px', background: 'white', borderRadius: 10, border: '1px solid #e5e7eb' }}>
              <CoverImg src={g.first_image_url || `https://www.coverbrowser.com/image/${g.slug}/1-1.jpg`} alt={g.title} size={40} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {g.title}
                  {!g.active && <span style={{ fontSize: 10, color: '#9ca3af' }}>(oculta)</span>}
                  {aiLoadingBulk === g.slug && <span style={{ fontSize: 11, color: '#f59e0b' }}>✦ generando...</span>}
                </div>
                <textarea
                  value={seoEdits[g.slug] ?? g.seo_description ?? ''}
                  onChange={e => setSeoEdits(prev => ({ ...prev, [g.slug]: e.target.value }))}
                  rows={2} placeholder={`La Tienda de Comics IA — ${g.title}. Colección completa...`}
                  style={{ ...S.input, width: '100%', resize: 'vertical', fontSize: 12 }} />
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span>{(seoEdits[g.slug] ?? g.seo_description ?? '').length} chars</span>
                  {(seoEdits[g.slug] ?? g.seo_description ?? '').length > 160 && <span style={{ color: '#f59e0b' }}>⚠️ &gt;160</span>}
                </div>
              </div>
              {/* Per-item AI button */}
              <AISeoBtn title={g.title}
                loading={aiLoadingBulk === g.slug}
                setLoading={v => setAiLoadingBulk(v ? g.slug : '')}
                onResult={text => setSeoEdits(prev => ({ ...prev, [g.slug]: text }))} />
            </div>
          ))}

          <div style={{ textAlign: 'center', paddingTop: 16, display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={generateAllSeo} disabled={savingSeo} style={btnStyle('#f59e0b')}>✦ IA Generar Todo</button>
            <button onClick={saveSeoAll} disabled={savingSeo} style={btnStyle('#CC0000')}>💾 Guardar Todo</button>
          </div>
        </div>
      )}

      {/* Flash */}
      {msg && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#111', color: '#fff', padding: '10px 18px', borderRadius: 10, fontSize: 13, zIndex: 9999 }}>
          {msg}
        </div>
      )}

      {/* Preview modal */}
      {preview && (
        <PreviewModal
          gallery={preview}
          onClose={() => setPreview(null)}
          onSaveImage={url => saveImage(preview, url)}
        />
      )}
    </div>
  );
}
