import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { query, ensureInit } from '@/lib/db';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🧠 PROMPT INTELIGENTE (NO ROBOT)
const SYSTEM = `
Eres Jarvis, asesor experto en cómics, manga y figuras.

OBJETIVO:
Ayudar a elegir productos y vender de forma natural.

REGLAS:
- No inventes productos
- No menciones marcas que no estén en catálogo
- No des precios
- Responde máximo 2-3 líneas
- Sé natural, no robótico
- Si escribe figuras muestras figuras
- Si escribe libros o comics muestras comics

COMPORTAMIENTO:
- Entiende el contexto de la conversación (ej: si hablan de Batman, sigue con Batman)
- Recomienda basado en lo que el usuario pide
- No repitas frases genéricas
- No listes cosas que no están en los productos mostrados

IMPORTANTE:
- Los productos se mostrarán automáticamente
- Tu trabajo es dar contexto útil + empujar decisión

FORMATO FINAL:
INTENT: { "query": "palabra_clave_simple" }
`;

// 🧠 NORMALIZACIÓN CON CONTEXTO
function normalizeQuery(input: string) {
  const q = input.toLowerCase();

  if (q.includes('batman')) return 'batman';
  if (q.includes('spider')) return 'spider';
  if (q.includes('iron man')) return 'iron man';

  if (q.includes('marvel')) return 'marvel';
  if (q.includes('dc')) return 'dc';

  if (q.includes('figura')) return 'statue';
  if (q.includes('comic')) return 'comic';
  if (q.includes('manga')) return 'manga';

  if (q.includes('regalo')) return 'batman';

  return q.trim() || 'comics';
}

// 🔎 BÚSQUEDA MEJORADA
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
      ORDER BY RANDOM()
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

    // 🧠 IA con contexto completo
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM },
        ...messages.slice(-6) // 👈 solo últimos mensajes para contexto real
      ],
      temperature: 0.6, // 👈 más natural
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

    // fallback inteligente
    if (!queryText) {
      queryText = messages[messages.length - 1]?.content || 'comics';
    }

    queryText = normalizeQuery(queryText);

    // 🔥 PRODUCTOS
    let products = await searchProducts(queryText);

    if (products.length === 0) {
      products = await searchProducts('batman');
    }

    // 🧠 TEXTO LIMPIO
    let cleanText = raw.replace(/INTENT:\s*\{.*\}/, '').trim();

    // fallback natural (NO robótico)
    if (!cleanText) {
      cleanText = 'Mira estas opciones que encajan muy bien 👇';
    }

    return NextResponse.json({
      text: cleanText,
      products,
      hasProducts: true,
    });

  } catch (err) {
    console.error(err);

    return NextResponse.json({
      text: 'Mira estas opciones 👇',
      products: [],
    });
  }
}
