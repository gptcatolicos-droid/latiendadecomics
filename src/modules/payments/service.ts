import type { PoolClient } from 'pg';
import { randomUUID } from 'node:crypto';
import { withTransaction } from '@/lib/db';
import type { PaymentProviderStatus } from './provider';

export interface VerifiedPayment {
  id: string | number;
  status?: string | null;
  external_reference?: string | null;
  currency_id?: string | null;
  transaction_amount?: number | null;
  payment_type_id?: string | null;
  metadata?: Record<string, unknown> | null;
}

export function paymentMatchesOrder(payment: VerifiedPayment, order: { id: string; total_usd: unknown }) {
  const amount = Number(payment.transaction_amount);
  const expected = Number(order.total_usd);
  return payment.external_reference === order.id
    && payment.currency_id === 'USD'
    && Number.isFinite(amount)
    && Number.isFinite(expected)
    && Math.abs(amount - expected) <= 0.01;
}

function normalizePaymentStatus(status?: string | null): PaymentProviderStatus {
  if (status === 'approved') return 'approved';
  if (status === 'rejected') return 'rejected';
  if (status === 'cancelled') return 'cancelled';
  if (status === 'refunded' || status === 'charged_back') return 'refunded';
  if (status === 'pending' || status === 'in_process' || status === 'authorized') return 'pending';
  return 'failed';
}

async function recordTransaction(client: PoolClient, payment: VerifiedPayment, orderId: string | null, status: PaymentProviderStatus) {
  const amount = Math.max(0, Number(payment.transaction_amount) || 0);
  const currency = (payment.currency_id || 'USD').toUpperCase().slice(0, 3);
  const amountMinor = currency === 'COP' ? Math.round(amount) : Math.round(amount * 100);
  await client.query(`INSERT INTO payment_transactions
    (id,order_id,provider,external_id,status,provider_status,amount_minor,currency,payment_method,occurred_at)
    VALUES($1,$2,'mercadopago',$3,$4,$5,$6,$7,$8,NOW())
    ON CONFLICT(provider,external_id) DO UPDATE SET order_id=COALESCE(EXCLUDED.order_id,payment_transactions.order_id),status=EXCLUDED.status,provider_status=EXCLUDED.provider_status,amount_minor=EXCLUDED.amount_minor,currency=EXCLUDED.currency,payment_method=EXCLUDED.payment_method,updated_at=NOW()`,
    [randomUUID(), orderId, String(payment.id), status, payment.status || null, amountMinor, currency, payment.payment_type_id || null]);
}

async function releaseReservations(client: PoolClient, orderId: string) {
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
}

async function commitReservations(client: PoolClient, orderId: string) {
  const reservations = await client.query(
    `SELECT * FROM inventory_reservations
     WHERE order_id = $1 AND status = 'active'
     ORDER BY product_id FOR UPDATE`,
    [orderId]
  );
  if (!reservations.rows.length || reservations.rows.some(row => new Date(row.expires_at).getTime() <= Date.now())) {
    return false;
  }

  for (const reservation of reservations.rows) {
    const updated = reservation.variant_id
      ? await client.query(
        `UPDATE product_variants
         SET stock = CASE WHEN stock = -1 THEN -1 ELSE stock - $1 END, updated_at = NOW()
         WHERE id = $2 AND product_id = $3 AND (stock = -1 OR stock >= $1)
         RETURNING id`,
        [reservation.quantity, reservation.variant_id, reservation.product_id]
      )
      : await client.query(
        `UPDATE products
         SET stock = CASE WHEN stock = -1 THEN -1 ELSE stock - $1 END, updated_at = NOW()
         WHERE id = $2 AND (stock = -1 OR stock >= $1)
         RETURNING id`,
        [reservation.quantity, reservation.product_id]
      );
    if (!updated.rowCount) throw new Error(`STOCK_COMMIT_FAILED:${reservation.product_id}`);
  }

  await client.query(
    `UPDATE inventory_reservations SET status = 'committed', updated_at = NOW()
     WHERE order_id = $1 AND status = 'active'`,
    [orderId]
  );

  const couponReservation = await client.query(
    `SELECT cr.id, cr.coupon_id, c.max_uses, c.uses_count
     FROM coupon_reservations cr JOIN coupons c ON c.id = cr.coupon_id
     WHERE cr.order_id = $1 AND cr.status = 'active' FOR UPDATE OF cr, c`,
    [orderId]
  );
  if (couponReservation.rows[0]) {
    const row = couponReservation.rows[0];
    if (row.max_uses !== null && Number(row.uses_count) >= Number(row.max_uses)) {
      throw new Error('COUPON_COMMIT_FAILED');
    }
    await client.query('UPDATE coupons SET uses_count = uses_count + 1 WHERE id = $1', [row.coupon_id]);
    await client.query(
      `UPDATE coupon_reservations SET status = 'consumed', updated_at = NOW() WHERE id = $1`,
      [row.id]
    );
  }
  return true;
}

