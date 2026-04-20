'use client';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCart } from '@/hooks/useCart';
import { Suspense } from 'react';

function CatalogoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addItem } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const categoria = searchParams.get('categoria') || '';

  const CATS = [
    { value: '', label: 'Todo' },
    { value: 'comics', label: 'Cómics' },
    { value: 'manga', label: 'Manga' },
    { value: 'figuras', label: 'Figuras' },
    { value: 'accesorios', label: 'Accesorios' },
  ];

  useEffect(() => {
    setLoading(true);
    const p = new URLSearchParams({ status: 'published', limit: '200' });
    if (categoria) p.set('category', categoria);
    fetch('/api/products?' + p)
      .then(r => r.json())
      .then(d => { setProducts(d.data?.items || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [categoria]);

  const filtered = products.filter(p =>
    !search || p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.publisher?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f7f7f7' }}>
      {/* Nav */}
      <nav style={{ background: '#0D0D0D', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <img src="/logo.webp" alt="La Tienda de Comics" style={{ height: 36, objectFit: 'contain' }} />
          </a>
          <div style={{ display: 'flex', gap: 20 }}>
            {CATS.filter(c => c.value).map(c => (
              <a key={c.value} href={`/catalogo?categoria=${c.value}`}
                style={{ color: categoria === c.value ? 'white' : 'rgba(255,255,255,.5)', fontSize: 13, textDecoration: 'none', fontWeight: categoria === c.value ? 700 : 400 }}>
                {c.label}
              </a>
            ))}
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px' }}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111', marginBottom: 4 }}>
            {categoria ? CATS.find(c => c.value === categoria)?.label || 'Catálogo' : 'Catálogo completo'}
          </h1>
          <p style={{ fontSize: 13, color: '#888' }}>{filtered.length} productos</p>
        </div>

        {/* Search + Filter */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por título, editorial..."
            style={{ flex: 1, minWidth: 200, padding: '10px 14px', border: '1px solid #e0e0e0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', background: 'white' }} />
          <div style={{ display: 'flex', gap: 6 }}>
            {CATS.map(c => (
              <button key={c.value} onClick={() => router.push(c.value ? `/catalogo?categoria=${c.value}` : '/catalogo')}
                style={{ padding: '10px 16px', background: categoria === c.value ? '#CC0000' : 'white', color: categoria === c.value ? 'white' : '#555', border: '1px solid #e0e0e0', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>Cargando catálogo...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>No hay productos en esta categoría.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {filtered.map(p => {
              const cop = p.price_cop || Math.round(parseFloat(p.price_usd) * 4100);
              const img = p.images?.[0]?.url || '';
              return (
                <a key={p.id} href={`/producto/${p.slug}`}
                  style={{ background: 'white', borderRadius: 14, overflow: 'hidden', textDecoration: 'none', border: '1px solid #ebebeb', display: 'block', transition: 'box-shadow .15s' }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,.1)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                  <div style={{ aspectRatio: '3/4', background: '#f5f5f5', overflow: 'hidden' }}>
                    {img ? <img src={img} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>📚</div>}
                  </div>
                  <div style={{ padding: '10px 12px 14px' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#222', lineHeight: 1.35, marginBottom: 6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.title}</div>
                    {p.publisher && <div style={{ fontSize: 10, color: '#aaa', marginBottom: 6 }}>{p.publisher}</div>}
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#CC0000' }}>${cop.toLocaleString('es-CO')} COP</div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CatalogoPage() {
  return <Suspense fallback={<div style={{ padding: 60, textAlign: 'center', color: '#aaa' }}>Cargando...</div>}><CatalogoContent /></Suspense>;
}
