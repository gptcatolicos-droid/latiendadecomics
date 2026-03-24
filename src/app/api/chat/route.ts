/**
 * CHAT API — GPT-4o con búsqueda en tiempo real
 * Streaming de respuesta + búsqueda de productos en paralelo
 */
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { liveSearch } from '@/lib/livesearch';
import { isAllowedQuery } from '@/lib/catalog-rules';
import { ensureInit } from '@/lib/db';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `Eres el asistente experto de La Tienda de Comics, la mejor tienda de cómics, figuras y manga de LATAM.

PERSONALIDAD: Apasionado por los cómics, amigable, experto en DC, Marvel, Manga y Star Wars. Hablas en español pero entiendes inglés.

REGLAS:
1. Solo hablas de cómics, figuras coleccionables, manga y Star Wars
2. Si preguntan por otra cosa, dices amablemente que solo manejas este universo
3. Cuando detectes que el usuario busca un producto específico, incluye exactamente este JSON al final de tu respuesta:
   [SEARCH:{"query":"el título exacto a buscar en inglés para mejores resultados"}]
4. Respuestas cortas y directas. Máximo 3 oraciones antes de mostrar productos.
5. Si es una pregunta general sobre cómics (sin compra), responde sin el JSON de búsqueda.

EJEMPLOS DE BÚSQUEDA:
- "quiero la muerte de superman" → [SEARCH:{"query":"Death of Superman"}]
- "batman año uno" → [SEARCH:{"query":"Batman Year One"}]  
- "figura iron man iron studios" → [SEARCH:{"query":"Iron Man Iron Studios figure"}]
- "naruto vol 1" → [SEARCH:{"query":"Naruto volume 1 manga"}]

TIENDAS DISPONIBLES: Midtown Comics (cómics en inglés), Iron Studios (figuras premium), Panini Colombia (español), Amazon (afiliado).`;

export async function POST(req: NextRequest) {
  await ensureInit();

  const { messages } = await req.json();
  if (!messages?.length) {
    return NextResponse.json({ error: 'No messages' }, { status: 400 });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      max_tokens: 300,
      temperature: 0.7,
    });

    const text = completion.choices[0]?.message?.content || '';

    // Extract search query if present
    const searchMatch = text.match(/\[SEARCH:\{"query":"([^"]+)"\}\]/);
    const cleanText = text.replace(/\[SEARCH:\{[^}]+\}\]/g, '').trim();

    let products: any[] = [];
    if (searchMatch) {
      const searchQuery = searchMatch[1];
      // Check if query is in allowed categories
      if (isAllowedQuery(searchQuery)) {
        products = await liveSearch(searchQuery);
      }
    }

    return NextResponse.json({
      text: cleanText,
      products,
      hasProducts: products.length > 0,
    });

  } catch (err: any) {
    console.error('Chat error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