export async function applyMercadoPagoPayment(payment: VerifiedPayment, eventId: number) {
  return withTransaction(async client => {
    const orderResult = await client.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [payment.external_reference]);
    const order = orderResult.rows[0];
    if (!order) {
      await recordTransaction(client, payment, null, normalizePaymentStatus(payment.status));
      await client.query(
        `UPDATE payment_webhook_events SET status = 'ignored', error = 'order_not_found', processed_at = NOW() WHERE id = $1`,
        [eventId]
      );
      return { order: null, sendConfirmation: false };
    }

    if (!paymentMatchesOrder(payment, order)) {
      await recordTransaction(client, payment, order.id, 'needs_review');
      await client.query(
        `UPDATE orders SET payment_status = 'needs_review', updated_at = NOW() WHERE id = $1`,
        [order.id]
      );
      await client.query(
        `UPDATE payment_webhook_events SET status = 'ignored', error = 'payment_mismatch', processed_at = NOW() WHERE id = $1`,
        [eventId]
      );
      return { order, sendConfirmation: false };
    }

    const paymentId = String(payment.id);
    const method = payment.payment_type_id || 'mercadopago';
    let sendConfirmation = false;

    if (payment.status === 'approved') {
      if (order.payment_status !== 'approved') {
        const committed = await commitReservations(client, order.id);
        if (!committed) {
          await client.query(
            `UPDATE orders SET payment_status = 'needs_review', inventory_status = 'expired',
             payment_id = $2, payment_method = $3, updated_at = NOW() WHERE id = $1`,
            [order.id, paymentId, method]
          );
        } else {
          sendConfirmation = !order.confirmation_sent_at;
          await client.query(
            `UPDATE orders SET status = 'processing', payment_status = 'approved', inventory_status = 'committed',
             payment_id = $2, payment_method = $3,
             confirmation_sent_at = COALESCE(confirmation_sent_at, NOW()), updated_at = NOW()
             WHERE id = $1`,
            [order.id, paymentId, method]
          );
        }
      } else {
        const claimed = await client.query(
          `UPDATE orders SET confirmation_sent_at = NOW(), updated_at = NOW()
           WHERE id = $1 AND confirmation_sent_at IS NULL RETURNING id`,
          [order.id]
        );
        sendConfirmation = Boolean(claimed.rowCount);
      }
    } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
      if (order.payment_status !== 'approved') {
        await releaseReservations(client, order.id);
        await client.query(
          `UPDATE orders SET status = 'cancelled', payment_status = $2, inventory_status = 'released',
           payment_id = $3, payment_method = $4, updated_at = NOW() WHERE id = $1`,
          [order.id, payment.status, paymentId, method]
        );
      }
    } else if (payment.status === 'pending' || payment.status === 'in_process') {
      if (order.payment_status !== 'approved') {
        await client.query(
          `UPDATE orders SET payment_status = 'pending', payment_id = $2,
           payment_method = $3, updated_at = NOW() WHERE id = $1`,
          [order.id, paymentId, method]
        );
      }
    }

    const statusResult = await client.query('SELECT payment_status FROM orders WHERE id=$1', [order.id]);
    const persistedStatus = statusResult.rows[0]?.payment_status;
    const transactionStatus: PaymentProviderStatus = ['pending','approved','rejected','cancelled','refunded','failed','needs_review'].includes(persistedStatus)
      ? persistedStatus
      : normalizePaymentStatus(payment.status);
    await recordTransaction(client, payment, order.id, transactionStatus);

    await client.query(
      `UPDATE payment_webhook_events SET status = 'processed', processed_at = NOW() WHERE id = $1`,
      [eventId]
    );
    const updated = await client.query('SELECT * FROM orders WHERE id = $1', [order.id]);
    return { order: updated.rows[0], sendConfirmation };
  });
}
