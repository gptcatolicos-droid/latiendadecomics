'use client';
import { useState } from 'react';

export default function ScraperAdmin() {
  const [log, setLog] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [singleSlug, setSingleSlug] = useState('');

  const startFullScrape = async () => {
    setLog([]);
    setRunning(true);
    setDone(false);

    const token = localStorage.getItem('admin_token') || '';

    try {
      const res = await fetch('/api/admin/scrape/coverbrowser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ batchSize: 3 }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done: d, value } = await reader.read();
        if (d) break;
        const text = decoder.decode(value);
        const lines = text.split('\n').filter(l => l.startsWith('data:'));
        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(5));
            if (data.msg) setLog(prev => [...prev.slice(-200), data.msg]);
            if (data.done) { setDone(true); setRunning(false); }
            if (data.error) { setLog(prev => [...prev, `❌ Error: ${data.error}`]); setRunning(false); }
          } catch {}
        }
      }
    } catch (err: any) {
      setLog(prev => [...prev, `Error: ${err.message}`]);
      setRunning(false);
    }
  };

  const scrapeSingle = async () => {
    if (!singleSlug.trim()) return;
    setLog([`Scraping ${singleSlug}...`]);
    setRunning(true);
    try {
      const res = await fetch(`/api/admin/scrape/coverbrowser?slug=${singleSlug}`);
      const data = await res.json();
      setLog([JSON.stringify(data, null, 2)]);
    } catch (err: any) {
      setLog([`Error: ${err.message}`]);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', background: '#0a0a0a', minHeight: '100vh', color: '#0f0' }}>
      <h1 style={{ color: '#CC0000', fontFamily: 'sans-serif', marginBottom: 24 }}>🤖 Admin — Scraper Panel</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div style={{ background: '#111', border: '1px solid #333', borderRadius: 8, padding: 16 }}>
          <h2 style={{ color: '#fff', fontSize: 14, marginBottom: 12, fontFamily: 'sans-serif' }}>CoverBrowser — Scrape Completo</h2>
          <p style={{ color: '#666', fontSize: 12, marginBottom: 12, fontFamily: 'sans-serif' }}>
            Scrape de todas las galerías (~450K covers). Puede tardar horas.
          </p>
          <button
            onClick={startFullScrape}
            disabled={running}
            style={{ background: running ? '#333' : '#CC0000', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: running ? 'not-allowed' : 'pointer', fontSize: 13 }}
          >
            {running ? '⏳ Corriendo...' : '🚀 Iniciar Scrape Completo'}
          </button>
        </div>

        <div style={{ background: '#111', border: '1px solid #333', borderRadius: 8, padding: 16 }}>
          <h2 style={{ color: '#fff', fontSize: 14, marginBottom: 12, fontFamily: 'sans-serif' }}>Scrape Individual</h2>
          <input
            type="text"
            value={singleSlug}
            onChange={e => setSingleSlug(e.target.value)}
            placeholder="slug (ej: batman, amazing-spider-man)"
            style={{ width: '100%', background: '#0a0a0a', border: '1px solid #333', borderRadius: 6, padding: '6px 10px', color: '#0f0', fontSize: 13, marginBottom: 8, fontFamily: 'monospace' }}
          />
          <button
            onClick={scrapeSingle}
            disabled={running || !singleSlug.trim()}
            style={{ background: '#0476D0', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
          >
            Scrape Slug
          </button>
        </div>
      </div>

      <div style={{ background: '#000', border: '1px solid #222', borderRadius: 8, padding: 16, height: 400, overflowY: 'auto' }}>
        <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>LOG {running ? '⏳ running...' : done ? '✅ done' : ''}</div>
        {log.map((line, i) => (
          <div key={i} style={{ fontSize: 11, color: line.startsWith('✓') ? '#0f0' : line.startsWith('✗') ? '#f00' : '#0f0', lineHeight: 1.5 }}>
            {line}
          </div>
        ))}
        {log.length === 0 && <div style={{ color: '#333', fontSize: 12 }}>Listo para correr...</div>}
      </div>
    </div>
  );
}
