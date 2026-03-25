export const dynamic = 'force-dynamic';
import { query, ensureInit } from '@/lib/db';
import Link from 'next/link';

export default async function AdminDashboard() {
  try {
    await ensureInit();
    const [salesToday, salesMonth, pendingOrders, totalProducts, recentOrders] = await Promise.all([
      query(`SELECT COALESCE(SUM(total_usd),0) as s FROM orders WHERE DATE(created_at)=CURRENT_DATE AND status NOT IN ('cancelled','refunded')`).then(r => parseFloat(r.rows[0].s)),
      query(`SELECT COALESCE(SUM(total_usd),0) as s FROM orders WHERE DATE_TRUNC('month',created_at)=DATE_TRUNC('month',NOW()) AND status NOT IN ('cancelled','refunded')`).then(r => parseFloat(r.rows[0].s)),
      query(`SELECT COUNT(*) as c FROM orders WHERE status IN ('pending','processing')`).then(r => parseInt(r.rows[0].c)),
      query(`SELECT COUNT(*) as c FROM products WHERE status='published'`).then(r => parseInt(r.rows[0].c)),
      query(`SELECT * FROM orders ORDER BY created_at DESC LIMIT 5`).then(r => r.rows),
    ]);

    const stats = [
      { label: 'Ventas hoy', value: `$${salesToday.toFixed(2)}`, sub: 'USD', color: '#CC0000' },
      { label: 'Ventas del mes', value: `$${salesMonth.toFixed(2)}`, sub: 'USD', color: '#CC0000' },
      { label: 'Pedidos pendientes', value: String(pendingOrders), sub: 'activos', color: pendingOrders > 0 ? '#f97316' : '#666' },
      { label: 'Productos activos', value: String(totalProducts), sub: 'publicados', color: '#15803d' },
    ];

    return (
      <div style={{ padding: '32px 36px', maxWidth: 960 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111', letterSpacing: '-.02em', marginBottom: 4 }}>Dashboard</h1>
          <p style={{ fontSize: 13, color: '#888' }}>Resumen de La Tienda de Comics</p>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 32 }}>
          {stats.map((s, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: 14, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
              <div style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10, fontWeight: 600 }}>{s.label}</div>
              <div style={{ fontSize: 30, fontWeight: 700, color: s.color, letterSpacing: '-.02em', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#bbb', marginTop: 5 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 32, flexWrap: 'wrap' }}>
          <Link href="/admin/importar" style={{ padding: '10px 20px', background: '#CC0000', borderRadius: 10, color: 'white', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            + Importar productos
          </Link>
          <Link href="/admin/productos" style={{ padding: '10px 20px', background: '#fff', border: '1px solid #e0e0e0', borderRadius: 10, color: '#333', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            Ver catálogo
          </Link>
          <Link href="/admin/pedidos" style={{ padding: '10px 20px', background: '#fff', border: '1px solid #e0e0e0', borderRadius: 10, color: '#333', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            Ver pedidos
          </Link>
        </div>

        {/* Recent orders */}
        <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>Pedidos recientes</span>
            <Link href="/admin/pedidos" style={{ fontSize: 12, color: '#CC0000', textDecoration: 'none', fontWeight: 500 }}>Ver todos →</Link>
          </div>
          {recentOrders.length === 0 ? (
            <div style={{ padding: '40px 22px', textAlign: 'center', color: '#bbb', fontSize: 13 }}>Sin pedidos aún</div>
          ) : (
            recentOrders.map((order: any) => (
              <div key={order.id} style={{ padding: '14px 22px', borderBottom: '1px solid #f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{order.customer_name}</div>
                  <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>#{order.order_number} · {new Date(order.created_at).toLocaleDateString('es-CO')}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>${order.total_usd} USD</div>
                  <div style={{ fontSize: 11, marginTop: 2, padding: '2px 8px', borderRadius: 20, background: order.status === 'delivered' ? '#f0fdf4' : order.status === 'cancelled' ? '#fef2f2' : '#fff7ed', color: order.status === 'delivered' ? '#15803d' : order.status === 'cancelled' ? '#dc2626' : '#c2410c', display: 'inline-block' }}>
                    {order.status}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  } catch {
    return (
      <div style={{ padding: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Dashboard</h1>
        <p style={{ color: '#888', fontSize: 13 }}>Cargando datos...</p>
      </div>
    );
  }
}
