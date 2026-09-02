'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import AdminIcon from '@/components/admin/AdminIcon';
import { PageHeader } from '@/components/admin/ui';

type Asset = {
  id: string;
  kind: 'image' | 'video' | 'audio' | 'document';
  url: string;
  title: string;
  alt_text: string;
  storage_provider: 'local' | 'external';
  folder: string;
  tags: string[];
  usage_count: number;
  usages: { entity_type: string; entity_id: string; role: string }[];
  created_at: string;
};
type Folder = { folder: string; count: number };
type Form = { url: string; title: string; alt_text: string; kind: Asset['kind']; folder: string; tags: string };
const blank: Form = { url: '', title: '', alt_text: '', kind: 'image', folder: 'General', tags: '' };
const filters = [{ value: '', label: 'Todo' }, { value: 'image', label: 'Imágenes' }, { value: 'video', label: 'Video' }, { value: 'audio', label: 'Audio' }, { value: 'document', label: 'Documentos' }];

export default function AdminMediaPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [filter, setFilter] = useState('');
  const [folder, setFolder] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Form>({ ...blank });
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter) params.set('kind', filter);
    if (folder) params.set('folder', folder);
    if (search.trim()) params.set('q', search.trim());
    const response = await fetch(`/api/admin/media?${params}`);
    const payload = await response.json();
    if (payload.success) { setAssets(payload.data || []); setFolders(payload.folders || []); }
    setLoading(false);
  }
  useEffect(() => { const timer = window.setTimeout(load, 200); return () => window.clearTimeout(timer); }, [filter, folder, search]);

  function reset() { setEditing(null); setForm({ ...blank, folder: folder || 'General' }); setError(''); }
  function edit(asset: Asset) {
    setEditing(asset.id);
    setForm({ url: asset.url, title: asset.title || '', alt_text: asset.alt_text || '', kind: asset.kind, folder: asset.folder || 'General', tags: (asset.tags || []).join(', ') });
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  async function register(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError('');
    const body = { ...form, id: editing || undefined, tags: form.tags.split(',').map(tag => tag.trim()).filter(Boolean), storage_provider: form.url.startsWith('/') ? 'local' : 'external' };
    const response = await fetch('/api/admin/media', { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const payload = await response.json(); setSaving(false);
    if (!response.ok) { setError(payload.error || 'No se pudo guardar el recurso'); return; }
    reset(); load();
  }
  async function upload(file: File) {
    setSaving(true); setError('');
    const data = new FormData(); data.append('files', file);
    const response = await fetch('/api/upload', { method: 'POST', body: data });
    const payload = await response.json(); setSaving(false);
    if (!response.ok) { setError(payload.error || 'No se pudo subir la imagen'); return; }
    load();
  }
  async function remove(asset: Asset) {
    if (asset.usage_count > 0) { setError('Ese recurso está en uso. Desvincúlalo del producto o contenido antes de eliminarlo.'); return; }
    if (!window.confirm('¿Quitar este recurso de la biblioteca? El archivo original no será eliminado.')) return;
    const response = await fetch(`/api/admin/media?id=${asset.id}`, { method: 'DELETE' });
    const payload = await response.json();
    if (!response.ok) { setError(payload.error || 'No se pudo eliminar'); return; }
    if (editing === asset.id) reset(); load();
  }

  return <div className="admin-page admin-media-page">
    <PageHeader eyebrow="Contenido" title="Biblioteca de media" description="Busca, clasifica, reemplaza y controla el uso de imágenes y recursos externos.">
      <button className="admin-button is-secondary" onClick={() => fileRef.current?.click()} disabled={saving}><AdminIcon name="import" size={15}/> Subir imagen</button>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={event => { const file = event.target.files?.[0]; if (file) upload(file); event.target.value = ''; }}/>
    </PageHeader>

    <form className="admin-media-register admin-panel" onSubmit={register}>
      <div><label htmlFor="media-url">{editing ? 'URL / reemplazo' : 'Añadir desde URL'}</label><input id="media-url" value={form.url} onChange={event => setForm(value => ({ ...value, url: event.target.value }))} placeholder="https://… o /uploads/…" required/></div>
      <div><label htmlFor="media-title">Título</label><input id="media-title" value={form.title} onChange={event => setForm(value => ({ ...value, title: event.target.value }))} placeholder="Nombre interno"/></div>
      <div><label htmlFor="media-alt">Texto alternativo</label><input id="media-alt" value={form.alt_text} onChange={event => setForm(value => ({ ...value, alt_text: event.target.value }))} placeholder="Describe el contenido"/></div>
      <div><label htmlFor="media-folder">Carpeta</label><input id="media-folder" value={form.folder} onChange={event => setForm(value => ({ ...value, folder: event.target.value }))} list="media-folders" required/><datalist id="media-folders">{folders.map(item => <option key={item.folder} value={item.folder}/>)}</datalist></div>
      <div><label htmlFor="media-tags">Tags</label><input id="media-tags" value={form.tags} onChange={event => setForm(value => ({ ...value, tags: event.target.value }))} placeholder="batman, portada"/></div>
      <div><label htmlFor="media-kind">Tipo</label><select id="media-kind" value={form.kind} onChange={event => setForm(value => ({ ...value, kind: event.target.value as Asset['kind'] }))}><option value="image">Imagen</option><option value="video">Video</option><option value="audio">Audio</option><option value="document">Documento</option></select></div>
      <div className="admin-media-form-actions"><button className="admin-button is-accent" disabled={saving}>{saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Añadir'}</button>{editing && <button type="button" className="admin-button is-secondary" onClick={reset}>Cancelar</button>}</div>
      {error && <p role="alert">{error}</p>}
    </form>

    <div className="admin-media-search-row"><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar por nombre, URL, alt o tag…"/><select value={folder} onChange={event => setFolder(event.target.value)}><option value="">Todas las carpetas</option>{folders.map(item => <option key={item.folder} value={item.folder}>{item.folder} ({item.count})</option>)}</select></div>
    <div className="admin-media-toolbar"><div>{filters.map(item => <button key={item.value} className={filter === item.value ? 'is-active' : ''} onClick={() => setFilter(item.value)}>{item.label}</button>)}</div><span>{assets.length} recursos</span></div>
    {loading ? <div className="admin-empty">Cargando biblioteca…</div> : assets.length === 0 ? <div className="admin-panel admin-media-empty"><AdminIcon name="media" size={26}/><strong>Sin resultados</strong><span>Cambia los filtros o añade un recurso.</span></div> : <div className="admin-media-grid">{assets.map(asset => <article className="admin-media-card" key={asset.id}>
      <button className="admin-media-edit" onClick={() => edit(asset)} aria-label={`Editar ${asset.title || 'recurso'}`}>Editar</button>
      <div className="admin-media-preview">{asset.kind === 'image' ? <img src={asset.url} alt={asset.alt_text || asset.title || ''}/> : <span><AdminIcon name="media" size={24}/>{asset.kind}</span>}</div>
      <div className="admin-media-card-copy"><strong>{asset.title || asset.url.split('/').pop()}</strong><span>{asset.folder} · {(asset.tags || []).join(', ') || 'sin tags'}</span><span>{asset.usage_count > 0 ? `En uso: ${asset.usage_count}` : 'Sin uso'} · {asset.storage_provider === 'local' ? 'archivo subido' : 'enlace externo'}</span></div>
      <button className="admin-media-remove" onClick={() => remove(asset)} aria-label={`Quitar ${asset.title || 'recurso'}`} disabled={asset.usage_count > 0}>×</button>
    </article>)}</div>}
  </div>;
}
