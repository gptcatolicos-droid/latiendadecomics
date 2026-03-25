'use client';
import { useState, useEffect, useRef } from 'react';
import ProductDrawer from './product/ProductDrawer';

interface Product {
  id: string; title: string; price_usd: number; price_cop: number;
  image: string; supplier: string; supplier_name: string; supplier_url: string;
  delivery_days: string; featured?: boolean;
}

export default function ShopPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [notFound, setNotFound] = useState('');
  const [view, setView] = useState<'search' | 'catalog'>('search');
  const [sortBy, setSortBy] = useState('destacados');
  const [drawerProduct, setDrawerProduct] = useState<Product | null>(null);
  const [bgOpacity, setBgOpacity] = useState(87);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/settings?keys=background_opacity')
      .then(r => r.json()).then(d => { if (d.background_opacity) setBgOpacity(parseInt(d.background_opacity)); })
      .catch(() => {});
    fetch('/api/products?status=published&limit=200')
      .then(r => r.json()).then(d => {
        setCatalog((d.data?.items || []).map((p: any) => ({
          id: p.id, title: p.title,
          price_usd: p.price_usd, price_cop: p.price_cop,
          image: p.images?.[0]?.url || '',
          supplier: p.supplier,
          supplier_name: ({ amazon:'Amazon', midtown:'Midtown Comics', ironstudios:'Iron Studios', panini:'Panini' } as any)[p.supplier] || 'La Tienda',
          supplier_url: p.supplier_url || '',
          delivery_days: p.supplier === 'panini' ? '3-5' : p.supplier === 'ironstudios' ? '5-8' : '6-10',
          featured: p.featured,
        })));
      }).catch(() => {});
  }, []);

  async function search(q?: string) {
    const term = (q || query).trim();
    if (!term || loading) return;
    setQuery(term); setLoading(true); setSearched(true); setNotFound(''); setResults([]); setView('search');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: term }] }),
      });
      const data = await res.json();
      if (data.products?.length > 0) setResults(data.products);
      else setNotFound(data.searchQuery || term);
    } catch { setNotFound(term); }
    finally { setLoading(false); }
  }

  function sorted(items: Product[]) {
    const c = [...items];
    if (sortBy === 'destacados') return c.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    if (sortBy === 'az') return c.sort((a, b) => a.title.localeCompare(b.title));
    if (sortBy === 'precio_asc') return c.sort((a, b) => Number(a.price_usd) - Number(b.price_usd));
    if (sortBy === 'precio_desc') return c.sort((a, b) => Number(b.price_usd) - Number(a.price_usd));
    return c;
  }

  return (
    <>
      <div style={{ minHeight: '100vh', backgroundImage: 'url(/background.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
        <div style={{ minHeight: '100vh', background: `rgba(255,255,255,${bgOpacity/100})`, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 14px 100px' }}>

          {/* Logo + Title */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <img src="/logo.webp" alt="La Tienda de Comics" style={{ height: 44, margin: '0 auto 10px' }} />
            <h1 style={{ fontFamily: 'Oswald, sans-serif', fontSize: 'clamp(16px, 6vw, 30px)', fontWeight: 700, color: '#111', textTransform: 'uppercase', letterSpacing: '.03em', marginBottom: 3 }}>
              La Tienda de Comics IA
            </h1>
            <p style={{ fontSize: 12, color: '#888' }}>La IA para comprar comics, figuras y manga</p>
          </div>

          {/* Search bar — full width on mobile */}
          <div style={{ width: '100%', maxWidth: 580, display: 'flex', gap: 8, marginBottom: 14 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#fff', border: '2px solid #E8E8E8', borderRadius: 14, padding: '5px 5px 5px 14px', boxShadow: '0 4px 20px rgba(0,0,0,.08)', minWidth: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, marginRight: 8 }}>
                <circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()}
                placeholder="¿Qué buscas?"
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, color: '#111', background: 'transparent', padding: '8px 0', fontFamily: 'inherit', minWidth: 0, width: '100%' }} />
              {query && <button onClick={() => { setQuery(''); setSearched(false); setResults([]); setNotFound(''); }}
                style={{ background: 'none', border: 'none', color: '#ccc', fontSize: 20, padding: '0 6px', cursor: 'pointer', flexShrink: 0 }}>×</button>}
            </div>
            <button onClick={() => search()} disabled={loading || !query.trim()} style={{
              padding: '0 18px', background: loading ? '#ccc' : '#CC0000', border: 'none', borderRadius: 12,
              color: 'white', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              {loading ? '...' : 'Buscar'}
            </button>
          </div>

          {/* Tabs — full width, same size */}
          <div style={{ width: '100%', maxWidth: 580, display: 'flex', gap: 8, marginBottom: 20 }}>
            <button onClick={() => setView('search')} style={{
              flex: 1, padding: '12px 0', borderRadius: 12, fontSize: 13, fontWeight: 700,
              background: view === 'search' ? '#0D0D0D' : '#fff',
              color: view === 'search' ? 'white' : '#555',
              border: view === 'search' ? 'none' : '1.5px solid #E8E8E8',
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Buscar
            </button>
            <button onClick={() => setView('catalog')} style={{
              flex: 1, padding: '12px 0', borderRadius: 12, fontSize: 13, fontWeight: 700,
              background: view === 'catalog' ? '#0D0D0D' : '#fff',
              color: view === 'catalog' ? 'white' : '#555',
              border: view === 'catalog' ? 'none' : '1.5px solid #E8E8E8',
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Ver catálogo
            </button>
          </div>

          <div style={{ width: '100%', maxWidth: 900 }}>
            {/* SEARCH */}
            {view === 'search' && (
              <>
                {loading && (
                  <div style={{ textAlign: 'center', padding: '50px 0' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 12 }}>
                      {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#CC0000', animation: `bounce .8s ${i*150}ms infinite` }} />)}
                    </div>
                    <p style={{ fontSize: 13, color: '#888' }}>Buscando...</p>
                  </div>
                )}
                {!loading && notFound && (
                  <div style={{ textAlign: 'center', padding: '36px 20px', background: '#fff', borderRadius: 16, border: '1.5px solid #E8E8E8' }}>
                    <div style={{ fontSize: 44, marginBottom: 10 }}>😕</div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: 6 }}>"{notFound}" no está en el catálogo</p>
                    <p style={{ fontSize: 13, color: '#888', marginBottom: 18 }}>Escríbenos y lo conseguimos.</p>
                    <a href={`https://wa.me/573001234567?text=Hola! Quiero: ${notFound}`} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'inline-block', padding: '10px 24px', background: '#25D366', borderRadius: 10, color: 'white', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                      Pedir por WhatsApp
                    </a>
                  </div>
                )}
                {!loading && results.length > 0 && (
                  <>
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
                      {results.length} resultado{results.length !== 1 ? 's' : ''} para "{query}"
                    </div>
                    <ProductGrid products={results} onSelect={setDrawerProduct} />
                  </>
                )}
                {!loading && !searched && (
                  <div style={{ textAlign: 'center', color: '#bbb', fontSize: 13, marginTop: 8 }}>
                    Escribe el nombre de un cómic, figura o personaje
                  </div>
                )}
              </>
            )}

            {/* CATALOG */}
            {view === 'catalog' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                  <p style={{ fontSize: 13, color: '#666', fontWeight: 500 }}>{catalog.length} productos</p>
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid #E8E8E8', fontSize: 12, background: '#fff', fontFamily: 'inherit', outline: 'none' }}>
                    <option value="destacados">Destacados primero</option>
                    <option value="az">A → Z</option>
                    <option value="precio_asc">Precio: menor a mayor</option>
                    <option value="precio_desc">Precio: mayor a menor</option>
                  </select>
                </div>
                {catalog.length > 0 && <ProductGrid products={sorted(catalog)} onSelect={setDrawerProduct} />}
              </>
            )}
          </div>
        </div>
      </div>

      <ProductDrawer product={drawerProduct} onClose={() => setDrawerProduct(null)} />
      <style>{`
        @keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-7px)}}
        @media(max-width:500px){
          .ltc-grid{grid-template-columns:repeat(2,1fr) !important;gap:10px !important}
        }
      `}</style>
    </>
  );
}

function ProductGrid({ products, onSelect }: { products: Product[]; onSelect: (p: Product) => void }) {
  return (
    <div className="ltc-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 12 }}>
      {products.map((p, i) => <ProductCard key={p.id || i} p={p} onClick={() => onSelect(p)} />)}
    </div>
  );
}

function ProductCard({ p, onClick }: { p: Product; onClick: () => void }) {
  const cop = p.price_cop ? Number(p.price_cop).toLocaleString('es-CO') : Math.round(Number(p.price_usd) * 4100).toLocaleString('es-CO');
  return (
    <div onClick={onClick} style={{ background: '#fff', border: `1.5px solid ${p.featured ? '#CC0000' : '#EFEFEF'}`, borderRadius: 14, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,.05)', transition: 'transform .18s', position: 'relative' }}>
      {p.featured && (
        <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 2, background: '#CC0000', color: 'white', fontSize: 8, fontWeight: 800, padding: '2px 7px', borderRadius: 20, textTransform: 'uppercase' }}>
          Destacado
        </div>
      )}
      <div style={{ aspectRatio: '3/4', background: '#F7F7F7', position: 'relative', overflow: 'hidden' }}>
        {p.image ? <img src={p.image} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>📚</div>}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(0deg,rgba(0,0,0,.7),transparent)', padding: '16px 8px 5px', fontSize: 9, fontWeight: 800, color: 'white', textTransform: 'uppercase' }}>
          {p.supplier_name}
        </div>
      </div>
      <div style={{ padding: '9px 10px 11px' }}>
        <div style={{ fontSize: 11, fontWeight: 500, lineHeight: 1.35, color: '#111', marginBottom: 5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {p.title}
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#CC0000' }}>${cop} COP</div>
        <div style={{ fontSize: 10, color: '#999', marginTop: 1 }}>${Number(p.price_usd).toFixed(2)} USD · {p.delivery_days} días</div>
        <button style={{ width: '100%', padding: '7px 0', marginTop: 7, background: '#0D0D0D', border: 'none', color: 'white', fontSize: 10, fontWeight: 700, borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit' }}>
          Ver producto →
        </button>
      </div>
    </div>
  );
}
