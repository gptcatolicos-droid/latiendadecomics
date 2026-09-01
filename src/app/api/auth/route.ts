import { NextRequest, NextResponse } from 'next/server';
import { query, ensureInit } from '@/lib/db';
import { createToken, verifyPassword, setAuthCookie, clearAuthCookie, hashPassword, verifyToken } from '@/lib/auth';
import { v4 as uuid } from 'uuid';
import { createHash } from 'node:crypto';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(200),
  action: z.literal('login').optional(),
}).strict();

function requestIpHash(req: NextRequest) {
  const ip = req.headers.get('cf-connecting-ip')
    || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown';
  return createHash('sha256').update(ip).digest('hex');
}

async function logAuthAttempt(email: string, ipHash: string, success: boolean, reason: string) {
  await query(
    'INSERT INTO admin_auth_events (email, ip_hash, success, reason) VALUES ($1,$2,$3,$4)',
    [email, ipHash, success, reason]
  );
}

async function ensureAdmin() {
  await ensureInit();
  const r = await query('SELECT id FROM admin_users LIMIT 1');
  if (r.rows.length === 0) {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password || password.length < 12) {
      throw new Error('ADMIN_NOT_CONFIGURED');
    }
    const hashed = await hashPassword(password);
    await query(
      'INSERT INTO admin_users (id, email, password, name) VALUES ($1,$2,$3,$4) ON CONFLICT (email) DO NOTHING',
      [uuid(), email, hashed, 'Admin']
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'logout') {
      const res = NextResponse.json({ success: true });
      clearAuthCookie(res);
      return res;
    }

    await ensureAdmin();

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Credenciales inválidas' }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();
    const password = parsed.data.password;
    const ipHash = requestIpHash(req);
    const recentFailures = await query(
      `SELECT COUNT(*)::int AS count FROM admin_auth_events
       WHERE created_at > NOW() - INTERVAL '15 minutes'
         AND success = false AND (ip_hash = $1 OR email = $2)`,
      [ipHash, email]
    );
    if (Number(recentFailures.rows[0]?.count || 0) >= 5) {
      await logAuthAttempt(email, ipHash, false, 'rate_limited');
      return NextResponse.json(
        { success: false, error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' },
        { status: 429, headers: { 'Retry-After': '900' } }
      );
    }

    const r = await query('SELECT * FROM admin_users WHERE email = $1', [email]);
    const admin = r.rows[0];

    if (!admin) {
      await logAuthAttempt(email, ipHash, false, 'invalid_credentials');
      return NextResponse.json({ success: false, error: 'Credenciales invalidas' }, { status: 401 });
    }

    const valid = await verifyPassword(password, admin.password);
    if (!valid) {
      await logAuthAttempt(email, ipHash, false, 'invalid_credentials');
      return NextResponse.json({ success: false, error: 'Credenciales invalidas' }, { status: 401 });
    }

    await logAuthAttempt(email, ipHash, true, 'login');
    const token = await createToken({ id: admin.id, email: admin.email });
    const res = NextResponse.json({ success: true, data: { name: admin.name, email: admin.email } });
    setAuthCookie(res, token);
    return res;
  } catch (err: any) {
    console.error('Auth POST error:', err?.message);
    if (err?.message === 'ADMIN_NOT_CONFIGURED') {
      return NextResponse.json({ success: false, error: 'Administrador no configurado' }, { status: 503 });
    }
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('ltc_admin_token')?.value;
    if (!token) return NextResponse.json({ success: false }, { status: 401 });
    const session = await verifyToken(token);
    if (!session) return NextResponse.json({ success: false }, { status: 401 });
    return NextResponse.json({ success: true, data: session });
  } catch {
    return NextResponse.json({ success: false }, { status: 401 });
  }
}
