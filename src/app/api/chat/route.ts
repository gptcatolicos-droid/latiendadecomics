import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { liveSearch } from '@/lib/livesearch';
import { isAllowedQuery } from '@/lib/catalog-rules';
import { ensureInit } from '@/lib/db';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM = `Eres el asistente de La Tienda de Comics, tienda de cómics, figuras y manga para LATAM.

REGLAS ESTRICTAS:
1. Solo hablas de cómics DC/Marvel, manga, figuras coleccionables y Star Wars
2. Si piden otra cosa, di amablemente que solo manejas este universo
3. Cuando el usuario busque un producto específico, añade al FINAL de tu respuesta exactamente:
   [BUSCAR:{"q":"título en inglés para mejor resultado"}]
4. Respuestas cortas, máximo 2 oraciones antes de los productos
5. Siempre responde en español aunque el usuario escriba en inglés

EJEMPLOS:
- "muerte de superman" → [BUSCAR:{"q":"Death of Superman"}]
- "batman año uno" → [BUSCAR:{"q":"Batman Year One"}]
- "figura iron man iron studios" → [BUSCAR:{"q":"Iron Man Iron Studios"}]
- "naruto tomo 1" → [BUSCAR:{"q":"Naruto volume 1"}]
- "funko spiderman" → [BUSCAR:{"q":"Spider-Man Funko Pop"}]`;

export async function POST(req: NextRequest) {
  try {
    await ensureInit();
    const body = await req.json();
    const { messages } = body;

    if (!messages?.length) {
      return NextResponse.json({ text: '', products: [] });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: SYSTEM }, ...messages],
      max_tokens: 250,
      temperature: 0.7,
    });

    const raw = completion.choices[0]?.message?.content || '';
    const searchMatch = raw.match(/\[BUSCAR:\{"q":"([^"]+)"\}\]/);
    const text = raw.replace(/\[BUSCAR:[^\]]+\]/g, '').trim();

    let products: any[] = [];
    if (searchMatch) {
      const q = searchMatch[1];
      if (isAllowedQuery(q)) {
        products = await liveSearch(q);
      }
    }

    return NextResponse.json({ text, products, hasProducts: products.length > 0 });

  } catch (err: any) {
    console.error('Chat error:', err?.message);
    return NextResponse.json({ text: 'Lo siento, hubo un error. Intenta de nuevo.', products: [] });
  }
}
