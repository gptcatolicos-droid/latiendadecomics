import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { ensureInit, query } from '@/lib/db';

const searchSchema = z.string().trim().min(2).max(80);

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;
  const parsed = searchSchema.safeParse(new URL(req.url).searchParams.get('q') || '');
  if (!parsed.success) return NextResponse.json({ success: true, data: [] });

  await ensureInit();
  const pattern = `%${parsed.data}%`;
  const [products, orders] = await Promise.all([
    query(`SELECT id, title, status, stock FROM products WHERE title ILIKE $1 OR slug ILIKE $1 ORDER BY updated_at DESC LIMIT 6`, [pattern]),
    query(`SELECT id, order_number, status, total_cop FROM orders WHERE order_number ILIKE $1 OR customer_name ILIKE $1 OR customer_email ILIKE $1 ORDER BY created_at DESC LIMIT 6`, [pattern]),
  ]);

  const data = [
    ...products.rows.map(row => ({ id: row.id, type: 'product', title: row.title, subtitle: `${row.status === 'published' ? 'Publicado' : 'Borrador'} · ${row.stock} unidades`, href: `/admin/productos/${row.id}` })),
    ...orders.rows.map(row => ({ id: row.id, type: 'order', title: `Pedido #${row.order_number}`, subtitle: `${row.status} · $${Number(row.total_cop || 0).toLocaleString('es-CO')} COP`, href: `/admin/pedidos/${row.id}` })),
  ].slice(0, 10);

  return NextResponse.json({ success: true, data });
}
