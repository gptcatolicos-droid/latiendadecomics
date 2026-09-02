import { createHash, randomBytes } from 'node:crypto';
import type { PoolClient } from 'pg';
import { v4 as uuid } from 'uuid';
import { withTransaction } from '@/lib/db';
import type { OrderItem, ShippingZone } from '@/types';
import type { CreateOrderInput } from './schemas';
import { deriveShippingZone } from './schemas';
import { calculateDiscount, canReserveCoupon, roundMoney } from './pricing';

const RESERVATION_MINUTES = 30;

export class OrderInputError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export function hashPublicToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

async function getNumericSetting(client: PoolClient, key: string, fallback: number) {
  const result = await client.query('SELECT value FROM settings WHERE key = $1', [key]);
  const value = Number(result.rows[0]?.value);
  return Number.isFinite(value) ? value : fallback;
}

function mergeItems(items: CreateOrderInput['items']) {
  const merged = new Map<string, { product_id: string; variant_id?: string; quantity: number; is_preventa: boolean }>();
  for (const item of items) {
    const key = `${item.product_id}:${item.variant_id || ''}`;
    const existing = merged.get(key);
    const quantity = (existing?.quantity || 0) + item.quantity;
    if (quantity > 25) throw new OrderInputError('Máximo 25 unidades por variante');
    merged.set(key, {
      product_id: item.product_id,
      variant_id: item.variant_id || undefined,
      quantity,
      is_preventa: Boolean(existing?.is_preventa || item.is_preventa),
    });
  }
  return [...merged.values()].sort((a, b) => `${a.product_id}:${a.variant_id || ''}`.localeCompare(`${b.product_id}:${b.variant_id || ''}`));
}

export interface CreatedOrder {
  orderId: string;
  orderNumber: string;
  publicToken: string;
  subtotalUsd: number;
  shippingUsd: number;
  discountUsd: number;
  totalUsd: number;
  totalCop: number;
  zone: ShippingZone;
  items: OrderItem[];
}

