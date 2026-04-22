import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { query, ensureInit } from '@/lib/db';

// TOP100 slugs to auto-seed into DB if missing
const TOP100_SEED = [
  {slug:'batman',title:'Batman'},{slug:'amazing-spider-man',title:'Amazing Spider-Man'},
  {slug:'superman',title:'Superman'},{slug:'x-men',title:'X-Men'},
  {slug:'wonder-woman',title:'Wonder Woman'},{slug:'iron-man',title:'Iron Man'},
  {slug:'thor',title:'Thor'},{slug:'incredible-hulk',title:'Incredible Hulk'},
  {slug:'captain-america',title:'Captain America'},{slug:'spider-man',title:'Spider-Man'},
  {slug:'detective-comics',title:'Detective Comics'},{slug:'wolverine',title:'Wolverine'},
  {slug:'daredevil',title:'Daredevil'},{slug:'fantastic-four',title:'Fantastic Four'},
  {slug:'avengers',title:'Avengers'},{slug:'flash',title:'The Flash'},
  {slug:'green-lantern',title:'Green Lantern'},{slug:'deadpool',title:'Deadpool'},
  {slug:'venom',title:'Venom'},{slug:'aquaman',title:'Aquaman'},
  {slug:'captain-marvel',title:'Captain Marvel'},{slug:'black-panther',title:'Black Panther'},
  {slug:'doctor-strange',title:'Doctor Strange'},{slug:'punisher',title:'The Punisher'},
  {slug:'green-arrow',title:'Green Arrow'},{slug:'uncanny-x-men',title:'Uncanny X-Men'},
  {slug:'ultimate-spider-man',title:'Ultimate Spider-Man'},{slug:'catwoman',title:'Catwoman'},
  {slug:'nightwing',title:'Nightwing'},{slug:'harley-quinn',title:'Harley Quinn'},
  {slug:'guardians-of-the-galaxy',title:'Guardians of the Galaxy'},
  {slug:'silver-surfer',title:'Silver Surfer'},{slug:'thanos',title:'Thanos'},
  {slug:'nova',title:'Nova'},{slug:'moon-knight',title:'Moon Knight'},
  {slug:'ghost-rider',title:'Ghost Rider'},{slug:'blade',title:'Blade'},
  {slug:'spawn',title:'Spawn'},{slug:'sandman',title:'Sandman'},
  {slug:'watchmen',title:'Watchmen'},{slug:'infinity-gauntlet',title:'Infinity Gauntlet'},
  {slug:'civil-war',title:'Civil War'},{slug:'secret-wars',title:'Secret Wars'},
];

async function ensureTop100InDB() {
  for (const item of TOP100_SEED) {
    await query(
      `INSERT INTO cb_galleries (slug, title, first_image_url, active, sort_order, source_type)
       VALUES ($1, $2, $3, true, 9999, 'coverbrowser')
       ON CONFLICT (slug) DO NOTHING`,
      [item.slug, item.title, `https://www.coverbrowser.com/image/${item.slug}/1-1.jpg`]
    ).catch(() => {});
  }
}

// GET — list all galleries for admin
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;
  await ensureInit();
  await ensureTop100InDB(); // ensure TOP100 always visible in admin

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const perPage = 200; // show all
  const offset = (page - 1) * perPage;

  const where = search ? `WHERE (title ILIKE $3 OR slug ILIKE $3)` : '';
  const params: any[] = search ? [perPage, offset, `%${search}%`] : [perPage, offset];

  const r = await query(
    `SELECT id, slug, title, description, seo_description, total_issues, first_image_url,
            active, sort_order, source_type, custom_covers, scraped_at, created_at
     FROM cb_galleries ${where}
     ORDER BY sort_order ASC, total_issues DESC NULLS LAST, title ASC
     LIMIT $1 OFFSET $2`,
    params
  );

  const total = await query(
    `SELECT COUNT(*) as n FROM cb_galleries ${search ? `WHERE title ILIKE $1 OR slug ILIKE $1` : ''}`,
    search ? [`%${search}%`] : []
  );

  return NextResponse.json({ galleries: r.rows, total: parseInt(total.rows[0]?.n || '0'), page, perPage });
}

