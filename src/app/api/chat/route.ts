
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { query, ensureInit } from '@/lib/db';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🧠 PROMPT MODO VENDEDOR
const SYSTEM = `
Eres Jarvis, asesor de ventas de La Tienda de Comics.

OBJETIVO: vender.

REGLAS:
- Máximo 2 líneas
- No inventes productos
- No menciones marcas que no estén en catálogo
- No des precios
- No expliques demasiado

ESTILO:
- Directo, seguro, vendedor
- Usa frases como:
  - "Estas son muy buenas opciones"
  - "Esta es una gran elección"
  - "Te recomiendo estas"
  - "Estas están top ahora"

COMPORTAMIENTO:
- Siempre acompaña con productos
- Si el usuario pide algo → responde directo + productos
- Si dice "más" → no expliques, solo muestra más

CIERRE:
- Siempre termina con intención clara de compra

FORMATO FINAL OBLIGATORIO:
INTENT: { "query": "palabra_clave_simple" }
`;

// 🧠 NORMALIZACIÓN INTELIGENTE
function normalizeQuery(input: string) {
  const q = input.toLowerCase();

  // personajes
  if (q.includes('batman')) return 'batman';
  if (q.includes('spider') || q.includes('spiderman')) return 'spider';
  if (q.includes('iron man')) return 'iron man';

  // universos
  if (q.includes('marvel')) return 'marvel';
  if (q.includes('dc')) return 'dc';

  // tipo producto
  if (q.includes('figura')) return 'figure';
  if (q.includes('comic')) return 'comic';
  if (q.includes('manga')) return 'manga';

  // intención comercial
  if (q.includes('regalo')) return 'marvel';

  return q.trim() || 'comics';
}

// 🔎 BÚSQUEDA OPTIMIZADA PARA VENDER
async function searchProducts(q: string) {
  try {
    await ensureInit();

    const clean = normalizeQuery(q);

    const r = await query(`
      SELECT p.id, p.title, p.slug, p.price_usd, p.price_cop, pi.url as image
      FROM products p
      LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = true
      WHERE p.status = 'published'
      AND (
        LOWER(p.title) LIKE $1
        OR LOWER(p.category) LIKE $1
        OR LOWER(p.tags::text) LIKE $1
      )
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

    // 🧠 IA
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM },
        ...messages
      ],
      temperature: 0.25,
      max_tokens: 80,
    });

    const raw = completion.choices[0]?.message?.content || '';

    // 🧠 EXTRAER INTENT
    const match = raw.match(/INTENT:\s*(\{.*\})/);
    let queryText = '';

    if (match) {
      try {
        const parsed = JSON.parse(match[1]);
        queryText = parsed.query || '';
      } catch {}
    }

    // fallback
    if (!queryText) {
      queryText = messages[messages.length - 1]?.content || 'comics';
    }

    queryText = normalizeQuery(queryText);

    // 🔥 PRODUCTOS
    let products = await searchProducts(queryText);

    if (products.length === 0) {
      products = await searchProducts('marvel');
    }

    // 🧠 TEXTO FINAL (VENDEDOR)
    let cleanText = raw.replace(/INTENT:\s*\{.*\}/, '').trim();

    if (!cleanText) {
      cleanText = 'Estas son muy buenas opciones para ti 👇';
    }

    // 💰 BOOST DE CONVERSIÓN
    if (products.length > 0) {
      cleanText += '\nElige una y cómprala ahora 👇';
    }

    return NextResponse.json({
      text: cleanText,
      products,
      hasProducts: true,
    });

  } catch (err) {
    console.error(err);

    return NextResponse.json({
      text: 'Aquí tienes algunas opciones 👇',
      products: [],
    });
  }
}
