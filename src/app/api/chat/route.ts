import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { query, ensureInit } from '@/lib/db';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 🧠 PROMPT
const SYSTEM = `
Eres Jarvis, asesor experto en cómics, manga y figuras de colección de La Tienda de Comics.

Tu objetivo es ayudar al usuario a decidir qué comprar.

Reglas:
- Habla claro, natural, como vendedor experto
- Detecta intención (regalo, personaje, empezar, coleccionista)
- No hagas demasiadas preguntas
- Máximo 2 interacciones antes de recomendar productos
- Siempre guía hacia una compra
- Nunca respondas genérico
- No repitas productos

Si el usuario dice cosas como:
"qué más tienes", "otra opción", "algo más"
→ debes continuar el contexto anterior

Al final SIEMPRE agrega:
INTENT: { "type": "search | recommend | gift | unknown", "query": "texto" }
`;

// 🔎 BUSCADOR
async function searchProducts(q: string) {
  try {
    await ensureInit();

    const r = await query(`
      SELECT p.id, p.title, p.slug, p.price_usd, p.price_cop, pi.url as image
      FROM products p
      LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = true
      WHERE p.status = 'published'
      AND LOWER(p.title) LIKE $1
      ORDER BY p.created_at DESC
      LIMIT 4
    `, [`%${q.toLowerCase()}%`]);

    return r.rows.map(row => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      price_cop: row.price_cop || Math.round(parseFloat(row.price_usd) * 4100),
      image: row.image || '',
    }));

  } catch (err) {
    console.error(err);
    return [];
  }
}

// 🚀 API
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, product } = body;

    if (!messages?.length) {
      return NextResponse.json({ text: '', products: [] });
    }

    // 🧠 CONTEXTO PRODUCTO
    let productContext = '';
    if (product) {
      productContext = `
Producto actual:
${product.title}
Precio: ${product.price_cop} COP
Descripción: ${product.description || ''}
`;
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM },
        ...(product ? [{ role: 'system', content: productContext }] : []),
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const raw = completion.choices[0]?.message?.content || '';

    // 🧠 EXTRAER INTENT
    const match = raw.match(/INTENT:\s*(\{.*\})/);
    let intent: any = null;

    if (match) {
      try {
        intent = JSON.parse(match[1]);
      } catch {}
    }

    const cleanText = raw.replace(/INTENT:\s*\{.*\}/, '').trim();

    // 🔥 LÓGICA DE PRODUCTOS (CLAVE)
    let products: any[] = [];

    const userMessagesCount = messages.filter((m: any) => m.role === 'user').length;

    if (!product) {

      // 1. por intención
      if (intent) {
        if (intent.type === 'search') {
          products = await searchProducts(intent.query);
        }

        if (intent.type === 'recommend' || intent.type === 'gift') {
          products = await searchProducts(intent.query || 'comics');
        }
      }

      // 2. 🔥 FORZAR después de 2 mensajes
      if (products.length === 0 && userMessagesCount >= 2) {
        const last = messages[messages.length - 1]?.content || 'comics';
        products = await searchProducts(last);
      }
    }

    return NextResponse.json({
      text: cleanText,
      products,
      hasProducts: products.length > 0,
    });

  } catch (err: any) {
    console.error(err);

    return NextResponse.json({
      text: 'Error en el chat.',
      products: [],
    });
  }
}
