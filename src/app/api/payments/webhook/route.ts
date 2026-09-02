import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { query, ensureInit } from '@/lib/db';
import { getPaymentStatus, verifyWebhookSignature } from '@/lib/mercadopago';
import { sendOrderConfirmation } from '@/lib/email';
import { applyMercadoPagoPayment, type VerifiedPayment } from '@/modules/payments/service';
import { parseOrder } from '@/modules/orders/mapper';

export async function POST(req: NextRequest) {
  let eventId: number | null = null;
  let confirmationOrderId: string | null = null;
  try {
    const rawBody = await req.text();
    if (rawBody.length > 128_000) {
      return NextResponse.json({ received: false }, { status: 413 });
    }

    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ received: false }, { status: 400 });
    }

    const requestId = req.headers.get('x-request-id');
    const signature = req.headers.get('x-signature');
    const dataId = String(new URL(req.url).searchParams.get('data.id') || body?.data?.id || '');
    if (!verifyWebhookSignature(dataId, signature, requestId)) {
      return NextResponse.json({ received: false, error: 'Firma inválida' }, { status: 401 });
    }

    await ensureInit();
    const eventKey = requestId || `${dataId}:${signature}`;
    const inserted = await query(
      `INSERT INTO payment_webhook_events
       (provider, event_key, external_id, event_type, payload_hash)
       VALUES ('mercadopago', $1, $2, $3, $4)
       ON CONFLICT (provider, event_key) DO UPDATE
         SET status = 'processing', error = NULL, processed_at = NULL
         WHERE payment_webhook_events.status = 'failed'
       RETURNING id`,
      [eventKey, dataId, body?.type || null, createHash('sha256').update(rawBody).digest('hex')]
    );
    if (!inserted.rows.length) {
      return NextResponse.json({ received: true, duplicate: true });
    }
    eventId = Number(inserted.rows[0].id);

    if (body?.type !== 'payment') {
      await query(
        `UPDATE payment_webhook_events SET status = 'ignored', error = 'unsupported_event', processed_at = NOW() WHERE id = $1`,
        [eventId]
      );
      return NextResponse.json({ received: true });
    }

    const payment = await getPaymentStatus(dataId) as VerifiedPayment;
    if (!payment?.external_reference) {
      await query(
        `UPDATE payment_webhook_events SET status = 'ignored', error = 'missing_external_reference', processed_at = NOW() WHERE id = $1`,
        [eventId]
      );
      return NextResponse.json({ received: true });
    }

    const result = await applyMercadoPagoPayment(payment, eventId);
    if (result.sendConfirmation && result.order) {
      confirmationOrderId = result.order.id;
      const order = await parseOrder(result.order);
      await sendOrderConfirmation(order);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    if (confirmationOrderId) {
      await query(
        'UPDATE orders SET confirmation_sent_at = NULL WHERE id = $1',
        [confirmationOrderId]
      ).catch(() => {});
    }
    if (eventId) {
      await query(
        `UPDATE payment_webhook_events SET status = 'failed', error = $2, processed_at = NOW() WHERE id = $1`,
        [eventId, String(error?.message || 'processing_failed').slice(0, 500)]
      ).catch(() => {});
    }
    return NextResponse.json({ received: false }, { status: 500 });
  }
}
