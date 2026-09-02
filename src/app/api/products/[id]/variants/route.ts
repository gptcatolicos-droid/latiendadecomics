import { NextRequest, NextResponse } from 'next/server';
import { getExchangeRate, query } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const product = await query(`SELECT id FROM products WHERE id=$1 AND status='published'`, [params.id]);
  if (!product.rows[0]) return NextResponse.json({ success: false, error: 'Producto no encontrado' }, { status: 404 });
  const [variants, exchangeRate] = await Promise.all([
    query(`SELECT id,title,option_values,price_usd,price_cop,stock,sort_order
      FROM product_variants WHERE product_id=$1 AND status='active' ORDER BY sort_order,created_at`, [params.id]),
    getExchangeRate(),
  ]);
  return NextResponse.json({ success: true, data: variants.rows, exchange_rate: Number(exchangeRate.usd_to_cop) || 4100 });
}
