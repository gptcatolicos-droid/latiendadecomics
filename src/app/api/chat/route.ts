import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { query, ensureInit } from '@/lib/db';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM = `Eres Jarvis, el asistente de inteligencia artificial de "La Tienda de Comics" — tienda especializada en cómics DC, Marvel, Manga y figuras coleccionables para Colombia y LATAM.

Tu personalidad: amigable, experto en cómics, entusiasta, hablas en español colombiano natural.

REGLAS DE RESPUESTA — sigue EXACTAMENTE este formato según la intención:

1. BÚSQUEDA DE PRODUCTO (usuario quiere un título específico que tengas):
   Responde SOLO con: [BUSCAR:{"q":"término"}]

2. RECOMENDACIÓN / IDEAS / REGALO (usuario dice: "recomiéndame", "qué tienes de Batman", "quiero un regalo", "dame ideas", "novedades", "qué hay nuevo", "lo mejor que tienes", "sorpréndeme"):
   Responde SOLO con: [RECOMENDAR:{"q":"término más relevante o categoría","texto":"frase natural de 1 oración introduciendo las opciones"}]
   Ejemplos:
   - "recomiéndame algo" → [RECOMENDAR:{"q":"comics","texto":"Aquí tienes algunas de nuestras mejores opciones:"}]
   - "quiero un regalo para un fan de DC" → [RECOMENDAR:{"q":"DC","texto":"¡Perfecto! Estos son ideales para fans de DC:"}]
   - "novedades" → [RECOMENDAR:{"q":"novedades","texto":"Esto es lo que acaba de llegar a La Tienda:"}]
   - "sorpréndeme" → [RECOMENDAR:{"q":"destacados","texto":"Estas son nuestras joyas del momento:"}]

3. PRODUCTO NO ENCONTRADO / NO EXISTE EN CATÁLOGO:
   Responde SOLO con: [NO_TENEMOS:{"producto":"nombre del producto buscado","texto":"texto natural ofreciendo buscarlo"}]
   Ejemplo: [NO_TENEMOS:{"producto":"X-Men Gold","texto":"No tenemos X-Men Gold en este momento, pero podemos conseguirlo para ti. ¿Nos dejas tu correo o WhatsApp y te avisamos en cuanto lo tengamos?"}]

4. PREGUNTA SOBRE UN PRODUCTO ESPECÍFICO DEL CATÁLOGO (están en el contexto):
   Responde de forma natural y experta en español, máximo 3 oraciones. SIN corchetes.

5. CONTACTO / CORREO / CELULAR del cliente (el usuario deja datos para buscar un producto):
   Responde SOLO con: [GUARDAR_LEAD:{"producto":"producto que busca","contacto":"correo o celular que dejó","texto":"confirmación amigable"}]
   Ejemplo: [GUARDAR_LEAD:{"producto":"X-Men Gold","contacto":"juan@email.com","texto":"¡Listo! Te avisamos a juan@email.com en cuanto tengamos X-Men Gold. 🔴"}]

6. CUALQUIER OTRA COSA: responde brevemente como Jarvis, máximo 2 oraciones.

IMPORTANTE: Nunca mezcles texto libre con los tags de corchete. Elige UNO y úsalo.`;

async function searchProducts(q: string, mode: 'search' | 'recommend' | 'novedades' | 'destacados' = 'search') {
  try {
    await ensureInit();

    // Ensure leads table exists
    await query(`CREATE TABLE IF NOT EXISTS customer_leads (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      producto TEXT NOT NULL,
      contacto TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`).catch(() => {});

    if (mode === 'novedades') {
      const r = await query(`
        SELECT p.id, p.title, p.slug, p.price_usd, p.price_cop, p.supplier, p.supplier_url,
               p.affiliate_url, p.delivery_type, p.publisher, p.category, pi.url as image
        FROM products p
        LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = true
        WHERE p.status = 'published'
        ORDER BY p.created_at DESC LIMIT 4
      `);
      return formatProducts(r.rows);
    }

    if (mode === 'destacados') {
      const r = await query(`
        SELECT p.id, p.title, p.slug, p.price_usd, p.price_cop, p.supplier, p.supplier_url,
               p.affiliate_url, p.delivery_type, p.publisher, p.category, pi.url as image
        FROM products p
        LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = true
        WHERE p.status = 'published' AND (p.featured = true OR p.price_usd > 30)
        ORDER BY RANDOM() LIMIT 4
      `);
      return formatProducts(r.rows);
    }

    // Phrase match first
    const phraseCondition = `LOWER(p.title) LIKE $1 OR LOWER(COALESCE(p.publisher,'')) LIKE $1 OR LOWER(COALESCE(p.franchise,'')) LIKE $1 OR LOWER(COALESCE(p.category,'')) LIKE $1 OR LOWER(COALESCE(p.description,'')) LIKE $1 OR LOWER(p.tags::text) LIKE $1`;
    const phraseResult = await query(`
      SELECT p.id, p.title, p.slug, p.price_usd, p.price_cop, p.supplier, p.supplier_url,
             p.affiliate_url, p.delivery_type, p.publisher, p.category, pi.url as image
      FROM products p
      LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = true
      WHERE p.status = 'published' AND (${phraseCondition})
      ORDER BY p.created_at DESC LIMIT 4
    `, [`%${q.toLowerCase()}%`]);

    if (phraseResult.rows.length > 0) return formatProducts(phraseResult.rows);

    // Word-by-word fallback
    const terms = q.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    if (!terms.length) return [];
    const conditions = terms.slice(0, 3).map((_, i) =>
      `(LOWER(p.title) LIKE $${i+1} OR LOWER(COALESCE(p.publisher,'')) LIKE $${i+1} OR LOWER(COALESCE(p.franchise,'')) LIKE $${i+1} OR LOWER(COALESCE(p.description,'')) LIKE $${i+1} OR LOWER(p.tags::text) LIKE $${i+1})`
    ).join(' OR ');
    const r = await query(`
      SELECT p.id, p.title, p.slug, p.price_usd, p.price_cop, p.supplier, p.supplier_url,
             p.affiliate_url, p.delivery_type, p.publisher, p.category, pi.url as image
      FROM products p
      LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = true
      WHERE p.status = 'published' AND (${conditions})
      ORDER BY p.created_at DESC LIMIT 4
    `, terms.slice(0, 3).map(t => `%${t}%`));
    return formatProducts(r.rows);
  } catch (err) {
    console.error('Search error:', err);
    return [];
  }
}

