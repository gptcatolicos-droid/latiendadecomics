import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { consumeRateLimit, requestClientKey } from '@/infrastructure/rate-limit/memory';
import { chatRequestSchema } from '@/modules/chat/schemas';
import { runChat } from '@/modules/chat/service';
import { saveLead, searchProducts } from '@/modules/chat/catalog-search';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const limit = consumeRateLimit(`chat:${requestClientKey(req.headers)}`, 20, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { text: 'Vas muy rápido, espera un momento e intenta de nuevo.', products: [], hasProducts: false },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ text: '', products: [], hasProducts: false });

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Chat error: ANTHROPIC_API_KEY is not configured');
    return NextResponse.json({ text: 'Error de conexión. Intenta de nuevo.', products: [], hasProducts: false });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return NextResponse.json(await runChat(parsed.data, client as any, { searchProducts, saveLead }));
}