export async function createReservedOrder(input: CreateOrderInput): Promise<CreatedOrder> {
  const mergedItems = mergeItems(input.items);
  const publicToken = randomBytes(32).toString('base64url');
  const publicTokenHash = hashPublicToken(publicToken);
  const orderId = uuid();

  return withTransaction(async client => {
    await client.query(
      `UPDATE inventory_reservations SET status = 'expired', updated_at = NOW()
       WHERE status = 'active' AND expires_at <= NOW()`
    );
    await client.query(
      `UPDATE coupon_reservations SET status = 'expired', updated_at = NOW()
       WHERE status = 'active' AND expires_at <= NOW()`
    );

    const enrichedItems: OrderItem[] = [];
    let subtotalUsd = 0;
    const exchangeRate = await getNumericSetting(client, 'usd_to_cop', 0)
      || Number((await client.query('SELECT usd_to_cop FROM exchange_rates ORDER BY id DESC LIMIT 1')).rows[0]?.usd_to_cop)
      || 4100;

    for (const item of mergedItems) {
      const productResult = await client.query(
        'SELECT p.* FROM products p WHERE p.id = $1 FOR UPDATE',
        [item.product_id]
      );
      const product = productResult.rows[0];
      if (!product || product.status !== 'published') {
        throw new OrderInputError(`Producto no disponible: ${item.product_id}`);
      }

      let variant: any = null;
      if (item.variant_id) {
        const variantResult = await client.query(
          `SELECT * FROM product_variants WHERE id=$1 AND product_id=$2 FOR UPDATE`,
          [item.variant_id, item.product_id]
        );
        variant = variantResult.rows[0];
        if (!variant || variant.status !== 'active') {
          throw new OrderInputError(`Variante no disponible: ${item.variant_id}`);
        }
      }

      const stock = Number(variant ? variant.stock : product.stock);
      if (stock !== -1) {
        const reservedResult = await client.query(
          `SELECT COALESCE(SUM(quantity), 0)::int AS quantity
           FROM inventory_reservations
           WHERE ${variant ? 'variant_id = $1' : 'product_id = $1 AND variant_id IS NULL'} AND status = 'active' AND expires_at > NOW()`,
          [variant ? variant.id : item.product_id]
        );
        const available = stock - Number(reservedResult.rows[0].quantity);
        if (available < item.quantity) {
          throw new OrderInputError(`Stock insuficiente: ${product.title}${variant ? ` — ${variant.title}` : ''}`);
        }
      }

      const priceUsd = variant?.price_usd != null
        ? Number(variant.price_usd)
        : variant?.price_cop != null
          ? roundMoney(Number(variant.price_cop) / exchangeRate)
          : Number(product.price_usd);
      const isPreventa = Boolean(item.is_preventa && product.preventa_enabled);
      const preventaAmount = isPreventa
        ? roundMoney(priceUsd * (Number(product.preventa_percent) / 100))
        : undefined;
      const chargedUnitPrice = preventaAmount ?? priceUsd;
      const imageResult = await client.query(
        `SELECT url FROM product_images WHERE product_id = $1
         ORDER BY is_primary DESC, sort_order ASC LIMIT 1`,
        [item.product_id]
      );

      enrichedItems.push({
        id: uuid(),
        product_id: item.product_id,
        variant_id: variant?.id,
        variant_title: variant?.title,
        product_title: variant ? `${product.title} — ${variant.title}` : product.title,
        product_image: imageResult.rows[0]?.url || undefined,
        quantity: item.quantity,
        price_usd: priceUsd,
        supplier_url: product.supplier_url || undefined,
        is_preventa: isPreventa,
        preventa_amount_paid: preventaAmount,
        preventa_remaining: preventaAmount === undefined ? undefined : roundMoney(priceUsd - preventaAmount),
      });
      subtotalUsd = roundMoney(subtotalUsd + chargedUnitPrice * item.quantity);
    }

    let coupon: any = null;
    if (input.coupon_code) {
      const couponResult = await client.query(
        `SELECT * FROM coupons
         WHERE code = $1 AND active = true AND (expires_at IS NULL OR expires_at > NOW())
         FOR UPDATE`,
        [input.coupon_code]
      );
      coupon = couponResult.rows[0];
      if (!coupon) throw new OrderInputError('Cupón no válido o expirado');
      if (coupon.min_order_usd && subtotalUsd < Number(coupon.min_order_usd)) {
        throw new OrderInputError(`El cupón requiere un subtotal mínimo de $${Number(coupon.min_order_usd).toFixed(2)} USD`);
      }
      if (coupon.max_uses !== null) {
        const reservedCoupons = await client.query(
          `SELECT COUNT(*)::int AS count FROM coupon_reservations
           WHERE coupon_id = $1 AND status = 'active' AND expires_at > NOW()`,
          [coupon.id]
        );
        if (!canReserveCoupon(Number(coupon.uses_count), Number(coupon.max_uses), Number(reservedCoupons.rows[0].count))) {
          throw new OrderInputError('Este cupón alcanzó su límite de usos');
        }
      }
    }

    const zone: ShippingZone = deriveShippingZone(input.shipping_address.country_code);
    const shippingUsd = coupon?.type === 'free_shipping'
      ? 0
      : await getNumericSetting(client, zone === 'colombia' ? 'shipping_colombia_usd' : 'shipping_international_usd', zone === 'colombia' ? 5 : 30);
    const discountUsd = calculateDiscount(subtotalUsd, coupon && { type: coupon.type, value: Number(coupon.value) });
    const totalUsd = roundMoney(Math.max(0, subtotalUsd + shippingUsd - discountUsd));
    const totalCop = Math.round(totalUsd * exchangeRate);

    const year = new Date().getUTCFullYear();
    const sequence = await client.query(
      `INSERT INTO order_number_sequences (year, next_value)
       VALUES (
         $1,
         COALESCE((
           SELECT MAX((SUBSTRING(order_number FROM '[0-9]+$'))::bigint) + 2
           FROM orders WHERE order_number LIKE $2
         ), 2)
       )
       ON CONFLICT (year) DO UPDATE SET next_value = order_number_sequences.next_value + 1
       RETURNING next_value - 1 AS value`,
      [year, `LTC-${year}-%`]
    );
    const orderNumber = `LTC-${year}-${String(sequence.rows[0].value).padStart(6, '0')}`;

    await client.query(
      `INSERT INTO orders (
        id, order_number, status, payment_status, inventory_status, public_token_hash, reservation_expires_at,
        customer_name, customer_email, customer_phone, customer_country,
        shipping_line1, shipping_line2, shipping_city, shipping_state, shipping_postal,
        shipping_country, shipping_country_code, shipping_zone,
        subtotal_usd, shipping_usd, discount_usd, total_usd, total_cop, coupon_code
      ) VALUES (
        $1,$2,'pending','pending','reserved',$3,NOW() + INTERVAL '30 minutes',
        $4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22
      )`,
      [
        orderId, orderNumber, publicTokenHash,
        input.customer.name, input.customer.email, input.customer.phone || null, input.customer.country || input.shipping_address.country_code,
        input.shipping_address.line1, input.shipping_address.line2 || null, input.shipping_address.city,
        input.shipping_address.state || null, input.shipping_address.postal_code || null,
        input.shipping_address.country, input.shipping_address.country_code, zone,
        subtotalUsd, shippingUsd, discountUsd, totalUsd, totalCop, input.coupon_code || null,
      ]
    );

    for (const item of enrichedItems) {
      await client.query(
        `INSERT INTO order_items (
          id, order_id, product_id, variant_id, variant_title, product_title, product_image, quantity, price_usd,
          supplier_url, is_preventa, preventa_amount_paid, preventa_remaining
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          item.id, orderId, item.product_id, item.variant_id || null, item.variant_title || null, item.product_title, item.product_image || null,
          item.quantity, item.price_usd, item.supplier_url || null, item.is_preventa,
          item.preventa_amount_paid ?? null, item.preventa_remaining ?? null,
        ]
      );
      await client.query(
        `INSERT INTO inventory_reservations (id, order_id, product_id, variant_id, quantity, expires_at)
         VALUES ($1,$2,$3,$4,$5,NOW() + INTERVAL '30 minutes')`,
        [uuid(), orderId, item.product_id, item.variant_id || null, item.quantity]
      );
    }

    if (coupon) {
      await client.query(
        `INSERT INTO coupon_reservations (id, order_id, coupon_id, expires_at)
         VALUES ($1,$2,$3,NOW() + INTERVAL '30 minutes')`,
        [uuid(), orderId, coupon.id]
      );
    }

    return {
      orderId, orderNumber, publicToken, subtotalUsd, shippingUsd,
      discountUsd, totalUsd, totalCop, zone, items: enrichedItems,
    };
  });
}

export async function releaseReservedOrder(orderId: string, paymentStatus = 'failed') {
  await withTransaction(async client => {
    await client.query(
      `UPDATE inventory_reservations SET status = 'released', updated_at = NOW()
       WHERE order_id = $1 AND status = 'active'`,
      [orderId]
    );
    await client.query(
      `UPDATE coupon_reservations SET status = 'released', updated_at = NOW()
       WHERE order_id = $1 AND status = 'active'`,
      [orderId]
    );
    await client.query(
      `UPDATE orders SET status = 'cancelled', payment_status = $2,
       inventory_status = 'released', updated_at = NOW() WHERE id = $1`,
      [orderId, paymentStatus]
    );
  });
}

export { RESERVATION_MINUTES };