async function saveLead(producto: string, contacto: string) {
  try {
    await ensureInit();
    await query(`CREATE TABLE IF NOT EXISTS customer_leads (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      producto TEXT NOT NULL, contacto TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`).catch(() => {});
    await query(`INSERT INTO customer_leads (id, producto, contacto) VALUES (gen_random_uuid()::text, $1, $2)`, [producto, contacto]);
  } catch (err) {
    console.error('Lead save error:', err);
  }
}

function formatProducts(rows: any[]) {
  return rows.map(row => ({
    id: row.id, title: row.title, slug: row.slug || '',
    price_usd: parseFloat(row.price_usd),
    price_cop: row.price_cop || Math.round(parseFloat(row.price_usd) * 4100),
    image: row.image || '', images: row.image ? [{ url: row.image, alt: row.title }] : [],
    supplier: row.supplier, supplier_url: row.supplier_url || '',
    affiliate_url: row.affiliate_url || '', delivery_type: row.delivery_type || 'standard',
    publisher: row.publisher || '', category: row.category || '', in_stock: true,
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
      max_tokens: 150,
      temperature: 0.4,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || '';

    // BUSCAR — exact product search
    const buscarMatch = raw.match(/\[BUSCAR:\{"q":"([^"]+)"\}\]/);
    if (buscarMatch) {
      const products = await searchProducts(buscarMatch[1]);
      if (products.length > 0) return NextResponse.json({ text: '', products, hasProducts: true });
      // Nothing found — return as NO_TENEMOS signal
      return NextResponse.json({ text: '', products: [], hasProducts: false, searchQuery: buscarMatch[1], notFound: true });
    }

    // RECOMENDAR — recommendation with intro text
    const recomendarMatch = raw.match(/\[RECOMENDAR:\{"q":"([^"]+)","texto":"([^"]+)"\}\]/);
    if (recomendarMatch) {
      const [, q, texto] = recomendarMatch;
      const mode = q === 'novedades' ? 'novedades' : q === 'destacados' ? 'destacados' : 'recommend';
      const products = await searchProducts(q, mode);
      const displayText = products.length > 0 ? texto : 'No tenemos eso en este momento, ¿buscas algo más?';
      return NextResponse.json({ text: displayText, products, hasProducts: products.length > 0 });
    }

    // NO_TENEMOS — product not in catalog, ask for contact
    const noTenemosMatch = raw.match(/\[NO_TENEMOS:\{"producto":"([^"]+)","texto":"([^"]+)"\}\]/);
    if (noTenemosMatch) {
      return NextResponse.json({ text: noTenemosMatch[2], products: [], hasProducts: false, askContact: true, producto: noTenemosMatch[1] });
    }

    // GUARDAR_LEAD — save customer contact info
    const leadMatch = raw.match(/\[GUARDAR_LEAD:\{"producto":"([^"]+)","contacto":"([^"]+)","texto":"([^"]+)"\}\]/);
    if (leadMatch) {
      await saveLead(leadMatch[1], leadMatch[2]);
      return NextResponse.json({ text: leadMatch[3], products: [], hasProducts: false, leadSaved: true });
    }

    // Plain text response
    return NextResponse.json({ text: raw, products: [], hasProducts: false });
  } catch (err: any) {
    console.error('Chat error:', err?.message);
    return NextResponse.json({ text: 'Error de conexión. Intenta de nuevo.', products: [] });
  }
}
