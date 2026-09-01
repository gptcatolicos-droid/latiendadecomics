import { NextRequest, NextResponse } from 'next/server';
import { query, ensureInit } from '@/lib/db';
import { getAdminSessionFromRequest, requireAdmin } from '@/lib/auth';
import { sendTrackingNotification } from '@/lib/email';
import { parseOrder } from '@/modules/orders/mapper';
import { hashPublicToken } from '@/modules/orders/service';
import { z } from 'zod';

const updateSchema = z.object({
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']).optional(),
  tracking_number: z.string().trim().max(120).optional(),
  tracking_carrier: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(5_000).nullable().optional(),
}).strict();

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await ensureInit();
  const isAdmin = Boolean(await getAdminSessionFromRequest(req));
  const token = new URL(req.url).searchParams.get('token');
  if (!isAdmin && (!token || token.length < 32 || token.length > 200)) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }

  const r = isAdmin
    ? await query('SELECT * FROM orders WHERE id = $1 OR order_number = $1', [params.id])
    : await query('SELECT * FROM orders WHERE id = $1 AND public_token_hash = $2', [params.id, hashPublicToken(token!)]);
  if (!r.rows.length) return NextResponse.json({ success: false, error: 'Pedido no encontrado' }, { status: 404 });
  const order = await parseOrder(r.rows[0]);
  if (isAdmin) return NextResponse.json({ success: true, data: order }, { headers: { 'Cache-Control': 'no-store' } });

  return NextResponse.json({
    success: true,
    data: {
      order_number: order.order_number,
      status: order.status,
      payment_status: order.payment_status,
      items: order.items.map(item => ({
        product_title: item.product_title,
        quantity: item.quantity,
        price_usd: item.price_usd,
        is_preventa: item.is_preventa,
        preventa_amount_paid: item.preventa_amount_paid,
      })),
      shipping_usd: order.shipping_usd,
      discount_usd: order.discount_usd,
      total_usd: order.total_usd,
      shipping_zone: order.shipping_zone,
    },
  }, { headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(req);
  if (auth) return auth;
  await ensureInit();

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Actualización inválida' }, { status: 400 });
  }
  const { status, tracking_number, tracking_carrier, notes } = parsed.data;

  const r = await query('SELECT * FROM orders WHERE id = $1', [params.id]);
  if (!r.rows.length) return NextResponse.json({ success: false, error: 'Pedido no encontrado' }, { status: 404 });

  const updates: string[] = ['updated_at = NOW()'];
  const vals: any[] = [];
  let idx = 1;

  if (status) { updates.push(`status = $${idx++}`); vals.push(status); }
  if (notes !== undefined) { updates.push(`notes = $${idx++}`); vals.push(notes); }

  let shouldSendTracking = false;
  if (tracking_number && tracking_number !== r.rows[0].tracking_number) {
    updates.push(`tracking_number = $${idx++}`, `tracking_carrier = $${idx++}`, `tracking_notified_at = NOW()`);
    vals.push(tracking_number, tracking_carrier || 'USPS');
    shouldSendTracking = true;
    if (!status) { updates.push(`status = $${idx++}`); vals.push('shipped'); }
  }

  await query(`UPDATE orders SET ${updates.join(', ')} WHERE id = $${idx}`, [...vals, params.id]);

  if (shouldSendTracking) {
    const updated = await query('SELECT * FROM orders WHERE id = $1', [params.id]);
    const order = await parseOrder(updated.rows[0]);
    sendTrackingNotification(order).catch(e => console.error('Tracking email error:', e));
  }

  return NextResponse.json({ success: true });
}
