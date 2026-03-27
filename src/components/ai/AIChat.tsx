'use client';

import { useState } from 'react';

export default function AIChat() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<any[]>([
    { role: 'jarvis', text: 'Hola, soy Jarvis. ¿Qué cómic, figura o manga estás buscando?' }
  ]);
  const [loading, setLoading] = useState(false);

  async function sendMessage(message: string) {
    if (!message.trim() || loading) return;

    setLoading(true);

    const userMessage = { role: 'user', text: message };

    // agregar mensaje usuario
    setMessages(prev => [...prev, userMessage]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...messages.map(m => ({
              role: m.role === 'jarvis' ? 'assistant' : 'user',
              content: m.text || ''
            })),
            { role: 'user', content: message }
          ]
        }),
      });

      const data = await res.json();

      setMessages(prev => [
        ...prev,
        {
          role: 'jarvis',
          text: data.text || 'No tengo respuesta en este momento.',
          products: data.products || []
        }
      ]);

    } catch (error) {
      setMessages(prev => [
        ...prev,
        { role: 'jarvis', text: 'Error al conectar con Jarvis.' }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      
      {/* CHAT */}
      <div className="bg-white/80 rounded-xl p-4 shadow">
        
        {/* MENSAJES */}
        <div className="space-y-3 mb-4 max-h-[400px] overflow-y-auto">
          {messages.map((msg, i) => (
            <div key={i} className={msg.role === 'user' ? 'text-right' : 'text-left'}>
              <div className={`inline-block px-4 py-2 rounded-lg ${
                msg.role === 'user' ? 'bg-black text-white' : 'bg-gray-100'
              }`}>
                {msg.text}
              </div>

              {/* PRODUCTOS */}
              {msg.products && msg.products.length > 0 && (
                <div className="flex gap-4 mt-3 overflow-x-auto">
                  {msg.products.map((p: any) => (
                    <div key={p.id} className="min-w-[160px] bg-white border rounded-lg p-2">
                      <img src={p.image} alt={p.title} className="w-full h-32 object-cover rounded" />
                      <div className="text-sm mt-2">{p.title}</div>
                      <div className="text-red-600 font-bold">
                        ${p.price_cop?.toLocaleString()} COP
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          ))}

          {loading && <div className="text-gray-500">Jarvis está pensando...</div>}
        </div>

        {/* INPUT */}
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
            placeholder="Busca un cómic, personaje, saga..."
            className="flex-1 border rounded-lg px-3 py-2"
          />
          <button
            onClick={() => {
              sendMessage(input);
              setInput('');
            }}
            className="bg-red-600 text-white px-4 py-2 rounded-lg"
          >
            Buscar
          </button>
        </div>

      </div>
    </div>
  );
}
