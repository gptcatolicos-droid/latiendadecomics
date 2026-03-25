'use client';
import { useState, useRef } from 'react';

interface ImportResult {
  url: string; status: 'ok' | 'error'; title?: string; price?: number; error?: string;
}

export default function BulkImportPage() {
  const [text, setText] = useState('');
  const [results, setResults] = useState<ImportResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [seedingTienda, setSeedingTienda] = useState(false);
  const [tiendaResult, setTiendaResult] = useState<{inserted:number;skipped:number}|null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function extractUrls(raw: string): string[] {
    const lines = raw.split(/[\n,;\r]+/);
    const urls: string[] = [];
    const seen = new Set<string>();
    for (const line of lines) {
      const trimmed = line.trim().replace(/^["']|["']$/g, '');
      if (!trimmed.startsWith('http')) continue;
      const asin = trimmed.match(/\/dp\/([A-Z0-9]{10})/);
      const clean = asin ? `https://www.amazon.com/dp/${asin[1]}` : trimmed.split('?')[0];
      if (!seen.has(clean)) { seen.add(clean); urls.push(clean); }
    }
    return urls;
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setText(ev.target?.result as string);
    reader.readAsText(file);
  }

  async function handleImport() {
    const urls = extractUrls(text);
    if (!urls.length) return;
    setLoading(true); setResults([]); setProgress(0);
    const newResults: ImportResult[] = [];

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      try {
        const res = await fetch('/api/import', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
        const data = await res.json();
        if (data.success) {
          await fetch('/api/products', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: data.data.title,
              description: data.data.description || data.data.title,
              price_usd: data.data.price_selling_usd,
              price_cop: data.data.price_cop,
              images: (data.data.images || []).map((u: string) => ({ url: u, alt: data.data.title })),
              supplier: data.data.supplier || 'amazon',
              supplier_url: url,
              stock: 1,
              status: 'published',
              category: data.data.category || 'comics',
            }),
          });
          newResults.push({ url, status: 'ok', title: data.data.title, price: data.data.price_selling_usd, priceCop: data.data.price_cop });
        } else {
          newResults.push({ url, status: 'error', error: data.error || 'Error al importar' });
        }
      } catch (err: any) {
        newResults.push({ url, status: 'error', error: err.message });
      }
      setResults([...newResults]);
      setProgress(Math.round(((i + 1) / urls.length) * 100));
      if (i < urls.length - 1) await new Promise(r => setTimeout(r, 800));
    }
    setLoading(false);
  }

  async function resetProducts() {
    if (!confirm('¿Eliminar TODOS los productos? Esta acción no se puede deshacer.')) return;
    setResetting(true);
    await fetch('/api/admin/reset-products', { method: 'POST' });
    setResetting(false); setResetDone(true);
    setTimeout(() => setResetDone(false), 3000);
  }

  async function runTiendaSeed() {
    setSeedingTienda(true);
    try {
      const res = await fetch('/api/seed', { method: 'PUT' });
      const data = await res.json();
      setTiendaResult(data.results);
    } catch { setTiendaResult(null); }
    setSeedingTienda(false);
  }

  const urlCount = extractUrls(text).length;
  const ok = results.filter(r => r.status === 'ok').length;
  const bad = results.filter(r => r.status === 'error').length;

  return (
    <div style={{ padding: '28px 32px', maxWidth: 820 }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111', letterSpacing: '-.02em', marginBottom: 4 }}>Importar productos</h1>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>
        Importa desde Amazon, Midtown Comics, Iron Studios o Panini. Pega las URLs, sube un CSV, o importa desde tu tienda.
      </p>

      {/* Reset */}
      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '14px 18px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#dc2626', marginBottom: 2 }}>Borrar todos los productos</div>
          <div style={{ fontSize: 12, color: '#ef4444' }}>Limpia el catálogo para empezar de cero</div>
          {resetDone && <div style={{ fontSize: 12, color: '#15803d', marginTop: 3, fontWeight: 600 }}>✓ Productos eliminados</div>}
        </div>
        <button onClick={resetProducts} disabled={resetting} style={{ padding: '9px 18px', background: resetting ? '#999' : '#dc2626', border: 'none', borderRadius: 9, color: 'white', fontSize: 13, fontWeight: 700, cursor: resetting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
          {resetting ? 'Borrando...' : '🗑 Borrar todo'}
        </button>
      </div>

      {/* Import from latiendadecomics.com */}
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '14px 18px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1d4ed8', marginBottom: 2 }}>Importar desde latiendadecomics.com</div>
          <div style={{ fontSize: 12, color: '#3b82f6' }}>Importa todos los productos de tu tienda Tiendanube actual</div>
          {tiendaResult && <div style={{ fontSize: 12, color: '#1d4ed8', marginTop: 3, fontWeight: 600 }}>✓ {tiendaResult.inserted} importados, {tiendaResult.skipped} ya existían</div>}
        </div>
        <button onClick={runTiendaSeed} disabled={seedingTienda} style={{ padding: '9px 18px', background: seedingTienda ? '#999' : '#1d4ed8', border: 'none', borderRadius: 9, color: 'white', fontSize: 13, fontWeight: 700, cursor: seedingTienda ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
          {seedingTienda ? 'Importando...' : '🏪 Importar Tienda'}
        </button>
      </div>

      {/* CSV Upload */}
      <div style={{ background: '#fff', border: '1.5px dashed #d0d0d0', borderRadius: 12, padding: '14px 18px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 2 }}>Subir archivo CSV</div>
          <div style={{ fontSize: 12, color: '#888' }}>Una URL por línea. Soporta .csv y .txt</div>
        </div>
        <button onClick={() => fileRef.current?.click()} style={{ padding: '9px 18px', background: '#0D0D0D', border: 'none', borderRadius: 9, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          📄 Subir CSV
        </button>
        <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile} style={{ display: 'none' }} />
      </div>

      {/* Manual textarea */}
      <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>O pega las URLs manualmente (una por línea):</div>
      <div style={{ background: '#f8f8f8', border: '1px solid #e0e0e0', borderRadius: 8, padding: '8px 12px', marginBottom: 8, fontSize: 11, color: '#888', lineHeight: 1.8 }}>
        https://www.amazon.com/dp/1401207529<br/>
        https://www.midtowncomics.com/product/...<br/>
        https://ironstudios.com/products/batman-deluxe
      </div>
      <textarea
        value={text} onChange={e => setText(e.target.value)}
        placeholder="Pega aquí las URLs..."
        style={{ width: '100%', height: 140, padding: 12, fontSize: 13, border: '1.5px solid #e0e0e0', borderRadius: 10, resize: 'vertical', fontFamily: 'monospace', outline: 'none', marginBottom: 12, boxSizing: 'border-box' }}
      />

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24 }}>
        <button onClick={handleImport} disabled={loading || urlCount === 0} style={{
          padding: '12px 28px', background: loading ? '#ccc' : '#CC0000', border: 'none', borderRadius: 10,
          color: 'white', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
        }}>
          {loading ? `Importando... ${progress}%` : `Importar ${urlCount} URL${urlCount !== 1 ? 's' : ''}`}
        </button>
        {loading && (
          <div style={{ flex: 1, height: 6, background: '#e0e0e0', borderRadius: 3 }}>
            <div style={{ width: `${progress}%`, height: '100%', background: '#CC0000', borderRadius: 3, transition: 'width .3s' }} />
          </div>
        )}
        {urlCount > 0 && !loading && <span style={{ fontSize: 12, color: '#888' }}>{urlCount} URLs detectadas</span>}
      </div>

      {results.length > 0 && (
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <span style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 600, color: '#15803d' }}>✓ {ok} importados</span>
            {bad > 0 && <span style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 600, color: '#dc2626' }}>✗ {bad} errores</span>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {results.map((r, i) => (
              <div key={i} style={{ background: r.status === 'ok' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${r.status === 'ok' ? '#bbf7d0' : '#fecaca'}`, borderRadius: 8, padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ flexShrink: 0 }}>{r.status === 'ok' ? '✅' : '❌'}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 2 }}>{r.status === 'ok' ? r.title : r.error}</div>
                  <div style={{ fontSize: 11, color: '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.status === 'ok' ? `$${r.price?.toFixed(2)} USD · ` : ''}{r.url}
                  </div>
                  {r.status === 'ok' && r.priceCop && <div style={{ fontSize: 11, color: '#15803d', fontWeight: 600 }}>${r.priceCop.toLocaleString('es-CO')} COP</div>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
