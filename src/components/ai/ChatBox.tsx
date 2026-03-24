'use client';
import { useState, useRef, useEffect } from 'react';
import ProductDrawer from '@/components/product/ProductDrawer';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  products?: any[];
}

const CHIPS = [
  'La Muerte de Superman',
  'Batman: Year One',
  'Naruto Vol. 1',
  'Iron Studios Batman',
  'Dark Knight Returns',
  'Funko Pop Spider-Man',
];

export default function ChatBox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [drawerProduct, setDrawerProduct] = useState<any>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function send(text?: string) {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg: Message = { role: 'user', content: msg };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.text || 'Hubo un error, intenta de nuevo.',
        products: data.products || [],
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Error de conexión. Intenta de nuevo.',
      }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div style={{ width: '100%', maxWidth: 640, display: 'flex', flexDirection: 'column' }}>

        {/* Thread */}
        <div ref={threadRef} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 }}>

          {/* Intro */}
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', paddingBottom: 8 }}>
              <h1 style={{
                fontSize: 'clamp(20px, 5vw, 26px)',
                fontWeight: 600,
                color: '#111',
                lineHeight: 1.3,
                letterSpacing: '-.02em',
                marginBottom: 8,
              }}>
                ¿En qué cómic, figura<br />o personaje estás interesado?
              </h1>
              <p style={{ fontSize: 13, color: '#999', marginBottom: 20 }}>
                Escribe o elige una sugerencia — busco en tiempo real
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                {CHIPS.map(chip => (
                  <button key={chip} onClick={() => send(chip)} style={{
                    padding: '8px 15px', borderRadius: 30, fontSize: 13, fontWeight: 500,
                    background: '#F7F7F7', border: '1.5px solid #E8E8E8', color: '#555',
                    transition: 'all .15s', lineHeight: 1,
                  }}>
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
                    padding: '11px 16px', fontSize: 14, lineHeight: 1.55,
                    maxWidth: '82%',
                  }}>
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {msg.content && (
                    <p style={{ fontSize: 14, color: '#555', lineHeight: 1.65, maxWidth: '90%' }}
                      dangerouslySetInnerHTML={{
                        __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#111">$1</strong>')
                      }}
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

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                        gap: 10,
                      }}>
                        {msg.products.slice(0, 4).map((p, pi) => (
                          <div key={pi} onClick={() => setDrawerProduct(p)} style={{
                            background: '#fff', border: '1.5px solid #E8E8E8',
                            borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
                            transition: 'all .18s',
                          }}>
                            <div style={{
                              aspectRatio: '3/4', background: '#F7F7F7',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              position: 'relative', overflow: 'hidden',
                            }}>
                              {p.image
                                ? <img src={p.image} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <span style={{ fontSize: 32 }}>📚</span>
                              }
                              <div style={{
                                position: 'absolute', bottom: 0, left: 0, right: 0,
                                background: 'linear-gradient(0deg,rgba(0,0,0,.65),transparent)',
                                padding: '20px 8px 6px',
                                fontSize: 9, fontWeight: 800, color: 'white',
                                textTransform: 'uppercase', letterSpacing: '.05em',
                              }}>
                                {p.supplier_name}
                              </div>
                            </div>
                            <div style={{ padding: '10px 10px 12px' }}>
                              <div style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.3, color: '#111', marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {p.title}
                              </div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>
                                ${p.price_usd?.toFixed(2)} USD
                              </div>
                              <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>
                                📦 {p.delivery_days} días
                              </div>
                              {p.model === 'affiliate' && (
                                <div style={{ fontSize: 9, color: '#f97316', fontWeight: 700, marginTop: 2 }}>
                                  Afiliado Amazon
                                </div>
                              )}
                              <button style={{
                                width: '100%', padding: '7px 0', marginTop: 8,
                                background: '#0D0D0D', border: 'none', color: 'white',
                                fontSize: 11, fontWeight: 700, borderRadius: 7,
                                cursor: 'pointer',
                              }}>
                                Ver producto →
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div style={{
                        fontSize: 11, color: '#bbb', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#CC0000', flexShrink: 0, animation: 'blink 2s infinite' }} />
                        Buscado en tiempo real · Midtown · Amazon · Iron Studios · Panini
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '4px 0' }}>
              {[0, 150, 300].map(d => (
                <div key={d} style={{
                  width: 6, height: 6, borderRadius: '50%', background: '#E0E0E0',
                  animation: `bounce .9s ${d}ms infinite`,
                }} />
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{
          background: '#fff', border: '2px solid #E8E8E8',
          borderRadius: 14, padding: '5px 5px 5px 16px',
          display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 2px 16px rgba(0,0,0,.06)',
          position: 'sticky', bottom: 16,
        }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Busca cualquier título, personaje o figura..."
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontSize: 15, color: '#111', background: 'transparent',
              padding: '8px 0',
            }}
          />
          <button onClick={() => send()} disabled={loading} style={{
            width: 42, height: 42, background: loading ? '#999' : '#0D0D0D',
            border: 'none', borderRadius: 10, display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            transition: 'background .15s',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>

        <div style={{ fontSize: 11, color: '#ccc', textAlign: 'center', marginTop: 10 }}>
          Powered by <strong style={{ color: '#999' }}>GPT-4o</strong> · Midtown · Amazon · Iron Studios · Panini
        </div>
      </div>

      {/* Drawer */}
      <ProductDrawer product={drawerProduct} onClose={() => setDrawerProduct(null)} />
    </>
  );
}
