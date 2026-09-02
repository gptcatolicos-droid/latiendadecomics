import { createHmac } from 'node:crypto';
import { afterEach, describe, expect, it } from 'vitest';
import { createOrderSchema, deriveShippingZone } from '@/modules/orders/schemas';
import { calculateDiscount, canReserveCoupon } from '@/modules/orders/pricing';
import { paymentMatchesOrder } from '@/modules/payments/service';
import { verifyWebhookSignature } from '@/lib/mercadopago';

const validOrder = {
  customer: { name: 'Bruce Wayne', email: 'bruce@example.com', country: 'CO' },
  shipping_address: {
    line1: 'Calle 123 # 45-67', city: 'Bogotá', country: 'Colombia', country_code: 'CO',
  },
  items: [{ product_id: 'comic-1', quantity: 1, is_preventa: false }],
  shipping_zone: 'international' as const,
};

describe('checkout validation', () => {
  it.each([0, -1, 1.5, 26])('rejects unsafe quantity %s', quantity => {
    const result = createOrderSchema.safeParse({
      ...validOrder,
      items: [{ product_id: 'comic-1', quantity }],
    });
    expect(result.success).toBe(false);
  });

  it('accepts a UUID variant reference but rejects arbitrary variant identifiers', () => {
    const valid = createOrderSchema.safeParse({
      ...validOrder,
      items: [{ product_id: 'comic-1', variant_id: '8f8f36a6-41ac-4d14-8e2f-38aab7fc426a', quantity: 1 }],
    });
    const invalid = createOrderSchema.safeParse({
      ...validOrder,
      items: [{ product_id: 'comic-1', variant_id: '../otro-producto', quantity: 1 }],
    });
    expect(valid.success).toBe(true);
    expect(invalid.success).toBe(false);
  });

  it('derives shipping from country and ignores the client zone', () => {
    const result = createOrderSchema.parse(validOrder);
    expect(result.shipping_zone).toBe('international');
    expect(deriveShippingZone(result.shipping_address.country_code)).toBe('colombia');
    expect(deriveShippingZone('US')).toBe('international');
  });

  it('bounds discounts at the subtotal', () => {
    expect(calculateDiscount(10, { type: 'fixed', value: 50 })).toBe(10);
    expect(calculateDiscount(10, { type: 'percentage', value: 25 })).toBe(2.5);
    expect(calculateDiscount(10, { type: 'percentage', value: 500 })).toBe(10);
    expect(calculateDiscount(10, { type: 'fixed', value: -5 })).toBe(0);
  });

  it('counts active reservations against a coupon limit', () => {
    expect(canReserveCoupon(3, 5, 1)).toBe(true);
    expect(canReserveCoupon(3, 5, 2)).toBe(false);
    expect(canReserveCoupon(999, null, 999)).toBe(true);
  });
});

describe('Mercado Pago verification', () => {
  const previousSecret = process.env.MP_WEBHOOK_SECRET;

  afterEach(() => {
    if (previousSecret === undefined) delete process.env.MP_WEBHOOK_SECRET;
    else process.env.MP_WEBHOOK_SECRET = previousSecret;
  });

  it('accepts only the official signed manifest', () => {
    process.env.MP_WEBHOOK_SECRET = 'webhook-test-secret';
    const dataId = '123456';
    const requestId = 'request-abc';
    const timestamp = '1720000000';
    const manifest = `id:${dataId};request-id:${requestId};ts:${timestamp};`;
    const digest = createHmac('sha256', process.env.MP_WEBHOOK_SECRET).update(manifest).digest('hex');
    const signature = `ts=${timestamp},v1=${digest}`;

    expect(verifyWebhookSignature(dataId, signature, requestId)).toBe(true);
    expect(verifyWebhookSignature(dataId, signature, 'different-request')).toBe(false);
    expect(verifyWebhookSignature(dataId, null, requestId)).toBe(false);
  });

  it('rejects amount, currency and order mismatches', () => {
    const order = { id: 'order-1', total_usd: '25.00' };
    const payment = {
      id: 'payment-1', external_reference: 'order-1', currency_id: 'USD', transaction_amount: 25,
    };
    expect(paymentMatchesOrder(payment, order)).toBe(true);
    expect(paymentMatchesOrder({ ...payment, transaction_amount: 24 }, order)).toBe(false);
    expect(paymentMatchesOrder({ ...payment, currency_id: 'COP' }, order)).toBe(false);
    expect(paymentMatchesOrder({ ...payment, external_reference: 'order-2' }, order)).toBe(false);
  });
});
