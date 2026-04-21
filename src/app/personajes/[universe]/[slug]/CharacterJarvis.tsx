'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { CharacterData } from '@/lib/characters-data';
import { CHARACTERS } from '@/lib/characters-data';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  redirectTo?: string;
  redirectLabel?: string;
}

export default function CharacterJarvis({ character }: { character: CharacterData }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `¡Hola! Soy Jarvis IA, tu guía del universo de los cómics. Puedo contarte todo sobre **${character.name}**, su historia, poderes, comics más importantes y más. ¿Qué quieres saber?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    setLoading(true);

    setMessages(prev => [...prev, { role: 'user', content: msg }]);

    // Check if user is asking about a DIFFERENT character
    const mentionedChar = CHARACTERS.find(c =>
      c.slug !== character.slug &&
      (msg.toLowerCase().includes(c.name.toLowerCase()) ||
        msg.toLowerCase().includes(c.realName.toLowerCase()))
    );

    if (mentionedChar) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Veo que preguntas sobre **${mentionedChar.name}**. ¡Tienes su perfil completo disponible! Te puedo redirigir allí para que puedas ver toda su historia, poderes y galerías de portadas.`,
          redirectTo: `/personajes/${mentionedChar.universe}/${mentionedChar.slug}`,
          redirectLabel: `Ver perfil de ${mentionedChar.name} →`,
        }]);
        setLoading(false);
      }, 600);
      return;
    }

    try {
      const res = await fetch('/api/jarvis-wiki', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          character: {
            name: character.name,
            universe: character.universe,
            description: character.description,
            powers: character.powers,
            firstAppearance: character.firstAppearance,
            teams: character.teams,
            relatedGalleries: character.relatedGalleries,
          },
          history: messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error('Error');

      const data = await res.json();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response || 'Lo siento, no pude procesar tu pregunta.',
        redirectTo: data.redirectTo,
        redirectLabel: data.redirectLabel,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Aquí hay algo interesante sobre ${character.name}: ${character.description.substring(0, 200)}...`,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const QUICK = [
    '¿Cuáles son sus poderes?',
    '¿Cuál es el mejor cómic para empezar?',
    '¿Cuál es su mayor batalla?',
    '¿Quiénes son sus enemigos?',
  ];

  const uniBg = character.universe === 'marvel' ? '#CC0000' : '#0476D0';

  return (
    <div style={{ borderRadius: 12, border: '1px solid rgba(255,255,255,.12)', background: '#111', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ background: uniBg, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 28, height: 28, background: 'rgba(255,255,255,.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 14 }}>🤖</span>
        </div>
        <div>
          <div style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>Jarvis IA</div>
          <div style={{ color: 'rgba(255,255,255,.65)', fontSize: 10 }}>Enciclopedia • Modo Wikipedia</div>
        </div>
        <div style={{ marginLeft: 'auto', width: 8, height: 8, background: '#22c55e', borderRadius: '50%' }} />
      </div>

      {/* Thread */}
      <div ref={threadRef} style={{ height: 260, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '86%', borderRadius: 10, padding: '8px 12px', fontSize: 12, lineHeight: 1.5,
              background: m.role === 'user' ? uniBg : '#1a1a1a',
              color: m.role === 'user' ? '#fff' : 'rgba(255,255,255,.8)',
              border: m.role === 'assistant' ? '1px solid rgba(255,255,255,.08)' : 'none',
            }}>
              <div dangerouslySetInnerHTML={{ __html: m.content.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>') }} />
              {m.redirectTo && (
                <div style={{ marginTop: 8 }}>
                  <Link href={m.redirectTo} style={{ background: uniBg, color: '#fff', fontSize: 11, padding: '4px 10px', borderRadius: 6, textDecoration: 'none', display: 'inline-block' }}>
                    {m.redirectLabel || 'Ver más →'}
                  </Link>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 4, padding: '8px 12px' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,.3)', animation: 'bounce .8s infinite', animationDelay: `${i * .2}s` }} />
            ))}
          </div>
        )}
      </div>

      {/* Quick chips */}
      {messages.length <= 1 && (
        <div style={{ padding: '0 12px 8px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {QUICK.map(q => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,.12)', color: 'rgba(255,255,255,.6)', borderRadius: 12, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', padding: 10, display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder={`Pregunta sobre ${character.name}...`}
          style={{ flex: 1, background: '#1a1a1a', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, padding: '7px 10px', color: '#fff', fontSize: 12, outline: 'none' }}
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          style={{ background: uniBg, border: 'none', borderRadius: 8, padding: '7px 12px', color: '#fff', fontSize: 14, cursor: 'pointer', opacity: loading || !input.trim() ? .5 : 1 }}
        >
          →
        </button>
      </div>

      {/* CTA */}
      <div style={{ padding: '6px 12px 10px', display: 'flex', gap: 8, borderTop: '1px solid rgba(255,255,255,.05)' }}>
        <Link href="/catalogo" style={{ flex: 1, background: '#CC0000', color: '#fff', borderRadius: 8, padding: '7px 0', fontSize: 11, textDecoration: 'none', textAlign: 'center', fontWeight: 700 }}>
          Ver cómics de {character.name}
        </Link>
        <Link href="/comicsIA" style={{ flex: 1, background: '#1a1a1a', color: 'rgba(255,255,255,.55)', borderRadius: 8, padding: '7px 0', fontSize: 11, textDecoration: 'none', textAlign: 'center', border: '1px solid rgba(255,255,255,.1)' }}>
          Jarvis completo
        </Link>
      </div>
    </div>
  );
}
