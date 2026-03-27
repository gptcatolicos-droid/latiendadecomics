'use client';
import { useState, useEffect } from 'react';
import { useCart } from '@/hooks/useCart';
import { useRouter } from 'next/navigation';
import type { Product } from '@/types';

export default function ProductPageClient({ product }: { product: Product }) {
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{role:'user'|'jarvis'; text?:string; products?:any[]}[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const { addItem } = useCart();
  const router = useRouter();

  // 🧠 FUNCIÓN CHAT NUEVA (CON CONTEXTO PRODUCTO)
  async function askProduct() {
    const text = chatInput.trim();
    if (!text || chatLoading) return;

    setChatInput('');
    setChatLoading(true);

    // guardar mensaje usuario
    setChatMessages(prev => [...prev, { role: 'user', text }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: text }
          ],
          product: {
            title: product.title,
            price_cop: product.price_cop,
            description: product.description,
          }
        }),
      });

      const data = await res.json();

      setChatMessages(prev => [
        ...prev,
        {
          role: 'jarvis',
          text: data.text || 'No tengo respuesta en este momento.',
        }
      ]);

    } catch (error) {
      setChatMessages(prev => [
        ...prev,
        { role: 'jarvis', text: 'Error al conectar con Jarvis.' }
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      
      {/* PRODUCT INFO */}
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>{product.title}</h1>
      <p style={{ marginBottom: 20 }}>{product.description}</p>

      {/* CHAT */}
      <div style={{ border: '1px solid #eee', borderRadius: 12, overflow: 'hidden' }}>
        
        {/* HEADER */}
        <div style={{ background: '#111', color: 'white', padding: 10 }}>
          Jarvis IA
        </div>

        {/* MESSAGES */}
        <div style={{ padding: 10, minHeight: 200 }}>
          {chatMessages.map((msg, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <strong>{msg.role === 'user' ? 'Tú' : 'Jarvis'}:</strong> {msg.text}
            </div>
          ))}

          {chatLoading && <div>Jarvis está escribiendo...</div>}
        </div>

        {/* INPUT */}
        <div style={{ display: 'flex', borderTop: '1px solid #eee' }}>
          <input
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && askProduct()}
            placeholder="Pregunta sobre este producto..."
            style={{ flex: 1, padding: 10, border: 'none' }}
          />
          <button onClick={askProduct} style={{ padding: '10px 20px', background: '#CC0000', color: 'white', border: 'none' }}>
            →
          </button>
        </div>

      </div>
    </div>
  );
}
