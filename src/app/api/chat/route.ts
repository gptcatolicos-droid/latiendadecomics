import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { query, ensureInit } from '@/lib/db';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 🧠 PROMPT (vendedor + contexto producto)
const SYSTEM = `
Eres Jarvis, asesor experto en cómics, manga y figuras de colección de La Tienda de Comics.

Tu objetivo es ayudar al usuario a decidir qué comprar, como un vendedor experto.

Reglas:
- Habla natural, claro y con criterio (no genérico)
- Detecta intención (regalo, empezar, fan, coleccionista)
- Si falta info, pregunta
- Recomienda máximo 3 opciones y explica por qué
- Nunca respondas como bot
- Nunca repitas productos
- Siempre cierra con una pregunta

Si hay un "Producto actual", responde usando ese contexto y habla como recomendación directa sobre ESE producto (no generalidades).

Al final de tu respuesta agrega SIEMPRE:
INTENT: { "type": "search | recommend | gift | unknown", "query": "término relevante" }
`;

// 🔎 BÚSQUEDA (se mantiene)
async function searchProducts(q: string, mode: 'search' | 'recommend' | 'novedades' | 'destacados' = 'search') {
  try {
    await ensureInit();

    await query(`CREATE TABLE IF NOT EXISTS customer_leads (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      producto TEXT NOT NULL,
      contacto TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`).catch(() => {});

    if (mode === 'novedades') {
      const r = await query(`
        SELECT p.id, p.title, p.slug, p.price_usd, p.price_cop, pi.url as image
        FROM products p
        LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = true
        WHERE p.status = 'published'
        ORDER BY p.created_at DESC LIMIT 4
      `);
      return formatProducts(r.rows);
    }

    if (mode === 'destacados') {
      const r = await query(`
        SELECT p.id, p.title, p.slug, p.price_usd, p.price_cop, pi.url as image
        FROM products p
        LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = true
        WHERE p.status = 'published'
        ORDER BY RANDOM() LIMIT 4
      `);
      return formatProducts(r.rows);
    }

    const r = await query(`
      SELECT p.id, p.title, p.slug, p.price_usd, p.price_cop, pi.url as image
      FROM products p
      LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = true
      WHERE p.status = 'published'
      AND LOWER(p.title) LIKE $1
      ORDER BY p.created_at DESC LIMIT 4
    `, [`%${q.toLowerCase()}%`]);

    return formatProducts(r.rows);
  } catch (err) {
    console.error('Search error:', err);
    return [];
  }
}

function formatProducts(rows: any[]) {
  return rows.map(row => ({
    id: row.id,
    title: row.title,
    slug: row.slug || '',
    price_usd: parseFloat(row.price_usd),
    price_cop: row.price_cop || Math.round(parseFloat(row.price_usd) * 4100),
    image: row.image || '',
    images: row.image ? [{ url: row.image, alt: row.title }] : [],
  }));
}

// 🚀 API
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, product } = body;

    if (!messages?.length) {
      return NextResponse.json({ text: '', products: [] });
    }

    // 🧩 CONTEXTO DE PRODUCTO (solo si viene)
    let productContext = '';
    if (product) {
      productContext = `
Producto actual:
Nombre: ${product.title}
Precio: ${product.price_cop} COP
Descripción: ${product.description || 'Cómic popular en la tienda'}

Instrucciones:
- El usuario está viendo ESTE producto
- Responde como recomendación directa sobre este producto
- Habla como vendedor (no genérico)
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

    const raw = completion.choices[0]?.message?.content?.trim() || '';

    // 🧠 EXTRAER INTENT
    const intentMatch = raw.match(/INTENT:\s*(\{.*\})/);
    let intent: any = null;

    if (intentMatch) {
      try {
        intent = JSON.parse(intentMatch[1]);
      } catch {}
    }

    // limpiar texto visible
    const cleanText = raw.replace(/INTENT:\s*\{.*\}/, '').trim();

    // 🎯 DECIDIR PRODUCTOS (SOLO si NO estás en PDP)
    let products: any[] = [];

    if (!product && intent) {
      if (intent.type === 'search') {
        products = await searchProducts(intent.query);
      }

      if (intent.type === 'recommend' || intent.type === 'gift') {
        products = await searchProducts(intent.query || 'comics');
      }
    }

    return NextResponse.json({
      text: cleanText,
      products,
      hasProducts: products.length > 0,
    });

  } catch (err: any) {
    console.error('Chat error:', err?.message);

    return NextResponse.json({
      text: 'Hubo un error. Intenta de nuevo.',
      products: [],
    });
  }
}
