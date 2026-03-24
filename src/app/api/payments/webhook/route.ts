import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getPaymentStatus } from '@/lib/mercadopago';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = getDb();

    // MercadoPago sends different notification types
    if (body.type === 'payment' || body.action === 'payment.updated') {
      const paymentId = body.data?.id || body.id;
      if (!paymentId) return NextResponse.json({ received: true });

      const payment = await getPaymentStatus(String(paymentId));
      const orderId = payment.external_reference;
      if (!orderId) return NextResponse.json({ received: true });

      const statusMap: Record<string, string> = {
        approved: 'processing',
        pending: 'pending',
        in_process: 'pending',
        rejected: 'cancelled',
        cancelled: 'cancelled',
        refunded: 'refunded',
      };

      const newStatus = statusMap[payment.status || ''] || 'pending';

      db.prepare(`
        UPDATE orders 
        SET status = ?, payment_id = ?, payment_method = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(newStatus, String(paymentId), payment.payment_method_id || null, orderId);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ received: true }); // Always 200 to MP
  }
}
