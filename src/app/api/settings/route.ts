import { NextRequest, NextResponse } from 'next/server';
import { query, ensureInit } from '@/lib/db';
import { getAdminSessionFromRequest, requireAdmin } from '@/lib/auth';
import { z } from 'zod';

const PUBLIC_KEYS = new Set([
  'store_name', 'whatsapp_number', 'background_opacity',
  'shipping_colombia_usd', 'shipping_international_usd',
  'site_font', 'font_heading', 'font_body', 'font_cards', 'font_chat',
  'color_h1', 'color_h2', 'color_body', 'color_price', 'color_card_title',
  'color_btn_buy_bg', 'color_btn_buy_text', 'color_btn_view_bg', 'color_btn_view_text',
  'btn_radius', 'btn_style', 'card_radius', 'card_border', 'card_shadow', 'card_shadow_hover',
  'site_bg', 'site_bg_type', 'site_bg_value', 'site_bg_opacity', 'site_header_color', 'header_buttons',
]);

const updateSchema = z.record(
  z.string().regex(/^[a-z0-9_]{1,80}$/),
  z.union([z.string().max(20_000), z.number(), z.boolean()])
).refine((value) => Object.keys(value).length <= 100, 'Demasiadas configuraciones');

export async function GET(req: NextRequest) {
  await ensureInit();
  const { searchParams } = new URL(req.url);
  const keys = searchParams.get('keys')?.split(',').map(key => key.trim()).filter(Boolean) || [];
  const isAdmin = Boolean(await getAdminSessionFromRequest(req));
  
  if (!keys.length) {
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }
    const r = await query('SELECT key, value FROM settings');
    const obj: Record<string, string> = {};
    r.rows.forEach((row: any) => { obj[row.key] = row.value; });
    return NextResponse.json(obj);
  }

  if (!isAdmin && keys.some(key => !PUBLIC_KEYS.has(key))) {
    return NextResponse.json({ success: false, error: 'Configuración no pública' }, { status: 403 });
  }

  if (keys.length > 50) {
    return NextResponse.json({ success: false, error: 'Demasiadas claves' }, { status: 400 });
  }

  const obj: Record<string, string> = {};
  for (const key of keys) {
    const r = await query('SELECT value FROM settings WHERE key = $1', [key]);
    if (r.rows.length) obj[key] = r.rows[0].value;
  }
  return NextResponse.json(obj);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;
  await ensureInit();
  
  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Configuración inválida' }, { status: 400 });
  }
  for (const [key, value] of Object.entries(parsed.data)) {
    await query(
      'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
      [key, String(value)]
    );
  }
  return NextResponse.json({ success: true });
}
