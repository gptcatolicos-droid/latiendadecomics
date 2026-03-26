'use client';
import { useState, useEffect, useRef } from 'react';
import { useCart } from '@/hooks/useCart';

interface Product {
  id: string; title: string; slug?: string;
  price_usd: number; price_cop: number;
  price_old_usd?: number; price_old_cop?: number;
  image: string; images?: any[];
  supplier: string; supplier_url: string;
  affiliate_url?: string;
  delivery_type?: string;
  category?: string; publisher?: string;
  featured?: boolean; description?: string;
}

function copFmt(n: number) { return '$' + Math.round(n).toLocaleString('es-CO'); }

export default function ShopPage() {
  const [query, setQuery] = useState('');
  const [chatMessages, setChatMessages] = useState<{role:'user'|'assistant';text:string;products?:Product[]}[]>([
    { role: 'assistant', text: 'Hola, soy Jarvis ✦ la IA de La Tienda de Comics. ¿Qué cómic, figura o manga estás buscando hoy?' }
  ]);
  const [results, setResults] = useState<Product[]>([]);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [view, setView] = useState<'search'|'catalog'>('search');
  const [sortBy, setSortBy] = useState('destacados');
  const [selected, setSelected] = useState<Product|null>(null);
  const [bgOpacity, setBgOpacity] = useState(87);
  const [whatsapp, setWhatsapp] = useState('573187079104');
  const [activeCoupon, setActiveCoupon] = useState<any>(null); // kept for future use
  const { totalItems } = useCart();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 900);
    const handler = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => {
    fetch('/api/settings?keys=background_opacity,whatsapp_number')
      .then(r => r.json()).then(d => {
        if (d.background_opacity) setBgOpacity(parseInt(d.background_opacity));
        if (d.whatsapp_number) setWhatsapp(d.whatsapp_number);
      }).catch(() => {});
    fetch('/api/products?status=published&limit=200')
      .then(r => r.json()).then(d => setCatalog((d.data?.items || []).map(mapProduct)))
      .catch(() => {});
    // Load recently viewed from localStorage
    try {
      const rv = JSON.parse(localStorage.getItem('ltc_recently_viewed') || '[]');
      setRecentlyViewed(rv.slice(0, 6));
    } catch {}
  }, []);

  function mapProduct(p: any): Product {
    const cop = p.price_cop || Math.round(parseFloat(p.price_usd) * 4100);
    const oldCop = p.price_old_usd ? Math.round(parseFloat(p.price_old_usd) * 4100) : undefined;
    return {
      id: p.id, title: p.title, slug: p.slug,
      price_usd: parseFloat(p.price_usd), price_cop: cop,
      price_old_usd: p.price_old_usd ? parseFloat(p.price_old_usd) : undefined,
      price_old_cop: oldCop,
      image: p.images?.[0]?.url || '', images: p.images || [],
      supplier: p.supplier,
      supplier_url: p.supplier_url || '',
      affiliate_url: p.affiliate_url || '',
      delivery_type: p.delivery_type || 'standard',
      category: p.category, publisher: p.publisher,
      featured: p.featured, description: p.description,
    };
  }

  function addToRecentlyViewed(p: Product) {
    try {
      const current = JSON.parse(localStorage.getItem('ltc_recently_viewed') || '[]');
      const filtered = current.filter((r: Product) => r.id !== p.id);
      const updated = [p, ...filtered].slice(0, 6);
      localStorage.setItem('ltc_recently_viewed', JSON.stringify(updated));
      setRecentlyViewed(updated);
    } catch {}
  }

  function selectProduct(p: Product) {
    setSelected(p);
    addToRecentlyViewed(p);
  }

  async function search(q?: string) {
    const term = (q || query).trim();
    if (!term || loading) return;
    setQuery(term); setLoading(true); setSearched(true); setView('search');
    const userMsg = { role: 'user' as const, text: term, products: [] };
    setChatMessages(prev => [...prev, userMsg]);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: term }] }),
      });
      const data = await res.json();
      const prods = (data.products || []).map((p: any) => ({ ...p, price_cop: p.price_cop || Math.round(parseFloat(p.price_usd) * 4100) }));
      setResults(prods);
      const aiText = data.hasProducts
        ? prods.length === 1 ? `¡Encontré exactamente lo que buscas! Este es el título que tenemos.`
          : `¡Buenas noticias! Tenemos ${prods.length} ${prods.length === 1 ? 'título' : 'títulos'} relacionados con "${term}". ${prods.length > 3 ? 'Te muestro los mejores.' : ''}`
        : data.searchQuery
          ? `No tenemos "${data.searchQuery}" en el catálogo todavía. Escríbenos por WhatsApp y lo conseguimos para ti. ¿Puedo ayudarte a buscar algo más?`
          : data.text || 'Cuéntame más, ¿qué tipo de cómic o personaje te interesa?';
      setChatMessages(prev => [...prev, { role: 'assistant', text: aiText, products: prods }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', text: 'Error de conexión. Intenta de nuevo.', products: [] }]);
    }
    setLoading(false);
  }

  function sorted(items: Product[]) {
    const c = [...items];
    if (sortBy === 'destacados') return c.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    if (sortBy === 'az') return c.sort((a, b) => a.title.localeCompare(b.title));
    if (sortBy === 'precio_asc') return c.sort((a, b) => a.price_usd - b.price_usd);
    if (sortBy === 'precio_desc') return c.sort((a, b) => b.price_usd - a.price_usd);
    return c;
  }

  const showPanel = !!selected && !isMobile;

  return (
    <>
      <div style={{ minHeight: '100vh', backgroundImage: 'url(/background.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
        <div style={{ minHeight: '100vh', background: `rgba(255,255,255,${bgOpacity/100})` }}>

          {/* Sticky top bar */}
          <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #f0f0f0', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <img src="/logo.webp" alt="La Tienda de Comics" style={{ height: 32, objectFit: 'contain' }} />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: '50%', background: '#25D366', color: 'white', textDecoration: 'none', fontSize: 18 }}>💬</a>
              <a href="/checkout" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#0D0D0D', borderRadius: 10, color: 'white', textDecoration: 'none', fontSize: 13, fontWeight: 600, position: 'relative' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                <span style={{ display: isMobile ? 'none' : 'inline' }}>Carrito</span>
                {totalItems > 0 && <span style={{ position: 'absolute', top: -6, right: -6, background: '#CC0000', color: 'white', borderRadius: '50%', width: 18, height: 18, fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{totalItems}</span>}
              </a>
            </div>
          </div>

          <div style={{ display: 'flex', minHeight: 'calc(100vh - 58px)' }}>
            {/* Left panel */}
            <div style={{ flex: 1, padding: isMobile ? '16px 14px 100px' : '28px 20px 120px', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'all .3s', minWidth: 0 }}>

              {/* Logo + title */}
              <div style={{ textAlign: 'center', marginBottom: isMobile ? 14 : 20 }}>
                <img src="/logo.webp" alt="La Tienda de Comics" style={{ height: isMobile ? 44 : 70, margin: '0 auto 8px', objectFit: 'contain' }} />
                <h1 style={{ fontFamily: 'Oswald, sans-serif', fontSize: isMobile ? 18 : 26, fontWeight: 700, color: '#111', textTransform: 'uppercase', letterSpacing: '.03em', marginBottom: 2 }}>
                  La Tienda de Comics IA
                </h1>
                <p style={{ fontSize: 11, color: '#888' }}>La IA para comprar comics, figuras y manga</p>
              </div>

              {/* Toggle pill — single control */}
              <div style={{ width: '100%', maxWidth: 400, marginBottom: 18 }}>
                <div style={{ display: 'flex', background: '#f0f0f0', borderRadius: 14, padding: 3, gap: 3 }}>
                  <button onClick={() => setView('search')} style={{ flex: 1, padding: '10px 0', borderRadius: 11, fontSize: 13, fontWeight: 700, background: view === 'search' ? '#CC0000' : 'transparent', color: view === 'search' ? 'white' : '#666', border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s' }}>
                    🔍 Buscar IA
                  </button>
                  <button onClick={() => setView('catalog')} style={{ flex: 1, padding: '10px 0', borderRadius: 11, fontSize: 13, fontWeight: 700, background: view === 'catalog' ? '#0D0D0D' : 'transparent', color: view === 'catalog' ? 'white' : '#666', border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s' }}>
                    📚 Catálogo
                  </button>
                </div>
              </div>

              <div style={{ width: '100%', maxWidth: 900 }}>

                {/* SEARCH / CHAT VIEW */}
                {view === 'search' && (
                  <>
                    {/* Chat history */}
                    {chatMessages.length > 0 && (
                      <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {chatMessages.map((msg, i) => (
                          <div key={i}>
                            {msg.role === 'user' ? (
                              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <div style={{ background: '#0D0D0D', color: 'white', borderRadius: '16px 16px 4px 16px', padding: '10px 16px', fontSize: 14, maxWidth: '70%' }}>{msg.text}</div>
                              </div>
                            ) : (
                              <div>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: msg.products?.length ? 12 : 0 }}>
                                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#CC0000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14 }}>✦</div>
                                  <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: '4px 16px 16px 16px', padding: '10px 14px', fontSize: 14, color: '#333', lineHeight: 1.5, maxWidth: '80%', boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>{msg.text}</div>
                                </div>
                                {msg.products && msg.products.length > 0 && (
                                  <div style={{ marginLeft: 36 }}>
                                    <ProductGrid products={msg.products} selected={selected} onSelect={selectProduct} />
                                  </div>
                                )}
                                {msg.products && msg.products.length === 0 && msg.role === 'assistant' && msg !== chatMessages[0] && (
                                  <div style={{ marginLeft: 36, marginTop: 10 }}>
                                    <a href={`https://wa.me/${whatsapp}?text=Hola! Quiero: ${chatMessages.find(m=>m.role==='user')?.text}`} target="_blank" rel="noopener noreferrer"
                                      style={{ display: 'inline-block', padding: '8px 18px', background: '#25D366', borderRadius: 8, color: 'white', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                                      📲 Pedir por WhatsApp
                                    </a>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                        {loading && (
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#CC0000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14 }}>✦</div>
                            <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: '4px 16px 16px 16px', padding: '12px 16px', display: 'flex', gap: 4 }}>
                              {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#CC0000', animation: `bounce .8s ${i*150}ms infinite` }} />)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Chat input - always visible in search mode */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                      <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()}
                        placeholder={searched ? "Escribe otra búsqueda..." : "Busca un cómic, personaje, saga..."}
                        style={{ flex: 1, padding: '12px 16px', border: '2px solid #e8e8e8', borderRadius: 12, fontSize: 14, fontFamily: 'inherit', outline: 'none', background: '#fff' }} />
                      <button onClick={() => search()} disabled={loading || !query.trim()} style={{ padding: '0 22px', background: loading ? '#ccc' : '#CC0000', border: 'none', borderRadius: 12, color: 'white', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                        {loading ? '...' : 'Buscar'}
                      </button>
                    </div>

                    {!searched && (
                      <div style={{ textAlign: 'center', color: '#bbb', fontSize: 13, paddingTop: 20 }}>
                        Busca "Batman", "Dark Knight Returns", "Iron Studios"...
                      </div>
                    )}

                    {/* Recently viewed */}
                    {!searched && recentlyViewed.length > 0 && (
                      <div style={{ marginTop: 24 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#888', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.06em' }}>👁 Vistos recientemente</div>
                        <ProductGrid products={recentlyViewed} selected={selected} onSelect={selectProduct} />
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
                        <option value="destacados">Destacados</option>
                        <option value="az">A → Z</option>
                        <option value="precio_asc">Precio: menor</option>
                        <option value="precio_desc">Precio: mayor</option>
                      </select>
                    </div>
                    <ProductGrid products={sorted(catalog)} selected={selected} onSelect={selectProduct} />
                  </>
                )}
              </div>
            </div>

            {/* Right panel - desktop product detail */}
            {showPanel && (
              <div style={{ width: 420, flexShrink: 0, background: '#fff', borderLeft: '1px solid #ebebeb', position: 'sticky', top: 58, height: 'calc(100vh - 58px)', overflowY: 'auto' }}>
                <ProductDetail product={selected!} onClose={() => setSelected(null)} whatsapp={whatsapp} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile modal */}
      {selected && isMobile && (
        <>
          <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 100 }} />
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderRadius: '20px 20px 0 0', zIndex: 101, maxHeight: '92vh', overflowY: 'auto', animation: 'slideUp .3s cubic-bezier(.32,.72,0,1)' }}>
            <div style={{ width: 36, height: 4, background: '#E0E0E0', borderRadius: 2, margin: '12px auto 0' }} />
            <ProductDetail product={selected} onClose={() => setSelected(null)} whatsapp={whatsapp} />
          </div>
        </>
      )}

      {/* Footer */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(8px)', borderTop: '1px solid #f0f0f0', padding: '6px 20px', display: 'flex', justifyContent: 'center', gap: 16, zIndex: 40, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, color: '#bbb' }}>© 2026 La Tienda de Comics</span>
        <a href="/terminos" style={{ fontSize: 10, color: '#999', textDecoration: 'none' }}>Términos</a>
        <a href="/privacidad" style={{ fontSize: 10, color: '#999', textDecoration: 'none' }}>Privacidad</a>
        <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: '#999', textDecoration: 'none' }}>Contacto</a>
      </div>

      <style>{`
        @keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-7px)}}
        @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @media(max-width:500px){.ltc-grid{grid-template-columns:repeat(2,1fr) !important;gap:10px !important}}
      `}</style>
    </>
  );
}

function ProductGrid({ products, selected, onSelect }: { products: Product[]; selected: Product|null; onSelect: (p: Product) => void }) {
  return (
    <div className="ltc-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 14 }}>
      {products.map((p, i) => <ProductCard key={p.id || i} p={p} isSelected={selected?.id === p.id} onClick={() => onSelect(p)} />)}
    </div>
  );
}

function ProductCard({ p, isSelected, onClick }: { p: Product; isSelected: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const cop = p.price_cop || Math.round(p.price_usd * 4100);
  const oldCop = p.price_old_cop;
  const discountPct = oldCop && cop < oldCop ? Math.round((1 - cop/oldCop) * 100) : null;

  return (
    <div onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: '#fff', border: '1.5px solid #EFEFEF', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', boxShadow: hovered ? '0 8px 24px rgba(0,0,0,.14)' : '0 2px 8px rgba(0,0,0,.05)', transition: 'all .18s', transform: hovered ? 'translateY(-3px)' : 'none', position: 'relative' }}>
      {discountPct && (
        <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 3, width: 40, height: 40, borderRadius: '50%', background: '#0D0D0D', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, lineHeight: 1.1 }}>
          <span>{discountPct}%</span><span>OFF</span>
        </div>
      )}
      {p.featured && !discountPct && (
        <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 2, background: '#CC0000', color: 'white', fontSize: 8, fontWeight: 800, padding: '2px 7px', borderRadius: 20, textTransform: 'uppercase' }}>Dest.</div>
      )}
      {/* Image - full ratio, no compression */}
      <div style={{ aspectRatio: '3/4', background: '#F5F5F5', position: 'relative', overflow: 'hidden' }}>
        {p.image
          ? <img src={p.image} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>📚</div>}
        {/* Hover overlay */}
        {hovered && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'flex-end', padding: 10, animation: 'fadeIn .15s ease' }}>
            <button style={{ width: '100%', padding: '10px 0', background: '#CC0000', border: 'none', color: 'white', fontSize: 12, fontWeight: 700, borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>
              Ver producto →
            </button>
          </div>
        )}
      </div>
      <div style={{ padding: '10px 10px 12px' }}>
        <div style={{ fontSize: 11, fontWeight: 500, lineHeight: 1.35, color: '#222', marginBottom: 6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{p.title}</div>
        {oldCop && (
          <div style={{ fontSize: 11, color: '#aaa', textDecoration: 'line-through', marginBottom: 1 }}>{copFmt(oldCop)} COP</div>
        )}
        <div style={{ fontSize: 15, fontWeight: 700, color: '#CC0000', marginBottom: 1 }}>{copFmt(cop)} COP</div>
        <div style={{ fontSize: 10, color: '#999' }}>${p.price_usd?.toFixed(2)} USD</div>
      </div>
    </div>
  );
}

function ProductDetail({ product: p, onClose, whatsapp }: { product: Product; onClose: () => void; whatsapp: string }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatResp, setChatResp] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [lightbox, setLightbox] = useState<string|null>(null);
  const [activeImg, setActiveImg] = useState(0);
  const { addItem } = useCart();

  const isAmazon = p.supplier === 'amazon' || (p.supplier_url || '').includes('amazon.com');
  const cop = p.price_cop || Math.round(p.price_usd * 4100);
  const oldCop = p.price_old_cop;
  const discountPct = oldCop && cop < oldCop ? Math.round((1 - cop/oldCop) * 100) : null;
  // Use ONLY the affiliate_url entered by admin — never auto-generate tags
  const affiliateUrl = p.affiliate_url || p.supplier_url || '';

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
      setChatResp(data.text || 'No pude responder.'); setChatInput('');
    } catch { setChatResp('Error. Intenta de nuevo.'); }
    setChatLoading(false);
  }

  return (
    <div style={{ padding: '14px 20px 80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: '#CC0000', textTransform: 'uppercase', letterSpacing: '.1em' }}>{p.category}</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {p.slug && <a href={`/producto/${p.slug}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: '#888', textDecoration: 'none', padding: '3px 8px', border: '1px solid #e0e0e0', borderRadius: 6 }}>🔗 Ver página</a>}
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: '50%', background: '#F0F0F0', border: 'none', cursor: 'pointer', fontSize: 13, color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
      </div>

      <h2 style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.2, marginBottom: 12, fontFamily: "'Oswald', sans-serif" }}>{p.title}</h2>

      {/* Main image - full size, no compression */}
      <div onClick={() => setLightbox(currentImg)} style={{ width: '100%', maxHeight: 340, background: '#F7F7F7', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, overflow: 'hidden', border: '1px solid #E8E8E8', cursor: 'zoom-in', position: 'relative' }}>
        {currentImg
          ? <img src={currentImg} alt={p.title} style={{ maxWidth: '100%', maxHeight: 340, objectFit: 'contain', display: 'block' }} />
          : <span style={{ fontSize: 60 }}>📚</span>}
        <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,.4)', color: 'white', borderRadius: 6, padding: '3px 8px', fontSize: 10 }}>🔍 Ampliar</div>
      </div>

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto' }}>
          {allImages.map((img: any, i: number) => (
            <div key={i} onClick={() => setActiveImg(i)} style={{ width: 48, height: 64, flexShrink: 0, borderRadius: 6, overflow: 'hidden', border: `2px solid ${activeImg === i ? '#CC0000' : '#E8E8E8'}`, cursor: 'pointer' }}>
              <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      )}

      {/* Price */}
      <div style={{ background: '#F7F7F7', borderRadius: 12, padding: '12px 14px', marginBottom: 12 }}>
        {oldCop && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 13, color: '#aaa', textDecoration: 'line-through' }}>{copFmt(oldCop)} COP</span>
            {discountPct && <span style={{ background: '#0D0D0D', color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20 }}>{discountPct}% OFF</span>}
          </div>
        )}
        <div style={{ fontSize: 28, fontWeight: 800, color: '#CC0000', letterSpacing: '-.02em', lineHeight: 1 }}>{copFmt(cop)} COP</div>
        <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>${p.price_usd?.toFixed(2)} USD</div>
        <div style={{ fontSize: 11, color: '#15803d', marginTop: 6, fontWeight: 600 }}>🚚 Envío Colombia: $9.900 COP · Internacional: $30 USD</div>
      </div>

      {/* Delivery - hide supplier name */}
      <div style={{ background: '#f0f7ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
        <span style={{ fontSize: 20 }}>📦</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1e3a5f' }}>{p.delivery_type === 'immediate' ? '2-4 días hábiles' : '6-10 días hábiles'}</div>
          <div style={{ fontSize: 11, color: p.delivery_type === 'immediate' ? '#15803d' : '#3b82f6', marginTop: 1 }}>{p.delivery_type === 'immediate' ? '⚡ Entrega inmediata · Solo Colombia' : isAmazon ? 'Envío directo a tu dirección' : 'USPS/DHL → Tu dirección'}</div>
        </div>
      </div>

      {/* Description */}
      {p.description && <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6, marginBottom: 14 }}>{p.description.slice(0, 300)}{p.description.length > 300 ? '...' : ''}</p>}

      {/* CTAs */}
      {isAmazon ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {/* Row: Amazon btn + Ver producto */}
          <div style={{ display: 'flex', gap: 8 }}>
            {affiliateUrl && (
              <a href={affiliateUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, textDecoration: 'none' }}>
                <img src="/amazon-btn-es.jpg" alt="Comprar en Amazon" style={{ width: '100%', height: 44, objectFit: 'contain', objectPosition: 'center', borderRadius: 10, display: 'block' }} />
              </a>
            )}
            {p.slug && (
              <a href={`/producto/${p.slug}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#CC0000', color: 'white', borderRadius: 10, padding: '0 16px', textDecoration: 'none', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', height: 44, flexShrink: 0 }}>
                Ver producto
              </a>
            )}
          </div>
          {/* Add to our cart row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'inline-flex', border: '1.5px solid #e0e0e0', borderRadius: 8, overflow: 'hidden' }}>
              <button onClick={() => setQty(q => Math.max(1,q-1))} style={{ width: 32, height: 32, background: '#fff', border: 'none', fontSize: 16, cursor: 'pointer' }}>−</button>
              <span style={{ width: 36, textAlign: 'center', fontSize: 14, fontWeight: 700, lineHeight: '32px' }}>{qty}</span>
              <button onClick={() => setQty(q => q+1)} style={{ width: 32, height: 32, background: '#fff', border: 'none', fontSize: 16, cursor: 'pointer' }}>+</button>
            </div>
            <button onClick={handleBuyNow} style={{ flex: 1, padding: '8px 0', background: '#0D0D0D', border: 'none', color: 'white', fontSize: 13, fontWeight: 700, borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>
              Comprar en La Tienda →
            </button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: '#888', fontWeight: 600, textTransform: 'uppercase' }}>Cantidad</span>
            <div style={{ display: 'inline-flex', border: '2px solid #0D0D0D', borderRadius: 8, overflow: 'hidden' }}>
              <button onClick={() => setQty(q => Math.max(1,q-1))} style={{ width: 36, height: 36, background: '#fff', border: 'none', fontSize: 18, cursor: 'pointer' }}>−</button>
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
          <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>✦✦ Pregúntale a Jarvis IA</span>
        </div>
        {chatResp && <div style={{ padding: '12px 14px', fontSize: 13, color: '#555', lineHeight: 1.6, borderBottom: '1px solid #E8E8E8' }}>{chatResp}</div>}
        {!chatResp && <div style={{ padding: '10px 14px', fontSize: 12, color: '#aaa', fontStyle: 'italic', borderBottom: '1px solid #E8E8E8' }}>Jarvis te responde sobre este producto...</div>}
        <div style={{ display: 'flex', gap: 7, padding: '8px 10px' }}>
          <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && askProduct()} placeholder="Escribe tu pregunta..."
            style={{ flex: 1, background: '#fff', border: '1px solid #E8E8E8', borderRadius: 7, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
          <button onClick={askProduct} disabled={chatLoading} style={{ padding: '8px 12px', background: '#CC0000', border: 'none', borderRadius: 7, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            {chatLoading ? '...' : '→'}
          </button>
        </div>
      </div>

      {/* Lightbox - full res */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.92)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
          <img src={lightbox} alt="zoom" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }} />
          <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,.15)', border: 'none', color: 'white', width: 36, height: 36, borderRadius: '50%', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>
      )}

      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:.2}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>
    </div>
  );
}
