'use client';
import { useState, useEffect, useCallback } from 'react';

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

// ── helpers ────────────────────────────────────────────────────────────────
function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
}

function CoverImg({ src, alt }: { src: string; alt: string }) {
  const [err, setErr] = useState(false);
  if (err || !src) return (
    <div style={{ width: 48, height: 72, background: '#222', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📚</div>
  );
  return (
    <img src={src} alt={alt} referrerPolicy="no-referrer"
      onError={() => setErr(true)}
      style={{ width: 48, height: 72, objectFit: 'cover', borderRadius: 4, flexShrink: 0, background: '#333' }} />
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

  // Create form
  const [newSlug, setNewSlug] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSeoDesc, setNewSeoDesc] = useState('');
  const [newCovers, setNewCovers] = useState('');
  const [creating, setCreating] = useState(false);

  // SEO bulk edit
  const [seoEdits, setSeoEdits] = useState<Record<string, string>>({});
  const [savingSeo, setSavingSeo] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/galleries?q=${encodeURIComponent(search)}&page=1`);
      const d = await r.json();
      setGalleries(d.galleries || []);
      setTotal(d.total || 0);
      // Pre-populate SEO edits
      const edits: Record<string, string> = {};
      (d.galleries || []).forEach((g: Gallery) => { edits[g.slug] = g.seo_description || ''; });
      setSeoEdits(edits);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  // Toggle active
  const toggleActive = async (g: Gallery) => {
    setSaving(g.id);
    await fetch('/api/admin/galleries', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: g.id, active: !g.active }),
    });
    setGalleries(prev => prev.map(x => x.id === g.id ? { ...x, active: !x.active } : x));
    setSaving(null);
    flash(`${g.title} ${!g.active ? 'activada' : 'desactivada'}`);
  };

  // Update sort_order
  const updateOrder = async (g: Gallery, order: number) => {
    setGalleries(prev => prev.map(x => x.id === g.id ? { ...x, sort_order: order } : x));
    await fetch('/api/admin/galleries', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: g.id, sort_order: order }),
    });
  };

  // Delete gallery
  const deleteGallery = async (g: Gallery) => {
    if (!confirm(`¿Eliminar galería "${g.title}"? Esto borrará todas sus portadas.`)) return;
    await fetch(`/api/admin/galleries?slug=${g.slug}`, { method: 'DELETE' });
    setGalleries(prev => prev.filter(x => x.id !== g.id));
    flash(`Galería "${g.title}" eliminada`);
  };

  // Save SEO bulk
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
    flash(`${count} descripciones SEO guardadas`);
  };

  // Create custom gallery
  const createGallery = async () => {
    if (!newSlug || !newTitle) { flash('❌ Slug y título son requeridos'); return; }
    setCreating(true);

    // Parse covers: one URL per line, format "URL | title opcional"
    const lines = newCovers.split('\n').map(l => l.trim()).filter(Boolean);
    const covers = lines.map((line, i) => {
      const [url, ...rest] = line.split('|').map(s => s.trim());
      return { url, title: rest.join(' ') || `${newTitle} #${i + 1}`, issue_number: i + 1 };
    });

    const res = await fetch('/api/admin/galleries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: newSlug, title: newTitle,
        description: newDesc, seo_description: newSeoDesc,
        covers,
        first_image_url: covers[0]?.url || '',
      }),
    });
    const d = await res.json();
    setCreating(false);
    if (d.success) {
      flash(`✅ Galería "${newTitle}" creada con ${covers.length} portadas`);
      setNewSlug(''); setNewTitle(''); setNewDesc(''); setNewSeoDesc(''); setNewCovers('');
      setTab('list');
      load();
    } else {
      flash(`❌ ${d.error}`);
    }
  };

  // ── UI ─────────────────────────────────────────────────────────────────
  const s = {
    container: { padding: 24, background: '#f7f7f7', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' },
    h1: { fontSize: 22, fontWeight: 700, color: '#111', marginBottom: 4 },
    sub: { fontSize: 13, color: '#888', marginBottom: 20 },
    tabs: { display: 'flex', gap: 8, marginBottom: 20 },
    tab: (active: boolean) => ({ padding: '8px 18px', borderRadius: 8, border: '1px solid #e0e0e0', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, background: active ? '#CC0000' : 'white', color: active ? 'white' : '#555' }),
    row: (active: boolean) => ({ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 14px', background: active ? 'white' : '#fef2f2', borderRadius: 10, border: `1px solid ${active ? '#e5e7eb' : '#fecaca'}`, marginBottom: 8, opacity: active ? 1 : 0.7 }),
    badge: (active: boolean) => ({ fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 700, background: active ? '#dcfce7' : '#fee2e2', color: active ? '#166534' : '#991b1b' }),
    input: { padding: '9px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: 'white' },
    btn: (color: string) => ({ padding: '8px 16px', background: color, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: 600 }),
    label: { fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4, display: 'block' },
    flash: { position: 'fixed' as const, bottom: 24, right: 24, background: '#111', color: '#fff', padding: '10px 18px', borderRadius: 10, fontSize: 13, zIndex: 9999, pointerEvents: 'none' as const },
  };

  return (
    <div style={s.container}>
      <h1 style={s.h1}>🖼️ Galerías de Portadas</h1>
      <p style={s.sub}>{total} galerías en total · {galleries.filter(g => g.active).length} activas</p>

      {/* Tabs */}
      <div style={s.tabs}>
        {([['list','📋 Gestionar'],['create','➕ Nueva Galería'],['seo','🔍 SEO Masivo']] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} style={s.tab(tab === t)}>{label}</button>
        ))}
      </div>

      {/* ── TAB: LIST ──────────────────────────────────────────────────── */}
      {tab === 'list' && (
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar galería..."
              style={{ ...s.input, flex: 1 }}
            />
            <button onClick={load} style={s.btn('#0D0D0D')}>Buscar</button>
            <a href="/blog" target="_blank"
              style={{ ...s.btn('#6b7280'), textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              Ver Blog ↗
            </a>
          </div>

          <div style={{ marginBottom: 12, fontSize: 12, color: '#888' }}>
            💡 Ordena arrastrando el número de orden · Desactiva para ocultar del blog sin borrar
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>Cargando...</div>
          ) : (
            <div>
              {galleries.map(g => (
                <div key={g.id} style={s.row(g.active)}>
                  <CoverImg src={g.first_image_url || `https://www.coverbrowser.com/image/${g.slug}/1-1.jpg`} alt={g.title} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{g.title}</span>
                      <span style={s.badge(g.active)}>{g.active ? 'Activa' : 'Oculta'}</span>
                      <span style={{ fontSize: 10, background: '#f3f4f6', padding: '2px 6px', borderRadius: 4, color: '#6b7280' }}>
                        {g.source_type === 'custom' ? '✏️ Custom' : '🌐 CoverBrowser'}
                      </span>
                      {g.total_issues > 0 && (
                        <span style={{ fontSize: 10, color: '#9ca3af' }}>{g.total_issues} issues</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      /blog/covers/{g.slug}
                      {g.seo_description && <span style={{ marginLeft: 8, color: '#22c55e' }}>✓ SEO</span>}
                    </div>
                  </div>

                  {/* Sort order */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>Orden:</span>
                    <input
                      type="number" defaultValue={g.sort_order}
                      onBlur={e => updateOrder(g, parseInt(e.target.value) || 9999)}
                      style={{ ...s.input, width: 64, textAlign: 'center', fontSize: 12 }}
                    />
                  </div>

                  {/* SEO inline */}
                  <input
                    defaultValue={g.seo_description}
                    placeholder="Descripción SEO Pro..."
                    onBlur={async e => {
                      if (e.target.value !== g.seo_description) {
                        await fetch('/api/admin/galleries', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: g.id, seo_description: e.target.value }),
                        });
                        flash(`SEO guardado: ${g.title}`);
                      }
                    }}
                    style={{ ...s.input, width: 220, fontSize: 12 }}
                  />

                  {/* Toggle */}
                  <button
                    onClick={() => toggleActive(g)}
                    disabled={saving === g.id}
                    style={s.btn(g.active ? '#f59e0b' : '#22c55e')}
                  >
                    {saving === g.id ? '...' : g.active ? 'Ocultar' : 'Activar'}
                  </button>

                  {/* View */}
                  <a href={`/blog/covers/${g.slug}`} target="_blank"
                    style={{ ...s.btn('#6b7280'), textDecoration: 'none' }}>↗</a>

                  {/* Delete */}
                  <button onClick={() => deleteGallery(g)} style={s.btn('#ef4444')}>🗑</button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── TAB: CREATE CUSTOM GALLERY ─────────────────────────────────── */}
      {tab === 'create' && (
        <div style={{ maxWidth: 720, background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 20 }}>Crear galería personalizada</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={s.label}>Título *</label>
              <input value={newTitle} onChange={e => { setNewTitle(e.target.value); setNewSlug(slugify(e.target.value)); }}
                placeholder="Ej: Batman Black Label" style={{ ...s.input, width: '100%' }} />
            </div>
            <div>
              <label style={s.label}>Slug (URL) *</label>
              <input value={newSlug} onChange={e => setNewSlug(slugify(e.target.value))}
                placeholder="batman-black-label" style={{ ...s.input, width: '100%', fontFamily: 'monospace' }} />
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>/blog/covers/{newSlug || 'mi-galeria'}</div>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={s.label}>Descripción interna</label>
            <input value={newDesc} onChange={e => setNewDesc(e.target.value)}
              placeholder="Descripción de la galería para admin..."
              style={{ ...s.input, width: '100%' }} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={s.label}>Descripción SEO Pro</label>
            <textarea value={newSeoDesc} onChange={e => setNewSeoDesc(e.target.value)}
              placeholder="La Tienda de Comics IA — Batman Black Label. Colección completa de portadas de la línea adulta de DC Comics..."
              rows={3}
              style={{ ...s.input, width: '100%', resize: 'vertical' }} />
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
              Esta descripción aparece en Google. Empieza con "La Tienda de Comics IA —"
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={s.label}>
              URLs de imágenes — una por línea
              <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: 8 }}>
                Formato: URL | Título opcional
              </span>
            </label>
            <textarea
              value={newCovers}
              onChange={e => setNewCovers(e.target.value)}
              rows={12}
              placeholder={`Pega las URLs de Midtown Comics u otras fuentes:\nhttps://www.midtowncomics.com/images/PROD/XXL/1234_XXL.jpg | Batman #1\nhttps://www.midtowncomics.com/images/PROD/XXL/5678_XXL.jpg | Batman #2\n\nO cualquier URL directa de imagen:\nhttps://i.annihil.us/u/prod/marvel/i/mg/.../portrait_incredible.jpg`}
              style={{ ...s.input, width: '100%', fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }}
            />
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
              {newCovers.split('\n').filter(l => l.trim().startsWith('http')).length} URLs detectadas
            </div>
          </div>

          {/* Preview first cover */}
          {(() => {
            const firstUrl = newCovers.split('\n').find(l => l.trim().startsWith('http'))?.split('|')[0].trim();
            return firstUrl ? (
              <div style={{ marginBottom: 16 }}>
                <label style={s.label}>Vista previa primera portada</label>
                <img src={firstUrl} alt="preview" referrerPolicy="no-referrer"
                  style={{ height: 120, objectFit: 'contain', borderRadius: 6, border: '1px solid #e5e7eb', background: '#f3f4f6' }} />
              </div>
            ) : null;
          })()}

          <button onClick={createGallery} disabled={creating || !newSlug || !newTitle}
            style={{ ...s.btn('#CC0000'), opacity: creating || !newSlug || !newTitle ? 0.5 : 1 }}>
            {creating ? '⏳ Creando...' : '✅ Crear Galería'}
          </button>
        </div>
      )}

      {/* ── TAB: SEO MASIVO ────────────────────────────────────────────── */}
      {tab === 'seo' && (
        <div style={{ maxWidth: 900 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111', margin: 0 }}>SEO Pro — Edición Masiva</h2>
              <p style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                Cada descripción empieza con "La Tienda de Comics IA — [Título]."
                Google usa el primer párrafo para el snippet.
              </p>
            </div>
            <button onClick={saveSeoAll} disabled={savingSeo} style={s.btn('#22c55e')}>
              {savingSeo ? '⏳ Guardando...' : '💾 Guardar Todo'}
            </button>
          </div>

          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#92400e' }}>
            💡 Fórmula SEO recomendada: <b>"La Tienda de Comics IA — [Título]. [Descripción] con portadas desde [año]. Colección completa disponible en Colombia y LATAM."</b>
          </div>

          {galleries.map(g => (
            <div key={g.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10, padding: '12px 14px', background: 'white', borderRadius: 10, border: '1px solid #e5e7eb' }}>
              <CoverImg src={g.first_image_url || `https://www.coverbrowser.com/image/${g.slug}/1-1.jpg`} alt={g.title} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 6 }}>
                  {g.title}
                  {!g.active && <span style={{ marginLeft: 8, fontSize: 10, color: '#9ca3af' }}>(oculta)</span>}
                </div>
                <textarea
                  value={seoEdits[g.slug] ?? g.seo_description}
                  onChange={e => setSeoEdits(prev => ({ ...prev, [g.slug]: e.target.value }))}
                  rows={2}
                  placeholder={`La Tienda de Comics IA — ${g.title}. Colección completa de portadas...`}
                  style={{ ...s.input, width: '100%', resize: 'vertical', fontSize: 12 }}
                />
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>
                  {(seoEdits[g.slug] ?? g.seo_description ?? '').length} chars
                  {(seoEdits[g.slug] ?? g.seo_description ?? '').length > 160 && (
                    <span style={{ color: '#f59e0b', marginLeft: 8 }}>⚠️ &gt;160 chars — ideal para descripción</span>
                  )}
                </div>
              </div>
            </div>
          ))}

          <div style={{ textAlign: 'center', paddingTop: 16 }}>
            <button onClick={saveSeoAll} disabled={savingSeo} style={s.btn('#CC0000')}>
              {savingSeo ? '⏳ Guardando...' : '💾 Guardar Todo'}
            </button>
          </div>
        </div>
      )}

      {/* Flash message */}
      {msg && <div style={s.flash}>{msg}</div>}
    </div>
  );
}
