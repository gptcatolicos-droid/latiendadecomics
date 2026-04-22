import { NextRequest, NextResponse } from 'next/server';
import { query, ensureInit } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;
  await ensureInit();
  const r = await query(`SELECT * FROM customer_leads ORDER BY created_at DESC LIMIT 200`);
  return NextResponse.json({ success: true, data: r.rows });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;
  await ensureInit();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, error: 'id requerido' }, { status: 400 });
  await query('DELETE FROM customer_leads WHERE id = $1', [id]);
  return NextResponse.json({ success: true });
}
