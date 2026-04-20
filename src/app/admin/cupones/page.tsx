'use client';
import { useState, useEffect } from 'react';

export default function CuponesPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ code: '', type: 'percentage', value: '', min_order_usd: '', max_uses: '', expires_at: '' });

  async function load() {
    setLoading(true);
    const r = await fetch('/api/coupons');
    const d = await r.json();
    setCoupons(d.data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function save() {
    setSaving(true);
    await fetch('/api/coupons', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, value: parseFloat(form.value), min_order_usd: form.min_order_usd ? parseFloat(form.min_order_usd) : null, max_uses: form.max_uses ? parseInt(form.max_uses) : null }),
    });
    setSaving(false); setShowForm(false); setForm({ code: '', type: 'percentage', value: '', min_order_usd: '', max_uses: '', expires_at: '' });
    load();
  }

  async function toggle(id: string, active: boolean) {
    await fetch('/api/coupons', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, active: !active }) });
    load();
  }

  async function del(id: string) {
    if (!confirm('Eliminar cupon?')) return;
    await fetch('/api/coupons?id=' + id, { method: 'DELETE' });
    load();
  }

  const inp = (f: string) => ({ value: (form as any)[f], onChange: (e: any) => setForm(prev => ({ ...prev, [f]: e.target.value })) });
  const inputStyle = { width: '100%', padding: '9px 12px', border: '1px solid #e0e0e0', borderRadius: 9, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff', boxSizing: 'border-box' as const };

  return (
    <div style={{ padding: '32px 36px', maxWidth: 800 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111', letterSpacing: '-.02em', marginBottom: 4 }}>Cupones</h1>
          <p style={{ fontSize: 13, color: '#888' }}>{coupons.length} cupones activos</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 20px', background: '#CC0000', border: 'none', borderRadius: 10, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          + Nuevo cupon
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: 14, padding: 20, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: '#111' }}>Crear cupon</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 5 }}>Codigo</label>
              <input {...inp('code')} placeholder="DESCUENTO20" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 5 }}>Tipo</label>
              <select {...inp('type')} style={inputStyle}>
                <option value="percentage">Porcentaje (%)</option>
                <option value="fixed">Valor fijo (USD)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 5 }}>Valor</label>
              <input type="number" {...inp('value')} placeholder={form.type === 'percentage' ? '20' : '10'} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 5 }}>Pedido minimo (USD)</label>
              <input type="number" {...inp('min_order_usd')} placeholder="0" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 5 }}>Usos maximos</label>
              <input type="number" {...inp('max_uses')} placeholder="Ilimitado" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 5 }}>Expira</label>
              <input type="date" {...inp('expires_at')} style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={save} disabled={saving || !form.code || !form.value} style={{ padding: '10px 24px', background: '#CC0000', border: 'none', borderRadius: 9, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              {saving ? 'Guardando...' : 'Crear cupon'}
            </button>
            <button onClick={() => setShowForm(false)} style={{ padding: '10px 20px', background: '#f5f5f5', border: 'none', borderRadius: 9, color: '#555', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
        {loading && <div style={{ padding: '60px 0', textAlign: 'center', color: '#bbb', fontSize: 13 }}>Cargando...</div>}
        {!loading && coupons.length === 0 && <div style={{ padding: '60px 0', textAlign: 'center', color: '#bbb', fontSize: 13 }}>Sin cupones</div>}
        {!loading && coupons.map((c, i) => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: i < coupons.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111', fontFamily: 'monospace', marginBottom: 2 }}>{c.code}</div>
              <div style={{ fontSize: 11, color: '#aaa' }}>
                {c.type === 'percentage' ? `${c.value}% descuento` : `$${c.value} USD`}
                {c.min_order_usd ? ` · Min $${c.min_order_usd}` : ''}
                {c.max_uses ? ` · ${c.uses_count}/${c.max_uses} usos` : ` · ${c.uses_count} usos`}
              </div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: c.active ? '#f0fdf4' : '#f5f5f5', color: c.active ? '#15803d' : '#999' }}>
              {c.active ? 'Activo' : 'Inactivo'}
            </div>
            <button onClick={() => toggle(c.id, c.active)} style={{ padding: '6px 12px', background: '#f5f5f5', border: 'none', borderRadius: 7, fontSize: 12, color: '#555', cursor: 'pointer', fontFamily: 'inherit' }}>
              {c.active ? 'Desactivar' : 'Activar'}
            </button>
            <button onClick={() => del(c.id)} style={{ padding: '6px 12px', background: '#fef2f2', border: 'none', borderRadius: 7, fontSize: 12, color: '#dc2626', cursor: 'pointer', fontFamily: 'inherit' }}>
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
