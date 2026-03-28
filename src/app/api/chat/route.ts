
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { query, ensureInit } from '@/lib/db';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🧠 PROMPT OPTIMIZADO PARA VENDER (NO INVENTAR)
const SYSTEM = `
Eres Jarvis, asesor de ventas de La Tienda de Comics.

REGLAS CRÍTICAS:
- NO inventes productos
- NO menciones marcas que no estén en catálogo
- NO recomiendes nada fuera de los productos que se muestran, si pide recomendar le recomiendas del catalogo
- Responde máximo en 2 líneas
- Tu objetivo es vender, no conversar, se amable

COMPORTAMIENTO:
- Siempre acompaña los productos
- Si el usuario dice "más", "otra opción", "qué más tienes", "busco un regalo", "para regalar"
  → responde corto y deja que los productos hagan el trabajo

Al final SIEMPRE escribe:
INTENT: { "query": "término simple" }
`;

// 🔎 BUSCADOR REAL (DB)
async function searchProducts(q: string) {
  try {
    await ensureInit();

    const clean = q.toLowerCase().trim();

    const r = await query(`
      SELECT p.id, p.title, p.slug, p.price_usd, p.price_cop, pi.url as image
      FROM products p
      LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = true
      WHERE p.status = 'published'
      AND LOWER(p.title) LIKE $1
      ORDER BY p.created_at DESC
      LIMIT 4
    `, [`%${clean}%`]);

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
    const { messages } = body;

    if (!messages?.length) {
      return NextResponse.json({ text: '', products: [] });
    }

    // 🧠 IA RESPUESTA
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM },
        ...messages
      ],
      temperature: 0.4,
      max_tokens: 120,
    });

    const raw = completion.choices[0]?.message?.content || '';

    // 🧠 EXTRAER QUERY
    const match = raw.match(/INTENT:\s*(\{.*\})/);
    let queryText = '';

    if (match) {
      try {
        const parsed = JSON.parse(match[1]);
        queryText = parsed.query || '';
      } catch {}
    }

    // fallback si IA falla
    if (!queryText) {
      queryText = messages[messages.length - 1]?.content || 'comics';
    }

    // limpiar basura
    queryText = queryText
      .toLowerCase()
      .replace(/hot toys|mark l|deluxe|edition/g, '')
      .trim();

    // 🔥 SIEMPRE TRAER PRODUCTOS
    let products = await searchProducts(queryText);

    // fallback si no encuentra nada
    if (products.length === 0) {
      products = await searchProducts('marvel');
    }

    // limpiar texto
    const cleanText = raw.replace(/INTENT:\s*\{.*\}/, '').trim();

    return NextResponse.json({
      text: cleanText || 'Aquí tienes algunas opciones:',
      products,
      hasProducts: products.length > 0,
    });

  } catch (err) {
    console.error(err);

    return NextResponse.json({
      text: 'Error en el chat',
      products: [],
    });
  }
}
