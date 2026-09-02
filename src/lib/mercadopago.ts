import MercadoPago, { Payment, Preference } from 'mercadopago';
import type { Order } from '@/types';
import { createHmac, timingSafeEqual } from 'node:crypto';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://latiendadecomics.com';

function getClient() {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) throw new Error('MP_ACCESS_TOKEN is not configured');
  return new MercadoPago({ accessToken });
}

// ── CREATE PREFERENCE ─────────────────────────
export async function createPaymentPreference(order: Order, publicToken: string) {
  const preference = new Preference(getClient());

  // Charge the server-calculated total as one immutable line. This keeps the
  // provider amount aligned with coupons, preventa deposits and shipping.
  const items = [{
    id: order.id,
    title: `Pedido ${order.order_number} · La Tienda de Comics`,
    quantity: 1,
    unit_price: Number(order.total_usd.toFixed(2)),
    currency_id: 'USD',
    picture_url: `${SITE_URL}/images/placeholder.jpg`,
  }];

  const result = await preference.create({
    body: {
      items,
      payer: {
        name: order.customer.name,
        email: order.customer.email,
        phone: order.customer.phone ? { number: order.customer.phone } : undefined,
        address: {
          street_name: order.shipping_address.line1,
          zip_code: order.shipping_address.postal_code || '',
        },
      },
      external_reference: order.id,
      back_urls: {
        success: `${SITE_URL}/confirmacion/${order.id}?token=${encodeURIComponent(publicToken)}`,
        failure: `${SITE_URL}/checkout?status=failed`,
        pending: `${SITE_URL}/confirmacion/${order.id}?token=${encodeURIComponent(publicToken)}`,
      },
      auto_return: 'approved',
      notification_url: `${SITE_URL}/api/payments/webhook`,
      metadata: {
        order_id: order.id,
        order_number: order.order_number,
      },
    },
  });

  return result;
}

// ── VERIFY WEBHOOK ────────────────────────────
export function verifyWebhookSignature(
  dataId: string,
  signature: string | null,
  requestId: string | null
): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!dataId || !signature || !requestId || !secret) return false;

  const parts = Object.fromEntries(
    signature.split(',').map(part => part.trim().split('=', 2) as [string, string])
  );
  const timestamp = parts.ts;
  const received = parts.v1;
  if (!timestamp || !received || !/^[a-f0-9]{64}$/i.test(received)) return false;

  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${timestamp};`;
  const expected = createHmac('sha256', secret)
    .update(manifest)
    .digest('hex');
  return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(received, 'hex'));
}

// ── GET PAYMENT STATUS ────────────────────────
export async function getPaymentStatus(paymentId: string) {
  const payment = new Payment(getClient());
  return payment.get({ id: paymentId });
}
