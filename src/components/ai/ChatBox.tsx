'use client';
import { useState, useRef, useEffect } from 'react';
import ProductDrawer from '@/components/product/ProductDrawer';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  products?: any[];
}

interface ChatBoxProps {
  placeholder?: string;
}

const CHIPS = [
  'La Muerte de Superman',
  'Naruto Vol. 1',
  'Batman: Year One',
  'Iron Studios Batman',
  'Dark Knight Returns',
  'Funko Pop Spider-Man',
];

export default function ChatBox({ placeholder }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [drawerProduct, setDrawerProduct] = useState<any>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function send(text?: string) {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg: Message = { role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.text || '',
        products: data.products || [],
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Lo siento, hubo un error. Intenta de nuevo.',
      }]);
    } finally {
      setLoading(false);
    }
  }

  const hasMessages = messages.length > 0;

  return (
    <>
      <div style={{ width: '100%', maxWidth: 640, display: 'flex', flexDirection: 'column' }}>

        {/* Thread */}
        <div
          ref={threadRef}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 14, overflowY: 'auto' }}
        >
          {/* Intro state */}
          {!hasMessages && (
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ fontSize: 22, fontWeight: 600, color: '#111', lineHeight: 1.3, letterSpacing: '-.02em', marginBottom: 6 }}>
                ¿En qué cómic, figura<br />o personaje estás interesado?
              </h1>
              <p style={{ fontSize: 13, color: '#999', marginBottom: 18 }}>Escribe o elige una sugerencia</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                {CHIPS.map(chip => (
                  <button
                    key={chip}
                    onClick={() => send(chip)}
                    style={{
                      padding: '8px 15px', borderRadius: 30, fontSize: 13, fontWeight: 500,
                      background: '#F7F7F7', border: '1.5px solid #E8E8E8', color: '#555',
                      cursor: 'pointer', fontFamily: 'inherit', transition: 'all .18s',
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, i) => (
            <div key={i}>
              {msg.role === 'user' ? (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{
                    background: '#0D0D0D', color: 'white',
                    borderRadius: '18px 18px 4px 18px',
                    padding: '11px 16px', fontSize: 14, lineHeight: 1.55, maxWidth: '82%',
                  }}>
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {msg.content && (
                    <div style={{ fontSize: 14, color: '#555', lineHeight: 1.65, maxWidth: '90%' }}
                      dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#111">$1</strong>') }}
                    />
                  )}
                  {msg.products && msg.products.length > 0 && (
                    <>
                      <div style={{
                        fontSize: 10, fontWeight: 700, color: '#999',
                        textTransform: 'uppercase', letterSpacing: '.08em',
                        display: 'flex', alignItems: 'center', gap: 8,
                      }}>
                        Resultados encontrados
                        <div style={{ flex: 1, height: 1, background: '#E8E8E8' }} />
                      </div>
                      {/* Grid: 2 cols mobile, 4 cols desktop */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                        gap: 10,
                        marginBottom: 10,
                      }}>
                        {msg.products.slice(0, 4).map((p, pi) => (
                          <div
                            key={pi}
                            onClick={() => setDrawerProduct(p)}
                            style={{
                              background: '#fff', border: '1.5px solid #E8E8E8',
                              borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
                              transition: 'all .18s',
                            }}
                          >
                            <div style={{
                              aspectRatio: '3/4', background: '#F7F7F7',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              position: 'relative', overflow: 'hidden',
                            }}>
                              {p.image ? (
                                <img src={p.image} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <span style={{ fontSize: 32 }}>📚</span>
                              )}
                              <div style={{
                                position: 'absolute', bottom: 0, left: 0, right: 0,
                                background: 'linear-gradient(0deg,rgba(0,0,0,.6),transparent)',
                                padding: '18px 8px 5px',
                                fontSize: 9, fontWeight: 800, color: 'white',
                                textTransform: 'uppercase', letterSpacing: '.05em',
                              }}>
                                {p.supplier_name}
                              </div>
                            </div>
                            <div style={{ padding: 10 }}>
                              <div style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.3, color: '#111', marginBottom: 5 }}>{p.title}</div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>${p.price_usd.toFixed(2)}</div>
                              <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>📦 {p.delivery_days} días</div>
                              {p.model === 'affiliate' && (
                                <div style={{ fontSize: 9, color: '#f97316', fontWeight: 700, marginTop: 2 }}>Vía Amazon</div>
                              )}
                              <button
                                style={{
                                  width: '100%', padding: '7px', background: '#0D0D0D', border: 'none',
                                  color: 'white', fontSize: 11, fontWeight: 700, borderRadius: 7,
                                  marginTop: 6, cursor: 'pointer', fontFamily: 'inherit',
                                }}
                              >
                                Ver producto →
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      {msg.products.length > 4 && (
                        <button style={{
                          width: '100%', padding: 12, borderRadius: 10,
                          border: '1.5px solid #E8E8E8', background: '#fff',
                          fontSize: 13, fontWeight: 600, color: '#555', cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}>
                          Ver más resultados →
                        </button>
                      )}
                      <div style={{
                        fontSize: 11, color: '#999', textAlign: 'center',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#CC0000', animation: 'blink 2s infinite' }} />
                        Buscado en tiempo real · Midtown · Amazon · Iron Studios · Panini
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Typing */}
          {loading && (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '4px 0' }}>
              {[0, 150, 300].map(delay => (
                <div key={delay} style={{
                  width: 6, height: 6, borderRadius: '50%', background: '#E0E0E0',
                  animation: `bounce .9s ${delay}ms infinite`,
                }} />
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{
          background: '#fff', border: '2px solid #E8E8E8', borderRadius: 14,
          padding: '5px 5px 5px 16px', display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 2px 12px rgba(0,0,0,.06)',
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder={placeholder || 'Busca cualquier título, personaje o figura...'}
            style={{
              flex: 1, border: 'none', outline: 'none', fontSize: 15,
              color: '#111', background: 'transparent', padding: '8px 0', fontFamily: 'inherit',
            }}
          />
          <button
            onClick={() => send()}
            disabled={loading}
            style={{
              width: 42, height: 42, background: '#0D0D0D', border: 'none',
              borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>

        <div style={{ fontSize: 11, color: '#bbb', textAlign: 'center', marginTop: 10 }}>
          Powered by <strong style={{ color: '#999' }}>GPT-4o</strong> · Busca en Midtown · Amazon · Iron Studios · Panini
        </div>
      </div>

      {/* Product Drawer */}
      <ProductDrawer product={drawerProduct} onClose={() => setDrawerProduct(null)} />

      <style>{`
        @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.2} }
      `}</style>
    </>
  );
}
