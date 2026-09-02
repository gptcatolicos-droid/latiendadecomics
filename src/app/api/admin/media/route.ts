import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminSessionFromRequest, requireAdmin } from '@/lib/auth';
import { query } from '@/lib/db';

const createMediaSchema = z.object({
  url: z.string().trim().max(2048).refine(value => value.startsWith('/') || /^https:\/\//i.test(value), 'Usa una URL HTTPS o una ruta local'),
  title: z.string().trim().max(160).optional().default(''),
  alt_text: z.string().trim().max(300).optional().default(''),
  kind: z.enum(['image', 'video', 'audio', 'document']).default('image'),
  mime_type: z.string().trim().max(120).optional().nullable(),
  size_bytes: z.number().int().nonnegative().max(100 * 1024 * 1024).optional().nullable(),
  storage_provider: z.enum(['local', 'external']).default('external'),
});

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;
  const kind = new URL(req.url).searchParams.get('kind');
  const params: string[] = [];
  const where = kind && ['image', 'video', 'audio', 'document'].includes(kind) ? 'WHERE kind = $1' : '';
  if (where) params.push(kind!);
  const rows = await query(`SELECT id, kind, url, title, alt_text, mime_type, size_bytes, storage_provider, source, created_at FROM media_assets ${where} ORDER BY created_at DESC LIMIT 200`, params);
  return NextResponse.json({ success: true, data: rows.rows });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;
  const session = await getAdminSessionFromRequest(req);
  const parsed = createMediaSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || 'Datos inválidos' }, { status: 400 });
  const asset = parsed.data;
  const result = await query(`INSERT INTO media_assets (id, kind, url, title, alt_text, mime_type, size_bytes, storage_provider, source, created_by)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'admin',$9)
    ON CONFLICT (url) DO UPDATE SET title = EXCLUDED.title, alt_text = EXCLUDED.alt_text, kind = EXCLUDED.kind, updated_at = NOW()
    RETURNING id, kind, url, title, alt_text, mime_type, size_bytes, storage_provider, source, created_at`,
    [randomUUID(), asset.kind, asset.url, asset.title, asset.alt_text, asset.mime_type || null, asset.size_bytes || null, asset.storage_provider, session?.id || null]);
  return NextResponse.json({ success: true, data: result.rows[0] }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;
  const id = z.string().uuid().safeParse(new URL(req.url).searchParams.get('id'));
  if (!id.success) return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
  await query('DELETE FROM media_assets WHERE id = $1', [id.data]);
  return NextResponse.json({ success: true });
}
