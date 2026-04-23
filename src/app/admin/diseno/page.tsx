'use client';
import { useState, useEffect } from 'react';

const GOOGLE_FONTS = [
  { name: 'Inter', sample: 'La Tienda de Comics' },
  { name: 'Oswald', sample: 'LA TIENDA DE COMICS' },
  { name: 'Roboto', sample: 'La Tienda de Comics' },
  { name: 'Montserrat', sample: 'La Tienda de Comics' },
  { name: 'Playfair Display', sample: 'La Tienda de Comics' },
  { name: 'Lato', sample: 'La Tienda de Comics' },
  { name: 'Raleway', sample: 'La Tienda de Comics' },
  { name: 'Poppins', sample: 'La Tienda de Comics' },
  { name: 'Nunito', sample: 'La Tienda de Comics' },
  { name: 'Source Sans 3', sample: 'La Tienda de Comics' },
  { name: 'Libre Baskerville', sample: 'La Tienda de Comics' },
  { name: 'Merriweather', sample: 'La Tienda de Comics' },
  { name: 'PT Serif', sample: 'La Tienda de Comics' },
  { name: 'Space Grotesk', sample: 'La Tienda de Comics' },
  { name: 'DM Sans', sample: 'La Tienda de Comics' },
  { name: 'Work Sans', sample: 'La Tienda de Comics' },
  { name: 'Rubik', sample: 'La Tienda de Comics' },
  { name: 'Barlow', sample: 'La Tienda de Comics' },
  { name: 'Josefin Sans', sample: 'La Tienda de Comics' },
  { name: 'Bebas Neue', sample: 'LA TIENDA DE COMICS' },
  { name: 'Anton', sample: 'LA TIENDA DE COMICS' },
  { name: 'Righteous', sample: 'La Tienda de Comics' },
  { name: 'Bangers', sample: 'La Tienda de Comics!' },
  { name: 'Permanent Marker', sample: 'La Tienda de Comics' },
  { name: 'Comic Neue', sample: 'La Tienda de Comics' },
];

const SOLID_COLORS = [
  { label: 'Halftone Cream', value: '#F5F0E6' },
  { label: 'Blanco', value: '#FFFFFF' },
  { label: 'Negro', value: '#0A0A0A' },
  { label: 'Gris claro', value: '#F7F7F7' },
  { label: 'Rojo oscuro', value: '#1a0000' },
  { label: 'Azul noche', value: '#0d1b2a' },
  { label: 'Verde oscuro', value: '#0a1a0a' },
  { label: 'Amarillo cómic', value: '#FFF9E6' },
  { label: 'Kraft', value: '#E8DCC8' },
];

const HEADER_COLORS = [
  { label: 'Rojo Marvel', value: '#CC0000' },
  { label: 'Negro', value: '#0A0A0A' },
  { label: 'Azul DC', value: '#0476D0' },
  { label: 'Verde', value: '#15803d' },
  { label: 'Morado', value: '#7c3aed' },
  { label: 'Naranja', value: '#c2410c' },
];

const PRESET_BG_IMAGES = [
  { label: 'Comics clásico', value: '/background.jpg' },
  { label: 'Sin imagen', value: '' },
];

type Tab = 'fuentes' | 'fondos';

