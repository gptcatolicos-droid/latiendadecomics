'use client';
import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

const CHIPS = [
  'La historia de Batman',
  '¿Quién mató a Gwen Stacy?',
  'Las mejores sagas de X-Men',
  '¿Por dónde empezar Marvel?',
  'Explícame el multiverso DC',
  'Mejores cómics de Wolverine',
  '¿Qué es el Infinito Guantelete?',
  'Historia de Harley Quinn',
];

export default function ComicsIAClient() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: 'Hola, soy Jarvis ✦ la IA de La Tienda de Comics. Pregúntame sobre cualquier personaje, saga, universo o historia del mundo del cómic.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [whatsapp, setWhatsapp] = useState('573187079104');
  const threadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/settings?keys=whatsapp_number')
      .then(r => r.json())
      .then(d => { if (d.whatsapp_number) setWhatsapp(d.whatsapp_number); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages]);

  const send = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setLoading(true);

    const newMessages = [...messages, { role: 'user' as const, text: msg }];
    setMessages(newMessages);

    try {
      const res = await fetch('/api/comicsIA', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          history: messages.slice(-8).map(m => ({ role: m.role, content: m.text })),
        }),
      });

      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', text: data.text || 'Lo siento, no pude procesar tu pregunta.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Error de conexión. Por favor intenta de nuevo.' }]);
    } finally {
      setLoading(false);
    }
  };

  const isFirstMessage = messages.length <= 1;

  return (
    <>
      <style>{`
        @keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}
        .msg-bounce{animation:bounce .8s infinite}
        .chip-btn{padding:8px 14px;background:#fff;border:1.5px solid #e8e8e8;border-radius:20px;font-size:13px;cursor:pointer;font-family:inherit;color:#333;transition:border-color .15s,background .15s;white-space:nowrap}
        .chip-btn:hover{border-color:#CC0000;background:#fff5f5;color:#CC0000}
      `}</style>

      <div style={{ minHeight:'100vh', backgroundImage:'url(/background.jpg)', backgroundSize:'cover', backgroundPosition:'center', backgroundAttachment:'fixed' }}>
        <div style={{ minHeight:'100vh', background:'rgba(255,255,255,0.93)' }}>

          {/* STICKY HEADER — identical to home */}
          <div style={{ position:'sticky', top:0, zIndex:50, background:'rgba(255,255,255,0.97)', backdropFilter:'blur(8px)', borderBottom:'1px solid #f0f0f0', padding:'8px 16px', display:'flex', alignItems:'center', gap:8 }}>
            <a href="/" style={{ flexShrink:0 }}>
              <img src="/logo.webp" alt="La Tienda de Comics" style={{ height:30, objectFit:'contain', display:'block' }} />
            </a>
            <div style={{ display:'flex', gap:4, flex:1, flexWrap:'wrap' }}>
              <a href="/blog" style={{ fontSize:12, fontWeight:600, color:'#fff', padding:'5px 10px', borderRadius:8, textDecoration:'none', background:'#0D0D0D', whiteSpace:'nowrap' }}>Blog Portadas</a>
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" style={{ display:'flex', alignItems:'center', justifyContent:'center', width:36, height:36, borderRadius:'50%', background:'#25D366', color:'white', textDecoration:'none', fontSize:17 }}>💬</a>
              <a href="/catalogo" style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 12px', background:'#0D0D0D', borderRadius:10, color:'white', textDecoration:'none', fontSize:13, fontWeight:600 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                Catálogo
              </a>
            </div>
          </div>

          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'28px 16px 120px', maxWidth:700, margin:'0 auto' }}>

            {/* Logo + title — identical to home */}
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <img src="/logo.webp" alt="La Tienda de Comics" style={{ height:64, margin:'0 auto 10px', objectFit:'contain' }} />
              <h1 style={{ fontFamily:'Oswald, sans-serif', fontSize:24, fontWeight:700, color:'#111', textTransform:'uppercase', letterSpacing:'.03em', marginBottom:2 }}>
                Comics IA
              </h1>
              <p style={{ fontSize:12, color:'#888' }}>Pregúntale a Jarvis sobre cualquier cómic, personaje o saga</p>
            </div>

            {/* Chat thread */}
            <div ref={threadRef} style={{ width:'100%', display:'flex', flexDirection:'column', gap:12, marginBottom:20 }}>
              {messages.map((msg, i) => (
                <div key={i}>
                  {msg.role === 'user' ? (
                    <div style={{ display:'flex', justifyContent:'flex-end' }}>
                      <div style={{ background:'#0D0D0D', color:'white', borderRadius:'16px 16px 4px 16px', padding:'10px 16px', fontSize:14, maxWidth:'70%' }}>
                        {msg.text}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                      <div style={{ width:28, height:28, borderRadius:'50%', background:'#CC0000', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:14 }}>✦</div>
                      <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:'4px 16px 16px 16px', padding:'10px 14px', fontSize:14, color:'#333', lineHeight:1.6, maxWidth:'82%', boxShadow:'0 2px 8px rgba(0,0,0,.06)', whiteSpace:'pre-wrap' }}>
                        {msg.text}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {loading && messages[messages.length-1]?.role === 'user' && (
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <div style={{ width:28, height:28, borderRadius:'50%', background:'#CC0000', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:14 }}>✦</div>
                  <div style={{ background:'#fff', border:'1px solid #e8e8e8', borderRadius:'4px 16px 16px 16px', padding:'12px 16px', display:'flex', gap:4 }}>
                    {[0,1,2].map(j => <div key={j} className="msg-bounce" style={{ width:7, height:7, borderRadius:'50%', background:'#CC0000', animationDelay:`${j*150}ms` }} />)}
                  </div>
                </div>
              )}
            </div>

            {/* Suggestion chips — only on first message */}
            {isFirstMessage && (
              <div style={{ width:'100%', display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center', marginBottom:20 }}>
                {CHIPS.map(chip => (
                  <button key={chip} onClick={() => send(chip)} className="chip-btn">{chip}</button>
                ))}
              </div>
            )}

            {/* Input — identical to home */}
            <div style={{ position:'fixed', bottom:0, left:0, right:0, background:'rgba(255,255,255,.97)', backdropFilter:'blur(8px)', borderTop:'1px solid #f0f0f0', padding:'12px 16px', zIndex:40 }}>
              <div style={{ maxWidth:700, margin:'0 auto', display:'flex', gap:8 }}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && send()}
                  placeholder="Pregunta sobre cualquier cómic, personaje o saga..."
                  style={{ flex:1, padding:'12px 16px', border:'2px solid #e8e8e8', borderRadius:12, fontSize:14, fontFamily:'inherit', outline:'none', background:'#fff' }}
                />
                <button
                  onClick={() => send()}
                  disabled={loading || !input.trim()}
                  style={{ padding:'0 22px', background: loading ? '#ccc' : '#CC0000', border:'none', borderRadius:12, color:'white', fontSize:14, fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily:'inherit', flexShrink:0 }}
                >
                  {loading ? '...' : 'Buscar'}
                </button>
              </div>
              <div style={{ maxWidth:700, margin:'6px auto 0', display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
                <a href="/blog" style={{ fontSize:11, color:'#aaa', textDecoration:'none' }}>📰 Blog Portadas</a>
                <a href="/catalogo" style={{ fontSize:11, color:'#aaa', textDecoration:'none' }}>🛒 Comprar cómics</a>
                <a href="/" style={{ fontSize:11, color:'#aaa', textDecoration:'none' }}>🏠 Inicio</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
