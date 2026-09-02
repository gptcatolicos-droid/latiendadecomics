import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import {
  generateSeoData, generateDescription, generateDescriptionEn,
  generateAltText, generateBlogArticle, chatAboutProduct,
} from '@/lib/ai';
import { consumeRateLimit, requestClientKey } from '@/infrastructure/rate-limit/memory';

const productSchema = z.object({
  title: z.string().trim().min(1).max(300),
  description: z.string().trim().max(10_000).optional(),
  category: z.string().trim().max(100).optional(),
  publisher: z.string().trim().max(150).optional(),
  franchise: z.string().trim().max(150).optional(),
}).passthrough();

const requestSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('chat_product'),
    product: z.object({
      title: z.string().trim().min(1).max(300),
      description: z.string().trim().max(10_000),
      price: z.union([z.string(), z.number()]).transform(String),
    }).strict(),
    message: z.string().trim().min(1).max(1_000),
  }).strict(),
  z.object({ action: z.literal('generate_seo'), product: productSchema }).strict(),
  z.object({ action: z.literal('generate_description'), product: productSchema }).strict(),
  z.object({ action: z.literal('generate_description_en'), spanish_description: z.string().trim().min(1).max(10_000) }).strict(),
  z.object({
    action: z.literal('generate_alt_text'),
    product_title: z.string().trim().min(1).max(300),
    image_index: z.number().int().min(0).max(100).optional(),
  }).strict(),
  z.object({
    action: z.literal('generate_blog'),
    topic: z.string().trim().min(2).max(300),
    keywords: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
  }).strict(),
]);

export async function POST(req: NextRequest) {
  const contentLength = Number(req.headers.get('content-length') || 0);
  if (contentLength > 32_000) {
    return NextResponse.json({ success: false, error: 'Solicitud demasiado grande' }, { status: 413 });
  }

  const parsed = requestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Solicitud de IA inválida' }, { status: 400 });
  }
  const body = parsed.data;

  if (body.action === 'chat_product') {
    const rate = consumeRateLimit(`ai:${requestClientKey(req.headers)}`, 20, 10 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: 'Demasiadas consultas. Intenta más tarde.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
    }
    const text = await chatAboutProduct(
      body.product as { title: string; description: string; price: string },
      body.message
    );
    return NextResponse.json({ success: true, data: { text } });
  }

  const auth = await requireAdmin(req);
  if (auth) return auth;

  if (body.action === 'generate_seo') {
    return NextResponse.json({
      success: true,
      data: await generateSeoData(body.product as { title: string; description?: string; category?: string; publisher?: string }),
    });
  }
  if (body.action === 'generate_description') {
    return NextResponse.json({
      success: true,
      data: { text: await generateDescription(body.product as { title: string; category?: string; publisher?: string; franchise?: string }) },
    });
  }
  if (body.action === 'generate_description_en') {
    return NextResponse.json({ success: true, data: { text: await generateDescriptionEn(body.spanish_description) } });
  }
  if (body.action === 'generate_alt_text') {
    return NextResponse.json({ success: true, data: { text: await generateAltText(body.product_title, body.image_index || 0) } });
  }
  return NextResponse.json({
    success: true,
    data: { text: await generateBlogArticle(body.topic, body.keywords || []) },
  });
}
