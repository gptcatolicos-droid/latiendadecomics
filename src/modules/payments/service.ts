import type { PoolClient } from 'pg';
import { withTransaction } from '@/lib/db';

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
    const updated = await client.query(
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
      await client.query(
        `UPDATE payment_webhook_events SET status = 'ignored', error = 'order_not_found', processed_at = NOW() WHERE id = $1`,
        [eventId]
      );
      return { order: null, sendConfirmation: false };
    }

    if (!paymentMatchesOrder(payment, order)) {
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

    await client.query(
      `UPDATE payment_webhook_events SET status = 'processed', processed_at = NOW() WHERE id = $1`,
      [eventId]
    );
    const updated = await client.query('SELECT * FROM orders WHERE id = $1', [order.id]);
    return { order: updated.rows[0], sendConfirmation };
  });
}
