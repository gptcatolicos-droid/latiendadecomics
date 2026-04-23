'use client';
import { useState, useEffect, useCallback } from 'react';

// ── Google Fonts list ─────────────────────────────────────────────────────
const FONTS = [
  'Inter','Oswald','Roboto','Montserrat','Playfair Display','Lato','Raleway',
  'Poppins','Nunito','Source Sans 3','Libre Baskerville','Merriweather',
  'Space Grotesk','DM Sans','Work Sans','Rubik','Barlow','Josefin Sans',
  'Bebas Neue','Anton','Righteous','Bangers','Permanent Marker','Comic Neue',
  'PT Serif','Cinzel','Abril Fatface','Lobster','Pacifico','Dancing Script',
];

const HEADER_COLORS = ['#CC0000','#0A0A0A','#0476D0','#15803d','#7c3aed','#c2410c','#1e293b','#b45309'];
const PRICE_COLORS  = ['#CC0000','#15803d','#0476D0','#c2410c','#7c3aed','#0A0A0A'];
const BG_COLORS     = ['#F5F0E6','#FFFFFF','#0A0A0A','#F7F7F7','#1a0000','#0d1b2a','#E8DCC8','#FFF9E6'];

type Tab = 'fuentes' | 'fondos' | 'colores' | 'botones' | 'cards' | 'header';

interface Settings { [k: string]: string }

function ColorRow({ label, value, options, custom, onChange }: {
  label: string; value: string; options: string[]; custom?: boolean; onChange: (v: string) => void;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {options.map(c => (
          <button key={c} onClick={() => onChange(c)}
            style={{ width: 34, height: 34, background: c, border: `3px solid ${value === c ? '#111' : 'transparent'}`, borderRadius: 8, cursor: 'pointer', position: 'relative', flexShrink: 0 }}
            title={c}>
            {value === c && <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, textShadow: '0 1px 3px rgba(0,0,0,.8)' }}>✓</span>}
          </button>
        ))}
        {custom && (
          <>
            <input type="color" value={value} onChange={e => onChange(e.target.value)}
              style={{ width: 34, height: 34, padding: 2, border: '1px solid #e0e0e0', borderRadius: 6, cursor: 'pointer' }} />
            <input value={value} onChange={e => onChange(e.target.value)} placeholder="#CC0000"
              style={{ width: 90, padding: '6px 8px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 12, fontFamily: 'monospace', outline: 'none' }} />
          </>
        )}
      </div>
      <div style={{ width: '100%', height: 8, background: value, borderRadius: 4, marginTop: 6, border: '1px solid rgba(0,0,0,.1)' }} />
    </div>
  );
}

