import { NextRequest, NextResponse } from 'next/server';
import { query, ensureInit } from '@/lib/db';
import { createToken, verifyPassword, setAuthCookie, clearAuthCookie, hashPassword } from '@/lib/auth';
import { v4 as uuid } from 'uuid';

export async function POST(req: NextRequest) {
  const { email, password, action } = await req.json();
  if (action === 'logout') {
    const res = NextResponse.json({ success: true });
    clearAuthCookie(res);
    return res;
  }
  if (!email || !password) return NextResponse.json({ success: false, error: 'Email y contraseña requeridos' }, { status: 400 });

  await ensureInit();
  let r = await query('SELECT * FROM admin_users WHERE email = $1', [email]);
  let admin = r.rows[0];

  if (!admin && email === process.env.ADMIN_EMAIL) {
    const id = uuid();
    const hashed = await hashPassword(process.env.ADMIN_PASSWORD || 'change-me');
    await query('INSERT INTO admin_users (id, email, password, name) VALUES ($1,$2,$3,$4)', [id, email, hashed, 'Admin']);
    r = await query('SELECT * FROM admin_users WHERE id = $1', [id]);
    admin = r.rows[0];
  }

  if (!admin) return NextResponse.json({ success: false, error: 'Credenciales inválidas' }, { status: 401 });
  const valid = await verifyPassword(password, admin.password);
  if (!valid) return NextResponse.json({ success: false, error: 'Credenciales inválidas' }, { status: 401 });

  const token = await createToken({ id: admin.id, email: admin.email });
  const res = NextResponse.json({ success: true, data: { name: admin.name, email: admin.email } });
  setAuthCookie(res, token);
  return res;
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get('ltc_admin_token')?.value;
  if (!token) return NextResponse.json({ success: false }, { status: 401 });
  const { verifyToken } = await import('@/lib/auth');
  const session = await verifyToken(token);
  if (!session) return NextResponse.json({ success: false }, { status: 401 });
  return NextResponse.json({ success: true, data: session });
}
