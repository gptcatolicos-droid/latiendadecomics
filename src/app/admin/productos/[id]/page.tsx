'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function ProductEditorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const isNew = id === 'nuevo';

  const [form, setForm] = useState<any>({ title: '', description: '', price_usd: '', price_old_usd: '', stock: 10, status: 'published', category: 'comics', supplier: 'manual', supplier_url: '', publisher: '', franchise: '', meta_title: '', meta_description: '' });
  const [images, setImages] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [aiLoading, setAiLoading] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/products/${id}`).then(r => r.json()).then(d => {
        if (d.success) { setForm(d.data); setImages(d.data.images || []); }
      });
    }
  }, [id]);

  const set = (field: string) => (e: any) => setForm((f: any) => ({ ...f, [field]: e.target.value }));
  const inp = (field: string, ph?: string) => ({ value: form[field] || '', onChange: set(field), placeholder: ph || '' });
  const S: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 9, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff', boxSizing: 'border-box' };
  const L: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 5 };

  async function save() {
    setSaving(true); setSaved(false);
    const payload = { ...form, images: images.map((img, i) => ({ ...img, sort_order: i, is_primary: i === 0, alt: `La Tienda de Comics - ${form.title}` })) };
    const res = await fetch(isNew ? '/api/products' : `/api/products/${id}`, {
      method: isNew ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (data.success) {
      setSaved(true); setTimeout(() => setSaved(false), 3000);
      if (isNew && data.data?.id) router.push(`/admin/productos/${data.data.id}`);
    }
  }

  async function uploadImage(file: File) {
    if (images.length >= 5) return;
    setUploading(true);
    const fd = new FormData(); fd.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) addImageUrl(data.url);
    } catch {}
    setUploading(false);
  }

  function addImageUrl(url: string) {
    if (!url || images.length >= 5) return;
    setImages(prev => [...prev, { id: Date.now().toString(), url, alt: `La Tienda de Comics - ${form.title}`, is_primary: prev.length === 0, sort_order: prev.length }]);
    setNewImageUrl('');
  }

  async function generateAI(field: string) {
    if (!form.title) return;
    setAiLoading(field);
    try {
      const prompts: Record<string, string> = {
        description: `Escribe una descripcion de producto de 3-4 oraciones en español para una tienda de comics LATAM. Producto: "${form.title}". Menciona para quien es ideal. Sin markdown.`,
        meta_title: `Crea un meta title SEO de maximo 60 caracteres para este producto de comics: "${form.title}". Solo el titulo, sin comillas.`,
        meta_description: `Crea una meta description SEO de maximo 155 caracteres para este producto de comics: "${form.title}". Menciona Colombia, entrega y la tienda. Sin comillas.`,
      };
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: prompts[field] }] }) });
      const data = await res.json();
      if (data.text) setForm((f: any) => ({ ...f, [field]: data.text.trim() }));
    } catch {}
    setAiLoading('');
  }

  const AIBtn = ({ field }: { field: string }) => (
    <button onClick={() => generateAI(field)} disabled={!!aiLoading || !form.title} style={{ padding: '8px 12px', background: '#f5f5f5', border: 'none', borderRadius: 8, fontSize: 11, color: aiLoading === field ? '#CC0000' : '#555', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>
      {aiLoading === field ? '...' : '✦ IA'}
    </button>
  );

  return (
    <div style={{ padding: '28px 32px', maxWidth: 760 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link href="/admin/productos" style={{ color: '#888', textDecoration: 'none', fontSize: 13 }}>← Volver</Link>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111', letterSpacing: '-.01em' }}>{isNew ? 'Nuevo producto' : 'Editar producto'}</h1>
        {saved && <span style={{ marginLeft: 'auto', fontSize: 13, color: '#15803d', fontWeight: 600, background: '#f0fdf4', padding: '6px 14px', borderRadius: 20 }}>✓ Guardado</span>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Info */}
        <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: 14, padding: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 14 }}>Información básica</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={L}>Título *</label>
              <input {...inp('title')} style={S} />
            </div>
            <div>
              <label style={L}>Descripción</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <textarea {...inp('description')} rows={4} style={{ ...S, resize: 'vertical' }} />
                <AIBtn field="description" />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={L}>Precio USD *</label>
                <input type="number" step="0.01" {...inp('price_usd', '34.99')} style={S} />
              </div>
              <div>
                <label style={L}>Precio tachado USD <span style={{ color: '#aaa', textTransform: 'none', fontSize: 10 }}>(opcional)</span></label>
                <input type="number" step="0.01" {...inp('price_old_usd', 'ej. 49.99')} style={S} />
                <div style={{ fontSize: 10, color: '#aaa', marginTop: 3 }}>Aparece tachado: <s>$49.99</s> → $34.99</div>
              </div>
              <div>
                <label style={L}>Stock</label>
                <input type="number" {...inp('stock')} style={S} />
              </div>
              <div>
                <label style={L}>Estado</label>
                <select value={form.status || 'draft'} onChange={set('status')} style={S}>
                  <option value="published">Publicado</option>
                  <option value="draft">Borrador</option>
                </select>
              </div>
              <div>
                <label style={L}>Categoría</label>
                <select value={form.category || 'comics'} onChange={set('category')} style={S}>
                  <option value="comics">Cómics</option>
                  <option value="figuras">Figuras</option>
                  <option value="manga">Manga</option>
                </select>
              </div>
              <div>
                <label style={L}>Proveedor</label>
                <select value={form.supplier || 'manual'} onChange={set('supplier')} style={S}>
                  <option value="manual">La Tienda</option>
                  <option value="amazon">Amazon</option>
                  <option value="midtown">Midtown Comics</option>
                  <option value="ironstudios">Iron Studios</option>
                  <option value="panini">Panini</option>
                </select>
              </div>
            </div>
            <div>
              <label style={L}>URL proveedor</label>
              <input {...inp('supplier_url', 'https://...')} style={S} />
            </div>
          </div>
        </div>

        {/* Images */}
        <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>Imágenes ({images.length}/5)</h2>
            {images.length < 5 && (
              <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ padding: '7px 14px', background: '#0D0D0D', border: 'none', borderRadius: 8, color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                {uploading ? '...' : '+ Subir'}
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0])} style={{ display: 'none' }} />
          </div>
          {images.length < 5 && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && addImageUrl(newImageUrl)} placeholder="O pega URL de imagen..." style={{ ...S, flex: 1 }} />
              <button onClick={() => addImageUrl(newImageUrl)} style={{ padding: '10px 14px', background: '#f5f5f5', border: 'none', borderRadius: 9, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>+ Agregar</button>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            {images.map((img, i) => (
              <div key={img.id || i} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: `2px solid ${img.is_primary || i === 0 ? '#CC0000' : '#e0e0e0'}`, aspectRatio: '3/4', background: '#f7f7f7' }}>
                <img src={img.url} alt={img.alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {(img.is_primary || i === 0) && <div style={{ position: 'absolute', top: 4, left: 4, background: '#CC0000', color: 'white', fontSize: 8, fontWeight: 700, padding: '2px 5px', borderRadius: 4 }}>Principal</div>}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,.6)', display: 'flex', gap: 3, padding: 4 }}>
                  {i !== 0 && <button onClick={() => setImages(prev => { const n = [...prev]; const [item] = n.splice(i, 1); return [item, ...n]; })} style={{ flex: 1, background: 'rgba(255,255,255,.2)', border: 'none', color: 'white', fontSize: 8, borderRadius: 3, cursor: 'pointer', padding: '3px 0' }}>★</button>}
                  <button onClick={() => setImages(prev => prev.filter((_, j) => j !== i))} style={{ flex: 1, background: 'rgba(204,0,0,.8)', border: 'none', color: 'white', fontSize: 8, borderRadius: 3, cursor: 'pointer', padding: '3px 0' }}>✕</button>
                </div>
              </div>
            ))}
            {Array.from({ length: 5 - images.length }).map((_, i) => (
              <div key={`e${i}`} onClick={() => fileRef.current?.click()} style={{ aspectRatio: '3/4', border: '2px dashed #e0e0e0', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ccc', fontSize: 22, background: '#fafafa' }}>+</div>
            ))}
          </div>
          <p style={{ fontSize: 10, color: '#aaa', marginTop: 8 }}>Alt text SEO automático: "La Tienda de Comics - [título del producto]"</p>
        </div>

        {/* SEO */}
        <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: 14, padding: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 14 }}>SEO</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={L}>Meta título (H1) <span style={{ color: '#aaa', fontSize: 10 }}>{(form.meta_title || '').length}/60</span></label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input {...inp('meta_title', 'Batman: Year One — Comprar en Colombia | La Tienda de Comics')} style={{ ...S, flex: 1 }} maxLength={60} />
                <AIBtn field="meta_title" />
              </div>
            </div>
            <div>
              <label style={L}>Meta descripción <span style={{ color: '#aaa', fontSize: 10 }}>{(form.meta_description || '').length}/155</span></label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <textarea {...inp('meta_description')} rows={3} style={{ ...S, resize: 'none', flex: 1 }} maxLength={155} />
                <AIBtn field="meta_description" />
              </div>
            </div>
          </div>
        </div>

        <button onClick={save} disabled={saving} style={{ padding: '14px 0', background: saved ? '#15803d' : saving ? '#999' : '#CC0000', border: 'none', borderRadius: 12, color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'background .2s' }}>
          {saved ? '✓ Guardado correctamente' : saving ? 'Guardando...' : 'Guardar producto'}
        </button>
      </div>
    </div>
  );
}
