'use client';
import { useState, useEffect } from 'react';

export default function ContactosPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const r = await fetch('/api/leads');
    const d = await r.json();
    if (d.success) setLeads(d.data);
    setLoading(false);
  }

  async function deleteLead(id: string) {
    await fetch(`/api/leads?id=${id}`, { method: 'DELETE' });
    setLeads(prev => prev.filter(l => l.id !== id));
  }

  useEffect(() => { load(); }, []);

  return (
    <div style={{ padding: '28px 32px', maxWidth: 780 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111', letterSpacing: '-.01em', marginBottom: 4 }}>Contactos de clientes</h1>
          <p style={{ fontSize: 13, color: '#888' }}>Clientes que buscaron productos no disponibles y dejaron su contacto vía Jarvis IA</p>
        </div>
        <button onClick={load} style={{ padding: '8px 16px', background: '#f5f5f5', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>↻ Actualizar</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#aaa', fontSize: 14 }}>Cargando...</div>
      ) : leads.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#555', marginBottom: 6 }}>Aún no hay contactos</div>
          <div style={{ fontSize: 13, color: '#aaa' }}>Cuando un cliente busque un producto y deje su correo o WhatsApp via Jarvis, aparecerá aquí.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {leads.map(lead => (
            <div key={lead.id} style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#CC0000', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                {lead.contacto.includes('@') ? '✉' : '📱'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 2 }}>{lead.contacto}</div>
                <div style={{ fontSize: 12, color: '#888' }}>
                  <span style={{ background: '#f5f5f5', padding: '2px 8px', borderRadius: 20, marginRight: 8 }}>🔍 {lead.producto}</span>
                  {new Date(lead.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {lead.contacto.includes('@') ? (
                  <a href={`mailto:${lead.contacto}?subject=Tu búsqueda: ${lead.producto} en La Tienda de Comics&body=Hola, tenemos buenas noticias sobre ${lead.producto}...`}
                    style={{ padding: '7px 14px', background: '#CC0000', color: 'white', borderRadius: 8, textDecoration: 'none', fontSize: 12, fontWeight: 600 }}>
                    ✉ Contactar
                  </a>
                ) : (
                  <a href={`https://wa.me/57${lead.contacto.replace(/\D/g,'')}?text=Hola! Te escribimos de La Tienda de Comics sobre ${lead.producto}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ padding: '7px 14px', background: '#25D366', color: 'white', borderRadius: 8, textDecoration: 'none', fontSize: 12, fontWeight: 600 }}>
                    💬 WhatsApp
                  </a>
                )}
                <button onClick={() => deleteLead(lead.id)} style={{ padding: '7px 10px', background: '#fef2f2', border: '1px solid #fecaca', color: '#CC0000', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
