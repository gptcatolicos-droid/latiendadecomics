'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import AdminIcon from '@/components/admin/AdminIcon';
import { PageHeader } from '@/components/admin/ui';

type Asset = { id: string; kind: 'image' | 'video' | 'audio' | 'document'; url: string; title: string; alt_text: string; storage_provider: string; created_at: string };
const filters = [{ value: '', label: 'Todo' }, { value: 'image', label: 'Imágenes' }, { value: 'video', label: 'Video' }, { value: 'audio', label: 'Audio' }, { value: 'document', label: 'Documentos' }];

export default function AdminMediaPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ url: '', title: '', alt_text: '', kind: 'image' });
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    const response = await fetch(`/api/admin/media${filter ? `?kind=${filter}` : ''}`);
    const payload = await response.json();
    if (payload.success) setAssets(payload.data || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, [filter]);

  async function register(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError('');
    const response = await fetch('/api/admin/media', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const payload = await response.json(); setSaving(false);
    if (!response.ok) { setError(payload.error || 'No se pudo registrar el recurso'); return; }
    setForm({ url: '', title: '', alt_text: '', kind: 'image' }); load();
  }

  async function upload(file: File) {
    setSaving(true); setError('');
    const data = new FormData(); data.append('files', file);
    const response = await fetch('/api/upload', { method: 'POST', body: data });
    const payload = await response.json(); setSaving(false);
    if (!response.ok) { setError(payload.error || 'No se pudo subir la imagen'); return; }
    load();
  }

  async function remove(id: string) {
    if (!window.confirm('¿Quitar este recurso de la biblioteca? El archivo original no será eliminado.')) return;
    await fetch(`/api/admin/media?id=${id}`, { method: 'DELETE' }); load();
  }

  return <div className="admin-page admin-media-page">
    <PageHeader eyebrow="Contenido" title="Biblioteca de media" description="Una fuente central para imágenes y recursos externos del catálogo.">
      <button className="admin-button is-secondary" onClick={() => fileRef.current?.click()} disabled={saving}><AdminIcon name="import" size={15}/> Subir imagen</button>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={event => { const file = event.target.files?.[0]; if (file) upload(file); event.target.value = ''; }}/>
    </PageHeader>

    <form className="admin-media-register admin-panel" onSubmit={register}>
      <div><label htmlFor="media-url">Añadir desde URL</label><input id="media-url" type="url" value={form.url} onChange={event => setForm(value => ({ ...value, url: event.target.value }))} placeholder="https://…" required/></div>
      <div><label htmlFor="media-title">Título</label><input id="media-title" value={form.title} onChange={event => setForm(value => ({ ...value, title: event.target.value }))} placeholder="Nombre interno"/></div>
      <div><label htmlFor="media-kind">Tipo</label><select id="media-kind" value={form.kind} onChange={event => setForm(value => ({ ...value, kind: event.target.value }))}><option value="image">Imagen</option><option value="video">Video</option><option value="audio">Audio</option><option value="document">Documento</option></select></div>
      <button className="admin-button is-accent" disabled={saving}>{saving ? 'Guardando…' : 'Añadir'}</button>
      {error && <p role="alert">{error}</p>}
    </form>

    <div className="admin-media-toolbar"><div>{filters.map(item => <button key={item.value} className={filter === item.value ? 'is-active' : ''} onClick={() => setFilter(item.value)}>{item.label}</button>)}</div><span>{assets.length} recursos</span></div>
    {loading ? <div className="admin-empty">Cargando biblioteca…</div> : assets.length === 0 ? <div className="admin-panel admin-media-empty"><AdminIcon name="media" size={26}/><strong>Tu biblioteca está lista</strong><span>Sube una imagen o registra una URL para comenzar.</span></div> : <div className="admin-media-grid">{assets.map(asset => <article className="admin-media-card" key={asset.id}>
      <div className="admin-media-preview">{asset.kind === 'image' ? <img src={asset.url} alt={asset.alt_text || asset.title || ''}/> : <span><AdminIcon name="media" size={24}/>{asset.kind}</span>}</div>
      <div className="admin-media-card-copy"><strong>{asset.title || asset.url.split('/').pop()}</strong><span>{asset.kind} · {asset.storage_provider === 'local' ? 'archivo subido' : 'enlace externo'}</span></div>
      <button onClick={() => remove(asset.id)} aria-label={`Quitar ${asset.title || 'recurso'}`}>×</button>
    </article>)}</div>}
  </div>;
}
