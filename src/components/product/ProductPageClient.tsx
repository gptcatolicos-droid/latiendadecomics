'use client';
import { useState, useEffect } from 'react';
import { useCart } from '@/hooks/useCart';
import { useRouter } from 'next/navigation';
import type { Product } from '@/types';

// Keywords that suggest a product search rather than a product question
const SEARCH_TRIGGERS = ['busca','buscar','tienes','hay','recomienda','recomiéndame','similar','parecido','quiero','otro','más','otros','cuál','cuáles','muéstrame','muéstrame','ver','mostrar','conseguir','comprar'];

function looksLikeSearch(text: string): boolean {
  const lower = text.toLowerCase();
  // If mentions the product name → it's a question about this product
  // If generic → it's a search
  return SEARCH_TRIGGERS.some(t => lower.startsWith(t) || lower.includes(' ' + t + ' '));
}

export default function ProductPageClient({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{role:'user'|'jarvis'; text?:string; products?:any[]}[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [buyMode, setBuyMode] = useState<'normal' | 'preventa' | 'installments'>('normal');
  const [installmentPlan, setInstallmentPlan] = useState<number>(0);
  const [activeCoupon, setActiveCoupon] = useState<any>(null);
  const { addItem } = useCart();
  const router = useRouter();

  useEffect(() => {
    // Fetch active coupon only if this product has show_coupon_banner enabled
    if (product.show_coupon_banner) {
      fetch('/api/coupons?active=1').then(r => r.json()).then(d => {
        if (d.coupon) setActiveCoupon(d.coupon);
      }).catch(() => {});
    }
    // Set default buy mode
    if (product.installments_enabled && product.category === 'figuras' && (product.installments_options || []).length > 0) {
      setInstallmentPlan((product.installments_options || [3])[0]);
    }
  }, [product.id]);

  const priceUSD = Number(product.price_usd);
  const priceCOP = product.price_cop ? Number(product.price_cop) : Math.round(priceUSD * 4100);
  const isAmazon = product.supplier === 'amazon';
  const affiliateUrl = product.affiliate_url || '';
  const images = product.images || [];
  const currentImg = images[activeImg];
  const inStock = product.stock > 0;

  const preventaPercent = product.preventa_percent || 25;
  const preventaDeposit = Math.round(priceCOP * (preventaPercent / 100));
  const preventaRemaining = priceCOP - preventaDeposit;

  const installmentAmt = installmentPlan > 0 ? Math.round(priceCOP / installmentPlan) : 0;

  function handleAddCart() {
    addItem({ id: product.id, title: product.title, price_usd: priceUSD, price_cop: priceCOP, image_url: images[0]?.url, supplier: product.supplier, product_url: product.supplier_url }, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function handleBuyNow() { handleAddCart(); setTimeout(() => router.push('/checkout'), 300); }

  async function askProduct() {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    setChatInput('');
    setChatLoading(true);

    // Add user message to thread
    setChatMessages(prev => [...prev, { role: 'user', text }]);

    try {
      // Smart context: if it looks like a product search, don't prefix with product name
      const isSearch = looksLikeSearch(text);
      const messageContent = isSearch
        ? text  // pure search — let Jarvis handle it normally
        : `Sobre el producto "${product.title}" (${product.description?.slice(0, 120) || ''}): ${text}`;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: messageContent }] }),
      });
      const data = await res.json();

      // If Jarvis returned search results (products array)
      if (data.products?.length) {
        setChatMessages(prev => [...prev, {
          role: 'jarvis',
          text: data.text || `Encontré ${data.products.length} productos:`,
          products: data.products,
        }]);
      } else if (data.text) {
        setChatMessages(prev => [...prev, { role: 'jarvis', text: data.text }]);
      }
    } catch {
      setChatMessages(prev => [...prev, { role: 'jarvis', text: 'Error al conectar con Jarvis. Intenta de nuevo.' }]);
    } finally {
      setChatLoading(false);
    }
  }

  const deliveryText = product.delivery_type === 'immediate'
    ? { days: '2-4 días hábiles', sub: '⚡ Entrega inmediata · Solo Colombia', color: '#15803d' }
    : { days: '6-10 días hábiles', sub: isAmazon ? 'Envío directo a tu dirección' : 'USPS/DHL → Tu dirección', color: '#3b82f6' };

  return (
    <>
      {/* NAVBAR */}
      <nav style={{ background: '#0D0D0D', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img src="/logo.webp" alt="La Tienda de Comics" style={{ height: 36, objectFit: 'contain' }} />
          </a>
          <div style={{ display: 'flex', gap: 20 }}>
            {['comics','manga','figuras'].map(c => <a key={c} href={`/catalogo?categoria=${c}`} style={{ color: 'rgba(255,255,255,.6)', fontSize: 13, textDecoration: 'none', textTransform: 'capitalize' }}>{c}</a>)}
            <a href="/catalogo" style={{ color: 'rgba(255,255,255,.6)', fontSize: 13, textDecoration: 'none' }}>Catálogo</a>
          </div>
        </div>
      </nav>

      {/* COUPON BANNER — only if show_coupon_banner is on AND there's an active coupon */}
      {product.show_coupon_banner && activeCoupon && (
        <div style={{ background: 'linear-gradient(135deg, #CC0000, #ff4444)', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.8)', textTransform: 'uppercase', letterSpacing: '.1em' }}>🎟 Cupón activo</div>
          <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 800, color: 'white', letterSpacing: '.1em' }}>{activeCoupon.code}</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: 'white' }}>{activeCoupon.value}{activeCoupon.type === 'percentage' ? '% OFF' : ' USD OFF'}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.8)' }}>Aplícalo en el checkout</div>
        </div>
      )}

      {/* BREADCRUMB */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '10px 20px', fontSize: 12, color: '#aaa', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <a href="/" style={{ color: '#aaa', textDecoration: 'none' }}>Inicio</a><span>/</span>
        <a href={`/catalogo?categoria=${product.category}`} style={{ color: '#aaa', textDecoration: 'none', textTransform: 'capitalize' }}>{product.category}</a><span>/</span>
        <span style={{ color: '#555', fontWeight: 500 }}>{product.title}</span>
      </div>

      {/* MAIN GRID */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px 60px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 40, alignItems: 'start' }}>

        {/* LEFT — Images + Description */}
        <div>
          <div style={{ background: '#F7F7F7', borderRadius: 16, overflow: 'hidden', border: '1px solid #E8E8E8', display: 'flex', alignItems: 'center', justifyContent: 'center', aspectRatio: '1/1' }}>
            {currentImg
              ? <img src={currentImg.url} alt={currentImg.alt || product.title} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 16 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              : <span style={{ fontSize: 80 }}>📚</span>}
          </div>
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto' }}>
              {images.map((img, i) => (
                <button key={img.id || i} onClick={() => setActiveImg(i)} style={{ flexShrink: 0, width: 60, height: 60, borderRadius: 8, overflow: 'hidden', border: `2px solid ${i === activeImg ? '#CC0000' : '#E0E0E0'}`, background: '#F7F7F7', cursor: 'pointer', padding: 0 }}>
                  <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
          {product.description && (
            <div style={{ marginTop: 28 }}>
              <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 20, letterSpacing: '0.05em', marginBottom: 12 }}>DESCRIPCIÓN</h2>
              <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{product.description}</p>
            </div>
          )}
          {(product.publisher || product.author || product.year || product.franchise) && (
            <div style={{ marginTop: 20, borderTop: '1px solid #E8E8E8', paddingTop: 16 }}>
              <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: 13 }}>
                {product.publisher && <><dt style={{ color: '#aaa' }}>Editorial</dt><dd style={{ color: '#333', fontWeight: 600 }}>{product.publisher}</dd></>}
                {product.author && <><dt style={{ color: '#aaa' }}>Autor</dt><dd style={{ color: '#333', fontWeight: 600 }}>{product.author}</dd></>}
                {product.year && <><dt style={{ color: '#aaa' }}>Año</dt><dd style={{ color: '#333', fontWeight: 600 }}>{product.year}</dd></>}
                {product.franchise && <><dt style={{ color: '#aaa' }}>Franquicia</dt><dd style={{ color: '#333', fontWeight: 600 }}>{product.franchise}</dd></>}
              </dl>
            </div>
          )}
        </div>

        {/* RIGHT — Buy box */}
        <div>
          <h1 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 26, fontWeight: 700, lineHeight: 1.2, marginBottom: 16, color: '#0D0D0D' }}>
            {product.title}
          </h1>

          {/* Preventa / Normal / Cuotas tabs */}
          {(product.preventa_enabled || (product.installments_enabled && product.category === 'figuras')) && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 14, background: '#f5f5f5', borderRadius: 10, padding: 4 }}>
              <button onClick={() => setBuyMode('normal')} style={{ flex: 1, padding: '8px 0', borderRadius: 7, fontSize: 12, fontWeight: 700, background: buyMode === 'normal' ? '#fff' : 'transparent', border: 'none', cursor: 'pointer', color: buyMode === 'normal' ? '#111' : '#888', boxShadow: buyMode === 'normal' ? '0 1px 4px rgba(0,0,0,.1)' : 'none', fontFamily: 'inherit' }}>
                Comprar
              </button>
              {product.preventa_enabled && (
                <button onClick={() => setBuyMode('preventa')} style={{ flex: 1, padding: '8px 0', borderRadius: 7, fontSize: 12, fontWeight: 700, background: buyMode === 'preventa' ? '#fff7ed' : 'transparent', border: 'none', cursor: 'pointer', color: buyMode === 'preventa' ? '#c2410c' : '#888', boxShadow: buyMode === 'preventa' ? '0 1px 4px rgba(0,0,0,.1)' : 'none', fontFamily: 'inherit' }}>
                  🕐 Preventa
                </button>
              )}
              {product.installments_enabled && product.category === 'figuras' && (
                <button onClick={() => setBuyMode('installments')} style={{ flex: 1, padding: '8px 0', borderRadius: 7, fontSize: 12, fontWeight: 700, background: buyMode === 'installments' ? '#eff6ff' : 'transparent', border: 'none', cursor: 'pointer', color: buyMode === 'installments' ? '#1d4ed8' : '#888', boxShadow: buyMode === 'installments' ? '0 1px 4px rgba(0,0,0,.1)' : 'none', fontFamily: 'inherit' }}>
                  💳 Cuotas
                </button>
              )}
            </div>
          )}

          {/* PREVENTA mode */}
          {buyMode === 'preventa' && (
            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#9a3412', marginBottom: 8 }}>📦 Preventa — Separa tu producto hoy</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#c2410c', marginBottom: 4 }}>
                ${preventaDeposit.toLocaleString('es-CO')} COP
                <span style={{ fontSize: 14, fontWeight: 600, marginLeft: 8 }}>({preventaPercent}% depósito)</span>
              </div>
              <div style={{ fontSize: 13, color: '#c2410c' }}>Al recibir: ${preventaRemaining.toLocaleString('es-CO')} COP</div>
              {product.preventa_launch_date && (
                <div style={{ fontSize: 11, color: '#b45309', marginTop: 6 }}>
                  📅 Lanzamiento: {new Date(product.preventa_launch_date).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}
                </div>
              )}
            </div>
          )}

          {/* INSTALLMENTS mode */}
          {buyMode === 'installments' && (
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1e40af', marginBottom: 10 }}>💳 Pago en cuotas</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                {(product.installments_options || [3, 6]).map((n: number) => (
                  <button key={n} onClick={() => setInstallmentPlan(n)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: `2px solid ${installmentPlan === n ? '#1d4ed8' : '#bfdbfe'}`, background: installmentPlan === n ? '#1d4ed8' : '#fff', color: installmentPlan === n ? 'white' : '#1d4ed8', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {n}x ${Math.round(priceCOP / n).toLocaleString('es-CO')}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 11, color: '#3b82f6' }}>
                Total: ${priceCOP.toLocaleString('es-CO')} COP · <a href="/terminos" target="_blank" style={{ color: '#CC0000' }}>Términos y condiciones</a>
              </div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>⚠ La figura se despacha al completar el pago total.</div>
            </div>
          )}

          {/* NORMAL price */}
          {buyMode === 'normal' && (
            <div style={{ background: '#F7F7F7', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
              <div style={{ fontSize: 34, fontWeight: 800, color: '#CC0000', letterSpacing: '-.02em', marginBottom: 4 }}>
                ${priceCOP.toLocaleString('es-CO')} COP
              </div>
              <div style={{ fontSize: 14, color: '#888' }}>
                ${priceUSD.toFixed(2)} USD
                {product.price_old_usd && <span style={{ marginLeft: 8, textDecoration: 'line-through', color: '#bbb', fontSize: 13 }}>${Number(product.price_old_usd).toFixed(2)}</span>}
              </div>
              {!isAmazon && <div style={{ fontSize: 11, color: '#15803d', marginTop: 6, fontWeight: 600 }}>🚚 Envío Colombia: $5 USD · Internacional: $30 USD</div>}
            </div>
          )}

          {/* Delivery */}
          <div style={{ background: '#f0f7ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 22 }}>📦</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1e3a5f' }}>{deliveryText.days}</div>
              <div style={{ fontSize: 11, color: deliveryText.color, marginTop: 2 }}>{deliveryText.sub}</div>
            </div>
          </div>

          {/* Stock warning */}
          {!inStock && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 14px', marginBottom: 12, fontSize: 13, color: '#CC0000', fontWeight: 600 }}>Agotado temporalmente</div>}

          {/* CTAs */}
          {isAmazon ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
              {/* Amazon affiliate button — full width */}
              {affiliateUrl && (
                <a href={affiliateUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none' }}>
                  <img src="/amazon-btn-es.jpg" alt="Comprar en Amazon" style={{ width: '100%', height: 52, objectFit: 'contain', objectPosition: 'center', borderRadius: 10, display: 'block' }} />
                </a>
              )}
              {/* Qty + Comprar en La Tienda */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'inline-flex', border: '2px solid #0D0D0D', borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 36, height: 44, background: '#fff', border: 'none', fontSize: 18, cursor: 'pointer', fontFamily: 'inherit' }}>−</button>
                  <span style={{ width: 40, textAlign: 'center', fontSize: 15, fontWeight: 700, lineHeight: '44px', background: '#fff' }}>{qty}</span>
                  <button onClick={() => setQty(q => Math.min(product.stock || 99, q + 1))} style={{ width: 36, height: 44, background: '#fff', border: 'none', fontSize: 18, cursor: 'pointer', fontFamily: 'inherit' }}>+</button>
                </div>
                <button onClick={handleBuyNow} disabled={!inStock} style={{ flex: 1, padding: '12px 0', background: inStock ? '#CC0000' : '#ccc', border: 'none', color: 'white', fontSize: 15, fontWeight: 700, borderRadius: 10, cursor: inStock ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
                  Comprar ahora →
                </button>
              </div>
              <div style={{ display: 'flex', gap: 14, justifyContent: 'center', fontSize: 11, color: '#aaa' }}>
                <span>🔒 Pago seguro</span><span>🏦 MercadoPago</span><span>📦 Envío garantizado</span>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '.05em' }}>Cantidad</span>
                <div style={{ display: 'inline-flex', border: '2px solid #0D0D0D', borderRadius: 8, overflow: 'hidden' }}>
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 36, height: 36, background: '#fff', border: 'none', fontSize: 18, cursor: 'pointer', fontFamily: 'inherit' }}>−</button>
                  <span style={{ width: 40, textAlign: 'center', fontSize: 15, fontWeight: 700, lineHeight: '36px', background: '#fff' }}>{qty}</span>
                  <button onClick={() => setQty(q => Math.min(product.stock || 99, q + 1))} style={{ width: 36, height: 36, background: '#fff', border: 'none', fontSize: 18, cursor: 'pointer', fontFamily: 'inherit' }}>+</button>
                </div>
                {inStock && <span style={{ fontSize: 12, color: '#15803d', fontWeight: 600 }}>✓ En stock</span>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 14 }}>
                <button onClick={handleBuyNow} disabled={!inStock} style={{ width: '100%', padding: 15, background: inStock ? '#CC0000' : '#ccc', border: 'none', color: 'white', fontSize: 15, fontWeight: 700, borderRadius: 12, cursor: inStock ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
                  {buyMode === 'preventa' ? `Reservar por $${preventaDeposit.toLocaleString('es-CO')} COP →` : buyMode === 'installments' ? `Cuota inicial: $${installmentAmt.toLocaleString('es-CO')} COP →` : 'Comprar ahora →'}
                </button>
                <button onClick={handleAddCart} disabled={!inStock} style={{ width: '100%', padding: 15, background: added ? '#0D0D0D' : '#fff', border: '2px solid #0D0D0D', color: added ? 'white' : '#0D0D0D', fontSize: 15, fontWeight: 700, borderRadius: 12, cursor: inStock ? 'pointer' : 'not-allowed', fontFamily: 'inherit', transition: 'all .2s' }}>
                  {added ? '✓ Agregado' : '+ Agregar al carrito'}
                </button>
              </div>
              <div style={{ display: 'flex', gap: 14, justifyContent: 'center', fontSize: 11, color: '#aaa', marginBottom: 20 }}>
                <span>🔒 Pago seguro</span><span>🏦 MercadoPago</span><span>📦 Envío garantizado</span>
              </div>
            </>
          )}

          {/* Jarvis AI Chat — smart: responde sobre el producto O busca productos */}
          <div style={{ background: '#F7F7F7', border: '1px solid #E8E8E8', borderRadius: 12, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ background: '#0D0D0D', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#CC0000', animation: 'blink 2s infinite' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>✦✦ Pregúntale a Jarvis IA</span>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,.35)', marginLeft: 'auto' }}>Pregunta sobre este producto o busca más</span>
            </div>

            {/* Conversation thread */}
            <div style={{ maxHeight: 340, overflowY: 'auto', padding: chatMessages.length ? '10px 12px' : '0' }}>
              {chatMessages.length === 0 && (
                <div style={{ padding: '12px 14px', fontSize: 12, color: '#aaa', fontStyle: 'italic', borderBottom: '1px solid #E8E8E8' }}>
                  Pregunta sobre este producto o escribe "busca batman" para ver más títulos
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  {msg.role === 'user' ? (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <div style={{ background: '#CC0000', color: 'white', borderRadius: '12px 12px 2px 12px', padding: '8px 12px', fontSize: 13, maxWidth: '80%' }}>
                        {msg.text}
                      </div>
                    </div>
                  ) : (
                    <div>
                      {msg.text && (
                        <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start', marginBottom: msg.products?.length ? 8 : 0 }}>
                          <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#CC0000', fontWeight: 900, flexShrink: 0, marginTop: 1 }}>J</div>
                          <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: '2px 12px 12px 12px', padding: '8px 12px', fontSize: 13, color: '#333', lineHeight: 1.5, maxWidth: '85%' }}>
                            {msg.text}
                          </div>
                        </div>
                      )}
                      {/* Inline product cards */}
                      {msg.products && msg.products.length > 0 && (
                        <div style={{ marginLeft: 29, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8, marginTop: 4 }}>
                          {msg.products.slice(0, 4).map((p: any, pi: number) => (
                            <a key={pi} href={p.slug ? `/producto/${p.slug}` : '#'} target="_blank" rel="noopener noreferrer"
                              style={{ background: '#fff', border: '1.5px solid #E8E8E8', borderRadius: 10, overflow: 'hidden', textDecoration: 'none', display: 'block', transition: 'box-shadow .15s' }}
                              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,.12)')}
                              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                            >
                              <div style={{ aspectRatio: '3/4', background: '#F5F5F5', overflow: 'hidden' }}>
                                {p.image
                                  ? <img src={p.image} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>📚</div>}
                              </div>
                              <div style={{ padding: '6px 8px 8px' }}>
                                <div style={{ fontSize: 10, fontWeight: 600, color: '#222', lineHeight: 1.3, marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                  {p.title}
                                </div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#CC0000' }}>
                                  ${(p.price_cop || Math.round(p.price_usd * 4100)).toLocaleString('es-CO')} COP
                                </div>
                              </div>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {chatLoading && (
                <div style={{ display: 'flex', gap: 7, alignItems: 'center', paddingBottom: 4 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#CC0000', fontWeight: 900 }}>J</div>
                  <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: '2px 12px 12px 12px', padding: '8px 14px', fontSize: 13, color: '#aaa' }}>
                    <span style={{ animation: 'blink 1s infinite' }}>•••</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div style={{ display: 'flex', gap: 7, padding: '9px 12px', borderTop: '1px solid #E8E8E8' }}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && askProduct()}
                placeholder="Pregunta sobre este producto o busca más títulos..."
                style={{ flex: 1, background: '#fff', border: '1px solid #E8E8E8', borderRadius: 7, padding: '8px 11px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
              />
              <button onClick={askProduct} disabled={chatLoading} style={{ padding: '8px 14px', background: '#CC0000', border: 'none', borderRadius: 7, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                →
              </button>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:.2}}`}</style>
    </>
  );
}
