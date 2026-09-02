import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminSessionFromRequest, requireAdmin } from '@/lib/auth';
import { query } from '@/lib/db';

const mediaFields = z.object({
  url: z.string().trim().max(2048).refine(value => value.startsWith('/') || /^https:\/\//i.test(value), 'Usa una URL HTTPS o una ruta local'),
  title: z.string().trim().max(160).optional().default(''),
  alt_text: z.string().trim().max(300).optional().default(''),
  kind: z.enum(['image', 'video', 'audio', 'document']).default('image'),
  mime_type: z.string().trim().max(120).optional().nullable(),
  size_bytes: z.number().int().nonnegative().max(100 * 1024 * 1024).optional().nullable(),
  storage_provider: z.enum(['local', 'external']).default('external'),
  folder: z.string().trim().min(1).max(120).default('General'),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
  metadata: z.record(z.unknown()).default({}),
});

const updateMediaSchema = mediaFields.extend({ id: z.string().uuid() });

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  const searchParams = new URL(req.url).searchParams;
  const kind = searchParams.get('kind');
  const folder = searchParams.get('folder')?.trim();
  const search = searchParams.get('q')?.trim();
  const params: string[] = [];
  const filters: string[] = [];
  if (kind && ['image', 'video', 'audio', 'document'].includes(kind)) {
    params.push(kind);
    filters.push(`m.kind = $${params.length}`);
  }
  if (folder) {
    params.push(folder);
    filters.push(`m.folder = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    filters.push(`(m.title ILIKE $${params.length} OR m.alt_text ILIKE $${params.length} OR m.url ILIKE $${params.length} OR m.tags::text ILIKE $${params.length})`);
  }

  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const rows = await query(`SELECT m.id, m.kind, m.url, m.title, m.alt_text, m.mime_type, m.size_bytes,
      m.storage_provider, m.source, m.folder, m.tags, m.metadata, m.created_at,
      COUNT(mu.id)::int AS usage_count,
      COALESCE(jsonb_agg(jsonb_build_object('entity_type', mu.entity_type, 'entity_id', mu.entity_id, 'role', mu.role))
        FILTER (WHERE mu.id IS NOT NULL), '[]'::jsonb) AS usages
    FROM media_assets m
    LEFT JOIN media_usages mu ON mu.asset_id = m.id
    ${where}
    GROUP BY m.id
    ORDER BY m.created_at DESC
    LIMIT 200`, params);
  const folders = await query('SELECT folder, COUNT(*)::int AS count FROM media_assets GROUP BY folder ORDER BY folder');
  return NextResponse.json({ success: true, data: rows.rows, folders: folders.rows });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;
  const session = await getAdminSessionFromRequest(req);
  const parsed = mediaFields.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message);
  const asset = parsed.data;
  const result = await query(`INSERT INTO media_assets (id, kind, url, title, alt_text, mime_type, size_bytes, storage_provider, source, created_by, folder, tags, metadata)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'admin',$9,$10,$11,$12)
    ON CONFLICT (url) DO UPDATE SET title = EXCLUDED.title, alt_text = EXCLUDED.alt_text, kind = EXCLUDED.kind,
      folder = EXCLUDED.folder, tags = EXCLUDED.tags, metadata = EXCLUDED.metadata, updated_at = NOW()
    RETURNING id, kind, url, title, alt_text, mime_type, size_bytes, storage_provider, source, folder, tags, metadata, created_at`,
    [randomUUID(), asset.kind, asset.url, asset.title, asset.alt_text, asset.mime_type || null, asset.size_bytes || null,
      asset.storage_provider, session?.id || null, asset.folder, JSON.stringify(asset.tags), JSON.stringify(asset.metadata)]);
  return NextResponse.json({ success: true, data: result.rows[0] }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;
  const parsed = updateMediaSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message);
  const asset = parsed.data;
  const result = await query(`UPDATE media_assets SET url=$2, title=$3, alt_text=$4, kind=$5, mime_type=$6,
      size_bytes=$7, storage_provider=$8, folder=$9, tags=$10, metadata=$11, updated_at=NOW()
    WHERE id=$1 RETURNING id, kind, url, title, alt_text, mime_type, size_bytes, storage_provider, source, folder, tags, metadata, created_at`,
    [asset.id, asset.url, asset.title, asset.alt_text, asset.kind, asset.mime_type || null, asset.size_bytes || null,
      asset.storage_provider, asset.folder, JSON.stringify(asset.tags), JSON.stringify(asset.metadata)]);
  if (!result.rows[0]) return NextResponse.json({ success: false, error: 'Recurso no encontrado' }, { status: 404 });
  return NextResponse.json({ success: true, data: result.rows[0] });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;
  const id = z.string().uuid().safeParse(new URL(req.url).searchParams.get('id'));
  if (!id.success) return invalid('ID inválido');
  const usage = await query('SELECT COUNT(*)::int AS count FROM media_usages WHERE asset_id = $1', [id.data]);
  if ((usage.rows[0]?.count || 0) > 0) {
    return NextResponse.json({ success: false, error: 'El recurso está en uso. Desvincúlalo antes de eliminarlo.' }, { status: 409 });
  }
  await query('DELETE FROM media_assets WHERE id = $1', [id.data]);
  return NextResponse.json({ success: true });
}

function invalid(error = 'Datos inválidos') {
  return NextResponse.json({ success: false, error }, { status: 400 });
}
