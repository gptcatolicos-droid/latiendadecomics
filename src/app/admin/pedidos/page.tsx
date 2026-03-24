'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';

const STATUS_OPTS = [
  { value: 'pending',    label: 'Pendiente',   cls: 'bg-orange-100 text-orange-700' },
  { value: 'processing', label: 'Procesando',  cls: 'bg-blue-100 text-blue-700' },
  { value: 'shipped',    label: 'Despachado',  cls: 'bg-purple-100 text-purple-700' },
  { value: 'delivered',  label: 'Entregado',   cls: 'bg-green-100 text-green-700' },
  { value: 'cancelled',  label: 'Cancelado',   cls: 'bg-red/10 text-red' },
];
const STATUS_MAP = Object.fromEntries(STATUS_OPTS.map(s => [s.value, s]));

export function OrdersListPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), limit: '20' });
    if (status) p.set('status', status);
    if (search) p.set('search', search);
    const res = await fetch(`/api/orders?${p}`);
    const data = await res.json();
    if (data.success) { setOrders(data.data.items); setTotal(data.data.total); }
    setLoading(false);
  }, [page, status, search]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-gray-900">Pedidos</h1>
          <p className="text-gray-400 text-sm mt-0.5">{total} pedidos en total</p>
        </div>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Buscar pedido o email..." className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red w-56" />
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none">
          <option value="">Todos los estados</option>
          {STATUS_OPTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <table className="w-full admin-table">
          <thead>
            <tr>
              <th>Pedido</th><th>Cliente</th><th>Productos</th>
              <th>Total</th><th>Envío</th><th>Estado</th><th>Tracking</th><th>Fecha</th><th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="text-center py-10 text-gray-400">Cargando...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-10 text-gray-400">Sin pedidos</td></tr>
            ) : orders.map(o => {
              const s = STATUS_MAP[o.status] || { label: o.status, cls: 'bg-gray-100 text-gray-500' };
              return (
                <tr key={o.id} className="cursor-pointer" onClick={() => router.push(`/admin/pedidos/${o.id}`)}>
                  <td className="font-semibold text-red text-sm">{o.order_number}</td>
                  <td>
                    <p className="text-sm font-medium text-gray-900">{o.customer.name}</p>
                    <p className="text-xs text-gray-400">{o.customer.email} · {o.customer.country}</p>
                  </td>
                  <td className="text-sm text-gray-600">{o.items.length} item(s)</td>
                  <td className="font-semibold text-sm">${o.total_usd.toFixed(2)}</td>
                  <td className="text-xs text-gray-500">{o.shipping_zone === 'colombia' ? '🇨🇴 $5' : '🌎 $30'}</td>
                  <td><span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span></td>
                  <td className="text-xs text-blue-600">{o.tracking_number || '—'}</td>
                  <td className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString('es-CO')}</td>
                  <td><Link href={`/admin/pedidos/${o.id}`} onClick={e => e.stopPropagation()} className="text-xs text-blue-600 hover:underline">Ver →</Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [tracking, setTracking] = useState('');
  const [carrier, setCarrier] = useState('USPS');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/orders/${params.id}`).then(r => r.json()).then(d => {
      if (d.success) { setOrder(d.data); setTracking(d.data.tracking_number || ''); setCarrier(d.data.tracking_carrier || 'USPS'); }
      else router.push('/admin/pedidos');
    });
  }, [params.id]);

  async function updateStatus(newStatus: string) {
    await fetch(`/api/orders/${params.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
    setOrder((prev: any) => ({ ...prev, status: newStatus }));
    toast.success('Estado actualizado');
  }

  async function saveTracking() {
    if (!tracking.trim()) { toast.error('Ingresa el número de tracking'); return; }
    setSaving(true);
    await fetch(`/api/orders/${params.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tracking_number: tracking, tracking_carrier: carrier }) });
    toast.success('Tracking guardado — email enviado al cliente ✓');
    setOrder((prev: any) => ({ ...prev, tracking_number: tracking, tracking_carrier: carrier, status: 'shipped' }));
    setSaving(false);
  }

  if (!order) return <div className="p-8 flex items-center justify-center"><div className="w-6 h-6 border-2 border-red border-t-transparent rounded-full animate-spin" /></div>;

  const statusInfo = STATUS_MAP[order.status] || { label: order.status, cls: 'bg-gray-100 text-gray-500' };

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">← Volver</button>
        <div className="flex-1">
          <h1 className="font-display text-3xl text-gray-900">{order.order_number}</h1>
          <p className="text-gray-400 text-sm">{new Date(order.created_at).toLocaleString('es-CO')}</p>
        </div>
        <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${statusInfo.cls}`}>{statusInfo.label}</span>
      </div>

      {/* Status change */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUS_OPTS.map(s => (
          <button key={s.value} onClick={() => updateStatus(s.value)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${order.status === s.value ? 'bg-brand-black text-white border-brand-black' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'}`}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Cliente</p>
          <p className="font-semibold text-gray-900">{order.customer.name}</p>
          <p className="text-sm text-gray-500">{order.customer.email}</p>
          {order.customer.phone && <p className="text-sm text-gray-500">{order.customer.phone}</p>}
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Dirección de envío</p>
          <p className="text-sm text-gray-700 leading-relaxed">
            {order.shipping_address.line1}<br />
            {order.shipping_address.line2 && <>{order.shipping_address.line2}<br /></>}
            {order.shipping_address.city}{order.shipping_address.state ? `, ${order.shipping_address.state}` : ''}<br />
            {order.shipping_address.country} {order.shipping_address.postal_code}
          </p>
        </div>
      </div>

      {/* Items + costs */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden mb-5">
        <div className="px-5 py-3 border-b border-gray-100 font-semibold text-sm text-gray-700">Productos</div>
        <table className="w-full admin-table">
          <thead><tr><th>Producto</th><th>Proveedor</th><th>Link compra (oculto)</th><th>Precio orig.</th><th>Cobrado</th><th>Margen</th></tr></thead>
          <tbody>
            {order.items.map((item: any) => (
              <tr key={item.id}>
                <td>
                  <p className="text-sm font-medium">{item.product_title}</p>
                  {item.is_preventa && <span className="text-[10px] text-orange-600 bg-orange-50 px-1.5 rounded">Preventa</span>}
                  <p className="text-xs text-gray-400">× {item.quantity}</p>
                </td>
                <td className="text-xs text-gray-500">{item.supplier_url ? new URL(item.supplier_url).hostname : '—'}</td>
                <td>
                  {item.supplier_url
                    ? <a href={item.supplier_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">Abrir enlace →</a>
                    : <span className="text-xs text-gray-400">—</span>}
                </td>
                <td className="text-sm text-gray-500">—</td>
                <td className="text-sm font-semibold">${((item.is_preventa ? item.preventa_amount_paid : item.price_usd) * item.quantity).toFixed(2)}</td>
                <td className="text-sm text-green-600 font-semibold">+${(item.price_usd * 0.25 * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
            <tr className="bg-gray-50">
              <td colSpan={4} className="text-right font-semibold text-sm pr-3 py-3">Envío</td>
              <td className="font-semibold text-sm">${order.shipping_usd.toFixed(2)}</td>
              <td></td>
            </tr>
            {order.discount_usd > 0 && (
              <tr className="bg-green-50">
                <td colSpan={4} className="text-right text-sm text-green-700 pr-3">Descuento ({order.coupon_code})</td>
                <td className="text-green-700 font-semibold text-sm">-${order.discount_usd.toFixed(2)}</td>
                <td></td>
              </tr>
            )}
            <tr className="bg-gray-50 border-t-2 border-gray-200">
              <td colSpan={4} className="text-right font-bold text-base pr-3 py-3">Total cobrado</td>
              <td className="font-bold text-base text-red">${order.total_usd.toFixed(2)} USD</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Tracking */}
      <div className={`bg-white border-2 rounded-xl p-5 ${order.tracking_number ? 'border-green-200' : 'border-gray-200'}`}>
        <p className="text-sm font-semibold text-gray-800 mb-1">
          📦 {order.tracking_number ? `Tracking: ${order.tracking_number}` : 'Agregar número de tracking'}
        </p>
        <p className="text-xs text-gray-400 mb-4">Al guardar, se envía automáticamente un email al cliente con el enlace de seguimiento.</p>
        <div className="flex gap-2">
          <select value={carrier} onChange={e => setCarrier(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none">
            {['USPS', 'DHL', 'FedEx', 'Coordinadora', 'Servientrega', 'TCC'].map(c => <option key={c}>{c}</option>)}
          </select>
          <input value={tracking} onChange={e => setTracking(e.target.value)} placeholder="Ej: EA123456789US" className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-green-400" />
          <button onClick={saveTracking} disabled={saving} className="px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50">
            {saving ? '...' : 'Notificar →'}
          </button>
        </div>
        {order.tracking_notified_at && (
          <p className="text-xs text-green-600 mt-2">✓ Email enviado el {new Date(order.tracking_notified_at).toLocaleDateString('es-CO')}</p>
        )}
      </div>
    </div>
  );
}

export default OrdersListPage;