export default function DisenoPag() {
  const [tab, setTab] = useState<Tab>('fuentes');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [msg, setMsg] = useState('');

  // Font settings
  const [selectedFont, setSelectedFont] = useState('Inter');
  const [fontSearch, setFontSearch] = useState('');
  const [customFont, setCustomFont] = useState('');

  // Background settings
  const [bgType, setBgType] = useState<'pattern' | 'color' | 'image'>('pattern');
  const [bgColor, setBgColor] = useState('#F5F0E6');
  const [bgImageUrl, setBgImageUrl] = useState('');
  const [bgOpacity, setBgOpacity] = useState(88);
  const [headerColor, setHeaderColor] = useState('#CC0000');

  // Preview font injection
  useEffect(() => {
    const fontToLoad = customFont.trim() || selectedFont;
    if (fontToLoad && fontToLoad !== 'Inter') {
      const id = 'admin-preview-font';
      const existing = document.getElementById(id);
      if (!existing) {
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontToLoad)}:wght@400;700;900&display=swap`;
        document.head.appendChild(link);
      } else {
        (existing as HTMLLinkElement).href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontToLoad)}:wght@400;700;900&display=swap`;
      }
    }
  }, [selectedFont, customFont]);

  // Load current settings
  useEffect(() => {
    fetch('/api/settings?keys=site_font,site_bg_type,site_bg_value,site_bg_opacity,site_header_color')
      .then(r => r.json())
      .then(d => {
        if (d.site_font) setSelectedFont(d.site_font);
        if (d.site_bg_type) setBgType(d.site_bg_type as any);
        if (d.site_bg_value) {
          if (d.site_bg_type === 'color') setBgColor(d.site_bg_value);
          else if (d.site_bg_type === 'image') setBgImageUrl(d.site_bg_value);
        }
        if (d.site_bg_opacity) setBgOpacity(parseInt(d.site_bg_opacity));
        if (d.site_header_color) setHeaderColor(d.site_header_color);
      }).catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    const fontToSave = customFont.trim() || selectedFont;
    const bgValue = bgType === 'color' ? bgColor : bgType === 'image' ? bgImageUrl : '';
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        site_font: fontToSave,
        site_bg_type: bgType,
        site_bg_value: bgValue,
        site_bg_opacity: String(bgOpacity),
        site_header_color: headerColor,
      }),
    }).catch(() => {});
    setSaving(false);
    setSaved(true);
    setMsg('✅ Cambios guardados. Se aplicarán en el próximo reload de la tienda.');
    setTimeout(() => { setSaved(false); setMsg(''); }, 4000);
  };

  const previewFont = customFont.trim() || selectedFont;
  const filteredFonts = GOOGLE_FONTS.filter(f =>
    f.name.toLowerCase().includes(fontSearch.toLowerCase())
  );

  const S = {
    card: { background: '#fff', border: '1px solid #ebebeb', borderRadius: 12, padding: 20, marginBottom: 20 },
    h2: { fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 14 },
    label: { fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4, display: 'block' as const },
    inp: { padding: '9px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: 'white', width: '100%' },
    btn: (bg: string, active = false) => ({
      padding: '8px 16px', background: active ? bg : 'white', color: active ? 'white' : '#555',
      border: `1px solid ${active ? bg : '#e0e0e0'}`, borderRadius: 8,
      cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: 600,
    }),
  };

  return (
    <div style={{ padding: '24px 28px', maxWidth: 820, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111' }}>🎨 Diseño del sitio</h1>
        {msg && <span style={{ fontSize: 13, color: '#15803d', background: '#f0fdf4', padding: '6px 14px', borderRadius: 20, fontWeight: 600 }}>{msg}</span>}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['fuentes', 'fondos'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '9px 20px', borderRadius: 9, border: '1px solid #e0e0e0', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, background: tab === t ? '#CC0000' : 'white', color: tab === t ? 'white' : '#555', textTransform: 'capitalize' }}>
            {t === 'fuentes' ? '🔤 Fuentes' : '🖼️ Fondos'}
          </button>
        ))}
        <button onClick={save} disabled={saving}
          style={{ marginLeft: 'auto', padding: '9px 24px', borderRadius: 9, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, background: saving ? '#ccc' : '#0D0D0D', color: 'white' }}>
          {saving ? '⏳ Guardando...' : '💾 Guardar cambios'}
        </button>
      </div>

      {/* ── TAB: FUENTES ─────────────────────────────────────────────────── */}
      {tab === 'fuentes' && (
        <>
          {/* Live preview */}
          <div style={{ ...S.card, background: '#0A0A0A', border: '3px solid #0A0A0A', boxShadow: '5px 5px 0 #CC0000', marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#F5C518', letterSpacing: '.15em', marginBottom: 12 }}>VISTA PREVIA EN VIVO</div>
            <div style={{ fontFamily: `'${previewFont}', sans-serif`, fontSize: 40, fontWeight: 900, color: '#fff', lineHeight: .9, textTransform: 'uppercase', letterSpacing: '-.02em' }}>
              LA TIENDA DE COMICS
            </div>
            <div style={{ fontFamily: `'${previewFont}', sans-serif`, fontSize: 20, color: '#F5C518', marginTop: 12 }}>
              Cómics · Manga · Figuras
            </div>
            <div style={{ fontFamily: `'${previewFont}', sans-serif`, fontSize: 14, color: '#888', marginTop: 8 }}>
              Busca un cómic, personaje, saga… · El mejor Batman para regalar…
            </div>
            <div style={{ marginTop: 16, fontFamily: 'monospace', fontSize: 11, color: '#555' }}>
              Fuente activa: <span style={{ color: '#F5C518' }}>{previewFont}</span>
            </div>
          </div>

          {/* Custom Google Font input */}
          <div style={S.card}>
            <h2 style={S.h2}>Google Font personalizada</h2>
            <label style={S.label}>Nombre exacto de la fuente en Google Fonts</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={customFont}
                onChange={e => setCustomFont(e.target.value)}
                placeholder="Ej: Bebas Neue, Cinzel, Dancing Script..."
                style={{ ...S.inp, flex: 1 }}
              />
              <a href="https://fonts.google.com" target="_blank" rel="noopener noreferrer"
                style={{ padding: '9px 14px', background: '#f3f4f6', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 13, color: '#374151', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                Google Fonts ↗
              </a>
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>
              Si llenan este campo, tiene prioridad sobre la selección del listado de abajo.
            </div>
          </div>

          {/* Font picker */}
          <div style={S.card}>
            <h2 style={S.h2}>Fuentes recomendadas</h2>
            <input
              value={fontSearch}
              onChange={e => setFontSearch(e.target.value)}
              placeholder="Buscar fuente..."
              style={{ ...S.inp, marginBottom: 16 }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
              {filteredFonts.map(f => (
                <button key={f.name} onClick={() => { setSelectedFont(f.name); setCustomFont(''); }}
                  style={{
                    padding: '12px 14px', textAlign: 'left', cursor: 'pointer',
                    background: selectedFont === f.name && !customFont ? '#fff5f5' : 'white',
                    border: `2px solid ${selectedFont === f.name && !customFont ? '#CC0000' : '#e5e7eb'}`,
                    borderRadius: 8, transition: 'border-color .15s',
                  }}>
                  <div style={{ fontSize: 18, fontFamily: `'${f.name}', sans-serif`, fontWeight: 700, color: '#111', marginBottom: 4, lineHeight: 1.2 }}>
                    {f.sample}
                  </div>
                  <div style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace' }}>{f.name}</div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── TAB: FONDOS ──────────────────────────────────────────────────── */}
      {tab === 'fondos' && (
        <>
          {/* Background type */}
          <div style={S.card}>
            <h2 style={S.h2}>Tipo de fondo</h2>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {([['pattern', '✦ Halftone (defecto)'], ['color', '🎨 Color sólido'], ['image', '🖼️ Imagen']] as const).map(([val, label]) => (
                <button key={val} onClick={() => setBgType(val)}
                  style={S.btn('#CC0000', bgType === val)}>
                  {label}
                </button>
              ))}
            </div>

            {bgType === 'color' && (
              <div>
                <label style={S.label}>Color de fondo</label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                  {SOLID_COLORS.map(c => (
                    <button key={c.value} onClick={() => setBgColor(c.value)}
                      style={{ width: 44, height: 44, background: c.value, border: `3px solid ${bgColor === c.value ? '#CC0000' : '#e5e7eb'}`, borderRadius: 8, cursor: 'pointer', position: 'relative' }}
                      title={c.label}>
                      {bgColor === c.value && <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✓</span>}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <label style={{ ...S.label, margin: 0, width: 'auto' }}>Color personalizado:</label>
                  <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
                    style={{ width: 44, height: 36, padding: 2, border: '1px solid #e0e0e0', borderRadius: 6, cursor: 'pointer' }} />
                  <input value={bgColor} onChange={e => setBgColor(e.target.value)} placeholder="#F5F0E6"
                    style={{ ...S.inp, width: 120 }} />
                </div>
              </div>
            )}

            {bgType === 'image' && (
              <div>
                <label style={S.label}>URL de la imagen de fondo</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <input value={bgImageUrl} onChange={e => setBgImageUrl(e.target.value)}
                    placeholder="https://... o /background.jpg"
                    style={{ ...S.inp, flex: 1 }} />
                  {bgImageUrl && (
                    <img src={bgImageUrl} alt="preview" style={{ width: 60, height: 44, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5e7eb', flexShrink: 0 }} />
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                  {PRESET_BG_IMAGES.map(p => (
                    <button key={p.label} onClick={() => setBgImageUrl(p.value)}
                      style={{ ...S.btn('#0D0D0D', bgImageUrl === p.value), fontSize: 12 }}>
                      {p.label}
                    </button>
                  ))}
                </div>
                <label style={S.label}>Opacidad de superposición: {bgOpacity}%</label>
                <input type="range" min={0} max={100} step={1} value={bgOpacity} onChange={e => setBgOpacity(parseInt(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer' }} />
              </div>
            )}
          </div>

          {/* Header color */}
          <div style={S.card}>
            <h2 style={S.h2}>Color del header / navbar</h2>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              {HEADER_COLORS.map(c => (
                <button key={c.value} onClick={() => setHeaderColor(c.value)}
                  style={{ width: 44, height: 44, background: c.value, border: `3px solid ${headerColor === c.value ? '#111' : '#e5e7eb'}`, borderRadius: 8, cursor: 'pointer', position: 'relative' }}
                  title={c.label}>
                  {headerColor === c.value && <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#fff' }}>✓</span>}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label style={{ ...S.label, margin: 0 }}>Personalizado:</label>
              <input type="color" value={headerColor} onChange={e => setHeaderColor(e.target.value)}
                style={{ width: 44, height: 36, padding: 2, border: '1px solid #e0e0e0', borderRadius: 6, cursor: 'pointer' }} />
              <input value={headerColor} onChange={e => setHeaderColor(e.target.value)}
                style={{ ...S.inp, width: 110 }} />
            </div>
            {/* Preview header */}
            <div style={{ marginTop: 16, background: headerColor, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 16, borderRadius: 8, border: '2px solid #0A0A0A' }}>
              <img src="/logo.webp" alt="logo" style={{ height: 28, objectFit: 'contain' }} />
              <div style={{ display: 'flex', gap: 8 }}>
                {['Catálogo', 'Blog', 'Comics IA'].map(l => (
                  <span key={l} style={{ padding: '4px 10px', border: '2px solid rgba(255,255,255,.4)', color: 'rgba(255,255,255,.85)', fontSize: 11, fontWeight: 700, fontFamily: 'monospace', borderRadius: 3 }}>{l}</span>
                ))}
              </div>
              <span style={{ marginLeft: 'auto', background: '#F5C518', color: '#0A0A0A', padding: '5px 12px', fontSize: 11, fontWeight: 800, fontFamily: 'monospace', border: '2px solid #0A0A0A' }}>🛒 Carrito</span>
            </div>
          </div>

          {/* Preview panel */}
          <div style={{ ...S.card, border: '2px solid #e5e7eb' }}>
            <h2 style={S.h2}>Vista previa del fondo</h2>
            <div style={{
              height: 140, borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb',
              background: bgType === 'color' ? bgColor : bgType === 'image' && bgImageUrl ? `url(${bgImageUrl}) center/cover` : '#F5F0E6',
              backgroundImage: bgType === 'pattern' ? 'radial-gradient(circle at 1px 1px, rgba(0,0,0,.10) 1px, transparent 0)' : undefined,
              backgroundSize: bgType === 'pattern' ? '6px 6px' : undefined,
              position: 'relative',
            }}>
              {bgType === 'image' && bgImageUrl && (
                <div style={{ position: 'absolute', inset: 0, background: `rgba(245,240,230,${bgOpacity / 100})` }} />
              )}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: 'rgba(255,255,255,.9)', border: '3px solid #0A0A0A', boxShadow: '4px 4px 0 #0A0A0A', padding: '12px 24px', fontFamily: 'monospace', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>
                  PREVIEW DEL FONDO
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