// POST — create a custom gallery
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;
  await ensureInit();

  const body = await req.json();
  const { slug, title, description, seo_description, covers, first_image_url } = body;
  if (!slug || !title) return NextResponse.json({ error: 'slug y title son requeridos' }, { status: 400 });
  if (!/^[a-z0-9-]+$/.test(slug)) return NextResponse.json({ error: 'slug inválido' }, { status: 400 });

  const coversArr = Array.isArray(covers) ? covers : [];
  const coverImg = first_image_url || coversArr[0]?.url || '';

  await query(
    `INSERT INTO cb_galleries (slug, title, description, seo_description, first_image_url, total_issues, active, sort_order, source_type, custom_covers)
     VALUES ($1, $2, $3, $4, $5, $6, true, 1, 'custom', $7::jsonb)
     ON CONFLICT (slug) DO UPDATE SET
       title = EXCLUDED.title, description = EXCLUDED.description,
       seo_description = EXCLUDED.seo_description, first_image_url = EXCLUDED.first_image_url,
       total_issues = EXCLUDED.total_issues, source_type = EXCLUDED.source_type,
       custom_covers = EXCLUDED.custom_covers`,
    [slug, title, description || '', seo_description || '', coverImg, coversArr.length, JSON.stringify(coversArr)]
  );

  for (let i = 0; i < coversArr.length; i++) {
    const cover = coversArr[i];
    await query(
      `INSERT INTO cb_covers (gallery_slug, issue_number, image_url, alt_text, sort_order)
       VALUES ($1, $2, $3, $4, $2)
       ON CONFLICT (gallery_slug, issue_number) DO UPDATE SET image_url = EXCLUDED.image_url`,
      [slug, cover.issue_number || (i + 1), cover.url, cover.title || `${title} #${i + 1}`]
    ).catch(() => {});
  }

  return NextResponse.json({ success: true, slug });
}

// PATCH — update any gallery field
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;
  await ensureInit();

  const body = await req.json();
  const { id, slug, active, sort_order, seo_description, title, description, first_image_url, source_type, add_covers } = body;
  if (!id && !slug) return NextResponse.json({ error: 'id o slug requerido' }, { status: 400 });

  // Special: append covers to existing gallery
  if (add_covers && Array.isArray(add_covers) && add_covers.length > 0) {
    const gallerySlug = slug || (await query('SELECT slug FROM cb_galleries WHERE id=$1', [id])).rows[0]?.slug;
    if (!gallerySlug) return NextResponse.json({ error: 'galería no encontrada' }, { status: 404 });

    const maxRes = await query('SELECT MAX(issue_number) as m FROM cb_covers WHERE gallery_slug = $1', [gallerySlug]);
    let nextNum = (parseInt(maxRes.rows[0]?.m || '0') || 0) + 1;

    for (const cover of add_covers) {
      const issueNum = cover.issue_number || nextNum++;
      await query(
        `INSERT INTO cb_covers (gallery_slug, issue_number, image_url, alt_text, sort_order)
         VALUES ($1, $2, $3, $4, $2)
         ON CONFLICT (gallery_slug, issue_number) DO UPDATE SET image_url = EXCLUDED.image_url`,
        [gallerySlug, issueNum, cover.url, cover.title || `#${issueNum}`]
      ).catch(() => {});
    }

    // Update total_issues and custom_covers for custom galleries
    const countRes = await query('SELECT COUNT(*) as n FROM cb_covers WHERE gallery_slug=$1 AND hidden=false', [gallerySlug]);
    const newTotal = parseInt(countRes.rows[0].n);

    // If custom gallery, also update custom_covers JSON
    const galleryRes = await query('SELECT source_type, custom_covers FROM cb_galleries WHERE slug=$1', [gallerySlug]);
    const g = galleryRes.rows[0];
    if (g?.source_type === 'custom') {
      const existing: any[] = g.custom_covers || [];
      const merged = [...existing, ...add_covers.map((c: any, i: number) => ({
        url: c.url, title: c.title || `#${existing.length + i + 1}`, issue_number: c.issue_number || (existing.length + i + 1)
      }))];
      await query('UPDATE cb_galleries SET total_issues=$1, custom_covers=$2::jsonb WHERE slug=$3', [newTotal, JSON.stringify(merged), gallerySlug]);
    } else {
      await query('UPDATE cb_galleries SET total_issues=$1, scraped_at=NOW() WHERE slug=$2', [newTotal, gallerySlug]);
    }

    return NextResponse.json({ success: true, added: add_covers.length, total: newTotal });
  }

  // Regular field update
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;
  if (active !== undefined)         { fields.push(`active=$${idx++}`);          values.push(active); }
  if (sort_order !== undefined)     { fields.push(`sort_order=$${idx++}`);       values.push(sort_order); }
  if (seo_description !== undefined){ fields.push(`seo_description=$${idx++}`); values.push(seo_description); }
  if (title !== undefined)          { fields.push(`title=$${idx++}`);            values.push(title); }
  if (description !== undefined)    { fields.push(`description=$${idx++}`);      values.push(description); }
  if (first_image_url !== undefined){ fields.push(`first_image_url=$${idx++}`); values.push(first_image_url); }
  if (source_type !== undefined)    { fields.push(`source_type=$${idx++}`);      values.push(source_type); }

  if (!fields.length) return NextResponse.json({ error: 'nada que actualizar' }, { status: 400 });

  values.push(id || slug);
  await query(`UPDATE cb_galleries SET ${fields.join(',')} WHERE ${id ? 'id' : 'slug'}=$${idx}`, values);
  return NextResponse.json({ success: true });
}

// DELETE
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;
  await ensureInit();
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'slug requerido' }, { status: 400 });
  await query(`DELETE FROM cb_galleries WHERE slug=$1`, [slug]);
  await query(`DELETE FROM cb_covers WHERE gallery_slug=$1`, [slug]);
  return NextResponse.json({ success: true });
}

