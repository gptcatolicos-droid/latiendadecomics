'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { CHARACTERS } from '@/lib/characters-data';

export default function PersonajesClient() {
  const [universe, setUniverse] = useState<'all' | 'marvel' | 'dc'>('all');
  const [alignment, setAlignment] = useState<'all' | 'hero' | 'villain' | 'antihero'>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return CHARACTERS.filter(c => {
      if (universe !== 'all' && c.universe !== universe) return false;
      if (alignment !== 'all' && c.alignment !== alignment) return false;
      if (search) {
        const q = search.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.realName.toLowerCase().includes(q);
      }
      return true;
    });
  }, [universe, alignment, search]);

  const marvelCount = CHARACTERS.filter(c => c.universe === 'marvel').length;
  const dcCount = CHARACTERS.filter(c => c.universe === 'dc').length;

  return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D', color: '#fff' }}>

      {/* ── NAVBAR ── */}
      <nav style={{ background: '#111', borderBottom: '1px solid #222', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px', height: 52, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ width: 28, height: 28, background: '#CC0000', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 12 }}>📚</span>
            </div>
            <span style={{ fontFamily: 'var(--font-oswald), serif', fontSize: 14, color: '#fff', letterSpacing: 1 }}>
              La Tienda de <span style={{ color: '#CC0000' }}>Comics</span>
            </span>
          </Link>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <Link href="/blog" style={{ color: 'rgba(255,255,255,.55)', fontSize: 12, padding: '4px 12px', borderRadius: 6, textDecoration: 'none', border: '1px solid rgba(255,255,255,.1)' }}>
              📰 Blog
            </Link>
            <Link href="/universo" style={{ color: 'rgba(255,255,255,.55)', fontSize: 12, padding: '4px 12px', borderRadius: 6, textDecoration: 'none', border: '1px solid rgba(255,255,255,.1)' }}>
              🤖 Jarvis IA
            </Link>
            <Link href="/catalogo" style={{ background: '#CC0000', color: '#fff', fontSize: 12, padding: '4px 12px', borderRadius: 6, textDecoration: 'none' }}>
              Catálogo
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div style={{ background: 'linear-gradient(180deg, #0a0a1a 0%, #0D0D0D 100%)', padding: '36px 16px 24px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-oswald), serif', fontSize: 'clamp(26px, 5vw, 48px)', fontWeight: 700, letterSpacing: 2, color: '#fff', margin: '0 0 8px' }}>
          🦸 Directorio de <span style={{ color: '#CC0000' }}>Personajes</span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,.45)', fontSize: 14, margin: '0 0 24px' }}>
          {CHARACTERS.length}+ personajes · Marvel · DC · Manga
        </p>

        {/* Universe toggle */}
        <div style={{ display: 'inline-flex', border: '1px solid rgba(255,255,255,.15)', borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
          {([['all','Todos'],['marvel','Marvel'],['dc','DC']] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setUniverse(val)}
              style={{
                padding: '8px 20px', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
                background: universe === val ? (val === 'dc' ? '#0476D0' : val === 'marvel' ? '#CC0000' : '#333') : 'transparent',
                color: universe === val ? '#fff' : 'rgba(255,255,255,.45)',
                letterSpacing: .5, transition: 'all .2s',
              }}
            >
              {label}
              <span style={{ marginLeft: 6, fontSize: 10, opacity: .7 }}>
                {val === 'marvel' ? marvelCount : val === 'dc' ? dcCount : CHARACTERS.length}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ maxWidth: 480, margin: '0 auto 16px' }}>
          <input
            type="text"
            placeholder="Buscar personaje o nombre real..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,.15)', background: 'rgba(255,255,255,.07)', color: '#fff', fontSize: 14, outline: 'none' }}
          />
        </div>
      </div>

      {/* ── ALIGNMENT FILTERS ── */}
      <div style={{ borderBottom: '1px solid #222', background: '#111', padding: '0 16px', overflowX: 'auto' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 0, minWidth: 'max-content' }}>
          {([['all','Todos'],['hero','Héroes'],['villain','Villanos'],['antihero','Antihéroes']] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setAlignment(val)}
              style={{
                padding: '11px 16px', fontSize: 13, fontWeight: 500, border: 'none', background: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap',
                color: alignment === val ? '#CC0000' : 'rgba(255,255,255,.45)',
                borderBottom: `2px solid ${alignment === val ? '#CC0000' : 'transparent'}`,
              }}
            >
              {val === 'hero' ? '💙 ' : val === 'villain' ? '🔴 ' : val === 'antihero' ? '⚡ ' : ''}{label}
            </button>
          ))}
        </div>
      </div>

      {/* ── CHARACTER GRID ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,.4)' }}>
            No se encontraron personajes con esos filtros.
          </div>
        ) : (
          <>
            <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 12, marginBottom: 16 }}>
              {filtered.length} personajes encontrados
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: 12,
            }}>
              {filtered.map(char => {
                const charUrl = `/personajes/${char.universe}/${char.slug}`;
                const alignColor = char.alignment === 'hero' ? '#3b82f6' : char.alignment === 'villain' ? '#CC0000' : '#f59e0b';
                const uniLabel = char.universe === 'marvel' ? 'MARVEL' : char.universe === 'dc' ? 'DC' : 'MANGA';
                const uniBg = char.universe === 'marvel' ? '#CC0000' : char.universe === 'dc' ? '#0476D0' : '#7c3aed';

                return (
                  <Link key={char.slug} href={charUrl} style={{ textDecoration: 'none', display: 'block' }}>
                    <div
                      style={{
                        borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,.1)',
                        background: '#161616', cursor: 'pointer', transition: 'all .2s', height: '100%',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = alignColor; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.1)'; e.currentTarget.style.transform = 'none'; }}
                    >
                      <div style={{ position: 'relative' }}>
                        <img
                          src={char.imageUrl}
                          alt={char.name}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', objectPosition: 'top', display: 'block', background: '#222' }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <div style={{ position: 'absolute', top: 5, right: 5, background: uniBg, color: '#fff', fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>
                          {uniLabel}
                        </div>
                        <div style={{ position: 'absolute', bottom: 5, left: 5, background: alignColor + 'cc', color: '#fff', fontSize: 8, padding: '2px 6px', borderRadius: 4 }}>
                          {char.alignment === 'hero' ? '💙' : char.alignment === 'villain' ? '🔴' : '⚡'} {char.alignment}
                        </div>
                      </div>
                      <div style={{ padding: '8px 10px' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{char.name}</div>
                        {char.realName !== char.name && (
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{char.realName}</div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── JARVIS FLOAT ── */}
      <div style={{ position: 'sticky', bottom: 0, background: 'rgba(13,13,13,.97)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,.1)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ width: 32, height: 32, background: '#CC0000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span>🤖</span>
        </div>
        <span style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,.5)', minWidth: 150 }}>
          <b style={{ color: '#fff' }}>Jarvis IA:</b> Pregúntame sobre cualquier personaje o cómic
        </span>
        <Link href="/universo" style={{ border: '1px solid rgba(204,0,0,.4)', color: '#CC0000', borderRadius: 6, padding: '6px 12px', fontSize: 12, textDecoration: 'none' }}>
          Preguntarle a Jarvis
        </Link>
        <Link href="/catalogo" style={{ background: '#CC0000', color: '#fff', borderRadius: 6, padding: '6px 12px', fontSize: 12, textDecoration: 'none', fontWeight: 600 }}>
          Ver Catálogo
        </Link>
        <Link href="/" style={{ color: 'rgba(255,255,255,.35)', fontSize: 12, textDecoration: 'none' }}>Inicio</Link>
      </div>
    </div>
  );
}
