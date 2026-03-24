'use client';
import { useState } from 'react';

interface ImportResult {
  url: string;
  status: 'ok' | 'error';
  title?: string;
  price?: number;
  error?: string;
}

export default function BulkImportPage() {
  const [text, setText] = useState('');
  const [results, setResults] = useState<ImportResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  async function handleImport() {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.startsWith('http'));
    if (!lines.length) return;
    setLoading(true);
    setResults([]);
    setProgress(0);

    const newResults: ImportResult[] = [];

    for (let i = 0; i < lines.length; i++) {
      const url = lines[i];
      try {
        const res = await fetch('/api/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
        const data = await res.json();

        if (data.success) {
          await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: data.data.title,
              description: data.data.description || data.data.title,
              price_usd: data.data.price_selling_usd,
              price_cop: data.data.price_cop,
              images: (data.data.images || []).map((u: string) => ({ url: u, alt: data.data.title })),
              supplier: data.data.supplier,
              supplier_url: url,
              stock: data.data.stock || 10,
              status: 'published',
              category: data.data.category || 'comics',
              publisher: data.data.publisher || '',
            }),
          });
          newResults.push({ url, status: 'ok', title: data.data.title, price: data.data.price_selling_usd });
        } else {
          newResults.push({ url, status: 'error', error: data.error || 'Error desconocido' });
        }
      } catch (err: any) {
        newResults.push({ url, status: 'error', error: err.message });
      }

      setResults([...newResults]);
      setProgress(Math.round(((i + 1) / lines.length) * 100));
      if (i < lines.length - 1) await new Promise(r => setTimeout(r, 600));
    }
    setLoading(false);
  }

  const urlCount = text.split('\n').filter(l => l.trim().startsWith('http')).length;
  const ok = results.filter(r => r.status === 'ok').length;
  const bad = results.filter(r => r.status === 'error').length;

  return (
    <div style={{ padding: 32, maxWidth: 800 }}>
      <h1 style={{ fontFamily: 'Oswald,sans-serif', fontSize: 28, fontWeight: 700, marginBottom: 6 }}>Importar productos</h1>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>
        Pega URLs de Amazon, Midtown Comics, Iron Studios o Panini — una por línea. Se guardan automáticamente en el catálogo.
      </p>

      <div style={{ background:'#f8f8f8', border:'1px solid #e0e0e0', borderRadius:10, padding:'12px 16px', marginBottom:12, fontSize:12, color:'#666', lineHeight:1.8 }}>
        <strong style={{color:'#333'}}>URLs soportadas:</strong><br/>
        https://www.amazon.com/dp/XXXXXXXXX<br/>
        https://www.midtowncomics.com/store/op=pd/...<br/>
        https://ironstudios.com/products/batman-...<br/>
        https://paninitienda.com/products/...
      </div>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="https://www.amazon.com/dp/B001234&#10;https://ironstudios.com/products/batman-deluxe&#10;https://midtowncomics.com/..."
        style={{ width:'100%', height:180, padding:14, fontSize:13, border:'1.5px solid #e0e0e0', borderRadius:10, resize:'vertical', fontFamily:'monospace', outline:'none', marginBottom:12 }}
      />

      <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:24 }}>
        <button onClick={handleImport} disabled={loading || urlCount === 0} style={{
          padding:'12px 28px', background: loading ? '#999' : '#CC0000',
          border:'none', borderRadius:10, color:'white', fontSize:14, fontWeight:700,
          cursor: loading ? 'not-allowed' : 'pointer', fontFamily:'inherit',
        }}>
          {loading ? `Importando... ${progress}%` : `Importar ${urlCount} producto${urlCount !== 1 ? 's' : ''}`}
        </button>
        {loading && (
          <div style={{ flex:1, height:6, background:'#e0e0e0', borderRadius:3 }}>
            <div style={{ width:`${progress}%`, height:'100%', background:'#CC0000', borderRadius:3, transition:'width .3s' }} />
          </div>
        )}
      </div>

      {results.length > 0 && (
        <>
          <div style={{ display:'flex', gap:12, marginBottom:16 }}>
            <span style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8, padding:'6px 14px', fontSize:13, fontWeight:600, color:'#15803d' }}>✓ {ok} importados</span>
            {bad > 0 && <span style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'6px 14px', fontSize:13, fontWeight:600, color:'#dc2626' }}>✗ {bad} errores</span>}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {results.map((r, i) => (
              <div key={i} style={{ background: r.status==='ok'?'#f0fdf4':'#fef2f2', border:`1px solid ${r.status==='ok'?'#bbf7d0':'#fecaca'}`, borderRadius:8, padding:'10px 14px', display:'flex', gap:10, alignItems:'flex-start' }}>
                <span>{r.status==='ok'?'✅':'❌'}</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:'#111' }}>{r.status==='ok' ? r.title : r.error}</div>
                  <div style={{ fontSize:11, color:'#999', marginTop:2 }}>
                    {r.status==='ok' ? `$${r.price?.toFixed(2)} USD · ` : ''}{r.url.slice(0,60)}...
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
