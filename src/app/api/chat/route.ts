import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { query, ensureInit } from '@/lib/db';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM = `Eres el asistente de "La Tienda de Comics" — tienda de cómics, figuras y manga para Colombia.

REGLA PRINCIPAL: Cuando el usuario busque CUALQUIER producto relacionado con cómics, figuras, manga o coleccionables, extrae el término de búsqueda y responde SOLO con:
[BUSCAR:{"q":"término de búsqueda en inglés o español"}]

Sin texto adicional. Solo ese JSON.

EJEMPLOS:
- "batman year one" → [BUSCAR:{"q":"batman year one"}]
- "facsimile" → [BUSCAR:{"q":"facsimile"}]
- "detective comics" → [BUSCAR:{"q":"detective comics"}]
- "muerte de superman" → [BUSCAR:{"q":"death of superman"}]
- "spider-man" → [BUSCAR:{"q":"spider-man"}]
- "iron man iron studios" → [BUSCAR:{"q":"iron man"}]

Para preguntas generales (no búsquedas de producto): responde brevemente en español, máximo 2 oraciones.`;

async function searchProducts(q: string) {
  try {
    await ensureInit();
    // Split into terms, search each word independently for better results
    const terms = q.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    if (!terms.length) return [];

    // Try exact phrase first
    const phraseCondition = `LOWER(p.title) LIKE $1 OR LOWER(p.description) LIKE $1`;
    const phraseResult = await query(`
      SELECT p.id, p.title, p.price_usd, p.price_cop, p.supplier, p.supplier_url,
             pi.url as image
      FROM products p
      LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = true
      WHERE p.status = 'published' AND (${phraseCondition})
      ORDER BY p.created_at DESC LIMIT 8
    `, [`%${q.toLowerCase()}%`]);

    if (phraseResult.rows.length > 0) {
      return formatProducts(phraseResult.rows);
    }

    // If no exact match, try individual terms with OR
    const conditions = terms.slice(0, 4).map((_, i) => 
      `(LOWER(p.title) LIKE $${i + 1} OR LOWER(p.description) LIKE $${i + 1})`
    ).join(' OR ');
    const params = terms.slice(0, 4).map(t => `%${t}%`);

    const r = await query(`
      SELECT p.id, p.title, p.price_usd, p.price_cop, p.supplier, p.supplier_url,
             pi.url as image
      FROM products p
      LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = true
      WHERE p.status = 'published' AND (${conditions})
      ORDER BY p.created_at DESC LIMIT 8
    `, params);

    return formatProducts(r.rows);
  } catch (err) {
    console.error('Search error:', err);
    return [];
  }
}

function formatProducts(rows: any[]) {
  const supplierNames: Record<string, string> = {
    amazon: 'Amazon', midtown: 'Midtown Comics',
    ironstudios: 'Iron Studios', panini: 'Panini', manual: 'La Tienda',
  };
  return rows.map(row => ({
    id: row.id,
    title: row.title,
    price_usd: parseFloat(row.price_usd),
    price_cop: row.price_cop || Math.round(parseFloat(row.price_usd) * 4100),
    image: row.image || '',
    supplier: row.supplier,
    supplier_name: supplierNames[row.supplier] || 'La Tienda',
    supplier_url: row.supplier_url || '',
    delivery_days: row.supplier === 'panini' ? '3-5' : row.supplier === 'ironstudios' ? '5-8' : '6-10',
    in_stock: true,
  }));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body;
    if (!messages?.length) return NextResponse.json({ text: '', products: [] });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: SYSTEM }, ...messages],
      max_tokens: 80,
      temperature: 0.2,
    });

    const raw = completion.choices[0]?.message?.content || '';
    const searchMatch = raw.match(/\[BUSCAR:\{"q":"([^"]+)"\}\]/);

    if (searchMatch) {
      const searchQuery = searchMatch[1];
      const products = await searchProducts(searchQuery);
      if (products.length > 0) {
        return NextResponse.json({ text: '', products, hasProducts: true });
      }
      return NextResponse.json({ 
        text: '', products: [], hasProducts: false, searchQuery,
      });
    }

    return NextResponse.json({ text: raw, products: [], hasProducts: false });
  } catch (err: any) {
    console.error('Chat error:', err?.message);
    return NextResponse.json({ text: 'Error de conexión. Intenta de nuevo.', products: [] });
  }
}
