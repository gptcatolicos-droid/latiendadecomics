import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { query, ensureInit } from '@/lib/db';

// GET — list all galleries for admin (including inactive)
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;
  await ensureInit();

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const perPage = 50;
  const offset = (page - 1) * perPage;

  const where = search
    ? `WHERE title ILIKE $3 OR slug ILIKE $3`
    : '';
  const params = search
    ? [perPage, offset, `%${search}%`]
    : [perPage, offset];

  const r = await query(
    `SELECT id, slug, title, description, seo_description, total_issues, first_image_url,
            active, sort_order, source_type, custom_covers, scraped_at, created_at
     FROM cb_galleries
     ${where}
     ORDER BY sort_order ASC, total_issues DESC
     LIMIT $1 OFFSET $2`,
    params
  );

  const total = await query(
    `SELECT COUNT(*) as n FROM cb_galleries ${where ? `WHERE title ILIKE $1 OR slug ILIKE $1` : ''}`,
    search ? [`%${search}%`] : []
  );

  return NextResponse.json({
    galleries: r.rows,
    total: parseInt(total.rows[0]?.n || '0'),
    page, perPage,
  });
}

// POST — create a custom gallery with user-provided images
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;
  await ensureInit();

  const body = await req.json();
  const { slug, title, description, seo_description, covers, first_image_url } = body;

  if (!slug || !title) {
    return NextResponse.json({ error: 'slug y title son requeridos' }, { status: 400 });
  }

  // Validate slug format
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: 'slug solo puede tener letras minúsculas, números y guiones' }, { status: 400 });
  }

  // covers = array of { url, title, issue_number }
  const coversArr = Array.isArray(covers) ? covers : [];
  const coverImg = first_image_url || coversArr[0]?.url || '';

  try {
    await query(
      `INSERT INTO cb_galleries (slug, title, description, seo_description, first_image_url, total_issues, active, sort_order, source_type, custom_covers)
       VALUES ($1, $2, $3, $4, $5, $6, true, 1, 'custom', $7::jsonb)
       ON CONFLICT (slug) DO UPDATE SET
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         seo_description = EXCLUDED.seo_description,
         first_image_url = EXCLUDED.first_image_url,
         total_issues = EXCLUDED.total_issues,
         source_type = EXCLUDED.source_type,
         custom_covers = EXCLUDED.custom_covers`,
      [slug, title, description || '', seo_description || '', coverImg, coversArr.length, JSON.stringify(coversArr)]
    );

    // Also save to cb_covers table for consistency
    for (let i = 0; i < coversArr.length; i++) {
      const cover = coversArr[i];
      await query(
        `INSERT INTO cb_covers (gallery_slug, issue_number, image_url, alt_text)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (gallery_slug, issue_number) DO UPDATE SET image_url = EXCLUDED.image_url`,
        [slug, cover.issue_number || (i + 1), cover.url, cover.title || `${title} #${i + 1}`]
      );
    }

    return NextResponse.json({ success: true, slug });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH — update a gallery (active, sort_order, seo_description, title, description)
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;
  await ensureInit();

  const body = await req.json();
  const { id, slug, active, sort_order, seo_description, title, description, first_image_url } = body;

  if (!id && !slug) {
    return NextResponse.json({ error: 'id o slug requerido' }, { status: 400 });
  }

  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (active !== undefined) { fields.push(`active = $${idx++}`); values.push(active); }
  if (sort_order !== undefined) { fields.push(`sort_order = $${idx++}`); values.push(sort_order); }
  if (seo_description !== undefined) { fields.push(`seo_description = $${idx++}`); values.push(seo_description); }
  if (title !== undefined) { fields.push(`title = $${idx++}`); values.push(title); }
  if (description !== undefined) { fields.push(`description = $${idx++}`); values.push(description); }
  if (first_image_url !== undefined) { fields.push(`first_image_url = $${idx++}`); values.push(first_image_url); }

  if (!fields.length) return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 });

  const where = id ? `id = $${idx}` : `slug = $${idx}`;
  values.push(id || slug);

  await query(`UPDATE cb_galleries SET ${fields.join(', ')} WHERE ${where}`, values);
  return NextResponse.json({ success: true });
}

// DELETE — delete a gallery
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;
  await ensureInit();

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'slug requerido' }, { status: 400 });

  await query(`DELETE FROM cb_galleries WHERE slug = $1`, [slug]);
  await query(`DELETE FROM cb_covers WHERE gallery_slug = $1`, [slug]);
  return NextResponse.json({ success: true });
}
