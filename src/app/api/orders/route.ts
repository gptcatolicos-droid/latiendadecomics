import { NextRequest, NextResponse } from 'next/server';
import { query, ensureInit } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { createPaymentPreference } from '@/lib/mercadopago';
import { createOrderSchema } from '@/modules/orders/schemas';
import { createReservedOrder, OrderInputError, releaseReservedOrder } from '@/modules/orders/service';
import { parseOrder } from '@/modules/orders/mapper';
import { consumeRateLimit, requestClientKey } from '@/infrastructure/rate-limit/memory';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;
  await ensureInit();

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get('limit') || '20', 10)));
  const status = searchParams.get('status');
  const search = searchParams.get('search')?.slice(0, 120);
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (status && status !== 'all') { conditions.push(`status = $${idx++}`); params.push(status); }
  if (search) {
    conditions.push(`(order_number ILIKE $${idx} OR customer_email ILIKE $${idx + 1} OR customer_name ILIKE $${idx + 2})`);
    params.push(`%${search}%`, `%${search}%`, `%${search}%`); idx += 3;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const totalRes = await query(`SELECT COUNT(*) AS c FROM orders ${where}`, params);
  const total = Number.parseInt(totalRes.rows[0].c, 10);
  const rows = await query(
    `SELECT * FROM orders ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, limit, offset]
  );
  const orders = await Promise.all(rows.rows.map(row => parseOrder(row)));

  return NextResponse.json({
    success: true,
    data: { items: orders, total, page, per_page: limit, total_pages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest) {
  try {
    const rate = consumeRateLimit(`checkout:${requestClientKey(req.headers)}`, 10, 10 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, error: 'Demasiados intentos de checkout. Intenta más tarde.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
    }
    const contentLength = Number(req.headers.get('content-length') || 0);
    if (contentLength > 64_000) {
      return NextResponse.json({ success: false, error: 'Solicitud demasiado grande' }, { status: 413 });
    }

    await ensureInit();
    const parsed = createOrderSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Datos de checkout inválidos', fields: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const created = await createReservedOrder(parsed.data);
    const orderRow = await query('SELECT * FROM orders WHERE id = $1', [created.orderId]);
    const order = await parseOrder(orderRow.rows[0]);

    try {
      const preference = await createPaymentPreference(order, created.publicToken);
      return NextResponse.json({
        success: true,
        data: {
          order_id: created.orderId,
          order_number: created.orderNumber,
          total_usd: created.totalUsd,
          total_cop: created.totalCop,
          payment_preference_id: preference.id,
          payment_init_point: preference.init_point,
        },
      }, { status: 201 });
    } catch (error) {
      console.error('Mercado Pago preference error:', error);
      await releaseReservedOrder(created.orderId, 'failed');
      return NextResponse.json(
        { success: false, error: 'No fue posible iniciar el pago. Intenta de nuevo.' },
        { status: 502 }
      );
    }
  } catch (error) {
    if (error instanceof OrderInputError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error('Order creation error:', error);
    return NextResponse.json({ success: false, error: 'No fue posible crear el pedido' }, { status: 500 });
  }
}
