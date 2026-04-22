'use client';
import { useState, useEffect } from 'react';

export default function AnalyticsPage() {
  const [gaId, setGaId] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/settings?keys=ga_id').then(r => r.json()).then(d => { if (d.ga_id) setGaId(d.ga_id); });
  }, []);

  async function save() {
    await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ga_id: gaId }) });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ padding: '32px 36px', maxWidth: 700 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111', letterSpacing: '-.02em', marginBottom: 4 }}>Google Analytics</h1>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>Conecta tu cuenta de Google Analytics para ver el tráfico.</p>

      <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: 14, padding: 20, marginBottom: 14 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Configurar GA4</h2>
        <p style={{ fontSize: 13, color: '#555', marginBottom: 14, lineHeight: 1.6 }}>
          1. Ve a <a href="https://analytics.google.com" target="_blank" rel="noopener" style={{ color: '#CC0000' }}>analytics.google.com</a><br/>
          2. Crea una propiedad para latiendadecomics.com<br/>
          3. Copia el Measurement ID (formato: G-XXXXXXXXXX)<br/>
          4. Pégalo aquí y guarda
        </p>
        <label style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 6 }}>
          Measurement ID
        </label>
        <div style={{ display: 'flex', gap: 10 }}>
          <input value={gaId} onChange={e => setGaId(e.target.value)} placeholder="G-XXXXXXXXXX"
            style={{ flex: 1, padding: '10px 14px', border: '1px solid #e0e0e0', borderRadius: 9, fontSize: 14, fontFamily: 'monospace', outline: 'none' }} />
          <button onClick={save} style={{ padding: '10px 20px', background: saved ? '#15803d' : '#CC0000', border: 'none', borderRadius: 9, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            {saved ? '✓ Guardado' : 'Guardar'}
          </button>
        </div>
        {gaId && <p style={{ fontSize: 11, color: '#15803d', marginTop: 8 }}>✓ Analytics activo — los datos pueden tardar 24-48h en aparecer</p>}
      </div>

      {gaId && (
        <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: 14, padding: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Ver reportes</h2>
          <a href={`https://analytics.google.com/analytics/web/#/p${gaId.replace('G-','')}/reports/overview`} target="_blank" rel="noopener"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#4285f4', borderRadius: 10, color: 'white', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
            📊 Abrir Google Analytics
          </a>
        </div>
      )}
    </div>
  );
}
