import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

const PAGE_ID = '113105554706073'; // La Tienda de Comics Fan Page ID
const GROUP_COMICS = '210645472320646';  // comicscolombia
const GROUP_SUBASTAS = '2401623106537041'; // subastascomicscolombia

// Get the Page access token from the user token
async function getPageToken(userToken: string): Promise<string | null> {
  try {
    const r = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${userToken}`);
    const d = await r.json();
    const page = d.data?.find((p: any) =>
      p.name?.toLowerCase().includes('tienda') ||
      p.name?.toLowerCase().includes('comic') ||
      d.data[0]
    ) || d.data?.[0];
    return page?.access_token || null;
  } catch { return null; }
}

// Post to a Facebook target (page or group)
async function fbPost(targetId: string, token: string, message: string, link?: string, imageUrl?: string) {
  const body: any = { message, access_token: token };
  if (link) body.link = link;

  // If we have an image, post as photo
  if (imageUrl) {
    const r = await fetch(`https://graph.facebook.com/v19.0/${targetId}/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, url: imageUrl, caption: message }),
    });
    return r.json();
  }

  // Otherwise post as feed
  const r = await fetch(`https://graph.facebook.com/v19.0/${targetId}/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return r.json();
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  const { productId, title, description, price_cop, slug, imageUrl, targets } = await req.json();

  const userToken = process.env.FACEBOOK_ACCESS_TOKEN || '';
  if (!userToken) {
    return NextResponse.json({ error: 'FACEBOOK_ACCESS_TOKEN no configurado en variables de entorno' }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://latiendadecomics.com';
  const productUrl = `${siteUrl}/producto/${slug}`;
  const priceFormatted = price_cop ? `$${Math.round(price_cop).toLocaleString('es-CO')} COP` : '';

  const message = `🎉 ${title}

💥 Precio: ${priceFormatted}

${description ? description.substring(0, 200) + (description.length > 200 ? '...' : '') : ''}

🛒 Comprar ahora: ${productUrl}

#comics #LaToendadeComics #Colombia #MangaYComics`;

  const results: Record<string, any> = {};

  // Get page token for page posts
  const pageToken = await getPageToken(userToken);

  const targetList: string[] = targets || ['page', 'group_comics', 'group_subastas'];

  for (const target of targetList) {
    try {
      if (target === 'page') {
        if (!pageToken) { results.page = { error: 'No se pudo obtener el Page Access Token. Verifica los permisos de la app.' }; continue; }
        results.page = await fbPost(PAGE_ID, pageToken, message, productUrl, imageUrl);
      } else if (target === 'group_comics') {
        results.group_comics = await fbPost(GROUP_COMICS, userToken, message, productUrl, imageUrl);
      } else if (target === 'group_subastas') {
        results.group_subastas = await fbPost(GROUP_SUBASTAS, userToken, message, productUrl, imageUrl);
      }
    } catch (err: any) {
      results[target] = { error: err.message };
    }
  }

  const allFailed = Object.values(results).every((r: any) => r.error);
  const anySuccess = Object.values(results).some((r: any) => r.id);

  return NextResponse.json({
    success: anySuccess,
    results,
    productUrl,
    message: anySuccess ? 'Publicado exitosamente' : 'Error al publicar',
  });
}
