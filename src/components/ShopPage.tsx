'use client';
import { useState, useEffect, useRef } from 'react';
import { useCart } from '@/hooks/useCart';

interface Product {
  id: string; title: string; price_usd: number; price_cop: number;
  price_old_usd?: number; price_old_cop?: number;
  image: string; supplier: string; supplier_name: string; supplier_url: string;
  delivery_days: string; featured?: boolean; description?: string;
  images?: any[];
}

function priceToCOP(usd: number): number {
  const raw = Math.round(usd * 4100);
  if (raw < 10000) return Math.ceil(raw / 100) * 100 - 1;
  if (raw < 100000) return Math.ceil(raw / 1000) * 1000 - 10;
  return Math.ceil(raw / 10000) * 10000 - 1;
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
  const [selected, setSelected] = useState<Product | null>(null);
  const [bgOpacity, setBgOpacity] = useState(87);
  const [whatsapp, setWhatsapp] = useState('573187079104');
  const { totalItems } = useCart();
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    fetch('/api/settings?keys=background_opacity,whatsapp_number')
      .then(r => r.json()).then(d => {
        if (d.background_opacity) setBgOpacity(parseInt(d.background_opacity));
        if (d.whatsapp_number) setWhatsapp(d.whatsapp_number);
      }).catch(() => {});
    fetch('/api/products?status=published&limit=200')
      .then(r => r.json()).then(d => {
        setCatalog((d.data?.items || []).map(mapProduct));
      }).catch(() => {});
  }, []);

  function mapProduct(p: any): Product {
    const cop = priceToCOP(parseFloat(p.price_usd));
    const oldCop = p.price_old_usd ? priceToCOP(parseFloat(p.price_old_usd)) : undefined;
    return {
      id: p.id, title: p.title,
      price_usd: parseFloat(p.price_usd), price_cop: p.price_cop || cop,
      price_old_usd: p.price_old_usd ? parseFloat(p.price_old_usd) : undefined,
      price_old_cop: oldCop,
      image: p.images?.[0]?.url || '',
      images: p.images || [],
      supplier: p.supplier,
      supplier_name: ({ amazon:'Amazon', midtown:'Midtown Comics', ironstudios:'Iron Studios', panini:'Panini' } as any)[p.supplier] || 'La Tienda',
      supplier_url: p.supplier_url || '',
      delivery_days: p.supplier === 'panini' ? '3-5' : p.supplier === 'ironstudios' ? '5-8' : '6-10',
      featured: p.featured,
      description: p.description,
      affiliate_url: p.affiliate_url,
    };
  }

  async function search(q?: string) {
    const term = (q || query).trim();
    if (!term || loading) return;
    setQuery(term); setLoading(true); setSearched(true); setNotFound(''); setResults([]); setView('search'); setSelected(null);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: term }] }),
      });
      const data = await res.json();
      const prods = (data.products || []).map((p: any) => ({
        ...p, price_cop: priceToCOP(parseFloat(p.price_usd)),
      }));
      if (prods.length > 0) setResults(prods);
      else setNotFound(data.searchQuery || term);
    } catch { setNotFound(term); }
    finally { setLoading(false); }
  }

  function sorted(items: Product[]) {
    const c = [...items];
    if (sortBy === 'destacados') return c.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    if (sortBy === 'az') return c.sort((a, b) => a.title.localeCompare(b.title));
    if (sortBy === 'precio_asc') return c.sort((a, b) => a.price_usd - b.price_usd);
    if (sortBy === 'precio_desc') return c.sort((a, b) => b.price_usd - a.price_usd);
    return c;
  }

  const showPanel = !!selected;

  return (
    <>
      <div style={{ minHeight: '100vh', backgroundImage: 'url(/background.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
        <div style={{ minHeight: '100vh', background: `rgba(255,255,255,${bgOpacity/100})` }}>
          
          {/* Top bar with cart */}
          <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #f0f0f0', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <img src="/logo.webp" alt="La Tienda de Comics" style={{ height: 28, objectFit: 'contain' }} />
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: '50%', background: '#25D366', color: 'white', textDecoration: 'none', fontSize: 18 }}>
                💬
              </a>
              <a href="/checkout" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#0D0D0D', borderRadius: 10, color: 'white', textDecoration: 'none', fontSize: 13, fontWeight: 600, position: 'relative' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                Carrito
                {totalItems > 0 && <span style={{ position: 'absolute', top: -6, right: -6, background: '#CC0000', color: 'white', borderRadius: '50%', width: 18, height: 18, fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{totalItems}</span>}
              </a>
            </div>
          </div>

          {/* Main content */}
          <div style={{ display: 'flex', minHeight: 'calc(100vh - 58px)' }}>
            {/* Left panel */}
            <div style={{ flex: 1, padding: '28px 20px 100px', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'all .3s' }}>
              
              {/* Title — hide on mobile when product open */}
              {!selected && (
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <h1 style={{ fontFamily: 'Oswald, sans-serif', fontSize: 'clamp(16px, 5vw, 28px)', fontWeight: 700, color: '#111', textTransform: 'uppercase', letterSpacing: '.03em', marginBottom: 3 }}>
                    La Tienda de Comics IA
                  </h1>
                  <p style={{ fontSize: 12, color: '#888' }}>La IA para comprar comics, figuras y manga</p>
                </div>
              )}

              {/* Search */}
              <div style={{ width: '100%', maxWidth: 560, display: 'flex', gap: 8, marginBottom: 12 }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#fff', border: '2px solid #E8E8E8', borderRadius: 14, padding: '5px 5px 5px 14px', boxShadow: '0 4px 20px rgba(0,0,0,.08)', minWidth: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, marginRight: 8 }}>
                    <circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                  <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()}
                    placeholder="¿Qué buscas?"
                    style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, color: '#111', background: 'transparent', padding: '8px 0', fontFamily: 'inherit', minWidth: 0 }} />
                  {query && <button onClick={() => { setQuery(''); setSearched(false); setResults([]); setNotFound(''); }} style={{ background: 'none', border: 'none', color: '#ccc', fontSize: 20, padding: '0 6px', cursor: 'pointer' }}>×</button>}
                </div>
                <button onClick={() => search()} disabled={loading || !query.trim()} style={{ padding: '0 18px', background: loading ? '#ccc' : '#CC0000', border: 'none', borderRadius: 12, color: 'white', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {loading ? '...' : 'Buscar'}
                </button>
              </div>

              {/* Tabs */}
              <div style={{ width: '100%', maxWidth: 560, display: 'flex', gap: 8, marginBottom: 20 }}>
                {(['search', 'catalog'] as const).map(v => (
                  <button key={v} onClick={() => { setView(v); setSelected(null); }} style={{ flex: 1, padding: '11px 0', borderRadius: 12, fontSize: 13, fontWeight: 700, background: view === v ? '#0D0D0D' : '#fff', color: view === v ? 'white' : '#555', border: view === v ? 'none' : '1.5px solid #E8E8E8', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {v === 'search' ? 'Buscar' : 'Ver catálogo'}
                  </button>
                ))}
              </div>

              {/* Results */}
              <div style={{ width: '100%', maxWidth: 900 }}>
                {view === 'search' && (
                  <>
                    {loading && <div style={{ textAlign: 'center', padding: '40px 0' }}><div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>{[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#CC0000', animation: `bounce .8s ${i*150}ms infinite` }} />)}</div></div>}
                    {!loading && notFound && (
                      <div style={{ textAlign: 'center', padding: '36px 20px', background: '#fff', borderRadius: 16, border: '1.5px solid #E8E8E8' }}>
                        <div style={{ fontSize: 40, marginBottom: 8 }}>😕</div>
                        <p style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: 6 }}>"{notFound}" no está en el catálogo</p>
                        <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>Escríbenos y lo conseguimos.</p>
                        <a href={`https://wa.me/${whatsapp}?text=Hola! Quiero: ${notFound}`} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'inline-block', padding: '10px 24px', background: '#25D366', borderRadius: 10, color: 'white', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                          Pedir por WhatsApp
                        </a>
                      </div>
                    )}
                    {!loading && results.length > 0 && (
                      <>
                        <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>{results.length} resultado{results.length !== 1 ? 's' : ''} para "{query}"</div>
                        <ProductGrid products={results} selected={selected} onSelect={setSelected} />
                      </>
                    )}
                    {!loading && !searched && <div style={{ textAlign: 'center', color: '#bbb', fontSize: 13, marginTop: 8 }}>Escribe el nombre de un cómic, figura o personaje</div>}
                  </>
                )}

                {view === 'catalog' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                      <p style={{ fontSize: 13, color: '#666', fontWeight: 500 }}>{catalog.length} productos</p>
                      <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid #E8E8E8', fontSize: 12, background: '#fff', fontFamily: 'inherit', outline: 'none' }}>
                        <option value="destacados">Destacados</option>
                        <option value="az">A → Z</option>
                        <option value="precio_asc">Precio: menor</option>
                        <option value="precio_desc">Precio: mayor</option>
                      </select>
                    </div>
                    {catalog.length > 0 && <ProductGrid products={sorted(catalog)} selected={selected} onSelect={setSelected} />}
                  </>
                )}
              </div>
            </div>

            {/* Right panel — desktop product detail */}
            {selected && (
              <div style={{ width: 400, flexShrink: 0, background: '#fff', borderLeft: '1px solid #ebebeb', position: 'sticky', top: 58, height: 'calc(100vh - 58px)', overflowY: 'auto', display: 'none' }} className="ltc-detail-panel">
                <ProductDetail product={selected} onClose={() => setSelected(null)} whatsapp={whatsapp} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile modal */}
      {selected && (
        <>
          <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 100, animation: 'fadeIn .2s ease' }} className="ltc-mobile-overlay" />
          <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 600, background: '#fff', borderRadius: '20px 20px 0 0', zIndex: 101, maxHeight: '92vh', overflowY: 'auto', animation: 'slideUp .3s cubic-bezier(.32,.72,0,1)' }} className="ltc-mobile-drawer">
            <div style={{ width: 36, height: 4, background: '#E0E0E0', borderRadius: 2, margin: '12px auto 0' }} />
            <ProductDetail product={selected} onClose={() => setSelected(null)} whatsapp={whatsapp} />
          </div>
        </>
      )}

      {/* Footer */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', borderTop: '1px solid #f0f0f0', padding: '8px 20px', display: 'flex', justifyContent: 'center', gap: 20, zIndex: 40 }}>
        <span style={{ fontSize: 11, color: '#aaa' }}>© 2026 La Tienda de Comics</span>
        <a href="/terminos" style={{ fontSize: 11, color: '#888', textDecoration: 'none' }}>Términos y Condiciones</a>
        <a href="/privacidad" style={{ fontSize: 11, color: '#888', textDecoration: 'none' }}>Política de Privacidad</a>
        <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#888', textDecoration: 'none' }}>Contacto</a>
      </div>

      <style>{`
        @keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-7px)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{transform:translateX(-50%) translateY(100%)}to{transform:translateX(-50%) translateY(0)}}
        @media(min-width:900px){
          .ltc-detail-panel{display:block !important}
          .ltc-mobile-overlay,.ltc-mobile-drawer{display:none !important}
        }
        @media(max-width:500px){
          .ltc-grid{grid-template-columns:repeat(2,1fr) !important;gap:10px !important}
        }
      `}</style>
    </>
  );
}

function ProductGrid({ products, selected, onSelect }: { products: Product[]; selected: Product | null; onSelect: (p: Product) => void }) {
  return (
    <div className="ltc-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 12 }}>
      {products.map((p, i) => <ProductCard key={p.id || i} p={p} isSelected={selected?.id === p.id} onClick={() => onSelect(p)} />)}
    </div>
  );
}

function ProductCard({ p, isSelected, onClick }: { p: Product; isSelected: boolean; onClick: () => void }) {
  const cop = p.price_cop || priceToCOP(p.price_usd);
  const oldCop = p.price_old_cop || (p.price_old_usd ? priceToCOP(p.price_old_usd) : undefined);
  return (
    <div onClick={onClick} style={{ background: '#fff', border: `2px solid ${isSelected ? '#CC0000' : p.featured ? '#f97316' : '#EFEFEF'}`, borderRadius: 14, overflow: 'hidden', cursor: 'pointer', boxShadow: isSelected ? '0 4px 20px rgba(204,0,0,.2)' : '0 2px 10px rgba(0,0,0,.05)', transition: 'all .18s', position: 'relative' }}>
      {p.featured && !isSelected && <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 2, background: '#f97316', color: 'white', fontSize: 8, fontWeight: 800, padding: '2px 7px', borderRadius: 20, textTransform: 'uppercase' }}>Destacado</div>}
      <div style={{ aspectRatio: '3/4', background: '#F7F7F7', position: 'relative', overflow: 'hidden' }}>
        {p.image ? <img src={p.image} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>📚</div>}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(0deg,rgba(0,0,0,.7),transparent)', padding: '16px 8px 5px', fontSize: 9, fontWeight: 800, color: 'white', textTransform: 'uppercase' }}>
          {p.supplier_name}
        </div>
      </div>
      <div style={{ padding: '9px 10px 11px' }}>
        <div style={{ fontSize: 11, fontWeight: 500, lineHeight: 1.35, color: '#111', marginBottom: 5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{p.title}</div>
        {oldCop && <div style={{ fontSize: 11, color: '#aaa', textDecoration: 'line-through' }}>${oldCop.toLocaleString('es-CO')}</div>}
        <div style={{ fontSize: 14, fontWeight: 700, color: '#CC0000' }}>${cop.toLocaleString('es-CO')} COP</div>
        <div style={{ fontSize: 10, color: '#999', marginTop: 1 }}>${p.price_usd?.toFixed(2)} USD · {p.delivery_days} días</div>
        <button style={{ width: '100%', padding: '7px 0', marginTop: 7, background: isSelected ? '#CC0000' : '#0D0D0D', border: 'none', color: 'white', fontSize: 10, fontWeight: 700, borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit' }}>
          {isSelected ? 'Seleccionado ✓' : 'Ver producto →'}
        </button>
      </div>
    </div>
  );
}

function ProductDetail({ product: p, onClose, whatsapp }: { product: Product; onClose: () => void; whatsapp: string }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [activeImg, setActiveImg] = useState(0);
  const { addItem } = useCart();

  const isAmazon = p.supplier === 'amazon' || (p.supplier_url || '').includes('amazon.com');
  const cop = p.price_cop || priceToCOP(p.price_usd);
  const oldCop = p.price_old_cop || (p.price_old_usd ? priceToCOP(p.price_old_usd) : undefined);
  const affiliateUrl = p.affiliate_url || ((p.supplier_url || '').includes('tag=') ? p.supplier_url : `${p.supplier_url}${(p.supplier_url || '').includes('?') ? '&' : '?'}tag=danielpalacio-20`);
  const allImages = p.images?.length ? p.images : (p.image ? [{ url: p.image }] : []);
  const currentImg = allImages[activeImg]?.url || p.image;

  function handleAddCart() {
    addItem({ id: p.id || p.supplier_url, title: p.title, price_usd: p.price_usd, price_cop: cop, image_url: p.image, supplier: p.supplier, product_url: p.supplier_url }, qty);
    setAdded(true); setTimeout(() => setAdded(false), 2000);
  }
  function handleBuyNow() { handleAddCart(); setTimeout(() => { window.location.href = '/checkout'; }, 300); }

  async function askProduct() {
    if (!chatInput.trim() || chatLoading) return;
    setChatLoading(true);
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: `Sobre "${p.title}": ${chatInput}` }] }) });
      const data = await res.json();
      setChatResponse(data.text || 'No pude responder.'); setChatInput('');
    } catch { setChatResponse('Error. Intenta de nuevo.'); }
    finally { setChatLoading(false); }
  }

  return (
    <div style={{ padding: '14px 20px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: isAmazon ? '#f97316' : '#CC0000', textTransform: 'uppercase', letterSpacing: '.1em' }}>{p.supplier_name}</div>
        <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: '50%', background: '#F0F0F0', border: 'none', cursor: 'pointer', fontSize: 13, color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.2, marginBottom: 14, fontFamily: "'Oswald', sans-serif" }}>{p.title}</h2>

      {/* Main image with lightbox */}
      <div onClick={() => setLightbox(currentImg)} style={{ width: '100%', maxHeight: 300, background: '#F7F7F7', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, overflow: 'hidden', border: '1px solid #E8E8E8', cursor: 'zoom-in', position: 'relative' }}>
        {currentImg ? <img src={currentImg} alt={p.title} style={{ maxWidth: '100%', maxHeight: 300, objectFit: 'contain' }} /> : <span style={{ fontSize: 60 }}>📚</span>}
        <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,.4)', color: 'white', borderRadius: 6, padding: '3px 7px', fontSize: 10 }}>🔍 Ver</div>
      </div>

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
          {allImages.map((img: any, i: number) => (
            <div key={i} onClick={() => setActiveImg(i)} style={{ width: 48, height: 64, flexShrink: 0, borderRadius: 6, overflow: 'hidden', border: `2px solid ${activeImg === i ? '#CC0000' : '#E8E8E8'}`, cursor: 'pointer' }}>
              <img src={img.url} alt={`${p.title} ${i+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      )}

      {/* Price */}
      <div style={{ background: '#F7F7F7', borderRadius: 12, padding: '12px 14px', marginBottom: 14 }}>
        {oldCop && <div style={{ fontSize: 13, color: '#aaa', textDecoration: 'line-through', marginBottom: 2 }}>${oldCop.toLocaleString('es-CO')} COP</div>}
        <div style={{ fontSize: 30, fontWeight: 800, color: '#CC0000', letterSpacing: '-.02em', lineHeight: 1 }}>${cop.toLocaleString('es-CO')} COP</div>
        <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>${p.price_usd?.toFixed(2)} USD</div>
        {!isAmazon && <div style={{ fontSize: 11, color: '#15803d', marginTop: 6, fontWeight: 600 }}>🚚 Envío Colombia: $5 · Internacional: $30</div>}
      </div>

      {/* Description */}
      {p.description && (
        <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6, marginBottom: 14 }}>
          {p.description.slice(0, 200)}{p.description.length > 200 ? '...' : ''}
        </p>
      )}

      {/* Delivery */}
      <div style={{ background: '#f0f7ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
        <span style={{ fontSize: 20 }}>📦</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1e3a5f' }}>{p.delivery_days || '6-10'} días hábiles</div>
          <div style={{ fontSize: 11, color: '#3b82f6', marginTop: 1 }}>{isAmazon ? 'Amazon → Amazon Prime → Tu dirección' : `${p.supplier_name} → USPS/DHL → Tu dirección`}</div>
        </div>
      </div>

      {/* CTAs - BOTH buttons for Amazon */}
      {isAmazon ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          <a href={affiliateUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
            <img src="/amazon-btn.png" alt="Order now at Amazon" style={{ height: 50, margin: '0 auto', objectFit: 'contain' }} />
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>Cant.</span>
            <div style={{ display: 'inline-flex', border: '1.5px solid #0D0D0D', borderRadius: 8, overflow: 'hidden' }}>
              <button onClick={() => setQty(q => Math.max(1, q-1))} style={{ width: 32, height: 32, background: '#fff', border: 'none', fontSize: 16, cursor: 'pointer' }}>−</button>
              <span style={{ width: 36, textAlign: 'center', fontSize: 14, fontWeight: 700, lineHeight: '32px' }}>{qty}</span>
              <button onClick={() => setQty(q => q+1)} style={{ width: 32, height: 32, background: '#fff', border: 'none', fontSize: 16, cursor: 'pointer' }}>+</button>
            </div>
          </div>
          <button onClick={handleBuyNow} style={{ width: '100%', padding: '13px 0', background: '#CC0000', border: 'none', color: 'white', fontSize: 14, fontWeight: 700, borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
            Comprar en La Tienda →
          </button>
          <p style={{ fontSize: 11, color: '#bbb', textAlign: 'center', margin: 0 }}>O compra directo en Amazon con el botón de arriba</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>Cantidad</span>
            <div style={{ display: 'inline-flex', border: '2px solid #0D0D0D', borderRadius: 8, overflow: 'hidden' }}>
              <button onClick={() => setQty(q => Math.max(1, q-1))} style={{ width: 36, height: 36, background: '#fff', border: 'none', fontSize: 18, cursor: 'pointer' }}>−</button>
              <span style={{ width: 40, textAlign: 'center', fontSize: 15, fontWeight: 700, lineHeight: '36px' }}>{qty}</span>
              <button onClick={() => setQty(q => q+1)} style={{ width: 36, height: 36, background: '#fff', border: 'none', fontSize: 18, cursor: 'pointer' }}>+</button>
            </div>
            <span style={{ fontSize: 12, color: '#15803d', fontWeight: 600 }}>✓ Disponible</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 14 }}>
            <button onClick={handleBuyNow} style={{ width: '100%', padding: 14, background: '#CC0000', border: 'none', color: 'white', fontSize: 15, fontWeight: 700, borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Comprar ahora →</button>
            <button onClick={handleAddCart} style={{ width: '100%', padding: 14, background: added ? '#0D0D0D' : '#fff', border: '2px solid #0D0D0D', color: added ? 'white' : '#0D0D0D', fontSize: 15, fontWeight: 700, borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s' }}>
              {added ? '✓ Agregado' : '+ Agregar al carrito'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', fontSize: 11, color: '#aaa', marginBottom: 16 }}>
            <span>🔒 Pago seguro</span><span>🏦 MercadoPago</span><span>📦 Garantizado</span>
          </div>
        </>
      )}

      {/* AI Chat */}
      <div style={{ background: '#F7F7F7', border: '1px solid #E8E8E8', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ background: '#0D0D0D', padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#CC0000', animation: 'blink 2s infinite' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>Pregunta sobre este producto</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', marginLeft: 'auto' }}>IA</span>
        </div>
        {chatResponse && <div style={{ padding: '12px 14px', fontSize: 13, color: '#555', lineHeight: 1.6, borderBottom: '1px solid #E8E8E8' }}>{chatResponse}</div>}
        {!chatResponse && <div style={{ padding: '10px 14px', fontSize: 12, color: '#aaa', fontStyle: 'italic', borderBottom: '1px solid #E8E8E8' }}>¿Es buena para alguien nuevo? ¿Qué leer después?</div>}
        <div style={{ display: 'flex', gap: 7, padding: '8px 10px' }}>
          <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && askProduct()} placeholder="Escribe tu pregunta..."
            style={{ flex: 1, background: '#fff', border: '1px solid #E8E8E8', borderRadius: 7, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
          <button onClick={askProduct} disabled={chatLoading} style={{ padding: '8px 12px', background: '#CC0000', border: 'none', borderRadius: 7, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            {chatLoading ? '...' : '→'}
          </button>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.9)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
          <img src={lightbox} alt="Zoom" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }} />
          <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,.2)', border: 'none', color: 'white', width: 36, height: 36, borderRadius: '50%', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Footer */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', borderTop: '1px solid #f0f0f0', padding: '8px 20px', display: 'flex', justifyContent: 'center', gap: 20, zIndex: 40 }}>
        <span style={{ fontSize: 11, color: '#aaa' }}>© 2026 La Tienda de Comics</span>
        <a href="/terminos" style={{ fontSize: 11, color: '#888', textDecoration: 'none' }}>Términos y Condiciones</a>
        <a href="/privacidad" style={{ fontSize: 11, color: '#888', textDecoration: 'none' }}>Política de Privacidad</a>
        <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#888', textDecoration: 'none' }}>Contacto</a>
      </div>

      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:.2}}`}</style>
    </div>
  );
}
