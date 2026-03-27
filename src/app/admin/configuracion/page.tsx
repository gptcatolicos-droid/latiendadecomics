'use client';
import { useState, useEffect } from 'react';

export default function ConfiguracionPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [recalcLoading, setRecalcLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState('');

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => setSettings(d));
    fetch('/api/exchange-rate').then(r => r.json()).then(d => {
      if (d.success) setSettings(prev => ({ ...prev, usd_to_cop: d.data?.usd_to_cop }));
    });
  }, []);

  async function recalcPrices() {
    const margin = parseFloat(settings.default_margin_percent || '10');
    const rate = parseFloat(settings.usd_to_cop || '4100');
    if (!confirm(`¿Aplicar tasa ${rate} COP/USD a todos los productos?\n\nEsto actualiza el precio en COP de todos los productos usando la tasa actual.`)) return;
    setRecalcLoading(true);
    try {
      const res = await fetch('/api/products?limit=500&status=all');
      const data = await res.json();
      const products = data.data?.items || [];
      let updated = 0;
      for (const p of products) {
        const priceUSD = parseFloat(p.price_usd);
        if (!priceUSD) continue;
        const newCop = Math.round(priceUSD * rate);
        const r = await fetch('/api/products/' + p.id, {
          method: 'PUT', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ price_cop: newCop }),
        });
        const d = await r.json();
        if (d.success) updated++;
      }
      alert(`✓ ${updated} productos actualizados con tasa ${rate} COP/USD`);
    } catch (e) {
      alert('Error al recalcular: ' + e);
    }
    setRecalcLoading(false);
  }

  async function save() {
    setSaving(true);
    await fetch('/api/settings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function updateRates() {
    const r = await fetch('/api/exchange-rate', { method: 'POST' });
    const d = await r.json();
    if (d.success) setSettings(prev => ({ ...prev, usd_to_cop: d.data?.usd_to_cop }));
  }

  const inp = (key: string, placeholder?: string) => ({
    value: settings[key] || '',
    onChange: (e: any) => setSettings(prev => ({ ...prev, [key]: e.target.value })),
    placeholder: placeholder || '',
  });

  const sectionStyle = { background: '#fff', border: '1px solid #ebebeb', borderRadius: 14, padding: 20, marginBottom: 14, boxShadow: '0 1px 4px rgba(0,0,0,.04)' };
  const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 5 };
  const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1px solid #e0e0e0', borderRadius: 9, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff', boxSizing: 'border-box' };

  return (
    <div style={{ padding: '32px 36px', maxWidth: 700 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111', letterSpacing: '-.02em', marginBottom: 4 }}>Configuracion</h1>
        <p style={{ fontSize: 13, color: '#888' }}>Ajustes globales de la tienda</p>
      </div>

      {/* MercadoPago */}
      <div style={sectionStyle}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>💳</span> MercadoPago
        </h2>
        <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>Configura en Render → Environment Variables</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={labelStyle}>MP_ACCESS_TOKEN</label>
            <input value={process.env.MP_ACCESS_TOKEN ? 'APP_USR-***' : 'No configurado'} readOnly style={{ ...inputStyle, background: '#f9f9f9', color: '#888' }} />
          </div>
          <div>
            <label style={labelStyle}>MP_PUBLIC_KEY</label>
            <input value={process.env.MP_PUBLIC_KEY ? 'APP_USR-***' : 'No configurado'} readOnly style={{ ...inputStyle, background: '#f9f9f9', color: '#888' }} />
          </div>
        </div>
        <p style={{ fontSize: 11, color: '#15803d', marginTop: 8 }}>✓ Webhook: /api/payments/webhook</p>
      </div>

      {/* Envios */}
      <div style={sectionStyle}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🚚</span> Tarifas de envio
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={labelStyle}>Colombia (USD)</label>
            <input type="number" step="0.5" {...inp('shipping_colombia_usd', '5')} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Internacional (USD)</label>
            <input type="number" step="1" {...inp('shipping_international_usd', '30')} style={inputStyle} />
          </div>
        </div>
      </div>

      {/* Margen */}
      <div style={sectionStyle}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>📈</span> Margenes y precios
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={labelStyle}>Margen por defecto (%)</label>
            <input type="number" {...inp('default_margin_percent', '25')} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Tasa USD → COP</label>
            <input type="number" {...inp('usd_to_cop', '4100')} style={inputStyle} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
          <button onClick={updateRates} style={{ padding: '8px 18px', background: '#f5f5f5', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#555', cursor: 'pointer', fontFamily: 'inherit' }}>
            Actualizar tasa automaticamente
          </button>
          <button onClick={recalcPrices} disabled={recalcLoading} style={{ padding: '8px 18px', background: recalcLoading ? '#ccc' : '#0D0D0D', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, color: 'white', cursor: recalcLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {recalcLoading ? 'Recalculando...' : '↻ Aplicar margen a todos los productos'}
          </button>
        </div>
      </div>

      {/* WhatsApp */}
      <div style={sectionStyle}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>💬</span> WhatsApp
        </h2>
        <label style={labelStyle}>Numero WhatsApp (con codigo de pais)</label>
        <input {...inp('whatsapp_number', '573001234567')} style={inputStyle} placeholder="573001234567" />
      </div>

      {/* Store info */}
      <div style={sectionStyle}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🏪</span> Informacion de la tienda
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={labelStyle}>Nombre de la tienda</label>
            <input {...inp('store_name', 'La Tienda de Comics')} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Email de contacto</label>
            <input type="email" {...inp('contact_email', 'superpoder@latiendadecomics.com')} style={inputStyle} />
          </div>
        </div>
      </div>

      {/* Envia.com */}
      <div style={sectionStyle}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🚚</span> Envia.com (envíos)
        </h2>
        <p style={{ fontSize: 12, color: '#888', marginBottom: 10, lineHeight: 1.6 }}>
          Integración con envia.com para cotizar y generar guías de envío. 
          Configura tu API key en Render → Environment Variables como <code>ENVIA_API_KEY</code>.
        </p>
        <div>
          <label style={labelStyle}>ENVIA_API_KEY</label>
          <input {...inp('envia_api_key', 'Tu API key de envia.com')} style={inputStyle} type="password" />
        </div>
        <p style={{ fontSize: 11, color: '#aaa', marginTop: 8 }}>
          Obtén tu API key en: <a href="https://shipping.envia.com/settings/developers" target="_blank" rel="noopener" style={{ color: '#CC0000' }}>shipping.envia.com/settings/developers</a>
        </p>
      </div>

      <button onClick={save} disabled={saving} style={{ width: '100%', padding: '14px 0', background: saved ? '#15803d' : '#CC0000', border: 'none', borderRadius: 12, color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'background .2s' }}>
        {saved ? '✓ Guardado' : saving ? 'Guardando...' : 'Guardar configuracion'}
      </button>
    </div>
  );
}
