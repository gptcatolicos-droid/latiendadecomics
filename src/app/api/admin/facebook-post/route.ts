import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

function defaultPost(title: string, price: string, url: string): string {
  return `🎉 ¡Nuevo en La Tienda de Cómics!\n\n📚 ${title}\n\n💥 Precio especial: ${price}\n\nEnvíos a toda Colombia 🇨🇴 ¡No te lo pierdas!\n\n🛒 Consíguelo aquí: ${url}\n\n#comics #LaToendadeComics #Colombia #MangaYComics`;
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  const { title, description, price_cop, slug } = await req.json();

  if (!title) {
    return NextResponse.json({ error: 'Falta el título del producto' }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://latiendadecomics.com';
  const productUrl = `${siteUrl}/producto/${slug}`;
  const priceFormatted = price_cop ? `$${Math.round(price_cop).toLocaleString('es-CO')} COP` : '';

  try {
    const { OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `Eres el community manager de "La Tienda de Cómics", la tienda de cómics más popular de Colombia.
Escribe un post para Facebook vendiendo este producto. El tono debe ser conversacional, cercano y entusiasta. Usa emojis relevantes al producto.
El post debe incluir: el nombre del producto, el precio (${priceFormatted}), una frase de enganche, la URL al final.
Máximo 3-4 hashtags al final. La URL del producto es: ${productUrl}
${description ? `Descripción del producto: ${description.substring(0, 200)}` : ''}
Producto: ${title}

Responde SOLO con el texto del post listo para copiar y pegar.`;

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 400,
    });

    const aiText = completion.choices[0]?.message?.content?.trim() || defaultPost(title, priceFormatted, productUrl);
    return NextResponse.json({ success: true, aiText });

  } catch {
    const aiText = defaultPost(title, priceFormatted, productUrl);
    return NextResponse.json({ success: true, aiText });
  }
}
