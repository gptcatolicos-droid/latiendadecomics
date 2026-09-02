import { NextRequest, NextResponse } from 'next/server';
import { consumeRateLimit, requestClientKey } from '@/infrastructure/rate-limit/memory';
import { captureCartSchema, unsubscribeSchema } from '@/modules/growth/schemas';
import { captureAbandonedCart, GrowthConfigurationError, unsubscribeCart } from '@/modules/growth/service';

function trustedBrowserRequest(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (!origin) return process.env.NODE_ENV !== 'production';
  try {
    const expected = new URL(process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin);
    return new URL(origin).host === expected.host;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!trustedBrowserRequest(request)) {
    return NextResponse.json({ success: false, error: 'Origen no permitido' }, { status: 403 });
  }
  const rate = consumeRateLimit(`cart-capture:${requestClientKey(request.headers)}`, 30, 10 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json(
      { success: false, error: 'Demasiadas actualizaciones de carrito' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
    );
  }
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 64_000) {
    return NextResponse.json({ success: false, error: 'Solicitud demasiado grande' }, { status: 413 });
  }

  try {
    const parsed = captureCartSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Carrito o consentimiento inválido' }, { status: 400 });
    }
    return NextResponse.json({ success: true, data: await captureAbandonedCart(parsed.data) });
  } catch (error) {
    if (error instanceof GrowthConfigurationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 409 });
    }
    console.error('abandoned cart capture error', error);
    return NextResponse.json({ success: false, error: 'No fue posible guardar el carrito' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const parsed = unsubscribeSchema.safeParse({ token: request.nextUrl.searchParams.get('token') });
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Enlace inválido' }, { status: 400 });
  }
  const success = await unsubscribeCart(parsed.data.token);
  return NextResponse.json(
    success ? { success: true, message: 'Preferencias actualizadas.' } : { success: false, error: 'Enlace inválido o ya utilizado.' },
    { status: success ? 200 : 404 }
  );
}
