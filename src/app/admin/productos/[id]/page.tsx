'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

const MP_FEE = 0.0399;

function calcFinalPrice(priceUsd: number, marginPercent: number, exchangeRate = 4100) {
  if (!priceUsd || priceUsd <= 0) return { usd: 0, cop: 0 };
  const withMargin = priceUsd * (1 + marginPercent / 100);
  const withFee = withMargin / (1 - MP_FEE);
  const usd = Math.round(withFee * 100) / 100;
  const cop = Math.round(usd * exchangeRate);
  return { usd, cop };
}

export default function ProductEditorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const isNew = id === 'nuevo';

  const [form, setForm] = useState<any>({
    title: '', description: '', price_usd: '', price_old_usd: '',
    stock: 1, status: 'published', category: 'comics',
    supplier: 'manual', supplier_url: '', affiliate_url: '',
    publisher: '', franchise: '', meta_title: '', meta_description: '', tags: [],
    delivery_type: 'standard', margin_percent: 15,
    preventa_enabled: false, preventa_percent: 25, preventa_launch_date: '',
    installments_enabled: false, installments_options: [3, 6],
    show_coupon_banner: false,
  });
  const [images, setImages] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [aiLoading, setAiLoading] = useState('');
  const [exchangeRate, setExchangeRate] = useState(4100);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/exchange-rate').then(r => r.json()).then(d => { const rate = d.data?.usd_to_cop || d.usd_to_cop; if (rate) setExchangeRate(rate); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/products/${id}`).then(r => r.json()).then(d => {
        if (d.success) {
          setForm((prev: any) => ({ ...prev, ...d.data, margin_percent: d.data.margin_percent ?? 15, preventa_percent: d.data.preventa_percent ?? 25, installments_options: d.data.installments_options || [3, 6] }));
          setImages(d.data.images || []);
        }
      });
    }
  }, [id]);

  const set = (field: string) => (e: any) => setForm((f: any) => ({ ...f, [field]: e.target.value }));
  const inp = (field: string, ph?: string) => ({ value: form[field] ?? '', onChange: set(field), placeholder: ph || '' });
  const S: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 9, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff', boxSizing: 'border-box' };
  const L: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: 5 };

  const priceUsdRaw = parseFloat(form.price_usd) || 0;
  const marginPct = parseFloat(form.margin_percent) || 15;
  const { usd: finalUsd, cop: finalCop } = calcFinalPrice(priceUsdRaw, marginPct, exchangeRate);
  const preventaDeposit = finalCop > 0 ? Math.round(finalCop * (form.preventa_percent / 100)) : 0;
  const installment3 = finalCop > 0 ? Math.round(finalCop / 3) : 0;
  const installment6 = finalCop > 0 ? Math.round(finalCop / 6) : 0;

  async function save() {
    setSaving(true); setSaved(false);
    const payload = { ...form, price_usd: finalUsd || priceUsdRaw, price_cop: finalCop, images: images.map((img, i) => ({ ...img, sort_order: i, is_primary: i === 0, alt: `La Tienda de Comics - ${form.title}` })) };
    const res = await fetch(isNew ? '/api/products' : `/api/products/${id}`, { method: isNew ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    setSaving(false);
    if (data.success) { setSaved(true); setTimeout(() => setSaved(false), 3000); if (isNew && data.data?.id) router.push(`/admin/productos/${data.data.id}`); }
  }

  async function uploadImage(file: File) {
    if (images.length >= 5) return; setUploading(true);
    const fd = new FormData(); fd.append('file', file);
    try { const res = await fetch('/api/upload', { method: 'POST', body: fd }); const data = await res.json(); if (data.url) addImageUrl(data.url); } catch {}
    setUploading(false);
  }

  function addImageUrl(url: string) {
    if (!url || images.length >= 5) return;
    setImages(prev => [...prev, { id: Date.now().toString(), url, alt: '', is_primary: prev.length === 0, sort_order: prev.length }]);
    setNewImageUrl('');
  }

  async function generateAI(field: string) {
    if (!form.title) return; setAiLoading(field);
    const prompts: Record<string, string> = {
      tags: `Genera exactamente 5 tags/keywords de busqueda en español para este producto de comics: "${form.title}". Solo keywords separadas por coma, sin espacios extras.`,
      description: `Escribe una descripcion de producto de 3-4 oraciones en español para una tienda de comics LATAM. Producto: "${form.title}". Sin markdown.`,
      meta_title: `Crea un meta title SEO de maximo 60 caracteres para este producto de comics: "${form.title}". Solo el titulo, sin comillas.`,
      meta_description: `Crea una meta description SEO de maximo 155 caracteres para este producto de comics: "${form.title}". Menciona Colombia, entrega y la tienda. Sin comillas.`,
    };
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: prompts[field] }] }) });
      const data = await res.json();
      if (data.text) {
        if (field === 'tags') { const t = data.text.split(',').map((x: string) => x.trim()).filter(Boolean).slice(0, 5); setForm((f: any) => ({ ...f, tags: t })); }
        else setForm((f: any) => ({ ...f, [field]: data.text.trim() }));
      }
    } catch {}
    setAiLoading('');
  }

  const AIBtn = ({ field }: { field: string }) => (
    <button onClick={() => generateAI(field)} disabled={!!aiLoading || !form.title} style={{ padding: '8px 12px', background: '#f5f5f5', border: 'none', borderRadius: 8, fontSize: 11, color: aiLoading === field ? '#CC0000' : '#555', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>
      {aiLoading === field ? '...' : '✦ IA'}
    </button>
  );

  const Toggle = ({ field, label, sub }: { field: string; label: string; sub?: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', cursor: 'pointer' }} onClick={() => setForm((f: any) => ({ ...f, [field]: !f[field] }))}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{sub}</div>}
      </div>
      <div style={{ width: 44, height: 24, borderRadius: 12, background: form[field] ? '#CC0000' : '#D0D0D0', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 2, left: form[field] ? 22 : 2, width: 20, height: 20, background: '#fff', borderRadius: '50%', boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left .2s' }} />
      </div>
    </div>
  );

  const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: 14, padding: 20 }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 16 }}>{title}</h2>
      {children}
    </div>
  );

  return (
    <div style={{ padding: '28px 32px', maxWidth: 780 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link href="/admin/productos" style={{ color: '#888', textDecoration: 'none', fontSize: 13 }}>← Volver</Link>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111' }}>{isNew ? 'Nuevo producto' : 'Editar producto'}</h1>
        {saved && <span style={{ marginLeft: 'auto', fontSize: 13, color: '#15803d', fontWeight: 600, background: '#f0fdf4', padding: '6px 14px', borderRadius: 20 }}>✓ Guardado</span>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* INFO BÁSICA */}
        <Card title="Información básica">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div><label style={L}>Título *</label><input {...inp('title')} style={S} /></div>
            <div>
              <label style={L}>Descripción</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <textarea {...inp('description')} rows={4} style={{ ...S, resize: 'vertical' }} />
                <AIBtn field="description" />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label style={L}>Stock</label><input type="number" {...inp('stock')} style={S} /></div>
              <div>
                <label style={L}>Estado</label>
                <select value={form.status || 'draft'} onChange={set('status')} style={S}>
                  <option value="published">Publicado</option><option value="draft">Borrador</option>
                </select>
              </div>
              <div>
                <label style={L}>Categoría</label>
                <select value={form.category || 'comics'} onChange={set('category')} style={S}>
                  <option value="comics">Cómics</option><option value="figuras">Figuras</option><option value="manga">Manga</option>
                </select>
              </div>
              <div>
                <label style={L}>Proveedor</label>
                <select value={form.supplier || 'manual'} onChange={set('supplier')} style={S}>
                  <option value="manual">La Tienda</option><option value="amazon">Amazon</option>
                  <option value="midtown">Midtown Comics</option><option value="ironstudios">Iron Studios</option><option value="panini">Panini</option>
                </select>
              </div>
              <div><label style={L}>Editorial</label><input {...inp('publisher')} style={S} /></div>
              <div><label style={L}>Franquicia</label><input {...inp('franchise')} style={S} /></div>
            </div>
            <div><label style={L}>URL proveedor</label><input {...inp('supplier_url', 'https://...')} style={S} /></div>
            {(form.supplier === 'amazon' || (form.supplier_url || '').includes('amazon')) && (
              <div>
                <label style={L}>🔗 Link afiliado Amazon <span style={{ color: '#f97316', textTransform: 'none', fontSize: 10 }}>incluye tu tag</span></label>
                <input {...inp('affiliate_url', 'https://www.amazon.com/dp/ASIN?tag=tu-tag')} style={S} />
              </div>
            )}
          </div>
        </Card>

        {/* PRECIO Y MARGEN */}
        <Card title="Precio y margen">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={L}>Precio base USD (proveedor) *</label>
                <input type="number" step="0.01" {...inp('price_usd', '34.99')} style={S} />
              </div>
              <div>
                <label style={L}>Margen % <span style={{ color: '#aaa', fontSize: 10, textTransform: 'none' }}>default 15</span></label>
                <input type="number" step="1" value={form.margin_percent ?? 15} onChange={e => setForm((f: any) => ({ ...f, margin_percent: parseFloat(e.target.value) || 15 }))} style={S} />
              </div>
            </div>
            {priceUsdRaw > 0 && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: '#166534', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>Precio final al cliente</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, fontSize: 12 }}>
                  <div><div style={{ color: '#888' }}>Base</div><div style={{ fontWeight: 700 }}>${priceUsdRaw.toFixed(2)} USD</div></div>
                  <div><div style={{ color: '#888' }}>+ {marginPct}% margen</div><div style={{ fontWeight: 700 }}>${(priceUsdRaw * (1 + marginPct / 100)).toFixed(2)} USD</div></div>
                  <div><div style={{ color: '#888' }}>+ 3.99% MP</div><div style={{ fontWeight: 700, color: '#CC0000' }}>${finalUsd.toFixed(2)} USD</div></div>
                </div>
                <div style={{ marginTop: 10, padding: '8px 0 0', borderTop: '1px solid #bbf7d0', fontSize: 14, fontWeight: 800, color: '#CC0000' }}>
                  ${finalCop.toLocaleString('es-CO')} COP (~TRM {exchangeRate.toLocaleString()})
                </div>
              </div>
            )}
            <div>
              <label style={L}>Precio tachado USD <span style={{ color: '#aaa', textTransform: 'none', fontSize: 10 }}>(opcional)</span></label>
              <input type="number" step="0.01" {...inp('price_old_usd', 'ej. 49.99')} style={S} />
            </div>
          </div>
        </Card>

        {/* ENTREGA */}
        <Card title="Tipo de entrega">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { v: 'standard', icon: '📦', label: 'Envío estándar', sub: '6-10 días hábiles · USPS/DHL' },
              { v: 'immediate', icon: '⚡', label: 'Entrega inmediata', sub: '2-4 días · Solo Colombia' },
            ].map(opt => (
              <label key={opt.v} style={{ cursor: 'pointer', border: `2px solid ${form.delivery_type === opt.v ? '#CC0000' : '#e0e0e0'}`, borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start', background: form.delivery_type === opt.v ? '#fff5f5' : '#fff' }}>
                <input type="radio" name="delivery_type" value={opt.v} checked={form.delivery_type === opt.v} onChange={set('delivery_type')} style={{ marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{opt.icon} {opt.label}</div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{opt.sub}</div>
                </div>
              </label>
            ))}
          </div>
        </Card>

        {/* PREVENTA */}
        <Card title="Preventa">
          <Toggle field="preventa_enabled" label="Activar preventa" sub="Aparece botón de preventa en el buy box — separa con un % del valor" />
          {form.preventa_enabled && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={L}>% depósito inicial <span style={{ color: '#aaa', fontSize: 10 }}>default 25</span></label>
                  <input type="number" step="5" min="10" max="100" value={form.preventa_percent} onChange={e => setForm((f: any) => ({ ...f, preventa_percent: parseInt(e.target.value) || 25 }))} style={S} />
                </div>
                <div>
                  <label style={L}>Fecha de lanzamiento</label>
                  <input type="date" {...inp('preventa_launch_date')} style={S} />
                </div>
              </div>
              {finalCop > 0 && (
                <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
                  <div style={{ fontWeight: 700, color: '#9a3412', marginBottom: 6 }}>Preview preventa</div>
                  <div style={{ color: '#c2410c' }}>Depósito hoy ({form.preventa_percent}%): <strong>${preventaDeposit.toLocaleString('es-CO')} COP</strong></div>
                  <div style={{ color: '#c2410c', marginTop: 3 }}>Al recibir el producto: <strong>${(finalCop - preventaDeposit).toLocaleString('es-CO')} COP</strong></div>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* CUOTAS — solo figuras */}
        {form.category === 'figuras' && (
          <Card title="Pago en cuotas">
            <Toggle field="installments_enabled" label="Activar cuotas" sub="Solo para figuras — el despacho se hace al completar el pago total" />
            {form.installments_enabled && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={L}>Opciones de cuotas</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[3, 6, 12].map(n => (
                      <label key={n} onClick={e => { e.stopPropagation(); const opts = form.installments_options || []; setForm((f: any) => ({ ...f, installments_options: opts.includes(n) ? opts.filter((x: number) => x !== n) : [...opts, n].sort((a: number, b: number) => a - b) })); }} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '8px 16px', border: `2px solid ${(form.installments_options || []).includes(n) ? '#CC0000' : '#e0e0e0'}`, borderRadius: 8, fontSize: 13, fontWeight: 600, background: (form.installments_options || []).includes(n) ? '#fff5f5' : '#fff' }}>
                        {n} cuotas
                      </label>
                    ))}
                  </div>
                </div>
                {finalCop > 0 && (
                  <div style={{ background: '#f8f8f8', borderRadius: 8, padding: '10px 14px', fontSize: 12, display: 'flex', gap: 20 }}>
                    {(form.installments_options || []).includes(3) && <div><span style={{ color: '#888' }}>3 cuotas: </span><strong>${installment3.toLocaleString('es-CO')} COP/mes</strong></div>}
                    {(form.installments_options || []).includes(6) && <div><span style={{ color: '#888' }}>6 cuotas: </span><strong>${installment6.toLocaleString('es-CO')} COP/mes</strong></div>}
                  </div>
                )}
                <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#713f12' }}>
                  ⚠ La figura se despacha únicamente cuando se complete el 100% del pago. Ver <a href="/terminos" target="_blank" style={{ color: '#CC0000' }}>Términos y condiciones</a>.
                </div>
              </div>
            )}
          </Card>
        )}

        {/* CUPÓN */}
        <Card title="Cupón de descuento">
          <Toggle field="show_coupon_banner" label="Mostrar banner de cupón activo en este producto" sub="Aparece el cupón activo del sistema en la página del producto" />
        </Card>

        {/* IMÁGENES */}
        <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>Imágenes ({images.length}/5)</h2>
            {images.length < 5 && <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ padding: '7px 14px', background: '#0D0D0D', border: 'none', borderRadius: 8, color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{uploading ? '...' : '+ Subir'}</button>}
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
              <div key={img.id || i} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: `2px solid ${i === 0 ? '#CC0000' : '#e0e0e0'}`, aspectRatio: '3/4', background: '#f7f7f7' }}>
                <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {i === 0 && <div style={{ position: 'absolute', top: 4, left: 4, background: '#CC0000', color: 'white', fontSize: 8, fontWeight: 700, padding: '2px 5px', borderRadius: 4 }}>Principal</div>}
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
        </div>

        {/* SEO */}
        <Card title="SEO">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={L}>Meta título <span style={{ color: '#aaa', fontSize: 10 }}>{(form.meta_title || '').length}/60</span></label>
              <div style={{ display: 'flex', gap: 8 }}><input {...inp('meta_title')} style={{ ...S, flex: 1 }} maxLength={60} /><AIBtn field="meta_title" /></div>
            </div>
            <div>
              <label style={L}>Meta descripción <span style={{ color: '#aaa', fontSize: 10 }}>{(form.meta_description || '').length}/155</span></label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}><textarea {...inp('meta_description')} rows={3} style={{ ...S, resize: 'none', flex: 1 }} maxLength={155} /><AIBtn field="meta_description" /></div>
            </div>
          </div>
        </Card>

        {/* TAGS */}
        <Card title="Tags / Keywords">
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: 9, background: '#fff', minHeight: 42 }}>
              {(form.tags || []).map((tag: string, i: number) => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f0f0f0', borderRadius: 20, padding: '3px 10px', fontSize: 12, color: '#333' }}>
                  {tag}<button onClick={() => setForm((f: any) => ({ ...f, tags: f.tags.filter((_: any, j: number) => j !== i) }))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#999', padding: 0, lineHeight: 1 }}>×</button>
                </span>
              ))}
              {(form.tags || []).length < 5 && (
                <input placeholder="+ tag" onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { const v = (e.target as HTMLInputElement).value.trim(); if (v) { setForm((f: any) => ({ ...f, tags: [...(f.tags || []), v].slice(0, 5) })); (e.target as HTMLInputElement).value = ''; } e.preventDefault(); } }} style={{ border: 'none', outline: 'none', fontSize: 12, background: 'transparent', minWidth: 80 }} />
              )}
            </div>
            <AIBtn field="tags" />
          </div>
          <p style={{ fontSize: 11, color: '#aaa' }}>Máximo 5 tags. Presiona Enter o coma para agregar.</p>
        </Card>

        <button onClick={save} disabled={saving} style={{ padding: '14px 0', background: saved ? '#15803d' : saving ? '#999' : '#CC0000', border: 'none', borderRadius: 12, color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'background .2s' }}>
          {saved ? '✓ Guardado correctamente' : saving ? 'Guardando...' : 'Guardar producto'}
        </button>
      </div>
    </div>
  );
}
