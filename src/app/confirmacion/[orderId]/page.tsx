export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Link from 'next/link';
import { query, ensureInit } from '@/lib/db';
import { hashPublicToken } from '@/modules/orders/service';

export const metadata: Metadata = {
  title: 'Estado del pedido | La Tienda de Comics',
  robots: { index: false, follow: false, noarchive: true },
  referrer: 'no-referrer',
};

async function getOrder(orderId: string, token?: string) {
  if (!token || token.length < 32 || token.length > 200) return null;
  try {
    await ensureInit();
    const result = await query(
      `SELECT id, order_number, status, payment_status, shipping_zone,
       shipping_usd, discount_usd, total_usd
       FROM orders WHERE id = $1 AND public_token_hash = $2`,
      [orderId, hashPublicToken(token)]
    );
    if (!result.rows[0]) return null;
    const items = await query(
      `SELECT product_title, quantity, price_usd, is_preventa, preventa_amount_paid
       FROM order_items WHERE order_id = $1 ORDER BY id`,
      [orderId]
    );
    return { ...result.rows[0], items: items.rows };
  } catch {
    return null;
  }
}

export default async function ConfirmacionPage({ params, searchParams }: {
  params: { orderId: string };
  searchParams: { token?: string };
}) {
  const order = await getOrder(params.orderId, searchParams.token);

  if (!order) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Enlace de pedido inválido</h1>
          <p style={{ color: '#999', marginBottom: 24 }}>Por privacidad, abre el enlace recibido al finalizar el pago.</p>
          <Link href="/" style={{ background: '#CC0000', color: 'white', padding: '12px 24px', borderRadius: 12, textDecoration: 'none', fontWeight: 700 }}>
            Volver al inicio
          </Link>
        </div>
      </main>
    );
  }

  const approved = order.payment_status === 'approved';
  const failed = ['rejected', 'cancelled', 'failed'].includes(order.payment_status);
  const needsReview = order.payment_status === 'needs_review';
  const title = approved ? '¡PAGO CONFIRMADO!' : failed ? 'PAGO NO COMPLETADO' : needsReview ? 'PAGO EN REVISIÓN' : 'PAGO EN PROCESO';
  const icon = approved ? '✅' : failed ? '❌' : needsReview ? '🔎' : '⏳';
  const message = approved
    ? 'Tu pago fue verificado. Enviamos los detalles a tu correo.'
    : failed
      ? 'El pago no fue aprobado. Puedes regresar al checkout e intentarlo de nuevo.'
      : needsReview
        ? 'Recibimos el pago, pero necesitamos verificarlo antes de preparar el pedido.'
        : 'Mercado Pago aún está procesando la transacción. Esta página mostrará la confirmación cuando el webhook sea verificado.';

  return (
    <main style={{ minHeight: '100vh', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>{icon}</div>
        <h1 style={{ fontFamily: 'Oswald, sans-serif', fontSize: 32, fontWeight: 700, letterSpacing: '.02em', marginBottom: 8 }}>{title}</h1>
        <p style={{ fontSize: 14, color: '#777', marginBottom: 28, lineHeight: 1.6 }}>{message}</p>

        <div style={{ background: '#F7F7F7', border: '1px solid #E8E8E8', borderRadius: 16, padding: 20, textAlign: 'left', marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>Número de pedido</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>{order.order_number}</div>

          {order.items.map((item: any, index: number) => {
            const unitPrice = item.is_preventa && item.preventa_amount_paid
              ? Number(item.preventa_amount_paid)
              : Number(item.price_usd);
            return (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #E8E8E8', fontSize: 13 }}>
                <span style={{ color: '#555' }}>{item.product_title} × {item.quantity}</span>
                <span>${(unitPrice * item.quantity).toFixed(2)}</span>
              </div>
            );
          })}

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 13, color: '#999' }}>
            <span>Envío</span><span>${Number(order.shipping_usd).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, fontWeight: 700, paddingTop: 12, borderTop: '1.5px solid #E8E8E8', marginTop: 8 }}>
            <span>Total</span>
            <span style={{ color: '#CC0000' }}>${Number(order.total_usd).toFixed(2)} USD</span>
          </div>
        </div>

        <Link href={failed ? '/checkout' : '/'} style={{
          display: 'block', width: '100%', padding: 14,
          background: failed ? '#CC0000' : '#0D0D0D', color: 'white', textDecoration: 'none',
          fontSize: 14, fontWeight: 700, borderRadius: 12, textAlign: 'center',
        }}>
          {failed ? 'Intentar de nuevo →' : 'Seguir buscando →'}
        </Link>
      </div>
    </main>
  );
}
