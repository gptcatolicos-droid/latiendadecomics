import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { query, ensureInit } from '@/lib/db';

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;
  await ensureInit();
  try {
    await query('DELETE FROM order_items');
    await query('DELETE FROM orders');
    await query('DELETE FROM product_images');
    await query('DELETE FROM products');
    await query('DELETE FROM coupons');
    await query('UPDATE exchange_rates SET usd_to_cop=4100, usd_to_mxn=17.5, usd_to_ars=900, updated_at=NOW()');
    return NextResponse.json({ success: true, message: 'BD limpiada. Admin, settings y TRM preservados.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
