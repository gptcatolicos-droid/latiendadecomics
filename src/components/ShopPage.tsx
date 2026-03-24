'use client';
import { useState, useEffect, useRef } from 'react';
import ProductDrawer from './product/ProductDrawer';

interface Product {
  id: string;
  title: string;
  price_usd: number;
  price_cop: number;
  image: string;
  supplier_name: string;
  supplier_url: string;
  model: string;
  delivery_days: string;
}

export default function ShopPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [view, setView] = useState<'home' | 'catalog'>('home');
  const [sortBy, setSortBy] = useState<'reciente' | 'precio_asc' | 'precio_desc' | 'az'>('reciente');
  const [drawerProduct, setDrawerProduct] = useState<Product | null>(null);
  const [aiText, setAiText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Load catalog on mount
  useEffect(() => {
    fetch('/api/products?status=published&limit=100')
      .then(r => r.json())
      .then(d => {
        const items = (d.data?.items || []).map((p: any) => ({
          id: p.id,
          title: p.title,
          price_usd: p.price_usd,
          price_cop: p.price_cop,
          image: p.images?.[0]?.url || '',
          supplier_name: p.supplier === 'amazon' ? 'Amazon' : p.supplier === 'midtown' ? 'Midtown Comics' : p.supplier === 'ironstudios' ? 'Iron Studios' : p.supplier === 'panini' ? 'Panini' : 'La Tienda',
          supplier_url: p.supplier_url || '',
          model: 'dropshipping',
          delivery_days: p.supplier === 'panini' ? '3–5' : p.supplier === 'ironstudios' ? '5–8' : '6–10',
        }));
        setCatalog(items);
      })
      .catch(() => {});
  }, []);

  async function search(q?: string) {
    const term = (q || query).trim();
    if (!term) return;
    setQuery(term);
    setLoading(true);
    setSearched(true);
    setAiText('');
    setResults([]);
    setView('home');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: term }],
        }),
      });
      const data = await res.json();
      setAiText(data.text || '');
      setResults(data.products || []);
    } catch {
      setAiText('Error buscando. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  function sortedCatalog() {
    const items = [...catalog];
    if (sortBy === 'precio_asc') return items.sort((a, b) => a.price_usd - b.price_usd);
    if (sortBy === 'precio_desc') return items.sort((a, b) => b.price_usd - a.price_usd);
    if (sortBy === 'az') return items.sort((a, b) => a.title.localeCompare(b.title));
    return items;
  }

  const displayProducts = searched ? results : [];

  return (
    <>
      <div style={{
        minHeight: '100vh',
        backgroundImage: 'url(/background.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
      }}>

        {/* White overlay for readability */}
        <div style={{ minHeight: '100vh', background: 'rgba(255,255,255,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px 100px' }}>

          {/* Logo + H1 */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <img src="/logo.webp" alt="La Tienda de Comics" style={{ height: 52, margin: '0 auto 14px' }} />
            <h1 style={{
              fontFamily: 'Oswald, sans-serif',
              fontSize: 'clamp(20px, 4vw, 32px)',
              fontWeight: 700, color: '#111',
              textTransform: 'uppercase',
              letterSpacing: '.03em', marginBottom: 6,
            }}>
              La Tienda de Comics IA
            </h1>
            <p style={{ fontSize: 13, color: '#777' }}>
              La IA para comprar cómics, figuras y manga
            </p>
          </div>

          {/* Search bar — Google style */}
          <div style={{
            width: '100%', maxWidth: 600, marginBottom: 16,
            display: 'flex', gap: 8,
          }}>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center',
              background: '#fff', border: '2px solid #E8E8E8',
              borderRadius: 14, padding: '5px 5px 5px 18px',
              boxShadow: '0 4px 24px rgba(0,0,0,.08)',
              transition: 'border-color .2s, box-shadow .2s',
            }}>
              {/* Search icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, marginRight: 10 }}>
                <circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && search()}
                placeholder="Batman, Spider-Man, Naruto, Iron Studios..."
                style={{
                  flex: 1, border: 'none', outline: 'none',
                  fontSize: 15, color: '#111', background: 'transparent',
                  padding: '8px 0', fontFamily: 'inherit',
                }}
              />
              {query && (
                <button onClick={() => { setQuery(''); setSearched(false); setResults([]); inputRef.current?.focus(); }}
                  style={{ background: 'none', border: 'none', color: '#ccc', fontSize: 18, padding: '0 8px', cursor: 'pointer', lineHeight: 1 }}>
                  ×
                </button>
              )}
            </div>
            <button onClick={() => search()} disabled={loading || !query.trim()} style={{
              padding: '0 22px', background: loading ? '#ccc' : '#CC0000',
              border: 'none', borderRadius: 12, color: 'white',
              fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', whiteSpace: 'nowrap',
              boxShadow: '0 4px 16px rgba(204,0,0,.25)',
            }}>
              {loading ? '...' : 'Buscar'}
            </button>
          </div>

          {/* Quick chips */}
          {!searched && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'center', marginBottom: 24, maxWidth: 600 }}>
              {['Batman', 'Spider-Man', 'Naruto', 'Iron Studios', 'X-Men', 'Dragon Ball', 'Funko Pop', 'Death of Superman'].map(chip => (
                <button key={chip} onClick={() => search(chip)} style={{
                  padding: '7px 14px', borderRadius: 30, fontSize: 12, fontWeight: 500,
                  background: 'rgba(255,255,255,0.85)', border: '1.5px solid #E8E8E8',
                  color: '#555', cursor: 'pointer', backdropFilter: 'blur(4px)',
                  fontFamily: 'inherit',
                }}>
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* View toggle */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            <button onClick={() => setView('home')} style={{
              padding: '8px 20px', borderRadius: 30, fontSize: 12, fontWeight: 700,
              background: view === 'home' ? '#0D0D0D' : 'rgba(255,255,255,0.85)',
              color: view === 'home' ? 'white' : '#555',
              border: view === 'home' ? 'none' : '1.5px solid #E8E8E8',
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              🔍 Buscar
            </button>
            <button onClick={() => setView('catalog')} style={{
              padding: '8px 20px', borderRadius: 30, fontSize: 12, fontWeight: 700,
              background: view === 'catalog' ? '#0D0D0D' : 'rgba(255,255,255,0.85)',
              color: view === 'catalog' ? 'white' : '#555',
              border: view === 'catalog' ? 'none' : '1.5px solid #E8E8E8',
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              📚 Catálogo {catalog.length > 0 ? `(${catalog.length})` : ''}
            </button>
          </div>

          {/* SEARCH VIEW */}
          {view === 'home' && (
            <div style={{ width: '100%', maxWidth: 860 }}>
              {loading && (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginBottom: 12 }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#CC0000', animation: `bounce .8s ${i*150}ms infinite` }} />
                    ))}
                  </div>
                  <p style={{ fontSize: 13, color: '#888' }}>Buscando en Midtown, Iron Studios, Panini...</p>
                </div>
              )}

              {searched && !loading && results.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <p style={{ fontSize: 24, marginBottom: 8 }}>🔍</p>
                  <p style={{ fontSize: 15, color: '#555', fontWeight: 500 }}>Sin resultados para "{query}"</p>
                  <p style={{ fontSize: 13, color: '#999', marginTop: 4 }}>Intenta con un título en inglés o revisa el catálogo</p>
                </div>
              )}

              {results.length > 0 && (
                <>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#CC0000', animation: 'blink 2s infinite' }} />
                    {results.length} resultados para "{query}"
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
                    {results.map((p, i) => <ProductCard key={i} product={p} onClick={() => setDrawerProduct(p)} />)}
                  </div>
                </>
              )}
            </div>
          )}

          {/* CATALOG VIEW */}
          {view === 'catalog' && (
            <div style={{ width: '100%', maxWidth: 860 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                <p style={{ fontSize: 13, color: '#666' }}>{catalog.length} productos en catálogo</p>
                <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} style={{
                  padding: '7px 14px', borderRadius: 8, border: '1.5px solid #E8E8E8',
                  fontSize: 13, background: '#fff', fontFamily: 'inherit', outline: 'none',
                }}>
                  <option value="reciente">Más recientes</option>
                  <option value="az">A → Z</option>
                  <option value="precio_asc">Precio: menor a mayor</option>
                  <option value="precio_desc">Precio: mayor a menor</option>
                </select>
              </div>

              {catalog.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <p style={{ fontSize: 40, marginBottom: 12 }}>📚</p>
                  <p style={{ fontSize: 15, color: '#555', fontWeight: 500 }}>El catálogo está vacío</p>
                  <p style={{ fontSize: 13, color: '#999', marginTop: 6 }}>Importa productos desde el panel admin → Importar masivo</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
                  {sortedCatalog().map((p, i) => <ProductCard key={i} product={p} onClick={() => setDrawerProduct(p)} />)}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      <ProductDrawer product={drawerProduct} onClose={() => setDrawerProduct(null)} />

      <style>{`
        @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.2} }
      `}</style>
    </>
  );
}

function ProductCard({ product: p, onClick }: { product: Product; onClick: () => void }) {
  const copFormatted = p.price_cop ? `$${p.price_cop.toLocaleString('es-CO')} COP` : `$${(p.price_usd * 4100).toLocaleString('es-CO')} COP`;
  return (
    <div onClick={onClick} style={{
      background: '#fff', border: '1.5px solid #E8E8E8', borderRadius: 14,
      overflow: 'hidden', cursor: 'pointer', transition: 'all .18s',
      boxShadow: '0 2px 12px rgba(0,0,0,.06)',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,.12)'; (e.currentTarget as HTMLDivElement).style.borderColor = '#0D0D0D'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,.06)'; (e.currentTarget as HTMLDivElement).style.borderColor = '#E8E8E8'; }}
    >
      <div style={{ aspectRatio: '3/4', background: '#F7F7F7', position: 'relative', overflow: 'hidden' }}>
        {p.image
          ? <img src={p.image} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>📚</div>
        }
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(0deg,rgba(0,0,0,.7),transparent)',
          padding: '20px 8px 6px',
          fontSize: 9, fontWeight: 800, color: 'white',
          textTransform: 'uppercase', letterSpacing: '.05em',
        }}>
          {p.supplier_name}
        </div>
      </div>
      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{
          fontSize: 12, fontWeight: 500, lineHeight: 1.35, color: '#111',
          marginBottom: 6, overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {p.title}
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#CC0000' }}>
          {copFormatted}
        </div>
        <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
          📦 {p.delivery_days} días · ${p.price_usd?.toFixed(2)} USD
        </div>
        <button style={{
          width: '100%', padding: '8px 0', marginTop: 8,
          background: '#0D0D0D', border: 'none', color: 'white',
          fontSize: 11, fontWeight: 700, borderRadius: 8,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>
          Ver producto →
        </button>
      </div>
    </div>
  );
}
