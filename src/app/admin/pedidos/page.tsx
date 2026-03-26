'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const STATUS_OPTS = [
  { value: 'pending', label: 'Pendiente', color: '#f97316', bg: '#fff7ed' },
  { value: 'processing', label: 'Procesando', color: '#3b82f6', bg: '#eff6ff' },
  { value: 'shipped', label: 'Despachado', color: '#8b5cf6', bg: '#f5f3ff' },
  { value: 'delivered', label: 'Entregado', color: '#15803d', bg: '#f0fdf4' },
  { value: 'cancelled', label: 'Cancelado', color: '#dc2626', bg: '#fef2f2' },
];

export default function OrdersListPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const p = new URLSearchParams({ limit: '50' });
    if (status) p.set('status', status);
    if (search) p.set('search', search);
    const r = await fetch('/api/orders?' + p.toString());
    const d = await r.json();
    setOrders(d.data?.items || []);
    setTotal(d.data?.total || 0);
    setLoading(false);
  }

  useEffect(() => { load(); }, [status, search]);

  const getStatus = (v: string) => STATUS_OPTS.find(s => s.value === v) || STATUS_OPTS[0];

  return (
    <div style={{ padding: '32px 36px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111', letterSpacing: '-.02em', marginBottom: 4 }}>Pedidos</h1>
        <p style={{ fontSize: 13, color: '#888' }}>{total} pedidos en total</p>
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente o email..."
          style={{ flex: 1, minWidth: 200, padding: '9px 14px', border: '1px solid #e0e0e0', borderRadius: 9, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff' }} />
        <select value={status} onChange={e => setStatus(e.target.value)}
          style={{ padding: '9px 14px', border: '1px solid #e0e0e0', borderRadius: 9, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff' }}>
          <option value="">Todos los estados</option>
          {STATUS_OPTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
      <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
        {loading && <div style={{ padding: '60px 0', textAlign: 'center', color: '#bbb', fontSize: 13 }}>Cargando...</div>}
        {!loading && orders.length === 0 && <div style={{ padding: '60px 0', textAlign: 'center', color: '#bbb', fontSize: 13 }}>Sin pedidos aun</div>}
        {!loading && orders.map((o, i) => {
          const s = getStatus(o.status);
          return (
            <Link key={o.id} href={'/admin/pedidos/' + o.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: i < orders.length - 1 ? '1px solid #f5f5f5' : 'none', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 2 }}>#{o.order_number} &middot; {o.customer_name}</div>
                <div style={{ fontSize: 11, color: '#aaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.customer_email} &middot; {new Date(o.created_at).toLocaleDateString('es-CO')}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111', flexShrink: 0 }}>${o.total_usd} USD</div>
              <div style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: s.bg, color: s.color, flexShrink: 0 }}>{s.label}</div>
              <div style={{ color: '#ccc' }}>›</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