function FontPicker({ label, value, onChange, search, onSearch }: {
  label: string; value: string; onChange: (v: string) => void; search: string; onSearch: (v: string) => void;
}) {
  const filtered = FONTS.filter(f => f.toLowerCase().includes(search.toLowerCase()));
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <input value={search} onChange={e => onSearch(e.target.value)} placeholder="Buscar..."
          style={{ flex: 1, padding: '7px 10px', border: '1px solid #e0e0e0', borderRadius: 7, fontSize: 12, outline: 'none' }} />
        {value && value !== 'Inter' && (
          <div style={{ padding: '7px 12px', background: '#f9fafb', border: '1px solid #e0e0e0', borderRadius: 7, fontSize: 12, fontFamily: `'${value}',sans-serif`, fontWeight: 700 }}>
            {value}
          </div>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 8, maxHeight: 240, overflowY: 'auto' }}>
        {filtered.map(f => (
          <button key={f} onClick={() => onChange(f)}
            style={{ padding: '10px 12px', textAlign: 'left', cursor: 'pointer', background: value === f ? '#fff5f5' : 'white', border: `2px solid ${value === f ? '#CC0000' : '#e5e7eb'}`, borderRadius: 8, fontFamily: `'${f}',sans-serif` }}>
            <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.2, marginBottom: 2, color: '#111' }}>Comics IA</div>
            <div style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace' }}>{f}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function DisenoPag() {
  const [tab, setTab] = useState<Tab>('fuentes');
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState('');
  const [s, setS] = useState<Settings>({
    site_font: 'Inter', font_heading: '', font_body: '', font_cards: '', font_chat: '',
    color_h1: '#0A0A0A', color_h2: '#111111', color_body: '#333333',
    color_price: '#CC0000', color_card_title: '#0A0A0A',
    color_btn_buy_bg: '#CC0000', color_btn_buy_text: '#ffffff',
    color_btn_view_bg: '#0A0A0A', color_btn_view_text: '#ffffff',
    btn_radius: '10px', btn_style: 'solid',
    card_radius: '12px', card_border: '1.5px solid #EFEFEF',
    card_shadow: '0 2px 8px rgba(0,0,0,.05)',
    card_shadow_hover: '0 8px 24px rgba(0,0,0,.14)',
    site_bg_type: 'pattern', site_bg_value: '', site_bg_opacity: '88',
    site_header_color: '#CC0000',
    header_buttons: JSON.stringify({catalogo:true,blog:true,marvel:true,dc:true,comicsia:true}),
  });

  const [fontSearch, setFontSearch] = useState<Record<string,string>>({});
  const [headerBtns, setHeaderBtns] = useState<Record<string,boolean>>({});

  useEffect(() => {
    const keys = Object.keys(s).join(',');
    fetch(`/api/settings?keys=${keys}`)
      .then(r => r.json())
      .then((d: Settings) => {
        setS(prev => ({ ...prev, ...d }));
        try { setHeaderBtns(JSON.parse(d.header_buttons || '{}')); } catch {}
      }).catch(() => {});
  }, []);

  // Inject Google Font preview
  useEffect(() => {
    const fontsToLoad = [s.site_font, s.font_heading, s.font_body, s.font_cards, s.font_chat].filter(Boolean);
    fontsToLoad.forEach(f => {
      if (!f || f === 'Inter') return;
      const id = `preview-${f.replace(/\s/g,'_')}`;
      if (document.getElementById(id)) return;
      const link = document.createElement('link');
      link.id = id; link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(f!)}:wght@400;700;900&display=swap`;
      document.head.appendChild(link);
    });
  }, [s.site_font, s.font_heading, s.font_body, s.font_cards, s.font_chat]);

  const set = (k: string, v: string) => setS(prev => ({ ...prev, [k]: v }));

  const save = async () => {
    setSaving(true);
    const toSave = { ...s, header_buttons: JSON.stringify(headerBtns) };
    await fetch('/api/settings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toSave),
    }).catch(() => {});
    setSaving(false);
    setFlash('✅ Guardado — recarga la tienda para ver los cambios');
    setTimeout(() => setFlash(''), 4000);
  };

  const globalFont = s.site_font || 'Inter';

  const TABS: [Tab, string][] = [
    ['fuentes','🔤 Fuentes'],['fondos','🖼️ Fondos'],['colores','🎨 Colores'],
    ['botones','🔘 Botones'],['cards','🃏 Cards'],['header','📐 Header'],
  ];

  const inp = { padding: '9px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: 'white', width: '100%' } as React.CSSProperties;
  const card = { background: '#fff', border: '1px solid #ebebeb', borderRadius: 12, padding: 20, marginBottom: 20 } as React.CSSProperties;

  return (
    <div style={{ padding: '20px 28px', maxWidth: 860, fontFamily: 'system-ui,sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111', margin: 0 }}>🎨 Suite de Diseño</h1>
        {flash && <span style={{ fontSize: 12, color: '#15803d', background: '#f0fdf4', padding: '6px 14px', borderRadius: 20, fontWeight: 600 }}>{flash}</span>}
        <button onClick={save} disabled={saving}
          style={{ marginLeft: 'auto', padding: '9px 24px', borderRadius: 9, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, background: saving ? '#ccc' : '#0D0D0D', color: 'white' }}>
          {saving ? '⏳...' : '💾 Guardar todo'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
        {TABS.map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e0e0e0', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, background: tab === t ? '#CC0000' : 'white', color: tab === t ? 'white' : '#555' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── FUENTES ─────────────────────────────────────── */}
      {tab === 'fuentes' && (
        <>
          {/* Live preview */}
          <div style={{ ...card, background: '#0A0A0A', border: '3px solid #0A0A0A', boxShadow: '5px 5px 0 #CC0000' }}>
            <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#F5C518', letterSpacing: '.15em', marginBottom: 12 }}>PREVIEW</div>
            <div style={{ fontFamily: `'${s.font_heading || globalFont}',sans-serif`, fontSize: 36, fontWeight: 900, color: '#fff', textTransform: 'uppercase', lineHeight: .9 }}>LA TIENDA DE COMICS</div>
            <div style={{ fontFamily: `'${s.font_body || globalFont}',sans-serif`, fontSize: 15, color: '#ccc', marginTop: 12, lineHeight: 1.5 }}>Jarvis lee, compara y recomienda. El mejor Batman para regalar.</div>
            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
              {[['Títulos',s.font_heading||globalFont,'h1'],['Cuerpo',s.font_body||globalFont,'body'],['Cards',s.font_cards||globalFont,'card'],['Chat',s.font_chat||globalFont,'chat']].map(([l,f,k]) => (
                <div key={k} style={{ background: '#1a1a1a', borderRadius: 6, padding: '8px 10px' }}>
                  <div style={{ fontFamily: `'${f}',sans-serif`, fontSize: 14, fontWeight: 700, color: '#F5C518' }}>{l}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#555', marginTop: 2 }}>{f}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={card}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Fuente global</h2>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>Se aplica a todo el sitio como base. Cada sección puede sobrescribirla.</div>
            <FontPicker label="" value={globalFont} onChange={v => set('site_font', v)} search={fontSearch.global||''} onSearch={v => setFontSearch(p=>({...p,global:v}))} />
          </div>

          {[
            { key: 'font_heading', label: '🔠 Titulares (H1, H2)', desc: 'Nombre del producto, sección headers' },
            { key: 'font_body', label: '📝 Texto de cuerpo', desc: 'Descripciones, textos informativos' },
            { key: 'font_cards', label: '🃏 Cards de producto', desc: 'Título y precio en las cards del catálogo' },
            { key: 'font_chat', label: '💬 Chat Jarvis', desc: 'Mensajes del chat IA' },
          ].map(({ key, label, desc }) => (
            <div key={key} style={{ ...card, borderLeft: '3px solid #CC0000' }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>{desc}</div>
              <FontPicker label="" value={s[key] || '(usa global)'} onChange={v => set(key, v)} search={fontSearch[key]||''} onSearch={v => setFontSearch(p=>({...p,[key]:v}))} />
              {s[key] && <button onClick={() => set(key, '')} style={{ fontSize: 11, color: '#CC0000', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>✕ Usar fuente global</button>}
            </div>
          ))}
        </>
      )}

      {/* ── FONDOS ──────────────────────────────────────── */}
      {tab === 'fondos' && (
        <>
          <div style={card}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Tipo de fondo</h2>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {([['pattern','✦ Halftone'],['color','🎨 Color'],['image','🖼️ Imagen']] as const).map(([v,l]) => (
                <button key={v} onClick={() => set('site_bg_type', v)}
                  style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid #e0e0e0`, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, background: s.site_bg_type===v ? '#CC0000' : 'white', color: s.site_bg_type===v ? 'white' : '#555' }}>{l}</button>
              ))}
            </div>
            {s.site_bg_type === 'color' && (
              <ColorRow label="Color de fondo" value={s.site_bg_value||'#F5F0E6'} options={BG_COLORS} custom onChange={v => set('site_bg_value', v)} />
            )}
            {s.site_bg_type === 'image' && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>URL de la imagen</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <input value={s.site_bg_value} onChange={e => set('site_bg_value', e.target.value)} placeholder="/background.jpg" style={inp} />
                  {s.site_bg_value && <img src={s.site_bg_value} alt="" style={{ width: 50, height: 36, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5e7eb', flexShrink: 0 }} />}
                </div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Opacidad: {s.site_bg_opacity}%</label>
                <input type="range" min={0} max={100} value={s.site_bg_opacity} onChange={e => set('site_bg_opacity', e.target.value)} style={{ width: '100%' }} />
              </div>
            )}
          </div>

          <div style={card}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Color del header / navbar</h2>
            <ColorRow label="" value={s.site_header_color} options={HEADER_COLORS} custom onChange={v => set('site_header_color', v)} />
            {/* Preview */}
            <div style={{ background: s.site_header_color, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 14, borderRadius: 8, border: '2px solid #0A0A0A', marginTop: 8 }}>
              <img src="/logo.webp" alt="logo" style={{ height: 28, objectFit: 'contain' }} />
              {['Catálogo','Blog','Comics IA'].map(l => (
                <span key={l} style={{ padding: '4px 10px', border: '2px solid rgba(255,255,255,.4)', color: 'rgba(255,255,255,.85)', fontSize: 11, fontWeight: 700, fontFamily: 'monospace', borderRadius: 3 }}>{l}</span>
              ))}
              <span style={{ marginLeft: 'auto', background: '#F5C518', color: '#0A0A0A', padding: '5px 12px', fontSize: 11, fontWeight: 800, fontFamily: 'monospace', border: '2px solid #0A0A0A' }}>🛒 Carrito</span>
            </div>
          </div>
        </>
      )}

      {/* ── COLORES ─────────────────────────────────────── */}
      {tab === 'colores' && (
        <>
          <div style={{ ...card, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <ColorRow label="H1 — Título principal (página de producto)" value={s.color_h1} options={['#0A0A0A','#CC0000','#0476D0','#fff','#111']} custom onChange={v => set('color_h1', v)} />
            <ColorRow label="H2 — Subtítulos y secciones" value={s.color_h2} options={['#111111','#CC0000','#374151','#0476D0']} custom onChange={v => set('color_h2', v)} />
            <ColorRow label="Texto cuerpo / descripciones" value={s.color_body} options={['#333333','#0A0A0A','#555','#6b7280','#fff']} custom onChange={v => set('color_body', v)} />
            <ColorRow label="Precio (COP / USD)" value={s.color_price} options={PRICE_COLORS} custom onChange={v => set('color_price', v)} />
            <ColorRow label="Títulos en cards de producto" value={s.color_card_title} options={['#0A0A0A','#111','#CC0000','#0476D0']} custom onChange={v => set('color_card_title', v)} />
          </div>

          {/* Live preview */}
          <div style={{ ...card, background: 'var(--site-bg,#F5F0E6)', border: '2px solid #0A0A0A' }}>
            <div style={{ fontSize: 11, fontFamily: 'monospace', marginBottom: 12, letterSpacing: '.1em' }}>PREVIEW DE COLORES</div>
            <h1 style={{ fontFamily: `'${s.font_heading||globalFont}',sans-serif`, fontSize: 26, color: s.color_h1, margin: '0 0 8px' }}>Kingdom Come DC Comics</h1>
            <h2 style={{ fontFamily: `'${s.font_heading||globalFont}',sans-serif`, fontSize: 18, color: s.color_h2, margin: '0 0 10px' }}>DESCRIPCIÓN</h2>
            <p style={{ fontFamily: `'${s.font_body||globalFont}',sans-serif`, color: s.color_body, fontSize: 14, lineHeight: 1.6, margin: '0 0 12px' }}>Mark Waid e ilustrada por Alex Ross. Una obra maestra del cómic.</p>
            <div style={{ fontFamily: `'${s.font_cards||globalFont}',sans-serif`, fontSize: 28, fontWeight: 900, color: s.color_price }}>$63.954 COP</div>
          </div>
        </>
      )}

      {/* ── BOTONES ─────────────────────────────────────── */}
      {tab === 'botones' && (
        <>
          <div style={card}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Estilo de botón</h2>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
              {([['solid','Sólido'],['outline','Outline'],['brutalist','Brutalista']] as const).map(([v,l]) => (
                <button key={v} onClick={() => set('btn_style', v)}
                  style={{ padding: '9px 18px', borderRadius: 8, border: `1px solid #e0e0e0`, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, background: s.btn_style===v ? '#0D0D0D' : 'white', color: s.btn_style===v ? 'white' : '#555' }}>{l}</button>
              ))}
            </div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>Border radius: {s.btn_radius}</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {['0px','4px','8px','10px','12px','999px'].map(r => (
                <button key={r} onClick={() => set('btn_radius', r)}
                  style={{ padding: '7px 14px', borderRadius: parseInt(r) > 20 ? '999px' : r, border: `2px solid ${s.btn_radius===r?'#CC0000':'#e0e0e0'}`, background: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                  {r === '0px' ? 'Cuadrado' : r === '999px' ? 'Redondo' : r}
                </button>
              ))}
            </div>
          </div>

          <div style={{ ...card, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Botón Comprar ahora</h3>
              <ColorRow label="Fondo" value={s.color_btn_buy_bg} options={['#CC0000','#0A0A0A','#15803d','#0476D0','#7c3aed']} custom onChange={v => set('color_btn_buy_bg', v)} />
              <ColorRow label="Texto" value={s.color_btn_buy_text} options={['#ffffff','#0A0A0A','#F5C518']} custom onChange={v => set('color_btn_buy_text', v)} />
            </div>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Botón Ver producto</h3>
              <ColorRow label="Fondo" value={s.color_btn_view_bg} options={['#0A0A0A','#CC0000','#f3f4f6','#0476D0']} custom onChange={v => set('color_btn_view_bg', v)} />
              <ColorRow label="Texto" value={s.color_btn_view_text} options={['#ffffff','#0A0A0A','#F5C518']} custom onChange={v => set('color_btn_view_text', v)} />
            </div>
          </div>

          {/* Button preview */}
          <div style={{ ...card, background: '#f9fafb' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 12 }}>PREVIEW</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button style={{
                padding: '12px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                background: s.btn_style === 'outline' ? 'transparent' : s.color_btn_buy_bg,
                color: s.btn_style === 'outline' ? s.color_btn_buy_bg : s.color_btn_buy_text,
                border: s.btn_style === 'outline' ? `2px solid ${s.color_btn_buy_bg}` : s.btn_style === 'brutalist' ? '3px solid #0A0A0A' : 'none',
                borderRadius: s.btn_radius,
                boxShadow: s.btn_style === 'brutalist' ? '4px 4px 0 #0A0A0A' : 'none',
                fontFamily: `'${globalFont}',sans-serif`,
              }}>Comprar ahora →</button>
              <button style={{
                padding: '12px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                background: s.color_btn_view_bg, color: s.color_btn_view_text, border: 'none',
                borderRadius: s.btn_radius, fontFamily: `'${globalFont}',sans-serif`,
              }}>Ver producto</button>
            </div>
          </div>
        </>
      )}

      {/* ── CARDS ────────────────────────────────────────── */}
      {tab === 'cards' && (
        <>
          <div style={card}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Estilo de card</h2>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
              {[
                { label: 'Clásico', radius: '12px', border: '1.5px solid #EFEFEF', shadow: '0 2px 8px rgba(0,0,0,.05)', shadowH: '0 8px 24px rgba(0,0,0,.14)' },
                { label: 'Brutalista', radius: '0px', border: '3px solid #0A0A0A', shadow: '4px 4px 0 #0A0A0A', shadowH: '6px 6px 0 #CC0000' },
                { label: 'Moderno', radius: '16px', border: '1px solid #e5e7eb', shadow: '0 4px 16px rgba(0,0,0,.08)', shadowH: '0 12px 32px rgba(0,0,0,.16)' },
                { label: 'Minimal', radius: '4px', border: '1px solid #D0D0D0', shadow: 'none', shadowH: '0 4px 12px rgba(0,0,0,.12)' },
              ].map(p => (
                <button key={p.label} onClick={() => { set('card_radius', p.radius); set('card_border', p.border); set('card_shadow', p.shadow); set('card_shadow_hover', p.shadowH); }}
                  style={{ padding: '9px 16px', borderRadius: 8, border: `1px solid #e0e0e0`, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, background: s.card_radius === p.radius ? '#0D0D0D' : 'white', color: s.card_radius === p.radius ? 'white' : '#555' }}>{p.label}</button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Border radius: {s.card_radius}</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {['0px','4px','8px','12px','16px','24px'].map(r => (
                    <button key={r} onClick={() => set('card_radius', r)}
                      style={{ padding: '5px 10px', borderRadius: r, border: `2px solid ${s.card_radius===r?'#CC0000':'#e0e0e0'}`, background: 'white', cursor: 'pointer', fontSize: 11 }}>{r}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Borde</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[['ninguno','none'],['fino','1px solid #e5e7eb'],['normal','1.5px solid #EFEFEF'],['grueso','3px solid #0A0A0A']].map(([l,v]) => (
                    <button key={l} onClick={() => set('card_border', v)}
                      style={{ padding: '5px 10px', border: v==='none'?'1px dashed #ccc':v, borderRadius: 6, background: 'white', cursor: 'pointer', fontSize: 11, fontWeight: s.card_border===v?700:400 }}>{l}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Card preview */}
          <div style={{ ...card, background: 'var(--site-bg,#F5F0E6)' }}>
            <div style={{ fontSize: 11, fontFamily: 'monospace', marginBottom: 12, letterSpacing: '.1em' }}>PREVIEW DE CARD</div>
            <div style={{ maxWidth: 200 }}>
              <div style={{ background: '#fff', border: s.card_border, borderRadius: s.card_radius, overflow: 'hidden', boxShadow: s.card_shadow }}>
                <div style={{ aspectRatio: '3/4', background: '#f3f4f6', overflow: 'hidden', borderBottom: s.card_border }}>
                  <img src="https://m.media-amazon.com/images/I/91fD2TcCWIL._SL1500_.jpg" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ fontFamily: `'${s.font_cards||globalFont}',sans-serif`, fontSize: 13, fontWeight: 700, color: s.color_card_title, marginBottom: 8 }}>Dark Knight Returns</div>
                  <div style={{ fontFamily: `'${s.font_cards||globalFont}',sans-serif`, fontSize: 17, fontWeight: 900, color: s.color_price }}>$102.000</div>
                  <button style={{ marginTop: 10, width: '100%', padding: '9px 0', background: s.btn_style==='outline'?'transparent':s.color_btn_buy_bg, color: s.btn_style==='outline'?s.color_btn_buy_bg:s.color_btn_buy_text, border: s.btn_style==='outline'?`2px solid ${s.color_btn_buy_bg}`:s.btn_style==='brutalist'?'3px solid #0A0A0A':'none', borderRadius: s.btn_radius, fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: s.btn_style==='brutalist'?'3px 3px 0 #0A0A0A':'none' }}>Ver producto</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── HEADER ──────────────────────────────────────── */}
      {tab === 'header' && (
        <>
          <div style={card}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Botones del header</h2>
            <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>Activa o desactiva los botones del navbar. El logo y el carrito no se pueden ocultar.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { id: 'catalogo', label: 'Catálogo', href: '/catalogo' },
                { id: 'blog', label: 'Blog Portadas', href: '/blog' },
                { id: 'marvel', label: 'Marvel', href: '/blog/marvel' },
                { id: 'dc', label: 'DC', href: '/blog/dc' },
                { id: 'comicsia', label: 'Comics IA', href: '/comicsIA' },
              ].map(btn => {
                const isOn = headerBtns[btn.id] !== false;
                return (
                  <div key={btn.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: isOn ? '#fff' : '#fef2f2', border: `1px solid ${isOn ? '#e5e7eb' : '#fecaca'}`, borderRadius: 10 }}>
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#111' }}>{btn.label}</span>
                    <span style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'monospace' }}>{btn.href}</span>
                    <button onClick={() => setHeaderBtns(prev => ({ ...prev, [btn.id]: !isOn }))}
                      style={{ padding: '6px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, background: isOn ? '#CC0000' : '#e5e7eb', color: isOn ? '#fff' : '#555' }}>
                      {isOn ? 'Visible' : 'Oculto'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preview header */}
          <div style={{ ...card, background: '#1a1a1a' }}>
            <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#F5C518', letterSpacing: '.15em', marginBottom: 12 }}>PREVIEW DEL HEADER</div>
            <div style={{ background: s.site_header_color, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '4px solid #0A0A0A', flexWrap: 'wrap' }}>
              <img src="/logo.webp" alt="logo" style={{ height: 32, objectFit: 'contain' }} />
              <div style={{ display: 'flex', gap: 6, flex: 1, flexWrap: 'wrap' }}>
                {[{id:'catalogo',l:'Catálogo'},{id:'blog',l:'Blog'},{id:'marvel',l:'Marvel'},{id:'dc',l:'DC'},{id:'comicsia',l:'Comics IA'}]
                  .filter(b => headerBtns[b.id] !== false)
                  .map(b => (
                    <span key={b.id} style={{ padding: '4px 10px', border: '2px solid rgba(255,255,255,.35)', color: 'rgba(255,255,255,.85)', fontSize: 11, fontWeight: 700, fontFamily: 'monospace', borderRadius: 3 }}>{b.l}</span>
                  ))}
              </div>
              <span style={{ background: '#F5C518', color: '#0A0A0A', padding: '5px 12px', fontSize: 11, fontWeight: 800, fontFamily: 'monospace', border: '2px solid #0A0A0A' }}>🛒 Carrito</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
