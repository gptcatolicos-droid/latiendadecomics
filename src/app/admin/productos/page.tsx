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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkAction, setBulkAction] = useState('');
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [priceVal, setPriceVal] = useState('');
  const [priceMode, setPriceMode] = useState<'usd' | 'cop'>('cop');
  const [saving, setSaving] = useState<string | null>(null);
  const USD_COP = 4100;

  async function load() {
    setLoading(true);
    const p = new URLSearchParams({ limit: '100' });
    if (search) p.set('search', search);
    if (supplier) p.set('supplier', supplier);
    if (status) p.set('status', status);
    const res = await fetch('/api/products?' + p.toString());
    const data = await res.json();
    setProducts(data.data?.items || []);
    setTotal(data.data?.total || 0);
    setLoading(false);
  }

  useEffect(() => { load(); }, [search, supplier, status]);

  function toggleSelect(id: string) {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  function toggleAll() {
    if (selected.size === products.length) setSelected(new Set());
    else setSelected(new Set(products.map(p => p.id)));
  }

  async function deleteProduct(id: string) {
    if (!confirm('¿Eliminar este producto?')) return;
    setSaving(id);
    await fetch('/api/products/' + id, { method: 'DELETE' });
    setSaving(null);
    load();
  }

  async function toggleFeatured(id: string, current: boolean) {
    await fetch('/api/products/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ featured: !current }) });
    load();
  }

  async function saveInlinePrice(id: string) {
    const numVal = parseFloat(priceVal);
    if (!numVal) return;
    const priceUSD = priceMode === 'cop' ? Math.round(numVal / USD_COP * 100) / 100 : numVal;
    setSaving(id);
    await fetch('/api/products/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ price_usd: priceUSD }) });
    setSaving(null);
    setEditingPrice(null);
    load();
  }

  async function applyBulk() {
    if (!selected.size) return;
    if (bulkAction === 'delete') {
      if (!confirm('¿Eliminar ' + selected.size + ' productos?')) return;
      for (const id of selected) await fetch('/api/products/' + id, { method: 'DELETE' });
      setSelected(new Set());
      load();
    } else if (bulkAction === 'price' && bulkPrice) {
      const num = parseFloat(bulkPrice);
      if (!num) return;
      const priceUSD = priceMode === 'cop' ? Math.round(num / USD_COP * 100) / 100 : num;
      for (const id of selected) {
        await fetch('/api/products/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ price_usd: priceUSD }) });
      }
      setSelected(new Set()); setBulkPrice('');
      load();
    } else if (bulkAction === 'publish' || bulkAction === 'draft') {
      for (const id of selected) {
        await fetch('/api/products/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: bulkAction }) });
      }
      setSelected(new Set());
      load();
    }
  }

  const copFormat = (usd: number) => Math.round(usd * USD_COP).toLocaleString('es-CO');

  return (
    <div style={{ padding: '28px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111', letterSpacing: '-.02em', marginBottom: 3 }}>Productos</h1>
          <p style={{ fontSize: 13, color: '#888' }}>{total} productos en total</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ display: 'flex', background: '#f5f5f5', borderRadius: 8, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
            <button onClick={() => setPriceMode('cop')} style={{ padding: '7px 14px', background: priceMode === 'cop' ? '#0D0D0D' : 'transparent', color: priceMode === 'cop' ? 'white' : '#555', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>COP</button>
            <button onClick={() => setPriceMode('usd')} style={{ padding: '7px 14px', background: priceMode === 'usd' ? '#0D0D0D' : 'transparent', color: priceMode === 'usd' ? 'white' : '#555', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>USD</button>
          </div>
          <Link href="/admin/importar" style={{ padding: '9px 18px', background: '#CC0000', borderRadius: 10, color: 'white', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>+ Importar</Link>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar producto..."
          style={{ flex: 1, minWidth: 160, padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
        <select value={supplier} onChange={e => setSupplier(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff' }}>
          <option value="">Todos proveedores</option>
          <option value="amazon">Amazon</option>
          <option value="midtown">Midtown</option>
          <option value="ironstudios">Iron Studios</option>
          <option value="panini">Panini</option>
          <option value="manual">Manual</option>
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff' }}>
          <option value="">Todos estados</option>
          <option value="published">Publicado</option>
          <option value="draft">Borrador</option>
        </select>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#c2410c' }}>{selected.size} seleccionados</span>
          <select value={bulkAction} onChange={e => setBulkAction(e.target.value)}
            style={{ padding: '6px 10px', border: '1px solid #e0e0e0', borderRadius: 7, fontSize: 12, fontFamily: 'inherit', outline: 'none', background: '#fff' }}>
            <option value="">Acción masiva...</option>
            <option value="delete">Eliminar seleccionados</option>
            <option value="price">Cambiar precio</option>
            <option value="publish">Publicar</option>
            <option value="draft">Poner borrador</option>
          </select>
          {bulkAction === 'price' && (
            <input type="number" value={bulkPrice} onChange={e => setBulkPrice(e.target.value)}
              placeholder={priceMode === 'cop' ? 'Precio en COP' : 'Precio en USD'}
              style={{ padding: '6px 10px', border: '1px solid #e0e0e0', borderRadius: 7, fontSize: 12, fontFamily: 'inherit', outline: 'none', width: 140 }} />
          )}
          <button onClick={applyBulk} disabled={!bulkAction} style={{ padding: '6px 16px', background: bulkAction === 'delete' ? '#dc2626' : '#CC0000', border: 'none', borderRadius: 7, color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Aplicar
          </button>
          <button onClick={() => setSelected(new Set())} style={{ padding: '6px 12px', background: 'none', border: '1px solid #e0e0e0', borderRadius: 7, fontSize: 12, color: '#555', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
        </div>
      )}

      {/* Products table */}
      <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
          <input type="checkbox" checked={selected.size === products.length && products.length > 0} onChange={toggleAll} style={{ cursor: 'pointer', width: 16, height: 16 }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '.06em', flex: 1 }}>Producto</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '.06em', width: 120, textAlign: 'right' }}>Precio ({priceMode.toUpperCase()})</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '.06em', width: 160 }}>Acciones</span>
        </div>

        {loading && <div style={{ padding: '50px 0', textAlign: 'center', color: '#bbb', fontSize: 13 }}>Cargando...</div>}
        {!loading && products.length === 0 && <div style={{ padding: '50px 0', textAlign: 'center', color: '#bbb', fontSize: 13 }}>Sin productos</div>}

        {!loading && products.map((p, i) => {
          const priceDisplay = priceMode === 'cop'
            ? '$' + copFormat(parseFloat(p.price_usd)) + ' COP'
            : '$' + parseFloat(p.price_usd).toFixed(2) + ' USD';

          return (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: i < products.length - 1 ? '1px solid #f5f5f5' : 'none', background: selected.has(p.id) ? '#fff7f7' : 'white' }}>
              <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} style={{ cursor: 'pointer', width: 16, height: 16, flexShrink: 0 }} />
              
              {/* Image */}
              <div style={{ width: 40, height: 56, background: '#f7f7f7', borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                {p.images?.[0]?.url
                  ? <img src={p.images[0].url} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📚</div>
                }
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#111', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, background: '#f0f0f0', padding: '1px 7px', borderRadius: 20, color: '#666' }}>{p.supplier}</span>
                  <span style={{ fontSize: 10, background: p.status === 'published' ? '#f0fdf4' : '#f5f5f5', color: p.status === 'published' ? '#15803d' : '#999', padding: '1px 7px', borderRadius: 20 }}>
                    {p.status === 'published' ? 'Publicado' : 'Borrador'}
                  </span>
                  {p.featured && <span style={{ fontSize: 10, background: '#fff7ed', color: '#c2410c', padding: '1px 7px', borderRadius: 20 }}>★</span>}
                </div>
              </div>

              {/* Inline price editor */}
              <div style={{ width: 120, textAlign: 'right', flexShrink: 0 }}>
                {editingPrice === p.id ? (
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center', justifyContent: 'flex-end' }}>
                    <input type="number" value={priceVal} onChange={e => setPriceVal(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveInlinePrice(p.id); if (e.key === 'Escape') setEditingPrice(null); }}
                      autoFocus
                      style={{ width: 80, padding: '4px 6px', border: '2px solid #CC0000', borderRadius: 6, fontSize: 12, fontFamily: 'inherit', outline: 'none', textAlign: 'right' }} />
                    <button onClick={() => saveInlinePrice(p.id)} style={{ background: '#CC0000', border: 'none', color: 'white', borderRadius: 5, padding: '4px 6px', cursor: 'pointer', fontSize: 11 }}>✓</button>
                    <button onClick={() => setEditingPrice(null)} style={{ background: '#f0f0f0', border: 'none', borderRadius: 5, padding: '4px 6px', cursor: 'pointer', fontSize: 11 }}>✕</button>
                  </div>
                ) : (
                  <div onClick={() => { setEditingPrice(p.id); setPriceVal(priceMode === 'cop' ? String(Math.round(parseFloat(p.price_usd) * USD_COP)) : p.price_usd); }}
                    style={{ fontSize: 13, fontWeight: 600, color: '#111', cursor: 'pointer', padding: '4px 8px', borderRadius: 6, border: '1px solid transparent' }}
                    title="Clic para editar precio">
                    {saving === p.id ? '...' : priceDisplay}
                    <span style={{ fontSize: 9, color: '#ccc', marginLeft: 3 }}>✏</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0, width: 160 }}>
                <button onClick={() => toggleFeatured(p.id, p.featured)} title={p.featured ? 'Quitar destacado' : 'Destacar'} style={{ padding: '5px 9px', background: p.featured ? '#fff7ed' : '#f5f5f5', borderRadius: 7, fontSize: 12, color: p.featured ? '#c2410c' : '#aaa', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {p.featured ? '★' : '☆'}
                </button>
                <Link href={'/admin/productos/' + p.id} style={{ padding: '5px 12px', background: '#f5f5f5', borderRadius: 7, fontSize: 12, fontWeight: 500, color: '#333', textDecoration: 'none' }}>
                  Editar
                </Link>
                <button onClick={() => deleteProduct(p.id)} style={{ padding: '5px 10px', background: '#fef2f2', borderRadius: 7, fontSize: 12, fontWeight: 500, color: '#dc2626', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
