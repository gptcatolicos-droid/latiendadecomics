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
  const [bulkAction, setBulkAction] = useState('');
  const [bulkVal, setBulkVal] = useState('');
  const [priceMode, setPriceMode] = useState<'cop'|'usd'>('cop');
  const [editRow, setEditRow] = useState<string|null>(null);
  const [editData, setEditData] = useState({ price_cop: '', price_old_cop: '', stock: '' });
  const [saving, setSaving] = useState<string|null>(null);
  const USD_COP = 4100;

  async function load() {
    setLoading(true);
    const p = new URLSearchParams({ limit: '200' });
    if (search) p.set('search', search);
    if (supplier) p.set('supplier', supplier);
    if (status) p.set('status', status);
    const res = await fetch('/api/products?' + p);
    const data = await res.json();
    setProducts(data.data?.items || []);
    setTotal(data.data?.total || 0);
    setLoading(false);
  }

  useEffect(() => { load(); }, [search, supplier, status]);

  function toggleSelect(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleAll() {
    setSelected(selected.size === products.length ? new Set() : new Set(products.map(p => p.id)));
  }

  async function deleteProduct(id: string) {
    if (!confirm('¿Eliminar?')) return;
    setSaving(id);
    await fetch('/api/products/' + id, { method: 'DELETE' });
    setSaving(null); load();
  }

  async function toggleFeatured(id: string, current: boolean) {
    await fetch('/api/products/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ featured: !current }) });
    load();
  }

  function startEdit(p: any) {
    setEditRow(p.id);
    setEditData({
      price_cop: String(p.price_cop || Math.round(parseFloat(p.price_usd) * USD_COP)),
      price_old_cop: p.price_old_usd ? String(Math.round(parseFloat(p.price_old_usd) * USD_COP)) : '',
      stock: String(p.stock ?? 1),
    });
  }

  async function saveEdit(id: string) {
    setSaving(id);
    const priceCOP = parseInt(editData.price_cop) || 0;
    const priceUSD = Math.round(priceCOP / USD_COP * 100) / 100;
    const oldCOP = editData.price_old_cop ? parseInt(editData.price_old_cop) : null;
    const oldUSD = oldCOP ? Math.round(oldCOP / USD_COP * 100) / 100 : null;
    await fetch('/api/products/' + id, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price_usd: priceUSD, price_cop: priceCOP, price_old_usd: oldUSD, stock: parseInt(editData.stock) || 1 }),
    });
    setSaving(null); setEditRow(null); load();
  }

  async function applyBulk() {
    if (!selected.size || !bulkAction) return;
    if (bulkAction === 'delete') {
      if (!confirm('¿Eliminar ' + selected.size + ' productos?')) return;
      for (const id of selected) await fetch('/api/products/' + id, { method: 'DELETE' });
      setSelected(new Set()); load(); return;
    }
    if (bulkAction === 'price' && bulkVal) {
      const num = parseInt(bulkVal);
      const priceUSD = priceMode === 'cop' ? Math.round(num / USD_COP * 100) / 100 : parseFloat(bulkVal);
      const priceCOP = priceMode === 'cop' ? num : Math.round(parseFloat(bulkVal) * USD_COP);
      for (const id of selected) {
        await fetch('/api/products/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ price_usd: priceUSD, price_cop: priceCOP }) });
      }
      setSelected(new Set()); setBulkVal(''); load(); return;
    }
    if (bulkAction === 'publish' || bulkAction === 'draft') {
      for (const id of selected) await fetch('/api/products/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: bulkAction }) });
      setSelected(new Set()); load();
    }
  }

  const fmt = (p: any) => {
    const cop = p.price_cop || Math.round(parseFloat(p.price_usd) * USD_COP);
    return priceMode === 'cop' ? '$' + Number(cop).toLocaleString('es-CO') + ' COP' : '$' + parseFloat(p.price_usd).toFixed(2) + ' USD';
  };

  const inpStyle: React.CSSProperties = { padding: '7px 10px', border: '1.5px solid #CC0000', borderRadius: 7, fontSize: 13, fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' };

  return (
    <div style={{ padding: '28px 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111', letterSpacing: '-.02em', marginBottom: 2 }}>Productos</h1>
          <p style={{ fontSize: 13, color: '#888' }}>{total} productos en total</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
            <button onClick={() => setPriceMode('cop')} style={{ padding: '7px 14px', background: priceMode === 'cop' ? '#0D0D0D' : '#f5f5f5', color: priceMode === 'cop' ? 'white' : '#555', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>COP</button>
            <button onClick={() => setPriceMode('usd')} style={{ padding: '7px 14px', background: priceMode === 'usd' ? '#0D0D0D' : '#f5f5f5', color: priceMode === 'usd' ? 'white' : '#555', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>USD</button>
          </div>
          <Link href="/admin/productos/nuevo" style={{ padding: '9px 18px', background: '#0D0D0D', borderRadius: 10, color: 'white', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>+ Nuevo</Link>
          <Link href="/admin/importar" style={{ padding: '9px 18px', background: '#CC0000', borderRadius: 10, color: 'white', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>+ Importar</Link>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
          style={{ flex: 1, minWidth: 160, padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
        <select value={supplier} onChange={e => setSupplier(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff' }}>
          <option value="">Todos proveedores</option>
          <option value="amazon">Amazon</option>
          <option value="midtown">Midtown</option>
          <option value="ironstudios">Iron Studios</option>
          <option value="panini">Panini</option>
          <option value="manual">Manual</option>
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff' }}>
          <option value="">Todos estados</option>
          <option value="published">Publicado</option>
          <option value="draft">Borrador</option>
        </select>
      </div>

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#c2410c' }}>{selected.size} seleccionados</span>
          <select value={bulkAction} onChange={e => setBulkAction(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #e0e0e0', borderRadius: 7, fontSize: 12, fontFamily: 'inherit', outline: 'none', background: '#fff' }}>
            <option value="">Acción...</option>
            <option value="delete">Eliminar</option>
            <option value="price">Cambiar precio</option>
            <option value="publish">Publicar</option>
            <option value="draft">Borrador</option>
          </select>
          {bulkAction === 'price' && (
            <input type="number" value={bulkVal} onChange={e => setBulkVal(e.target.value)} placeholder={priceMode === 'cop' ? 'Precio COP' : 'Precio USD'}
              style={{ padding: '6px 10px', border: '1px solid #e0e0e0', borderRadius: 7, fontSize: 12, fontFamily: 'inherit', outline: 'none', width: 130 }} />
          )}
          <button onClick={applyBulk} style={{ padding: '6px 16px', background: bulkAction === 'delete' ? '#dc2626' : '#CC0000', border: 'none', borderRadius: 7, color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Aplicar</button>
          <button onClick={() => setSelected(new Set())} style={{ padding: '6px 12px', background: 'none', border: '1px solid #e0e0e0', borderRadius: 7, fontSize: 12, color: '#555', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
        </div>
      )}

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
          <input type="checkbox" checked={selected.size === products.length && products.length > 0} onChange={toggleAll} style={{ cursor: 'pointer', width: 16, height: 16 }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '.06em', flex: 1 }}>Producto</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '.06em', width: 140, textAlign: 'right' }}>Precio ({priceMode.toUpperCase()})</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '.06em', width: 50, textAlign: 'center' }}>Uds.</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '.06em', width: 180, textAlign: 'right' }}>Acciones</span>
        </div>

        {loading && <div style={{ padding: '50px 0', textAlign: 'center', color: '#bbb', fontSize: 13 }}>Cargando...</div>}
        {!loading && products.length === 0 && <div style={{ padding: '50px 0', textAlign: 'center', color: '#bbb', fontSize: 13 }}>Sin productos</div>}

        {!loading && products.map((p, i) => (
          <div key={p.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: editRow === p.id ? 'none' : (i < products.length - 1 ? '1px solid #f5f5f5' : 'none'), background: selected.has(p.id) ? '#fff7f7' : editRow === p.id ? '#fffbf0' : 'white' }}>
              <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} style={{ cursor: 'pointer', width: 16, height: 16, flexShrink: 0 }} />
              <div style={{ width: 40, height: 56, background: '#f7f7f7', borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                {p.images?.[0]?.url ? <img src={p.images[0].url} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📚</div>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#111', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {p.slug && <a href={'/producto/' + p.slug} target="_blank" rel="noopener" style={{ fontSize: 10, color: '#3b82f6', padding: '1px 6px', background: '#eff6ff', borderRadius: 20, textDecoration: 'none' }}>🔗 Ver</a>}
                  <span style={{ fontSize: 10, background: '#f0f0f0', padding: '1px 6px', borderRadius: 20, color: '#666' }}>{p.supplier}</span>
                  <span style={{ fontSize: 10, background: p.status === 'published' ? '#f0fdf4' : '#f5f5f5', color: p.status === 'published' ? '#15803d' : '#999', padding: '1px 6px', borderRadius: 20 }}>{p.status === 'published' ? 'Pub.' : 'Draft'}</span>
                  {p.featured && <span style={{ fontSize: 10, background: '#fff7ed', color: '#c2410c', padding: '1px 6px', borderRadius: 20 }}>★</span>}
                </div>
              </div>

              {/* Price display */}
              {/* Price — click to edit inline */}
              <div onClick={() => editRow === p.id ? null : startEdit(p)}
                style={{ width: 140, textAlign: 'right', flexShrink: 0, cursor: 'pointer', borderRadius: 7, padding: '4px 8px', background: editRow === p.id ? '#fff7ed' : 'transparent', transition: 'background .15s' }}
                title="Click para editar precio">
                {p.price_old_usd && (
                  <div style={{ fontSize: 10, color: '#aaa', textDecoration: 'line-through' }}>
                    {priceMode === 'cop' ? '$' + Math.round(parseFloat(p.price_old_usd) * USD_COP).toLocaleString('es-CO') : '$' + parseFloat(p.price_old_usd).toFixed(2)}
                  </div>
                )}
                <div style={{ fontSize: 13, fontWeight: 600, color: editRow === p.id ? '#c2410c' : '#111' }}>{fmt(p)} <span style={{ fontSize: 10, color: '#ccc' }}>✏</span></div>
              </div>

              {/* Stock — click to edit inline */}
              <div onClick={() => editRow === p.id ? null : startEdit(p)}
                style={{ width: 50, textAlign: 'center', flexShrink: 0, cursor: 'pointer', borderRadius: 7, padding: '4px 4px', background: editRow === p.id ? '#fff7ed' : 'transparent', transition: 'background .15s' }}
                title="Click para editar unidades">
                <div style={{ fontSize: 13, color: p.stock <= 0 ? '#dc2626' : '#555', fontWeight: p.stock <= 0 ? 700 : 400 }}>{p.stock ?? 1} <span style={{ fontSize: 9, color: '#ccc' }}>✏</span></div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6, width: 180, justifyContent: 'flex-end', flexShrink: 0 }}>
                <button onClick={() => setEditRow(editRow === p.id ? null : p.id)} style={{ padding: '5px 11px', background: editRow === p.id ? '#fff7ed' : '#f5f5f5', borderRadius: 7, fontSize: 12, fontWeight: 600, color: editRow === p.id ? '#c2410c' : '#333', border: editRow === p.id ? '1px solid #fed7aa' : 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {editRow === p.id ? '✕ Cerrar' : '✏ Precio'}
                </button>
                <button onClick={() => toggleFeatured(p.id, p.featured)} style={{ padding: '5px 9px', background: p.featured ? '#fff7ed' : '#f5f5f5', borderRadius: 7, fontSize: 12, color: p.featured ? '#c2410c' : '#aaa', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {p.featured ? '★' : '☆'}
                </button>
                <Link href={'/admin/productos/' + p.id} style={{ padding: '5px 11px', background: '#f5f5f5', borderRadius: 7, fontSize: 12, fontWeight: 500, color: '#333', textDecoration: 'none' }}>Editar</Link>
                <button onClick={() => deleteProduct(p.id)} style={{ padding: '5px 9px', background: '#fef2f2', borderRadius: 7, fontSize: 12, color: '#dc2626', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {saving === p.id ? '...' : '✕'}
                </button>
              </div>
            </div>

            {/* Inline edit panel */}
            {editRow === p.id && (
              <div style={{ padding: '12px 16px 14px 82px', borderBottom: i < products.length - 1 ? '1px solid #f5f5f5' : 'none', background: '#fffbf0', display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ minWidth: 140 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Precio en COP *</label>
                  <input type="number" value={editData.price_cop} onChange={e => setEditData(d => ({...d, price_cop: e.target.value}))} style={inpStyle} placeholder="ej. 245000" />
                  <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>≈ ${editData.price_cop ? (parseInt(editData.price_cop)/USD_COP).toFixed(2) : '0.00'} USD</div>
                </div>
                <div style={{ minWidth: 140 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Precio tachado COP <span style={{ color: '#ccc' }}>(promo)</span></label>
                  <input type="number" value={editData.price_old_cop} onChange={e => setEditData(d => ({...d, price_old_cop: e.target.value}))} style={{ ...inpStyle, borderColor: '#e0e0e0' }} placeholder="ej. 320000" />
                </div>
                <div style={{ minWidth: 80 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Unidades</label>
                  <input type="number" value={editData.stock} onChange={e => setEditData(d => ({...d, stock: e.target.value}))} style={{ ...inpStyle, borderColor: '#e0e0e0' }} min="0" />
                </div>
                <button onClick={() => saveEdit(p.id)} disabled={saving === p.id} style={{ padding: '9px 20px', background: saving === p.id ? '#ccc' : '#CC0000', border: 'none', borderRadius: 8, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 2 }}>
                  {saving === p.id ? '...' : 'Guardar'}
                </button>
                <button onClick={() => setEditRow(null)} style={{ padding: '9px 14px', background: 'none', border: '1px solid #e0e0e0', borderRadius: 8, color: '#555', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 2 }}>
                  Cancelar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
