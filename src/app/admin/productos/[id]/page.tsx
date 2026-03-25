'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface ProductImage { id: string; url: string; alt: string; is_primary: boolean; sort_order: number; }

export default function ProductEditorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const isNew = id === 'nuevo';

  const [form, setForm] = useState<any>({ title: '', description: '', price_usd: '', stock: 10, status: 'published', category: 'comics', supplier: 'manual', supplier_url: '', publisher: '', franchise: '' });
  const [images, setImages] = useState<ProductImage[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/products/${id}`).then(r => r.json()).then(d => {
        if (d.success) {
          setForm(d.data);
          setImages(d.data.images || []);
        }
      });
    }
  }, [id]);

  const inp = (field: string) => ({ value: form[field] || '', onChange: (e: any) => setForm((f: any) => ({ ...f, [field]: e.target.value })) });
  const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 9, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff', boxSizing: 'border-box' as const };

  async function save() {
    setSaving(true);
    const payload = { ...form, images: images.map((img, i) => ({ ...img, sort_order: i, is_primary: i === 0 })) };
    const res = await fetch(isNew ? '/api/products' : `/api/products/${id}`, {
      method: isNew ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (data.success) { setSaved(true); setTimeout(() => setSaved(false), 2000); if (isNew) router.push(`/admin/productos/${data.data.id}`); }
  }

  async function uploadImage(file: File) {
    if (images.length >= 5) return;
    setUploading(true);
    const form = new FormData(); form.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (data.url) addImageUrl(data.url);
    } catch {}
    setUploading(false);
  }

  function addImageUrl(url: string) {
    if (!url || images.length >= 5) return;
    setImages(prev => [...prev, { id: Date.now().toString(), url, alt: form.title || '', is_primary: prev.length === 0, sort_order: prev.length }]);
    setNewImageUrl('');
  }

  function removeImage(idx: number) {
    setImages(prev => prev.filter((_, i) => i !== idx));
  }

  function setPrimary(idx: number) {
    setImages(prev => prev.map((img, i) => ({ ...img, is_primary: i === idx })));
  }

  async function generateWithAI(field: 'title' | 'description') {
    if (!form.title) return;
    setAiLoading(true);
    try {
      const prompt = field === 'title'
        ? 'Mejora este titulo de producto para SEO en una tienda de comics LATAM, maximo 80 caracteres, devuelve solo el titulo: ' + form.title
        : 'Escribe una descripcion de producto de 2-3 oraciones en espanol para esta tienda de comics LATAM: ' + form.title;
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
      });
      const data = await res.json();
      if (data.text) setForm((f: any) => ({ ...f, [field]: data.text }));
    } catch {}
    setAiLoading(false);
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 760 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link href="/admin/productos" style={{ color: '#888', textDecoration: 'none', fontSize: 13 }}>← Volver</Link>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111', letterSpacing: '-.01em' }}>
          {isNew ? 'Nuevo producto' : 'Editar producto'}
        </h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Basic info */}
        <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: 14, padding: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 14 }}>Información básica</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 5 }}>Título *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input {...inp('title')} style={{ ...inputStyle, flex: 1 }} />
                <button onClick={() => generateWithAI('title')} disabled={aiLoading} style={{ padding: '10px 14px', background: '#f5f5f5', border: 'none', borderRadius: 9, fontSize: 12, color: '#555', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                  ✦ IA
                </button>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 5 }}>Descripción</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <textarea {...inp('description')} rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
                <button onClick={() => generateWithAI('description')} disabled={aiLoading} style={{ padding: '10px 14px', background: '#f5f5f5', border: 'none', borderRadius: 9, fontSize: 12, color: '#555', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                  ✦ IA
                </button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 5 }}>Precio USD *</label>
                <input type="number" step="0.01" {...inp('price_usd')} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 5 }}>Stock</label>
                <input type="number" {...inp('stock')} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 5 }}>Estado</label>
                <select value={form.status || 'draft'} onChange={e => setForm((f: any) => ({ ...f, status: e.target.value }))} style={inputStyle}>
                  <option value="published">Publicado</option>
                  <option value="draft">Borrador</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 5 }}>Categoría</label>
                <select value={form.category || 'comics'} onChange={e => setForm((f: any) => ({ ...f, category: e.target.value }))} style={inputStyle}>
                  <option value="comics">Cómics</option>
                  <option value="figuras">Figuras</option>
                  <option value="manga">Manga</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 5 }}>URL proveedor</label>
              <input {...inp('supplier_url')} style={inputStyle} placeholder="https://..." />
            </div>
          </div>
        </div>

        {/* Images — 5 max */}
        <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>Imágenes ({images.length}/5)</h2>
            {images.length < 5 && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ padding: '7px 14px', background: '#0D0D0D', border: 'none', borderRadius: 8, color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {uploading ? '...' : '+ Subir'}
                </button>
                <input ref={fileRef} type="file" accept="image/*" onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0])} style={{ display: 'none' }} />
              </div>
            )}
          </div>

          {/* Add by URL */}
          {images.length < 5 && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <input value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && addImageUrl(newImageUrl)} placeholder="O pega una URL de imagen..."
                style={{ ...inputStyle, flex: 1 }} />
              <button onClick={() => addImageUrl(newImageUrl)} style={{ padding: '10px 16px', background: '#f5f5f5', border: 'none', borderRadius: 9, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', color: '#333', fontWeight: 600 }}>
                + Agregar
              </button>
            </div>
          )}

          {/* Image grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            {images.map((img, i) => (
              <div key={img.id || i} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: `2px solid ${img.is_primary ? '#CC0000' : '#e0e0e0'}`, aspectRatio: '3/4', background: '#f7f7f7' }}>
                <img src={img.url} alt={img.alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {img.is_primary && (
                  <div style={{ position: 'absolute', top: 4, left: 4, background: '#CC0000', color: 'white', fontSize: 8, fontWeight: 700, padding: '2px 5px', borderRadius: 4 }}>Principal</div>
                )}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,.6)', display: 'flex', gap: 4, padding: 4 }}>
                  {!img.is_primary && (
                    <button onClick={() => setPrimary(i)} style={{ flex: 1, background: 'rgba(255,255,255,.2)', border: 'none', color: 'white', fontSize: 8, borderRadius: 4, cursor: 'pointer', padding: '3px 0' }}>⭐</button>
                  )}
                  <button onClick={() => removeImage(i)} style={{ flex: 1, background: 'rgba(204,0,0,.8)', border: 'none', color: 'white', fontSize: 8, borderRadius: 4, cursor: 'pointer', padding: '3px 0' }}>✕</button>
                </div>
              </div>
            ))}
            {/* Empty slots */}
            {Array.from({ length: 5 - images.length }).map((_, i) => (
              <div key={`empty-${i}`} onClick={() => fileRef.current?.click()} style={{ aspectRatio: '3/4', border: '2px dashed #e0e0e0', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ccc', fontSize: 22, background: '#fafafa' }}>
                +
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: '#aaa', marginTop: 8 }}>La primera imagen es la principal. Haz clic en ⭐ para cambiarla.</p>
        </div>

        {/* Save */}
        <button onClick={save} disabled={saving} style={{ padding: '14px 32px', background: saved ? '#15803d' : '#CC0000', border: 'none', borderRadius: 12, color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'background .2s' }}>
          {saved ? '✓ Guardado' : saving ? 'Guardando...' : 'Guardar producto'}
        </button>
      </div>
    </div>
  );
}
