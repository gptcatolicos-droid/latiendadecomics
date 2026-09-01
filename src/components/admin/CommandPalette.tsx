'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminIcon from './AdminIcon';
import { ADMIN_COMMANDS } from './navigation';

type SearchResult = { id: string; type: 'product' | 'order'; title: string; subtitle: string; href: string };

export default function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const commands = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('es');
    return (normalized ? ADMIN_COMMANDS.filter(item => item.label.toLocaleLowerCase('es').includes(normalized)) : ADMIN_COMMANDS).slice(0, 7);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    setQuery(''); setResults([]);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  useEffect(() => {
    if (!open || query.trim().length < 2) { setResults([]); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/search?q=${encodeURIComponent(query.trim())}`, { signal: controller.signal });
        const payload = await response.json();
        if (payload.success) setResults(payload.data || []);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') setResults([]);
      } finally { setLoading(false); }
    }, 220);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [open, query]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Enter') {
        const target = results[0]?.href || commands[0]?.href;
        if (target) { router.push(target); onClose(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, results, commands, router]);

  if (!open) return null;
  return (
    <div className="admin-command-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="admin-command" role="dialog" aria-modal="true" aria-label="Buscar o ir a">
        <div className="admin-command-input-wrap">
          <AdminIcon name="search" size={20} />
          <input ref={inputRef} value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar pedidos, productos o secciones…" aria-label="Buscar" />
          <kbd>ESC</kbd>
        </div>
        <div className="admin-command-results">
          {commands.length > 0 && <div className="admin-command-group"><p>Ir a</p>{commands.map(item => (
            <Link key={item.href} href={item.href} onClick={onClose}>
              <span className="admin-command-result-icon"><AdminIcon name={item.icon} size={17} /></span><span>{item.label}</span><AdminIcon name="arrow" size={15} />
            </Link>
          ))}</div>}
          {query.trim().length >= 2 && <div className="admin-command-group">
            <p>{loading ? 'Buscando…' : 'Resultados'}</p>
            {!loading && results.length === 0 && <div className="admin-command-empty">No encontramos coincidencias.</div>}
            {results.map(result => <Link key={`${result.type}-${result.id}`} href={result.href} onClick={onClose}>
              <span className="admin-command-result-icon"><AdminIcon name={result.type === 'order' ? 'orders' : 'products'} size={17} /></span>
              <span className="admin-command-copy"><strong>{result.title}</strong><small>{result.subtitle}</small></span><AdminIcon name="arrow" size={15} />
            </Link>)}
          </div>}
        </div>
        <footer><span><kbd>↵</kbd> abrir</span><span><kbd>ESC</kbd> cerrar</span></footer>
      </section>
    </div>
  );
}
