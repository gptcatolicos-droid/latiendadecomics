'use client';
import { useState, useEffect } from 'react';
import { useCart } from '@/hooks/useCart';

export default function ProductDrawer({ product, onClose }: { product: any; onClose: () => void }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    if (product) { document.body.style.overflow = 'hidden'; setQty(1); setAdded(false); setChatResponse(''); setChatInput(''); }
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [!!product]);

  if (!product) return null;

  const isAmazon = product.supplier === 'amazon' || (product.supplier_url || '').includes('amazon.com');
  const priceUSD = Number(product.price_usd);
  const priceCOP = product.price_cop ? Number(product.price_cop) : Math.round(priceUSD * 4100);
  // Use ONLY the affiliate_url entered by admin — never auto-generate tags
  const affiliateUrl = product.affiliate_url || product.supplier_url || '';

  async function askProduct() {
    if (!chatInput.trim() || chatLoading) return;
    setChatLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: `Sobre "${product.title}": ${chatInput}` }] }),
      });
      const data = await res.json();
      setChatResponse(data.text || 'No pude responder esa pregunta.');
      setChatInput('');
    } catch { setChatResponse('Error. Intenta de nuevo.'); }
    finally { setChatLoading(false); }
  }

  function handleAddCart() {
    addItem({ id: product.id || product.supplier_url, title: product.title, price_usd: priceUSD, price_cop: priceCOP, image_url: product.image, supplier: product.supplier, product_url: product.supplier_url }, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function handleBuyNow() {
    handleAddCart();
    setTimeout(() => { window.location.href = '/checkout'; }, 300);
  }

  const supplierLabel = 'La Tienda';

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 100, animation: 'fadeIn .2s ease' }} />
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 600, background: '#fff', borderRadius: '20px 20px 0 0', boxShadow: '0 -8px 40px rgba(0,0,0,.2)', zIndex: 101, maxHeight: '92vh', overflowY: 'auto', animation: 'slideUp .3s cubic-bezier(.32,.72,0,1)' }}>

        <div style={{ width: 36, height: 4, background: '#E0E0E0', borderRadius: 2, margin: '12px auto 0' }} />
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, width: 30, height: 30, borderRadius: '50%', background: '#F0F0F0', border: 'none', cursor: 'pointer', fontSize: 14, color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>

        <div style={{ padding: '14px 20px 32px' }}>

          {/* Title */}
          <h2 style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2, marginBottom: 14, fontFamily: "'Oswald', sans-serif" }}>
            {product.title}
          </h2>

          {/* Image */}
          <div style={{ width: '100%', maxHeight: 320, background: '#F7F7F7', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, overflow: 'hidden', border: '1px solid #E8E8E8' }}>
            {product.image
              ? <img src={product.image} alt={product.title} style={{ maxWidth: '100%', maxHeight: 320, objectFit: 'contain' }} />
              : <span style={{ fontSize: 60 }}>📚</span>}
          </div>

          {/* Price — COP primary, USD secondary */}
          <div style={{ background: '#F7F7F7', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#CC0000', letterSpacing: '-.02em', marginBottom: 4 }}>
              ${priceCOP.toLocaleString('es-CO')} COP
            </div>
            <div style={{ fontSize: 14, color: '#888' }}>
              ${priceUSD.toFixed(2)} USD
            </div>
            {!isAmazon && (
              <div style={{ fontSize: 11, color: '#15803d', marginTop: 6, fontWeight: 600 }}>
                🚚 Envío Colombia: $5 · Internacional: $30
              </div>
            )}
          </div>

          {/* Delivery */}
          <div style={{ background: '#f0f7ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 20 }}>📦</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1e3a5f' }}>{product.delivery_days || '6-10'} días hábiles</div>
              <div style={{ fontSize: 11, color: '#3b82f6', marginTop: 1 }}>
                {isAmazon ? 'Envío directo a tu dirección' : 'USPS/DHL → Tu dirección'}
              </div>
            </div>
          </div>

          {/* CTAs */}
          {isAmazon && affiliateUrl ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <a href={affiliateUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
                <img src="/amazon-btn.png" alt="Comprar en Amazon" style={{ height: 52, margin: '0 auto', objectFit: 'contain' }} />
              </a>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '.05em' }}>Cantidad</span>
                <div style={{ display: 'inline-flex', border: '2px solid #0D0D0D', borderRadius: 8, overflow: 'hidden' }}>
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 36, height: 36, background: '#fff', border: 'none', fontSize: 18, cursor: 'pointer' }}>−</button>
                  <span style={{ width: 40, textAlign: 'center', fontSize: 15, fontWeight: 700, lineHeight: '36px' }}>{qty}</span>
                  <button onClick={() => setQty(q => q + 1)} style={{ width: 36, height: 36, background: '#fff', border: 'none', fontSize: 18, cursor: 'pointer' }}>+</button>
                </div>
                <span style={{ fontSize: 12, color: '#15803d', fontWeight: 600 }}>✓ Disponible</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 14 }}>
                <button onClick={handleBuyNow} style={{ width: '100%', padding: 15, background: '#CC0000', border: 'none', color: 'white', fontSize: 15, fontWeight: 700, borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Comprar ahora →
                </button>
                <button onClick={handleAddCart} style={{ width: '100%', padding: 15, background: added ? '#0D0D0D' : '#fff', border: '2px solid #0D0D0D', color: added ? 'white' : '#0D0D0D', fontSize: 15, fontWeight: 700, borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s' }}>
                  {added ? '✓ Agregado' : '+ Agregar al carrito'}
                </button>
              </div>
              <div style={{ display: 'flex', gap: 14, justifyContent: 'center', fontSize: 11, color: '#aaa', marginBottom: 20 }}>
                <span>🔒 Pago seguro</span><span>🏦 MercadoPago</span><span>📦 Envío garantizado</span>
              </div>
            </>
          )}

          {/* Claude chat */}
          <div style={{ background: '#F7F7F7', border: '1px solid #E8E8E8', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ background: '#0D0D0D', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#CC0000', animation: 'blink 2s infinite' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>Pregunta sobre este producto</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', marginLeft: 'auto' }}>IA</span>
            </div>
            {chatResponse && <div style={{ padding: '12px 14px', fontSize: 13, color: '#555', lineHeight: 1.6, borderBottom: '1px solid #E8E8E8' }}>{chatResponse}</div>}
            {!chatResponse && <div style={{ padding: '12px 14px', fontSize: 12, color: '#aaa', fontStyle: 'italic', borderBottom: '1px solid #E8E8E8' }}>¿Es buena para alguien nuevo? ¿Qué leer después?</div>}
            <div style={{ display: 'flex', gap: 7, padding: '9px 12px' }}>
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && askProduct()} placeholder="Escribe tu pregunta..."
                style={{ flex: 1, background: '#fff', border: '1px solid #E8E8E8', borderRadius: 7, padding: '8px 11px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
              <button onClick={askProduct} disabled={chatLoading} style={{ padding: '8px 14px', background: '#CC0000', border: 'none', borderRadius: 7, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                {chatLoading ? '...' : '→'}
              </button>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideUp{from{transform:translateX(-50%) translateY(100%)}to{transform:translateX(-50%) translateY(0)}}@keyframes blink{0%,100%{opacity:1}50%{opacity:.2}}`}</style>
    </>
  );
}
