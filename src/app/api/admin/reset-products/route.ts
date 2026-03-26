import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;
  await query('DELETE FROM product_images');
  await query('DELETE FROM products');
  return NextResponse.json({ success: true, message: 'Todos los productos eliminados' });
}
