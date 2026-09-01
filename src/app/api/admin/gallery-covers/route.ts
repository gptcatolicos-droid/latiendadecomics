import { NextRequest, NextResponse } from 'next/server';
import { query, ensureInit } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { z } from 'zod';

const patchSchema = z.object({
  id: z.coerce.number().int().positive(),
  sort_order: z.coerce.number().int().min(0).max(100_000).optional(),
  hidden: z.boolean().optional(),
}).refine(value => value.sort_order !== undefined || value.hidden !== undefined);

const batchSchema = z.object({
  updates: z.array(z.object({
    id: z.coerce.number().int().positive(),
    sort_order: z.coerce.number().int().min(0).max(100_000),
  })).min(1).max(500),
});

// Add sort_order to cb_covers if not exists
async function ensureCoverSortOrder() {
  await query(`ALTER TABLE cb_covers ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0`).catch(() => {});
  await query(`ALTER TABLE cb_covers ADD COLUMN IF NOT EXISTS hidden BOOLEAN DEFAULT false`).catch(() => {});
}

// GET — all covers for a gallery (for admin manager)
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;
  await ensureInit();
  await ensureCoverSortOrder();
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });

  const r = await query(
    `SELECT id, gallery_slug, issue_number, image_url, alt_text, sort_order, hidden
     FROM cb_covers WHERE gallery_slug = $1 AND hidden = false
     ORDER BY COALESCE(sort_order, issue_number) ASC`,
    [slug]
  );
  return NextResponse.json({ covers: r.rows });
}

// PATCH — reorder or hide a cover
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;
  await ensureInit();
  await ensureCoverSortOrder();
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid update' }, { status: 400 });
  const { id, sort_order, hidden } = parsed.data;

  const fields: string[] = [];
  const vals: any[] = [];
  let i = 1;
  if (sort_order !== undefined) { fields.push(`sort_order = $${i++}`); vals.push(sort_order); }
  if (hidden !== undefined) { fields.push(`hidden = $${i++}`); vals.push(hidden); }
  if (!fields.length) return NextResponse.json({ error: 'nothing to update' }, { status: 400 });

  vals.push(id);
  await query(`UPDATE cb_covers SET ${fields.join(', ')} WHERE id = $${i}`, vals);
  return NextResponse.json({ success: true });
}

// POST — batch reorder (array of {id, sort_order})
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;
  await ensureInit();
  await ensureCoverSortOrder();
  const parsed = batchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'updates array required' }, { status: 400 });
  await Promise.all(parsed.data.updates.map(u =>
    query('UPDATE cb_covers SET sort_order = $1 WHERE id = $2', [u.sort_order, u.id])
  ));
  return NextResponse.json({ success: true, updated: parsed.data.updates.length });
}
