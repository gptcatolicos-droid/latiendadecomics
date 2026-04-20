'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { CHARACTERS, searchCharacters } from '@/lib/characters-data';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  links?: { label: string; href: string }[];
}

const SUGGESTED_TOPICS = [
  { icon: '🦇', label: 'Historia de Batman', q: '¿Cuál es la historia completa de Batman?' },
  { icon: '🕷️', label: '¿Quién es Spider-Man?', q: '¿Cuál es el origen de Spider-Man?' },
  { icon: '💥', label: 'Mejores sagas Marvel', q: '¿Cuáles son las mejores sagas de Marvel Comics?' },
  { icon: '🔱', label: 'Multiverso DC', q: '¿Cómo funciona el multiverso de DC Comics?' },
  { icon: '⚡', label: 'X-Men explicados', q: '¿Quiénes son los X-Men y cuál es su historia?' },
  { icon: '🌌', label: 'Infinity Gauntlet', q: '¿Qué es el Guantelete del Infinito y quién es Thanos?' },
  { icon: '🃏', label: 'El Joker', q: '¿Quién es el Joker y cuál es su historia en los cómics?' },
  { icon: '📖', label: 'Empezar a leer comics', q: '¿Por dónde empezar a leer comics de Marvel o DC?' },
];

export default function UniversoClient({ initialQuery }: { initialQuery: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState(initialQuery || '');
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (initialQuery) {
      sendMessage(initialQuery);
    }
  }, []);

  const sendMessage = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setStarted(true);
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: msg }]);

    // Check if query matches a character → suggest links
    const matchedChars = searchCharacters(msg).slice(0, 3);

    try {
      const res = await fetch('/api/jarvis-wiki', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          character: null, // encyclopedia mode — no character context restriction
          history: messages.slice(-8).map(m => ({ role: m.role, content: m.content })),
          mode: 'encyclopedia',
        }),
      });

      if (!res.ok) throw new Error('Error');
      const data = await res.json();

      const links: { label: string; href: string }[] = [];
      // Add character profile links if matched
      matchedChars.forEach(c => {
        links.push({ label: `Ver perfil: ${c.name}`, href: `/personajes/${c.universe}/${c.slug}` });
        if (c.relatedGalleries?.[0]) {
          links.push({ label: `Portadas de ${c.name}`, href: `/blog/covers/${c.relatedGalleries[0]}` });
        }
      });

      if (data.redirectTo) {
        links.unshift({ label: data.redirectLabel || 'Ver más', href: data.redirectTo });
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response || 'No pude procesar tu pregunta en este momento.',
        links: links.length > 0 ? links : undefined,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Ocurrió un error. Por favor intenta de nuevo.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D', color: '#fff', display: 'flex', flexDirection: 'column' }}>

      {/* ── NAVBAR ── */}
      <nav style={{ background: '#111', borderBottom: '1px solid #222', position: 'sticky', top: 0, zIndex: 50, flexShrink: 0 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px', height: 52, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ width: 28, height: 28, background: '#CC0000', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 12 }}>📚</span>
            </div>
            <span style={{ fontFamily: 'var(--font-oswald), serif', fontSize: 14, color: '#fff', letterSpacing: 1 }}>
              La Tienda de <span style={{ color: '#CC0000' }}>Comics</span>
            </span>
          </Link>
          <span style={{ color: 'rgba(255,255,255,.3)', fontSize: 12 }}>›</span>
          <span style={{ color: '#CC0000', fontSize: 12, fontWeight: 600 }}>🤖 Jarvis IA — ComicsIA</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <Link href="/personajes" style={{ color: 'rgba(255,255,255,.55)', fontSize: 12, padding: '4px 10px', borderRadius: 6, textDecoration: 'none', border: '1px solid rgba(255,255,255,.1)' }}>
              Personajes
            </Link>
            <Link href="/catalogo" style={{ background: '#CC0000', color: '#fff', fontSize: 12, padding: '4px 10px', borderRadius: 6, textDecoration: 'none' }}>
              Catálogo
            </Link>
          </div>
        </div>
      </nav>

      {/* ── LANDING HERO (shown when no conversation) ── */}
      {!started && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', textAlign: 'center' }}>
          {/* Logo */}
          <div style={{ width: 72, height: 72, background: 'linear-gradient(135deg, #CC0000, #880000)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, boxShadow: '0 0 40px rgba(204,0,0,.3)' }}>
            <span style={{ fontSize: 36 }}>🤖</span>
          </div>

          <h1 style={{ fontFamily: 'var(--font-oswald), serif', fontSize: 'clamp(28px, 6vw, 52px)', fontWeight: 700, letterSpacing: 2, color: '#fff', margin: '0 0 8px' }}>
            Jarvis <span style={{ color: '#CC0000' }}>Comics IA</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,.45)', fontSize: 'clamp(13px, 2vw, 16px)', margin: '0 0 8px', maxWidth: 480 }}>
            La enciclopedia de comics más completa con inteligencia artificial
          </p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
            {['Marvel','DC','Manga','Villanos','Héroes'].map(tag => (
              <span key={tag} style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.5)', fontSize: 11, padding: '3px 10px', borderRadius: 10 }}>
                {tag}
              </span>
            ))}
          </div>

          {/* Suggested topics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, maxWidth: 700, width: '100%', marginBottom: 32 }}>
            {SUGGESTED_TOPICS.map(t => (
              <button
                key={t.q}
                onClick={() => sendMessage(t.q)}
                style={{
                  background: '#161616', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10,
                  padding: '12px 14px', cursor: 'pointer', textAlign: 'left', color: '#fff',
                  transition: 'border-color .2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#CC0000')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,.1)')}
              >
                <div style={{ fontSize: 20, marginBottom: 4 }}>{t.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>{t.label}</div>
              </button>
            ))}
          </div>

          {/* SEO text block */}
          <div style={{ maxWidth: 580, textAlign: 'center', marginBottom: 32 }}>
            <p style={{ color: 'rgba(255,255,255,.3)', fontSize: 12, lineHeight: 1.8 }}>
              Jarvis Comics IA es tu asistente especializado en el universo de los comics. Pregunta sobre héroes, villanos, sagas épicas, fechas de publicación, poderes, universos alternativos y más. Cubre <b style={{ color: 'rgba(255,255,255,.5)' }}>Marvel</b>, <b style={{ color: 'rgba(255,255,255,.5)' }}>DC Comics</b>, <b style={{ color: 'rgba(255,255,255,.5)' }}>Manga</b>, <b style={{ color: 'rgba(255,255,255,.5)' }}>Dark Horse</b> e independientes.
            </p>
          </div>
        </div>
      )}

      {/* ── CONVERSATION VIEW ── */}
      {started && (
        <div ref={threadRef} style={{ flex: 1, overflowY: 'auto', padding: '24px 16px', maxWidth: 760, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', gap: 10 }}>
              {m.role === 'assistant' && (
                <div style={{ width: 32, height: 32, background: '#CC0000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                  <span style={{ fontSize: 14 }}>🤖</span>
                </div>
              )}
              <div style={{ maxWidth: '80%' }}>
                <div style={{
                  borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : '4px 12px 12px 12px',
                  padding: '12px 16px', fontSize: 14, lineHeight: 1.7,
                  background: m.role === 'user' ? '#CC0000' : '#161616',
                  color: '#fff',
                  border: m.role === 'assistant' ? '1px solid rgba(255,255,255,.1)' : 'none',
                }}>
                  <div dangerouslySetInnerHTML={{ __html: m.content
                    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
                    .replace(/\n/g, '<br/>') }} />
                </div>
                {m.links && m.links.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                    {m.links.map((link, li) => (
                      <Link
                        key={li}
                        href={link.href}
                        style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,.15)', color: 'rgba(255,255,255,.7)', fontSize: 11, padding: '5px 12px', borderRadius: 8, textDecoration: 'none' }}
                      >
                        {link.label} →
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 32, height: 32, background: '#CC0000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 14 }}>🤖</span>
              </div>
              <div style={{ background: '#161616', borderRadius: '4px 12px 12px 12px', padding: '12px 16px', border: '1px solid rgba(255,255,255,.1)' }}>
                <div style={{ display: 'flex', gap: 5 }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#CC0000', opacity: .6, animation: 'bounce .8s infinite', animationDelay: `${i * .2}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── INPUT AREA ── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,.1)', background: 'rgba(13,13,13,.97)', backdropFilter: 'blur(12px)', padding: '16px', flexShrink: 0 }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          {/* Quick chips after first message */}
          {started && messages.length >= 2 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              {['¿Cuáles son sus mejores cómics?','¿Tiene versiones alternativas?','¿Quiénes son sus enemigos?','Cuéntame más'].map(q => (
                <button key={q} onClick={() => sendMessage(q)} style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.55)', borderRadius: 12, padding: '4px 12px', fontSize: 11, cursor: 'pointer' }}>
                  {q}
                </button>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ flex: 1, background: '#161616', border: '1px solid rgba(255,255,255,.15)', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>🤖</span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Pregunta sobre cualquier personaje, saga o universo de comics..."
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 14 }}
              />
            </div>
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              style={{ background: '#CC0000', border: 'none', borderRadius: 12, width: 44, height: 44, cursor: 'pointer', fontSize: 18, opacity: loading || !input.trim() ? .4 : 1, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}
            >
              →
            </button>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/personajes" style={{ color: 'rgba(255,255,255,.35)', fontSize: 11, textDecoration: 'none' }}>
              🦸 Ver personajes
            </Link>
            <Link href="/blog" style={{ color: 'rgba(255,255,255,.35)', fontSize: 11, textDecoration: 'none' }}>
              📰 Galería de portadas
            </Link>
            <Link href="/catalogo" style={{ color: 'rgba(255,255,255,.35)', fontSize: 11, textDecoration: 'none' }}>
              🛒 Comprar cómics
            </Link>
            <Link href="/" style={{ color: 'rgba(255,255,255,.35)', fontSize: 11, textDecoration: 'none' }}>
              🏠 Inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
