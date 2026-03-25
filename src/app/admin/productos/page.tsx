'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [supplier, setSupplier] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ limit: '50' });
    if (search) params.set('search', search);
    if (supplier) params.set('supplier', supplier);
    if (status) params.set('status', status);
    const res = await fetch(`/api/products?${params}`);
    const data = await res.json();
    setProducts(data.data?.items || []);
    setTotal(data.data?.total || 0);
    setLoading(false);
  }

  useEffect(() => { load(); }, [search, supplier, status]);

  async function toggleFeatured(id: string, current: boolean) {
    await fetch(`/api/products/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featured: !current }),
    });
    load();
  }

  async function deleteProduct(id: string) {
    if (!confirm('¿Eliminar este producto?')) return;
    setDeleting(id);
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    setDeleting(null);
    load();
  }

  return (
    <div style={{ padding: '32px 36px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111', letterSpacing: '-.02em', marginBottom: 4 }}>Productos</h1>
          <p style={{ fontSize: 13, color: '#888' }}>{total} productos en total</p>
        </div>
        <Link href="/admin/importar" style={{ padding: '10px 20px', background: '#CC0000', borderRadius: 10, color: 'white', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
          + Importar
        </Link>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar producto..."
          style={{ flex: 1, minWidth: 200, padding: '9px 14px', border: '1px solid #e0e0e0', borderRadius: 9, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff' }} />
        <select value={supplier} onChange={e => setSupplier(e.target.value)}
          style={{ padding: '9px 14px', border: '1px solid #e0e0e0', borderRadius: 9, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff' }}>
          <option value="">Todos los proveedores</option>
          <option value="amazon">Amazon</option>
          <option value="midtown">Midtown</option>
          <option value="ironstudios">Iron Studios</option>
          <option value="panini">Panini</option>
          <option value="manual">Manual</option>
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)}
          style={{ padding: '9px 14px', border: '1px solid #e0e0e0', borderRadius: 9, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff' }}>
          <option value="">Todos los estados</option>
          <option value="published">Publicado</option>
          <option value="draft">Borrador</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#bbb', fontSize: 13 }}>Cargando...</div>
        ) : products.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#bbb', fontSize: 13 }}>Sin productos</div>
        ) : (
          products.map((p, i) => (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px',
              borderBottom: i < products.length - 1 ? '1px solid #f5f5f5' : 'none',
              transition: 'background .1s',
            }}>
              {/* Image */}
              <div style={{ width: 48, height: 64, background: '#f7f7f7', borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                {p.images?.[0]?.url
                  ? <img src={p.images[0].url} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📚</div>
                }
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.title}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, background: '#f5f5f5', padding: '2px 8px', borderRadius: 20, color: '#666' }}>{p.supplier}</span>
                  <span style={{ fontSize: 11, background: p.status === 'published' ? '#f0fdf4' : '#fafafa', color: p.status === 'published' ? '#15803d' : '#999', padding: '2px 8px', borderRadius: 20 }}>
                    {p.status === 'published' ? 'Publicado' : 'Borrador'}
                  </span>
                </div>
              </div>

              {/* Price */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>${Number(p.price_usd).toFixed(2)}</div>
                <div style={{ fontSize: 11, color: '#aaa' }}>USD</div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                <button onClick={() => toggleFeatured(p.id, p.featured)} title={p.featured ? 'Quitar destacado' : 'Destacar'} style={{
                  padding: '6px 12px', background: p.featured ? '#fff7ed' : '#f5f5f5',
                  borderRadius: 8, fontSize: 11, fontWeight: 600,
                  color: p.featured ? '#c2410c' : '#999', border: 'none',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  {p.featured ? '★ Dest.' : '☆'}
                </button>
                <Link href={`/admin/productos/${p.id}`} style={{ padding: '6px 14px', background: '#f5f5f5', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#333', textDecoration: 'none' }}>
                  Editar
                </Link>
                <button onClick={() => deleteProduct(p.id)} disabled={deleting === p.id} style={{
                  padding: '6px 14px', background: '#fef2f2', borderRadius: 8,
                  fontSize: 12, fontWeight: 600, color: '#dc2626', border: 'none',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  {deleting === p.id ? '...' : 'Eliminar'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
